const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function normalizeEmail(email = '') {
  return email.toLowerCase().trim();
}

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function getPrimaryConfiguredAdminEmail() {
  return getConfiguredAdminEmails()[0] || '';
}

function getConfiguredAdminDashboardPassword() {
  return String(process.env.ADMIN_DASHBOARD_PASSWORD || '').trim();
}

function isConfiguredAdminDashboardCredential(email, password) {
  const normalizedEmail = normalizeEmail(email || '');

  return (
    normalizedEmail.length > 0 &&
    normalizedEmail === getPrimaryConfiguredAdminEmail() &&
    String(password || '') === getConfiguredAdminDashboardPassword()
  );
}

function isAdminUser(userDoc) {
  if (!userDoc) return false;

  const normalizedEmail = normalizeEmail(userDoc.email || '');

  return Boolean(userDoc.isAdmin) || getConfiguredAdminEmails().includes(normalizedEmail);
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    createdAt: userDoc.createdAt,
    isAdmin: isAdminUser(userDoc),
  };
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function hashPasswordResetToken(rawToken = '') {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function createPasswordResetTokenPayload() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const configuredMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
  const ttlMinutes = Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 30;

  return {
    rawToken,
    hashedToken: hashPasswordResetToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  };
}

function getClientApplicationUrl() {
  const configuredUrl = String(
    process.env.PASSWORD_RESET_URL_BASE ||
      process.env.CLIENT_URL ||
      process.env.FRONT_END_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173'
  )
    .split(',')[0]
    .trim();

  return configuredUrl.replace(/\/+$/, '');
}

function buildPasswordResetLink(rawToken) {
  return `${getClientApplicationUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
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
    message: 'An unexpected error occurred. Please try again.',
  };
}

module.exports = {
  normalizeEmail,
  getConfiguredAdminEmails,
  getPrimaryConfiguredAdminEmail,
  getConfiguredAdminDashboardPassword,
  isConfiguredAdminDashboardCredential,
  isAdminUser,
  hashPasswordResetToken,
  createPasswordResetTokenPayload,
  getClientApplicationUrl,
  buildPasswordResetLink,
  sanitizeUser,
  signToken,
  getAuthErrorResponse,
};
