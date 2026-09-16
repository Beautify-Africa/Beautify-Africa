// services/currencyService.js
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_KEY = 'currency:rates:v1';
const CACHE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

const DEFAULT_CURRENCY_METADATA = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸', decimals: 2 },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    rate: 130.0,
    flag: '🇰🇪',
    decimals: 0,
  },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1500.0, flag: '🇳🇬', decimals: 0 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.5, flag: '🇬🇭', decimals: 2 },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    rate: 18.5,
    flag: '🇿🇦',
    decimals: 2,
  },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimals: 2 },
};

/**
 * Returns supported currencies with conversion rates relative to USD.
 * Checks Redis cache first; falls back to verified baseline rates if cache misses or Redis is down.
 */
async function getExchangeRates() {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to read currency rates from Redis, using defaults');
  }

  // Cache baseline rates in Redis
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.set(
        CACHE_KEY,
        JSON.stringify(DEFAULT_CURRENCY_METADATA),
        'EX',
        CACHE_TTL_SECONDS
      );
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to cache currency rates in Redis');
  }

  return DEFAULT_CURRENCY_METADATA;
}

/**
 * Converts a base USD amount to target currency
 */
async function convertPrice(amountInUSD, targetCurrency = 'USD') {
  const num = Number(amountInUSD) || 0;
  const rates = await getExchangeRates();
  const currencyInfo = rates[targetCurrency.toUpperCase()] || rates.USD;

  const converted = num * currencyInfo.rate;
  // Round to appropriate decimal precision
  const factor = Math.pow(10, currencyInfo.decimals);
  const rounded = Math.round(converted * factor) / factor;

  return {
    amount: rounded,
    currency: currencyInfo.code,
    symbol: currencyInfo.symbol,
    rate: currencyInfo.rate,
    formatted: formatCurrency(rounded, currencyInfo.code),
  };
}

/**
 * Converts an amount in a local currency back to USD
 */
async function convertToUSD(amount, sourceCurrency = 'USD') {
  const num = Number(amount) || 0;
  const rates = await getExchangeRates();
  const currencyInfo = rates[sourceCurrency.toUpperCase()] || rates.USD;

  if (currencyInfo.rate <= 0) return num;
  const inUSD = num / currencyInfo.rate;
  return Math.round(inUSD * 100) / 100;
}

/**
 * Format a number into regional currency presentation
 */
function formatCurrency(amount, currencyCode = 'USD') {
  const info =
    DEFAULT_CURRENCY_METADATA[currencyCode.toUpperCase()] || DEFAULT_CURRENCY_METADATA.USD;
  const num = Number(amount) || 0;

  if (info.decimals === 0) {
    return `${info.symbol} ${Math.round(num).toLocaleString('en-US')}`;
  }

  return `${info.symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  })}`;
}

module.exports = {
  getExchangeRates,
  convertPrice,
  convertToUSD,
  formatCurrency,
  SUPPORTED_CURRENCIES: Object.keys(DEFAULT_CURRENCY_METADATA),
  DEFAULT_CURRENCY_METADATA,
};
