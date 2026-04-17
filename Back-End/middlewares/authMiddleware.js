// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { isAdminUser, buildJwtBlacklistKey } = require('../services/authService');

async function findAuthUserById(userId) {
  const queryOrUser = User.findById(userId);

  if (!queryOrUser) {
    return null;
  }

  if (typeof queryOrUser.select === 'function') {
    const selected = queryOrUser.select('name email createdAt isAdmin');
    if (selected && typeof selected.lean === 'function') {
      return selected.lean();
    }
    return selected;
  }

  return queryOrUser;
}

async function isTokenBlacklisted(token) {
  try {
    const isBlacklisted = await redisClient.get(buildJwtBlacklistKey(token));
    return Boolean(isBlacklisted);
  } catch (redisErr) {
    // If Redis is unavailable, fail open — let valid JWTs through
    console.warn('JWT blacklist check skipped (Redis unavailable):', redisErr.message);
    return false;
  }
}

// Protects routes — rejects requests without a valid JWT
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Missing token',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject tokens that have been explicitly blacklisted on logout
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Token has been invalidated. Please sign in again.',
      });
    }

    const user = await findAuthUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized. Invalid or expired token',
    });
  }
}

// Optionally identifies the user — allows both authenticated and guest requests through.
// If a valid Bearer token is present, req.user is populated; otherwise the request
// continues as a guest (req.user is undefined). Never blocks the request.
async function optionalProtect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    // Skip JWT verification entirely if no Bearer token is present
    if (!authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (await isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findAuthUserById(decoded.id);

    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid or expired token — treat the request as a guest, do not block
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !isAdminUser(req.user)) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    });
  }

  return next();
}

module.exports = { protect, optionalProtect, requireAdmin };
