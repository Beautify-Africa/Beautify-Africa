const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Wishlist', () => ({
  Wishlist: {
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
  },
  WishlistProduct: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    findOrCreate: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));
jest.mock('../models/Product', () => ({
  Product: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
}));

const User = require('../models/User');
const { Wishlist, WishlistProduct } = require('../models/Wishlist');
const { Product } = require('../models/Product');
const wishlistRoutes = require('../routes/wishlistRoutes');

const USER_ID = 'a111a111-a111-a111-a111-a111a111a111';
const WISHLIST_ID = 'w111w111-w111-w111-w111-w111w111w111';
const PRODUCT_ID_A = 'b111b111-b111-b111-b111-b111b111b111';
const PRODUCT_ID_B = 'c111c111-c111-c111-c111-c111c111c111';
const PRODUCT_ID_C = 'd111d111-d111-d111-d111-d111d111d111';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wishlist', wishlistRoutes);
  return app;
}

describe('Wishlist routes', () => {
  let app;
  let server;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'wishlist-route-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    app = createApp();
    authToken = jwt.sign({ id: USER_ID }, process.env.JWT_SECRET);

    User.findByPk.mockResolvedValue({
      id: USER_ID,
      _id: USER_ID,
      name: 'Wishlist Tester',
      email: 'wishlist@test.com',
    });

    Wishlist.findOrCreate.mockResolvedValue([{ id: WISHLIST_ID, userId: USER_ID }]);
    Wishlist.findOne.mockResolvedValue({ id: WISHLIST_ID, userId: USER_ID });
  });

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  test('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/wishlist');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  test('returns wishlist products for authenticated user', async () => {
    WishlistProduct.findAll.mockResolvedValue([{ productId: PRODUCT_ID_A }]);
    Product.findAll.mockResolvedValue([
      {
        id: PRODUCT_ID_A,
        name: 'Product A',
        price: 20,
      },
    ]);

    const response = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.count).toBe(1);
    expect(response.body.data[0]._id).toBe(PRODUCT_ID_A);
  });

  test('toggles an existing product off the wishlist', async () => {
    const existingEntry = {
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    WishlistProduct.findOne.mockResolvedValue(existingEntry);
    WishlistProduct.findAll.mockResolvedValue([]);
    Product.findAll.mockResolvedValue([]);

    const response = await request(app)
      .post('/api/wishlist/toggle')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: PRODUCT_ID_A });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.action).toBe('removed');
    expect(response.body.inWishlist).toBe(false);
    expect(existingEntry.destroy).toHaveBeenCalledTimes(1);
  });

  test('syncs guest wishlist items into the authenticated wishlist', async () => {
    WishlistProduct.findAll
      .mockResolvedValueOnce([{ productId: PRODUCT_ID_A }])
      .mockResolvedValueOnce([
        { productId: PRODUCT_ID_A },
        { productId: PRODUCT_ID_B },
      ]);

    Product.findAll
      .mockResolvedValueOnce([{ id: PRODUCT_ID_B }, { id: PRODUCT_ID_C }])
      .mockResolvedValueOnce([
        { id: PRODUCT_ID_A, name: 'Product A' },
        { id: PRODUCT_ID_B, name: 'Product B' },
      ]);

    const response = await request(app)
      .post('/api/wishlist/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        localItems: [
          PRODUCT_ID_A,
          PRODUCT_ID_B,
          PRODUCT_ID_B,
          'invalid-product-id',
          { productId: PRODUCT_ID_C },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.count).toBe(2);
    expect(response.body.data.map((item) => item._id)).toEqual([PRODUCT_ID_A, PRODUCT_ID_B]);
    expect(WishlistProduct.bulkCreate).toHaveBeenCalled();
  });

  test('validates sync payload shape', async () => {
    const response = await request(app)
      .post('/api/wishlist/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ localItems: 'not-an-array' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/Expected an array of items/i);
  });
});
