const redisClient = require('../config/redis');

const PRODUCT_CACHE_VERSION_KEY = 'products:version';
const PRODUCT_LIST_CACHE_TTL_SECONDS = 60 * 10;
const PRODUCT_CATALOG_CACHE_TTL_SECONDS = 60 * 60;

function normalizeCacheValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeCacheValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = normalizeCacheValue(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

async function getProductCacheVersion() {
  try {
    const existingVersion = await redisClient.get(PRODUCT_CACHE_VERSION_KEY);
    if (existingVersion) {
      return existingVersion;
    }

    await redisClient.set(PRODUCT_CACHE_VERSION_KEY, '1');
    return '1';
  } catch (error) {
    console.warn('Redis version lookup failed for product cache:', error.message);
    return null;
  }
}

async function buildVersionedCacheKey(scope, query = {}) {
  const version = await getProductCacheVersion();
  if (!version) {
    return null;
  }

  return `${scope}:v${version}:${JSON.stringify(normalizeCacheValue(query))}`;
}

async function readCache(key) {
  if (!key) return null;

  try {
    const cachedData = await redisClient.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.warn('Redis read failed for product cache:', error.message);
    return null;
  }
}

async function writeCache(key, payload, ttlSeconds) {
  if (!key) return;

  try {
    await redisClient.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
  } catch (error) {
    console.warn('Redis write failed for product cache:', error.message);
  }
}

async function bumpProductCacheVersion() {
  try {
    await redisClient.incr(PRODUCT_CACHE_VERSION_KEY);
  } catch (error) {
    console.warn('Redis cache version bump failed for products:', error.message);
  }
}

module.exports = {
  PRODUCT_LIST_CACHE_TTL_SECONDS,
  PRODUCT_CATALOG_CACHE_TTL_SECONDS,
  buildVersionedCacheKey,
  readCache,
  writeCache,
  bumpProductCacheVersion,
};
