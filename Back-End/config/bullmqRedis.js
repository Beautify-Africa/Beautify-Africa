const { Redis } = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTestEnv = process.env.NODE_ENV === 'test';

function createBullmqRedisConnection() {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: isTestEnv ? 500 : 2000,
    enableOfflineQueue: true,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      if (isTestEnv) {
        return null;
      }

      return Math.min(times * 200, 2000);
    },
  });
}

module.exports = createBullmqRedisConnection;