// middlewares/csrfProtection.js
const crypto = require('crypto');
const { isOriginAllowed } = require('../config/corsConfig');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Protection Middleware
 * - Exempts safe HTTP methods (GET, HEAD, OPTIONS)
 * - Exempts cryptographic payment webhooks
 * - Exempts requests with Bearer Authorization tokens (immune to ambient browser credential attacks)
 * - Validates Origin / Referer headers against allowed CORS origins
 * - Supports double-submit CSRF cookie/header pattern for cookie-authenticated mutations
 */
function csrfProtection(req, res, next) {
  // 1. Safe HTTP methods pass automatically
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Webhook endpoints are protected by HMAC signatures, not CSRF
  const path = req.path || req.originalUrl || '';
  if (path.startsWith('/api/stripe/webhook') || path.startsWith('/api/payments/webhook')) {
    return next();
  }

  // 3. Requests authenticated via Bearer token cannot be forged by browser ambient credentials
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 4. Validate Origin header if present
  const origin = req.headers.origin;
  if (origin) {
    if (!isOriginAllowed(origin)) {
      return res.status(403).json({
        status: 'error',
        code: 'CSRF_BLOCKED',
        message: `Cross-site request blocked: origin ${origin} is not allowed.`,
      });
    }
  }

  // 5. Check Referer header if Origin is absent
  const referer = req.headers.referer;
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refererOrigin)) {
        return res.status(403).json({
          status: 'error',
          code: 'CSRF_BLOCKED',
          message: `Cross-site request blocked: referer ${refererOrigin} is not allowed.`,
        });
      }
    } catch {
      return res.status(403).json({
        status: 'error',
        code: 'CSRF_BLOCKED',
        message: 'Invalid referer header format.',
      });
    }
  }

  // 6. Double submit CSRF token check if CSRF token header or cookie is present
  const csrfHeader = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const cookies = req.headers.cookie || '';
  const csrfCookieMatch = cookies.match(/(?:^|;\s*)_csrf=([^;]+)/);
  const csrfCookie = csrfCookieMatch ? decodeURIComponent(csrfCookieMatch[1]) : null;

  if (csrfCookie) {
    if (!csrfHeader || csrfHeader !== csrfCookie) {
      return res.status(403).json({
        status: 'error',
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token mismatch or missing token header.',
      });
    }
  }

  next();
}

/**
 * Route handler to issue CSRF token and set cookie
 */
function getCsrfTokenHandler(req, res) {
  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('_csrf', token, {
    httpOnly: false, // Must be readable by client script for double-submit
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600 * 1000, // 1 hour
  });

  return res.status(200).json({
    status: 'success',
    csrfToken: token,
  });
}

module.exports = {
  csrfProtection,
  generateCsrfToken,
  getCsrfTokenHandler,
};
