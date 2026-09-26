// middlewares/ensureHttps.js
/**
 * Middleware to enforce HTTPS Everywhere.
 * Redirects unencrypted HTTP requests to HTTPS in production and staging environments
 * when accessed directly or behind reverse proxies (Render, AWS ALB, Cloudflare, Heroku).
 */
function ensureHttps(req, res, next) {
  const isProductionLike =
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'staging' ||
    process.env.FORCE_HTTPS === 'true';

  if (!isProductionLike) {
    return next();
  }

  // Check direct TLS or proxy forwarded protocol headers
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-ssl'] === 'on';

  if (isSecure) {
    return next();
  }

  const host = req.headers.host || 'localhost';
  return res.redirect(301, `https://${host}${req.originalUrl}`);
}

module.exports = ensureHttps;
module.exports.ensureHttps = ensureHttps;
