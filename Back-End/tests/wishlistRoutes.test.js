const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Wishlist');
jest.mock('../models/Product');

const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const wishlistRoutes = require('../routes/wishlistRoutes');

const USER_ID = '507f1f77bcf86cd799439011';
const PRODUCT_ID_A = '507f1f77bcf86cd799439012';
const PRODUCT_ID_B = '507f1f77bcf86cd799439013';
const PRODUCT_ID_C = '507f1f77bcf86cd799439014';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wishlist', wishlistRoutes);
  return app;
}

function createWishlistDoc(initialItems = [], populatedItems = []) {
  const wishlistDoc = {
    user: USER_ID,
    items: [...initialItems],
    populate: jest.fn(),
    save: jest.fn(),
  };

  wishlistDoc.populate.mockImplementation(async function populate() {
    this.items = [...populatedItems];
    return this;
  });

  wishlistDoc.save.mockImplementation(async function save() {
    return this;
  });

  return wishlistDoc;
}

describe('Wishlist routes', () => {
  let app;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'wishlist-route-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    app = createApp();
    authToken = jwt.sign({ id: USER_ID }, process.env.JWT_SECRET);

    User.findById.mockResolvedValue({
      _id: USER_ID,
      name: 'Wishlist Tester',
      email: 'wishlist@test.com',
    });
  });

  test('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/wishlist');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  test('returns wishlist products for authenticated user', async () => {
    const populatedProducts = [
      {
        _id: PRODUCT_ID_A,
        name: 'Product A',
        price: 20,
      },
    ];

    const wishlistDoc = createWishlistDoc([PRODUCT_ID_A], populatedProducts);
    Wishlist.findOne.mockResolvedValue(wishlistDoc);

    const response = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.count).toBe(1);
    expect(response.body.data[0]._id).toBe(PRODUCT_ID_A);
  });

  test('toggles an existing product off the wishlist', async () => {
    const wishlistDoc = createWishlistDoc([PRODUCT_ID_A], []);
    Wishlist.findOne.mockResolvedValue(wishlistDoc);

    const response = await request(app)
      .post('/api/wishlist/toggle')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: PRODUCT_ID_A });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.action).toBe('removed');
    expect(response.body.inWishlist).toBe(false);
    expect(wishlistDoc.save).toHaveBeenCalledTimes(1);
  });

  test('syncs guest wishlist items into the authenticated wishlist', async () => {
    const populatedProducts = [
      { _id: PRODUCT_ID_A, name: 'Product A' },
      { _id: PRODUCT_ID_B, name: 'Product B' },
    ];

    const wishlistDoc = createWishlistDoc([PRODUCT_ID_A], populatedProducts);
    Wishlist.findOne.mockResolvedValue(wishlistDoc);
    const selectMock = jest.fn().mockResolvedValue([{ _id: PRODUCT_ID_B }]);
    Product.find.mockReturnValue({ select: selectMock });

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
    expect(Product.find).toHaveBeenCalledWith({
      _id: { $in: [PRODUCT_ID_B, PRODUCT_ID_C] },
    });
    expect(selectMock).toHaveBeenCalledWith('_id');
    expect(wishlistDoc.save).toHaveBeenCalledTimes(1);
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
