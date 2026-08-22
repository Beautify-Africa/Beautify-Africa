jest.mock('../models/Product', () => ({
  Product: {
    findAll: jest.fn(),
  },
}));
jest.mock('../models/Cart', () => ({
  Cart: {
    findOne: jest.fn(),
  },
  CartItem: {},
}));
jest.mock('../services/inventoryLock', () => ({
  withInventoryLock: jest.fn(),
}));

const { Product } = require('../models/Product');
const { Cart } = require('../models/Cart');
const { withInventoryLock } = require('../services/inventoryLock');
const { buildVerifiedOrderItems } = require('../services/orderService');

describe('buildVerifiedOrderItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withInventoryLock.mockImplementation(async (_productId, fn) => {
      const result = await fn();
      return { result };
    });
  });

  test('builds verified order items from a direct product id', async () => {
    Product.findAll.mockResolvedValue([
      {
        id: 'c744f43c-628e-48a0-975d-852654ecbf6c',
        name: 'Glow Serum',
        image: '/glow-serum.jpg',
        price: 25,
        inStock: true,
      },
    ]);

    const result = await buildVerifiedOrderItems([
      { product: 'c744f43c-628e-48a0-975d-852654ecbf6c', qty: 2 },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.itemsPrice).toBe(50);
    expect(result.verifiedOrderItems).toEqual([
      {
        name: 'Glow Serum',
        qty: 2,
        image: '/glow-serum.jpg',
        price: 25,
        productId: 'c744f43c-628e-48a0-975d-852654ecbf6c',
      },
    ]);
  });

  test('accepts an authenticated cart item id and resolves it to the product id', async () => {
    Product.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'e625a589-98a9-4676-a059-e932906b3bc4',
          name: 'Baobab Butter',
          image: '/baobab-butter.jpg',
          price: 18,
          inStock: true,
        },
      ]);

    Cart.findOne.mockResolvedValue({
      cartItems: [
        {
          id: '2be0f81d-6548-4cb9-ba9d-cf8152345d8b',
          productId: 'e625a589-98a9-4676-a059-e932906b3bc4',
        },
      ],
    });

    const result = await buildVerifiedOrderItems(
      [{ product: '2be0f81d-6548-4cb9-ba9d-cf8152345d8b', quantity: 1 }],
      'a111a111-a111-a111-a111-a111a111a111'
    );

    expect(result.error).toBeUndefined();
    expect(result.verifiedOrderItems[0]).toMatchObject({
      name: 'Baobab Butter',
      qty: 1,
      price: 18,
      productId: 'e625a589-98a9-4676-a059-e932906b3bc4',
    });
  });

  test('returns a conflict error when a product lock is already held', async () => {
    Product.findAll.mockResolvedValue([
      {
        id: 'c744f43c-628e-48a0-975d-852654ecbf6c',
        name: 'Glow Serum',
        image: '/glow-serum.jpg',
        price: 25,
        inStock: true,
      },
    ]);

    withInventoryLock.mockResolvedValueOnce({ conflict: true });

    const result = await buildVerifiedOrderItems([
      { product: 'c744f43c-628e-48a0-975d-852654ecbf6c', qty: 1 },
    ]);

    expect(result.error).toBeDefined();
    expect(result.error.statusCode).toBe(409);
    expect(result.error.message).toMatch(/currently being reserved/i);
  });
});
