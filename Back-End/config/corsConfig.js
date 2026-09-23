// config/corsConfig.js
function normalizeOrigin(value = '') {
  return String(value).trim().replace(/\/+$/, '').toLowerCase();
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  const isProd = process.env.NODE_ENV === 'production';

  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
        .map((u) => normalizeOrigin(u))
        .filter(Boolean)
    : [];

  const localOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:4174',
    'http://localhost:4175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4174',
  ].map((u) => normalizeOrigin(u));

  const prodOrigins = [
    'https://www.beautifyafrica.app',
    'https://beautifyafrica.app',
    'https://beautify-africa.vercel.app',
    'https://beautify-africa.com',
    'https://www.beautify-africa.com',
  ].map((u) => normalizeOrigin(u));

  const isProjectVercelOrigin =
    /^https:\/\/(beautify-africa|beautifyafrica)[a-z0-9-]*\.vercel\.app$/.test(
      normalizedOrigin
    );

  // In production, strictly reject localhost origins unless explicitly in CLIENT_URL
  if (isProd) {
    return (
      envOrigins.includes(normalizedOrigin) ||
      prodOrigins.includes(normalizedOrigin) ||
      isProjectVercelOrigin
    );
  }

  // In staging, development, and test environments
  return (
    envOrigins.includes(normalizedOrigin) ||
    localOrigins.includes(normalizedOrigin) ||
    prodOrigins.includes(normalizedOrigin) ||
    isProjectVercelOrigin
  );
}

function createCorsOptions() {
  return {
    origin: function (origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked unauthorized origin: ${origin}`);
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-CSRF-Token',
      'x-csrf-token',
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
      'Accept',
      'Origin',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'Content-Range',
      'X-Total-Count',
      'X-CSRF-Token',
      'X-Idempotent-Replay',
      'ETag',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  };
}

module.exports = {
  createCorsOptions,
  normalizeOrigin,
  isOriginAllowed,
};
