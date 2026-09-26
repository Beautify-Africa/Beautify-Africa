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

function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function isConfiguredAdminDashboardCredential(email, password) {
  const normalizedEmail = normalizeEmail(email || '');
  const primaryAdminEmail = getPrimaryConfiguredAdminEmail();
  const configuredPassword = getConfiguredAdminDashboardPassword();

  if (!normalizedEmail || !primaryAdminEmail || !configuredPassword) {
    return false;
  }

  const isEmailMatch = timingSafeStringEqual(normalizedEmail, primaryAdminEmail);
  const isPasswordMatch = timingSafeStringEqual(String(password || ''), configuredPassword);

  return isEmailMatch && isPasswordMatch;
}

function isSoleOwnerEmail(email = '') {
  const normalized = normalizeEmail(email);
  const primaryAdmin = getPrimaryConfiguredAdminEmail();
  return Boolean(primaryAdmin && timingSafeStringEqual(normalized, primaryAdmin));
}

function isAdminUser(userDoc) {
  if (!userDoc) return false;
  const normalizedEmail = normalizeEmail(userDoc.email || '');
  const configuredEmails = getConfiguredAdminEmails();

  // If server has configured admin emails, strictly require the email to be in the whitelist
  if (configuredEmails.length > 0) {
    return configuredEmails.includes(normalizedEmail);
  }

  return Boolean(userDoc.isAdmin) || userDoc.role === 'admin';
}

function sanitizeUser(userDoc) {
  const role = userDoc.role || (isAdminUser(userDoc) ? 'admin' : 'customer');
  return {
    id: userDoc.id || userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role,
    createdAt: userDoc.createdAt,
    isAdmin: role === 'admin' || isAdminUser(userDoc),
    twoFactorEnabled: Boolean(userDoc.twoFactorEnabled),
  };
}

function validatePasswordStrength(password = '') {
  if (typeof password !== 'string' || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }
  return { isValid: true };
}

function signToken(userOrId, options = {}) {
  const userId =
    typeof userOrId === 'object' && userOrId !== null
      ? userOrId.id || userOrId._id
      : userOrId;
  const tokenVersion =
    options.tokenVersion !== undefined
      ? options.tokenVersion
      : typeof userOrId === 'object' && userOrId !== null
        ? userOrId.tokenVersion || 0
        : 0;

  const payload = {
    id: userId,
    sub: String(userId),
    tokenVersion,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
  });
}

function hashPasswordResetToken(rawToken = '') {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function hashJwtToken(token = '') {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function buildJwtBlacklistKey(token = '') {
  return `bl:jwt:${hashJwtToken(token)}`;
}

function createPasswordResetTokenPayload() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const configuredMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
  const ttlMinutes =
    Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 30;
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
  if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
    const firstMessage =
      (error.errors && error.errors[0]?.message) ||
      Object.values(error.errors || {})[0]?.message ||
      'Invalid user data';
    return { statusCode: 400, message: firstMessage };
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return { statusCode: 409, message: 'Email is already registered' };
  }
  return { statusCode: 500, message: 'An unexpected error occurred. Please try again.' };
}

module.exports = {
  normalizeEmail,
  getConfiguredAdminEmails,
  getPrimaryConfiguredAdminEmail,
  getConfiguredAdminDashboardPassword,
  isConfiguredAdminDashboardCredential,
  isSoleOwnerEmail,
  isAdminUser,
  hashPasswordResetToken,
  hashJwtToken,
  buildJwtBlacklistKey,
  createPasswordResetTokenPayload,
  getClientApplicationUrl,
  buildPasswordResetLink,
  sanitizeUser,
  validatePasswordStrength,
  signToken,
  verifyToken,
  getAuthErrorResponse,
};
