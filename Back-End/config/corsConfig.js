function normalizeOrigin(value = '') {
  return String(value).trim().replace(/\/+$/, '').toLowerCase();
}

function createCorsOptions() {
  return {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
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
        'https://www.beautifyafrica.app',
        'https://beautifyafrica.app',
        'https://beautify-africa.vercel.app',
      ].map((u) => normalizeOrigin(u));

      const isProjectVercelOrigin =
        /^https:\/\/(beautify-africa|beautifyafrica)[a-z0-9-]*\.vercel\.app$/.test(
          normalizedOrigin
        );

      if (
        envOrigins.includes(normalizedOrigin) ||
        localOrigins.includes(normalizedOrigin) ||
        isProjectVercelOrigin
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked unauthorized origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  };
}

module.exports = {
  createCorsOptions,
  normalizeOrigin,
};
