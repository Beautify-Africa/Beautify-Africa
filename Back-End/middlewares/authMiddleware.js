const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function resolveUserFromAuthHeader(authHeader) {
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  return User.findById(decoded.id);
}

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Missing token',
      });
    }

    const user = await resolveUserFromAuthHeader(authHeader);
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
      message: 'Not authorized. Invalid token',
    });
  }
}

async function optionalProtect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const user = await resolveUserFromAuthHeader(authHeader);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Continue as guest when auth header is missing or invalid.
  }

  next();
}

module.exports = { protect, optionalProtect };