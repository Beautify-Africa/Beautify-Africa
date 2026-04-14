const { Redis } = require('ioredis');

// When deployed to Render, REDIS_URL will be provided by the environment.
// Locally without docker-compose, we default to localhost.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
  // BullMQ workers require this to be null for blocking Redis commands.
  maxRetriesPerRequest: null,
  connectTimeout: 1500,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully: ', redisUrl);
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redisClient;
