// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const {
  normalizeEmail,
  getPrimaryConfiguredAdminEmail,
  getConfiguredAdminDashboardPassword,
  isConfiguredAdminDashboardCredential,
  buildJwtBlacklistKey,
  sanitizeUser,
  validatePasswordStrength,
  signToken,
  getAuthErrorResponse,
} = require('../services/authService');
const { clearPaymentRateLimit } = require('../middlewares/rateLimiters');
const { forgotPassword, resetPassword } = require('./authPasswordResetController');

const AUTH_COOKIE_NAME = 'token';

function setAuthCookie(res, token) {
  if (typeof res.cookie === 'function') {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

function clearAuthCookie(res) {
  if (typeof res.clearCookie === 'function') {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
}

function handleAuthError(res, error) {
  const { statusCode, message } = getAuthErrorResponse(error);
  return res.status(statusCode).json({ status: 'error', message });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Name, email, and password are required' });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ status: 'error', message: passwordCheck.message });
    }

    const existing = await User.findOne({ where: { email: normalizedEmail }, attributes: ['id'] });
    if (existing)
      return res.status(409).json({ status: 'error', message: 'Email is already registered' });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    const token = signToken(user.id);
    setAuthCookie(res, token);
    return res.status(201).json({ status: 'success', token, user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');
    if (!email || !password)
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });

    if (typeof user.isLocked === 'function' && user.isLocked()) {
      return res.status(429).json({
        status: 'error',
        message:
          'Account temporarily locked due to excessive failed attempts. Please try again in 15 minutes or reset your password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (typeof user.recordFailedLogin === 'function') {
        await user.recordFailedLogin();
      }
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (typeof user.recordSuccessfulLogin === 'function') {
      await user.recordSuccessfulLogin();
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    await clearPaymentRateLimit(user.id, req.ip);
    return res.status(200).json({ status: 'success', token, user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function adminDashboardLogin(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');
    if (!email || !password)
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });

    const configuredEmail = getPrimaryConfiguredAdminEmail();
    const configuredPassword = getConfiguredAdminDashboardPassword();
    if (!configuredEmail || !configuredPassword) {
      return res.status(503).json({
        status: 'error',
        message: 'Admin dashboard credentials are not configured on the server.',
      });
    }
    if (!isConfiguredAdminDashboardCredential(normalizedEmail, password)) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Invalid admin dashboard credentials' });
    }

    let user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      user = await User.create({
        name: 'Admin User',
        email: normalizedEmail,
        password,
        isAdmin: true,
      });
    } else {
      let requiresSave = false;
      if (!user.isAdmin) {
        user.isAdmin = true;
        requiresSave = true;
      }
      const matchesConfiguredPassword = await user.comparePassword(password);
      if (!matchesConfiguredPassword) {
        user.password = password;
        requiresSave = true;
      }
      if (requiresSave) await user.save();
    }
    const token = signToken(user.id);
    setAuthCookie(res, token);
    return res.status(200).json({ status: 'success', token, user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function me(req, res) {
  return res.status(200).json({ status: 'success', user: sanitizeUser(req.user) });
}

async function logout(req, res) {
  try {
    const token =
      (req.headers.authorization || '').split(' ')[1] ||
      req.headers.cookie?.match(/(?:^|;\s*)token=([^;]+)/)?.[1];

    let userId = null;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const secondsRemaining = decoded.exp - Math.floor(Date.now() / 1000);
        if (secondsRemaining > 0) {
          await redisClient.set(buildJwtBlacklistKey(token), '1', 'EX', secondsRemaining);
        }
      }
      userId = decoded?.id || decoded?.userId || null;
    }
    await clearPaymentRateLimit(userId, req.ip);
    clearAuthCookie(res);
    return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('logout error:', error);
    await clearPaymentRateLimit(null, req.ip).catch(() => {});
    clearAuthCookie(res);
    return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  }
}

async function updateUserProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id || req.user._id);
    if (user) {
      if (req.body.name && typeof req.body.name === 'string') {
        user.name = req.body.name.trim();
      }
      const normalizedEmail = normalizeEmail(req.body.email || '');
      if (req.body.email && normalizedEmail !== req.user.email) {
        const existingEmail = await User.findOne({
          where: { email: normalizedEmail },
          attributes: ['id'],
        });
        if (existingEmail)
          return res
            .status(409)
            .json({ status: 'error', message: 'Email is already taken by another account.' });
        user.email = normalizedEmail;
      }
      if (req.body.password) {
        const passwordCheck = validatePasswordStrength(req.body.password);
        if (!passwordCheck.isValid) {
          return res.status(400).json({ status: 'error', message: passwordCheck.message });
        }
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      return res.status(200).json({ status: 'success', user: sanitizeUser(updatedUser) });
    } else {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    return handleAuthError(res, error);
  }
}

module.exports = {
  register,
  login,
  adminDashboardLogin,
  forgotPassword,
  resetPassword,
  me,
  logout,
  updateUserProfile,
};
