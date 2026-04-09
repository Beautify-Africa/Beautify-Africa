jest.mock('../models/Product');
jest.mock('../models/Cart');

const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { buildVerifiedOrderItems } = require('../services/orderService');

describe('buildVerifiedOrderItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds verified order items from a direct product id', async () => {
    Product.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      name: 'Glow Serum',
      image: '/glow-serum.jpg',
      price: 25,
      inStock: true,
    });

    const result = await buildVerifiedOrderItems([
      { product: '507f1f77bcf86cd799439012', qty: 2 },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.itemsPrice).toBe(50);
    expect(result.verifiedOrderItems).toEqual([
      {
        name: 'Glow Serum',
        qty: 2,
        image: '/glow-serum.jpg',
        price: 25,
        product: '507f1f77bcf86cd799439012',
      },
    ]);
  });

  test('accepts an authenticated cart item subdocument id and resolves it to the product id', async () => {
    Product.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439099',
        name: 'Baobab Butter',
        image: '/baobab-butter.jpg',
        price: 18,
        inStock: true,
      });

    Cart.findOne.mockResolvedValue({
      cartItems: [
        {
          _id: { toString: () => '69d7ac2d39cb8055f7eae7b2' },
          product: '507f1f77bcf86cd799439099',
        },
      ],
    });

    const result = await buildVerifiedOrderItems(
      [{ product: '69d7ac2d39cb8055f7eae7b2', quantity: 1 }],
      '507f1f77bcf86cd799439011'
    );

    expect(Cart.findOne).toHaveBeenCalledWith({
      user: '507f1f77bcf86cd799439011',
      'cartItems._id': '69d7ac2d39cb8055f7eae7b2',
    });
    expect(result.error).toBeUndefined();
    expect(result.verifiedOrderItems[0]).toMatchObject({
      name: 'Baobab Butter',
      qty: 1,
      price: 18,
      product: '507f1f77bcf86cd799439099',
    });
  });
});
