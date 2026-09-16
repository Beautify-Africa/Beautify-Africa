// middlewares/requestId.js
const crypto = require('crypto');
const logger = require('../utils/logger');

function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);

  req.id = requestId;
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  // Bind a contextual child logger with requestId to req
  req.log = logger.child({ requestId });

  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = Number((elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2));

    if (process.env.NODE_ENV !== 'test') {
      req.log.info(
        {
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          responseTimeMs: elapsedTimeInMs,
        },
        `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${elapsedTimeInMs}ms`
      );
    }
  });

  next();
}

module.exports = requestIdMiddleware;
