const { Redis } = require('ioredis');

// When deployed to Render, REDIS_URL will be provided by the environment.
// Locally without docker-compose, we default to localhost.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTestEnv = process.env.NODE_ENV === 'test';

const redisClient = new Redis(redisUrl, {
  // BullMQ workers require this to be null for blocking Redis commands.
  maxRetriesPerRequest: null,
  connectTimeout: isTestEnv ? 500 : 1500,
  // Tests can run before Redis is fully connected; queue commands briefly there.
  enableOfflineQueue: isTestEnv,
  enableReadyCheck: isTestEnv,
  lazyConnect: isTestEnv,
  retryStrategy(times) {
    if (isTestEnv) {
      return null;
    }

    return Math.min(times * 200, 2000);
  },
});

if (!isTestEnv) {
  redisClient.on('connect', () => {
    console.log('Redis connected successfully: ', redisUrl);
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
} else {
  // Avoid noisy logs in tests while still surfacing command-level failures.
  redisClient.on('error', () => {});

  process.on('beforeExit', () => {
    redisClient.disconnect();
  });
}

module.exports = redisClient;
