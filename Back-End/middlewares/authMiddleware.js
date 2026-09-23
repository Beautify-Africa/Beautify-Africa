// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { isAdminUser, buildJwtBlacklistKey } = require('../services/authService');

async function findAuthUserById(userId) {
  return User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'createdAt', 'isAdmin', 'role'],
    raw: true,
  });
}

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  // Fallback to httpOnly cookie (supporting standard 'token', '__Secure-token', and '__Host-token')
  const cookieMatch = req.headers.cookie?.match(/(?:^|;\s*)(?:__Host-|__Secure-)?token=([^;]+)/);
  if (cookieMatch) {
    return decodeURIComponent(cookieMatch[1]);
  }
  return null;
}

async function isTokenBlacklisted(token) {
  try {
    const isBlacklisted = await redisClient.get(buildJwtBlacklistKey(token));
    return Boolean(isBlacklisted);
  } catch (redisErr) {
    console.warn('JWT blacklist check skipped (Redis unavailable):', redisErr.message);
    return false;
  }
}

async function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token)
      return res.status(401).json({ status: 'error', message: 'Not authorized. Missing token' });

    // Enforce HS256 algorithm to block algorithm confusion attacks ('none' or asymmetric public key forging)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (await isTokenBlacklisted(token))
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Token has been invalidated. Please sign in again.',
      });

    const userId = decoded.id || decoded.sub;
    const user = await findAuthUserById(userId);
    if (!user)
      return res.status(401).json({ status: 'error', message: 'Not authorized. User not found' });

    // Enforce centralized session invalidation (token revocation across devices)
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      user.tokenVersion !== decoded.tokenVersion
    ) {
      return res.status(401).json({
        status: 'error',
        code: 'SESSION_REVOKED',
        message: 'Session has been revoked. Please sign in again.',
      });
    }

    // Add _id virtual for backward compat
    req.user = { ...user, _id: user.id };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Not authorized. Invalid or expired token' });
  }
}

async function optionalProtect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    if (await isTokenBlacklisted(token)) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    const userId = decoded.id || decoded.sub;
    const user = await findAuthUserById(userId);
    if (user) {
      if (
        decoded.tokenVersion === undefined ||
        user.tokenVersion === undefined ||
        user.tokenVersion === decoded.tokenVersion
      ) {
        req.user = { ...user, _id: user.id };
      }
    }
  } catch {
    /* treat as guest */
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !isAdminUser(req.user))
    return res.status(403).json({ status: 'error', message: 'Admin access required' });
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }
    const userRole = req.user.role || (req.user.isAdmin ? 'admin' : 'customer');
    if (roles.includes(userRole) || req.user.isAdmin) {
      return next();
    }
    return res.status(403).json({ status: 'error', message: 'Insufficient role permissions' });
  };
}

module.exports = { protect, optionalProtect, requireAdmin, requireRole };
