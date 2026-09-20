const express = require('express');
const { sequelize } = require('../config/db');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

const router = express.Router();

// Liveness probe (cheap process responsiveness check)
router.get('/live', setPrivateNoStore, (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (dependency connectivity check: DB & Redis)
router.get('/ready', setPrivateNoStore, async (req, res) => {
  const checks = {
    database: 'down',
    redis: 'down',
  };

  let isReady = true;

  try {
    await sequelize.authenticate();
    checks.database = 'up';
  } catch (err) {
    checks.database = 'down';
    isReady = false;
    (req.log || logger).warn({ err: err.message }, 'Readiness check: database unreachable');
  }

  try {
    if (redisClient && redisClient.status === 'ready') {
      checks.redis = 'up';
    } else if (redisClient) {
      const pong = await redisClient.ping();
      checks.redis = pong === 'PONG' ? 'up' : 'down';
      if (checks.redis !== 'up') isReady = false;
    } else {
      checks.redis = 'not_configured';
    }
  } catch (err) {
    checks.redis = 'down';
    isReady = false;
    (req.log || logger).warn({ err: err.message }, 'Readiness check: redis unreachable');
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Legacy /health endpoint preserved for backward compatibility
router.get('/', setPrivateNoStore, async (req, res) => {
  let isDbConnected = false;
  try {
    await sequelize.authenticate();
    isDbConnected = true;
  } catch {
    isDbConnected = false;
  }

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
  });
});

module.exports = router;
