const { sanitizeRequest, sanitizeValue } = require('../middlewares/requestSanitizer');
const { buildProductFilter } = require('../services/productService');

describe('request sanitizer', () => {
  test('removes Mongo operator-style keys recursively from request data', () => {
    const sanitized = sanitizeValue({
      email: 'user@example.com',
      profile: {
        name: 'Ada',
        $ne: null,
        'settings.theme': 'dark',
      },
      localItems: [
        {
          product: '507f1f77bcf86cd799439012',
          $gt: '',
        },
      ],
    });

    expect(sanitized).toEqual({
      email: 'user@example.com',
      profile: {
        name: 'Ada',
      },
      localItems: [
        {
          product: '507f1f77bcf86cd799439012',
        },
      ],
    });
  });

  test('sanitizes body and params without touching getter-only query objects', () => {
    const req = {
      body: {
        email: 'user@example.com',
        credentials: {
          password: 'secret',
          $ne: null,
        },
      },
      params: {
        id: '507f1f77bcf86cd799439011',
        '$where': 'sleep(5000)',
      },
    };

    Object.defineProperty(req, 'query', {
      enumerable: true,
      get() {
        return {
          skinType: {
            $ne: 'oily',
          },
        };
      },
    });

    const next = jest.fn();

    expect(() => sanitizeRequest(req, {}, next)).not.toThrow();
    expect(req.body).toEqual({
      email: 'user@example.com',
      credentials: {
        password: 'secret',
      },
    });
    expect(req.params).toEqual({
      id: '507f1f77bcf86cd799439011',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

const { Op } = require('sequelize');

describe('buildProductFilter', () => {
  test('ignores non-string query values and escapes the search term', () => {
    const filter = buildProductFilter({
      skinType: { $ne: 'oily' },
      q: 'dry+(skin)',
      minPrice: '10',
      maxPrice: '25',
      inStock: 'true',
    });

    expect(filter.skinType).toBeUndefined();
    expect(filter.inStock).toBe(true);
    expect(filter.price).toEqual({
      [Op.gte]: 10,
      [Op.lte]: 25,
    });
    expect(filter[Op.or]).toEqual([
      { name: { [Op.iLike]: '%dry+(skin)%' } },
      { brand: { [Op.iLike]: '%dry+(skin)%' } },
      { category: { [Op.iLike]: '%dry+(skin)%' } },
    ]);
  });
});

