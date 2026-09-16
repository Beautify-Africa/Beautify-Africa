// tests/currencyService.test.js
jest.mock('../config/redis', () => ({
  status: 'ready',
  get: jest.fn(),
  set: jest.fn(),
}));

const redisClient = require('../config/redis');
const {
  getExchangeRates,
  convertPrice,
  convertToUSD,
  formatCurrency,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY_METADATA,
} = require('../services/currencyService');

describe('Currency Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('supports key African and global currencies', () => {
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('KES');
      expect(SUPPORTED_CURRENCIES).toContain('NGN');
      expect(SUPPORTED_CURRENCIES).toContain('GHS');
      expect(SUPPORTED_CURRENCIES).toContain('ZAR');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
    });
  });

  describe('getExchangeRates', () => {
    it('returns default metadata when Redis cache is empty', async () => {
      redisClient.get.mockResolvedValue(null);
      const rates = await getExchangeRates();

      expect(rates).toEqual(DEFAULT_CURRENCY_METADATA);
      expect(redisClient.set).toHaveBeenCalledWith(
        'currency:rates:v1',
        JSON.stringify(DEFAULT_CURRENCY_METADATA),
        'EX',
        60 * 60 * 12
      );
    });

    it('returns cached rates when available in Redis', async () => {
      const mockCached = {
        USD: { code: 'USD', symbol: '$', rate: 1.0, decimals: 2 },
        KES: { code: 'KES', symbol: 'KSh', rate: 135.0, decimals: 0 },
      };
      redisClient.get.mockResolvedValue(JSON.stringify(mockCached));

      const rates = await getExchangeRates();
      expect(rates.KES.rate).toBe(135.0);
      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it('falls back gracefully to defaults when Redis throws an error', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis connection lost'));

      const rates = await getExchangeRates();
      expect(rates).toEqual(DEFAULT_CURRENCY_METADATA);
    });
  });

  describe('convertPrice', () => {
    it('converts USD to KES correctly', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await convertPrice(10, 'KES');

      // 10 USD * 130 = 1300 KES
      expect(result.currency).toBe('KES');
      expect(result.amount).toBe(1300);
      expect(result.symbol).toBe('KSh');
      expect(result.formatted).toContain('KSh');
    });

    it('converts USD to NGN correctly', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await convertPrice(20, 'NGN');

      // 20 USD * 1500 = 30000 NGN
      expect(result.currency).toBe('NGN');
      expect(result.amount).toBe(30000);
      expect(result.symbol).toBe('₦');
    });

    it('converts USD to EUR with 2 decimal precision', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await convertPrice(10, 'EUR');

      // 10 USD * 0.92 = 9.2 EUR
      expect(result.currency).toBe('EUR');
      expect(result.amount).toBe(9.2);
    });

    it('defaults to USD if an unsupported currency is requested', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await convertPrice(50, 'XYZ');

      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(50);
    });
  });

  describe('convertToUSD', () => {
    it('converts local currency back to USD', async () => {
      redisClient.get.mockResolvedValue(null);
      const usdAmount = await convertToUSD(1300, 'KES');
      expect(usdAmount).toBe(10);
    });

    it('converts NGN back to USD', async () => {
      redisClient.get.mockResolvedValue(null);
      const usdAmount = await convertToUSD(30000, 'NGN');
      expect(usdAmount).toBe(20);
    });
  });

  describe('formatCurrency', () => {
    it('formats KES with zero decimals and KSh symbol', () => {
      const formatted = formatCurrency(2500, 'KES');
      expect(formatted).toBe('KSh 2,500');
    });

    it('formats USD with two decimals and dollar symbol', () => {
      const formatted = formatCurrency(25.5, 'USD');
      expect(formatted).toBe('$25.50');
    });

    it('formats NGN with zero decimals and naira symbol', () => {
      const formatted = formatCurrency(15000, 'NGN');
      expect(formatted).toBe('₦ 15,000');
    });
  });
});
