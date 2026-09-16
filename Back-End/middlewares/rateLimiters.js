// middlewares/rateLimiters.js
const rateLimit = require('express-rate-limit');
const { Redis } = require('ioredis');
const { RedisStore } = require('rate-limit-redis');

const isTestEnv = process.env.NODE_ENV === 'test';

const rateLimitRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  connectTimeout: 2000,
  lazyConnect: true,
  retryStrategy: (times) => (isTestEnv ? null : Math.min(times * 200, 2000)),
});
rateLimitRedis.on('error', (err) => {
  if (!isTestEnv) {
    console.warn('Rate-limit Redis error:', err.message);
  }
});

function makeRedisStore(prefix) {
  if (isTestEnv) return undefined;
  return new RedisStore({
    sendCommand: (...args) => rateLimitRedis.call(...args),
    prefix,
  });
}

// General API limiter: 100 requests per IP per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:api:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});

// Auth limiter: strict 20 requests per IP per 15 minutes — deters brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:auth:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
});

// Cart limiter: tight 30 requests per IP per minute — blocks bot cart abuse
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:cart:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: { status: 'error', message: 'Too many cart requests, please slow down.' },
});

function getClientIdentifier(req) {
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

// Payment intent limiter: protects payment gateway from abuse during intent creation
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:payment:'),
  keyGenerator: getClientIdentifier,
  passOnStoreError: true,
  skip: () => isTestEnv,
  validate: { keyGeneratorIpFallback: false },
  message: { status: 'error', message: 'Too many payment requests, please try again later.' },
});

// Verification / Polling limiter: high-frequency status polling during checkout
const paymentVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 1200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:pay_poll:'),
  keyGenerator: getClientIdentifier,
  passOnStoreError: true,
  skip: () => isTestEnv,
  validate: { keyGeneratorIpFallback: false },
  message: { status: 'error', message: 'Too many verification requests, please slow down.' },
});

// Newsletter limiter: 15 requests per IP per 15 minutes — prevents email bombing
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:newsletter:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: { status: 'error', message: 'Too many newsletter requests, please slow down.' },
});

/**
 * Resets rate limit locks for a user or IP across Redis stores
 */
async function clearPaymentRateLimit(userId, ip) {
  if (isTestEnv) return;
  try {
    const pipeline = rateLimitRedis.pipeline();
    if (userId) {
      pipeline.del(`rl:payment:user_${userId}`);
      pipeline.del(`rl:pay_poll:user_${userId}`);
    }
    if (ip) {
      pipeline.del(`rl:payment:${ip}`);
      pipeline.del(`rl:pay_poll:${ip}`);
    }
    await pipeline.exec();

    // In local development, also wipe any residual rl:payment and rl:pay_poll keys
    if (process.env.NODE_ENV !== 'production') {
      const keys = await rateLimitRedis.keys('rl:payment:*');
      if (keys.length > 0) await rateLimitRedis.del(...keys);
      const pollKeys = await rateLimitRedis.keys('rl:pay_poll:*');
      if (pollKeys.length > 0) await rateLimitRedis.del(...pollKeys);
    }
  } catch {
    // Non-fatal if Redis cleanup fails
  }
}

module.exports = {
  rateLimitRedis,
  apiLimiter,
  authLimiter,
  cartLimiter,
  paymentLimiter,
  paymentVerificationLimiter,
  newsletterLimiter,
  clearPaymentRateLimit,
  getClientIdentifier,
};
