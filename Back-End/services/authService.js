const jwt = require('jsonwebtoken');

function normalizeEmail(email = '') {
  return email.toLowerCase().trim();
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    createdAt: userDoc.createdAt,
  };
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function getAuthErrorResponse(error) {
  if (error.name === 'ValidationError') {
    const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid user data';

    return {
      statusCode: 400,
      message: firstMessage,
    };
  }

  return {
    statusCode: 500,
    message: error.message,
  };
}

module.exports = {
  normalizeEmail,
  sanitizeUser,
  signToken,
  getAuthErrorResponse,
};
