// routes/healthRoutes.js
const express = require('express');
const { sequelize } = require('../config/db');
const redisClient = require('../config/redis');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Liveness probe for process orchestrators (Kubernetes / Docker / PM2)
 * @access  Public
 */
router.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    service: 'beautify-africa-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
    },
  });
});

/**
 * @route   GET /api/ready
 * @desc    Deep readiness probe validating downstream infrastructure dependencies
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: { status: 'unknown' },
    redis: { status: 'unknown' },
    memory: { status: 'unknown' },
  };

  let isHealthy = true;

  // 1. PostgreSQL Database Ping
  try {
    const dbStart = Date.now();
    await sequelize.query('SELECT 1', { timeout: 3000 });
    checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch (dbErr) {
    isHealthy = false;
    checks.database = {
      status: 'unhealthy',
      error: dbErr.message,
    };
  }

  // 2. Redis Cache Ping
  try {
    const redisStart = Date.now();
    const pingRes = await redisClient.ping();
    checks.redis = {
      status: pingRes === 'PONG' ? 'healthy' : 'degraded',
      latencyMs: Date.now() - redisStart,
    };
    if (pingRes !== 'PONG') isHealthy = false;
  } catch (redisErr) {
    // Redis degradation allows partial fallback
    checks.redis = {
      status: 'degraded',
      error: redisErr.message,
    };
  }

  // 3. Memory Pressure Check (< 95% heap headroom)
  const mem = process.memoryUsage();
  const heapUsageRatio = mem.heapUsed / mem.heapTotal;
  checks.memory = {
    status: heapUsageRatio < 0.95 ? 'healthy' : 'warning',
    heapUsagePercentage: `${Math.round(heapUsageRatio * 100)}%`,
  };

  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json({
    status: isHealthy ? 'ready' : 'degraded',
    service: 'beautify-africa-api',
    timestamp: new Date().toISOString(),
    checks,
  });
});

module.exports = router;
