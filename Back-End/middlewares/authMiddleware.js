// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { isAdminUser, buildJwtBlacklistKey } = require('../services/authService');

async function findAuthUserById(userId) {
  return User.findByPk(userId, { attributes: ['id', 'name', 'email', 'createdAt', 'isAdmin'], raw: true });
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
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ status: 'error', message: 'Not authorized. Missing token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (await isTokenBlacklisted(token)) return res.status(401).json({ status: 'error', message: 'Not authorized. Token has been invalidated. Please sign in again.' });
    const user = await findAuthUserById(decoded.id);
    if (!user) return res.status(401).json({ status: 'error', message: 'Not authorized. User not found' });
    // Add _id virtual for backward compat
    req.user = { ...user, _id: user.id };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Not authorized. Invalid or expired token' });
  }
}

async function optionalProtect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    if (await isTokenBlacklisted(token)) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findAuthUserById(decoded.id);
    if (user) req.user = { ...user, _id: user.id };
  } catch { /* treat as guest */ }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !isAdminUser(req.user)) return res.status(403).json({ status: 'error', message: 'Admin access required' });
  return next();
}

module.exports = { protect, optionalProtect, requireAdmin };
