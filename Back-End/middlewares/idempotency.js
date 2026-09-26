// middlewares/idempotency.js
const redisClient = require('../config/redis');

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

/**
 * Idempotency Middleware for Order and Payment mutations
 * Prevents double-charging or duplicate order submissions.
 */
function idempotency(req, res, next) {
  const idempotencyKey =
    req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return next();
  }

  const trimmedKey = idempotencyKey.trim();
  if (trimmedKey.length < 8 || trimmedKey.length > 128) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_IDEMPOTENCY_KEY',
      message: 'Idempotency-Key must be between 8 and 128 characters.',
    });
  }

  const actor = req.user?.id || req.user?._id || req.ip || 'anon';
  const cacheKey = `idemp:v1:${actor}:${trimmedKey}`;

  redisClient
    .get(cacheKey)
    .then((cachedRecord) => {
      if (cachedRecord) {
        try {
          const { status, body } = JSON.parse(cachedRecord);
          res.setHeader('X-Idempotent-Replay', 'true');
          return res.status(status).json(body);
        } catch {
          // If parse fails, continue execution
        }
      }

      // Intercept res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode < 400) {
          const payloadToCache = JSON.stringify({
            status: res.statusCode,
            body,
          });
          redisClient
            .set(cacheKey, payloadToCache, 'EX', IDEMPOTENCY_TTL_SECONDS)
            .catch(() => {});
        }
        return originalJson(body);
      };

      next();
    })
    .catch(() => {
      // If Redis is unavailable, continue without blocking
      next();
    });
}

module.exports = idempotency;
module.exports.idempotency = idempotency;
