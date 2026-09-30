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
const bcrypt = require('bcryptjs');
const {
  generateTotpSecret,
  generateOtpAuthUri,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  isTotpCodeReplayed,
  markTotpCodeUsed,
} = require('../services/totpService');
const {
  encryptTotpSecret,
  decryptTotpSecret,
  isEncryptedTotpSecret,
} = require('../services/totpSecretCipher');

async function getUserTotpSecret(user) {
  const secret = decryptTotpSecret(user.twoFactorSecret);
  // Gradually migrate existing plaintext values when their owner next authenticates.
  if (secret && !isEncryptedTotpSecret(user.twoFactorSecret)) {
    user.twoFactorSecret = encryptTotpSecret(secret);
    await user.save();
  }
  return secret;
}

// Pre-computed bcrypt cost 12 hash of a 32-char high-entropy string to normalize timing and block email enumeration
const DUMMY_BCRYPT_HASH =
  '$2a$12$e8kQ8YQ.Z7n.a3fL0F1GauQZzXW9vU0K6T8Y5e.Z7n.a3fL0F1Gau';

const AUTH_COOKIE_NAME = 'token';

function setAuthCookie(res, token) {
  if (typeof res.cookie === 'function') {
    const isProductionLike =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    const cookieOptions = {
      httpOnly: true,
      secure: isProductionLike,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set standard httpOnly authentication cookie
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

    // In production/staging over HTTPS, set __Secure- and __Host- prefixed cookies for maximum browser boundary enforcement
    if (isProductionLike) {
      res.cookie('__Secure-token', token, cookieOptions);
      res.cookie('__Host-token', token, {
        ...cookieOptions,
        secure: true,
      });
    }
  }
}

function clearAuthCookie(res) {
  if (typeof res.clearCookie === 'function') {
    const isProductionLike =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
    const clearOptions = {
      httpOnly: true,
      secure: isProductionLike,
      sameSite: 'lax',
      path: '/',
    };

    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
    res.clearCookie('__Secure-token', clearOptions);
    res.clearCookie('__Host-token', clearOptions);
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
    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ status: 'success', user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function login(req, res) {
  try {
    const { email, password, twoFactorCode } = req.body;
    const normalizedEmail = normalizeEmail(email || '');
    if (!email || !password)
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      // Execute dummy bcrypt comparison to ensure constant-time response and prevent email enumeration
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH).catch(() => {});
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

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

    // Two-factor authentication check if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          status: 'require_2fa',
          message: 'Two-factor authentication code required',
          require2FA: true,
        });
      }

      // Check if TOTP code was already submitted within this validity window (replay defense)
      const isReplayed = await isTotpCodeReplayed(user.id, twoFactorCode);
      if (isReplayed) {
        return res.status(401).json({
          status: 'error',
          message: 'Two-factor authentication code has already been used. Please wait for the next code.',
        });
      }

      const isTotpValid = verifyTotpCode({
        secret: await getUserTotpSecret(user),
        code: twoFactorCode,
      });

      if (isTotpValid) {
        await markTotpCodeUsed(user.id, twoFactorCode);
      } else {
        const recoveryCheck = verifyAndConsumeRecoveryCode(
          user.twoFactorRecoveryCodes,
          twoFactorCode
        );
        if (!recoveryCheck.isValid) {
          if (typeof user.recordFailedLogin === 'function') {
            await user.recordFailedLogin();
          }
          return res.status(401).json({
            status: 'error',
            message: 'Invalid two-factor authentication code or recovery code',
          });
        }
        user.twoFactorRecoveryCodes = recoveryCheck.remainingCodes;
        await user.save();
      }
    }

    if (typeof user.recordSuccessfulLogin === 'function') {
      await user.recordSuccessfulLogin();
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    await clearPaymentRateLimit(user.id, req.ip);
    return res.status(200).json({ status: 'success', user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function adminDashboardLogin(req, res) {
  try {
    const { email, password, twoFactorCode } = req.body;
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
    if (user && typeof user.isLocked === 'function' && user.isLocked()) {
      return res.status(429).json({
        status: 'error',
        message:
          'Account temporarily locked due to excessive failed attempts. Please try again in 15 minutes.',
      });
    }

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

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return res.status(200).json({
            status: 'require_2fa',
            message: 'Two-factor authentication code required',
            require2FA: true,
          });
        }

        // Check if TOTP code was already submitted within this validity window (replay defense)
        const isReplayed = await isTotpCodeReplayed(user.id, twoFactorCode);
        if (isReplayed) {
          return res.status(401).json({
            status: 'error',
            message: 'Two-factor authentication code has already been used. Please wait for the next code.',
          });
        }

        const isTotpValid = verifyTotpCode({
          secret: await getUserTotpSecret(user),
          code: twoFactorCode,
        });

        if (isTotpValid) {
          await markTotpCodeUsed(user.id, twoFactorCode);
        } else {
          const recoveryCheck = verifyAndConsumeRecoveryCode(
            user.twoFactorRecoveryCodes,
            twoFactorCode
          );
          if (!recoveryCheck.isValid) {
            if (typeof user.recordFailedLogin === 'function') {
              await user.recordFailedLogin();
            }
            return res.status(401).json({
              status: 'error',
              message: 'Invalid two-factor authentication code or recovery code',
            });
          }
          user.twoFactorRecoveryCodes = recoveryCheck.remainingCodes;
          requiresSave = true;
        }
      }

      if (typeof user.recordSuccessfulLogin === 'function') {
        await user.recordSuccessfulLogin();
      } else if (requiresSave) {
        await user.save();
      }
    }
    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(200).json({ status: 'success', user: sanitizeUser(user) });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function setupTwoFactor(req, res) {
  try {
    const user = await User.findByPk(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const secret = generateTotpSecret(20);
    const otpAuthUrl = generateOtpAuthUri({
      secret,
      email: user.email,
      issuer: 'Beautify Africa',
    });
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

    user.twoFactorSecret = encryptTotpSecret(secret);
    user.twoFactorRecoveryCodes = hashedCodes;
    await user.save();

    return res.status(200).json({
      status: 'success',
      secret,
      otpAuthUrl,
      recoveryCodes: plainCodes,
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function enableTwoFactor(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ status: 'error', message: 'Verification code is required' });
    }

    const user = await User.findByPk(req.user.id || req.user._id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        status: 'error',
        message: 'Please initiate two-factor setup before verifying.',
      });
    }

    const isValid = verifyTotpCode({ secret: await getUserTotpSecret(user), code });
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code. Please check your authenticator app.',
      });
    }

    await markTotpCodeUsed(user.id, code);

    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication successfully enabled.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function disableTwoFactor(req, res) {
  try {
    const { password, code } = req.body;
    if (!password) {
      return res.status(400).json({ status: 'error', message: 'Password is required to disable 2FA' });
    }

    const user = await User.findByPk(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid password' });
    }

    if (user.twoFactorEnabled && !code) {
      return res.status(400).json({
        status: 'error',
        message: 'A current two-factor code or recovery code is required to disable 2FA',
      });
    }

    if (user.twoFactorEnabled && code) {
      const isValid = verifyTotpCode({ secret: await getUserTotpSecret(user), code });
      const recoveryCheck = isValid
        ? { isValid: true, remainingCodes: user.twoFactorRecoveryCodes }
        : verifyAndConsumeRecoveryCode(user.twoFactorRecoveryCodes, code);
      if (!recoveryCheck.isValid) {
        return res.status(400).json({ status: 'error', message: 'Invalid authentication code' });
      }
      if (!isValid) user.twoFactorRecoveryCodes = recoveryCheck.remainingCodes;
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = [];
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication disabled successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function revokeAllSessions(req, res) {
  try {
    const user = await User.findByPk(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      status: 'success',
      message: 'All other active sessions have been invalidated.',
    });
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
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  revokeAllSessions,
};
