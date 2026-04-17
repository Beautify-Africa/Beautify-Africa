// services/inventoryLock.js
//
// Redis-backed atomic inventory locks.
// Prevents two simultaneous checkout requests from both reserving
// the same last item in stock (the "oversell" race condition).
//
// Uses Redis SET NX PX — the most battle-tested atomic lock primitive.
// The lock is self-expiring (10s TTL) so a crashed server can never
// permanently block a product from being purchased.

const crypto = require('crypto');
const redisClient = require('../config/redis');

const LOCK_TTL_MS = 10_000; // 10 seconds — more than enough for any order save
const REDIS_BYPASS_LOCK_TOKEN = '__redis_bypass_lock__';
const RELEASE_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

function buildLockKey(productId) {
  return `lock:inventory:${productId}`;
}

function createLockToken() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Attempt to acquire an exclusive lock for a product.
 * Returns a lock token when acquired, null when already held.
 * Returns REDIS_BYPASS_LOCK_TOKEN if Redis is unavailable (fail-open).
 */
async function acquireLock(productId) {
  try {
    const key = buildLockKey(productId);
    const token = createLockToken();
    // SET key value NX PX ttl
    // NX = only set if key does NOT exist (atomic check-and-set)
    const result = await redisClient.set(key, token, 'NX', 'PX', LOCK_TTL_MS);
    return result === 'OK' ? token : null;
  } catch (err) {
    // If Redis is unavailable, fail open — don't block the checkout
    console.warn(`inventoryLock: acquireLock failed for ${productId}:`, err.message);
    return REDIS_BYPASS_LOCK_TOKEN;
  }
}

/**
 * Release the lock only if this request still owns it.
 */
async function releaseLock(productId, lockToken) {
  if (!lockToken || lockToken === REDIS_BYPASS_LOCK_TOKEN) {
    return;
  }

  try {
    const key = buildLockKey(productId);
    await redisClient.eval(RELEASE_LOCK_SCRIPT, 1, key, lockToken);
  } catch (err) {
    console.warn(`inventoryLock: releaseLock failed for ${productId}:`, err.message);
  }
}


/**
 * Acquire the lock, run fn(), then always release the lock.
 * Returns { result } on success or { conflict: true } if the lock is held.
 */
async function withInventoryLock(productId, fn) {
  const lockToken = await acquireLock(productId);

  if (!lockToken) {
    return { conflict: true };
  }

  try {
    const result = await fn();
    return { result };
  } finally {
    await releaseLock(productId, lockToken);
  }
}

module.exports = { acquireLock, releaseLock, withInventoryLock };
