// middlewares/rateLimiters.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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

// General API limiter: generous limit, skipped for localhost in development
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:api:'),
  passOnStoreError: true,
  skip: (req) => isTestEnv || (process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.headers['x-forwarded-for'] === '127.0.0.1')),
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

// Admin auth limiter: high-security 5 requests per IP per 15 minutes — blocks admin brute-force
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:admin-auth:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: {
    status: 'error',
    message: 'Too many admin authentication attempts. Access locked for 15 minutes.',
  },
});

// Password reset request limiter: 5 requests per 15 minutes per IP — blocks email bombing
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:pw-reset:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: {
    status: 'error',
    message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
  },
});

// Reset password attempt limiter: 5 attempts per 15 minutes — prevents token brute-forcing
const resetPasswordAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:pw-attempt:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: {
    status: 'error',
    message: 'Too many password reset verification attempts. Access locked for 15 minutes.',
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

// Search limiter: 60 requests per minute per IP — prevents heavy scraping and search DoS
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:search:'),
  passOnStoreError: true,
  skip: () => isTestEnv,
  message: { status: 'error', message: 'Too many search requests, please slow down.' },
});

module.exports = {
  rateLimitRedis,
  apiLimiter,
  authLimiter,
  adminAuthLimiter,
  passwordResetLimiter,
  resetPasswordAttemptLimiter,
  cartLimiter,
  paymentLimiter,
  paymentVerificationLimiter,
  newsletterLimiter,
  searchLimiter,
  clearPaymentRateLimit,
  getClientIdentifier,
};
