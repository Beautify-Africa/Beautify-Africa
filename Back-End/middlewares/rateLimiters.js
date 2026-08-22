// middlewares/rateLimiters.js
const rateLimit = require('express-rate-limit');
const { Redis } = require('ioredis');
const { RedisStore } = require('rate-limit-redis');

const rateLimitRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  connectTimeout: 2000,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});
rateLimitRedis.on('error', (err) => console.warn('Rate-limit Redis error:', err.message));

function makeRedisStore(prefix) {
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
  message: { status: 'error', message: 'Too many authentication attempts, please try again later.' },
});

// Cart limiter: tight 30 requests per IP per minute — blocks bot cart abuse
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:cart:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many cart requests, please slow down.' },
});

// Payment intent limiter: 25 payment attempts per IP per 15 minutes — protects payment gateway
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:payment:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many payment requests, please try again later.' },
});

// Newsletter limiter: 15 requests per IP per 15 minutes — prevents email bombing
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:newsletter:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many newsletter requests, please slow down.' },
});

module.exports = {
  rateLimitRedis,
  apiLimiter,
  authLimiter,
  cartLimiter,
  paymentLimiter,
  newsletterLimiter,
};
