const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User');
jest.mock('../utils/sendEmail', () => jest.fn());
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const User = require('../models/User');
const redisClient = require('../config/redis');
const authRoutes = require('../routes/authRoutes');
const { buildJwtBlacklistKey } = require('../services/authService');

const USER_ID = '507f1f77bcf86cd799439011';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

function authTokenFor(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Auth logout + JWT blacklist flow', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'logout-blacklist-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    User.findById.mockResolvedValue({
      _id: USER_ID,
      name: 'Blacklist Tester',
      email: 'blacklist@test.com',
      isAdmin: false,
    });

    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue('OK');
  });

  test('logout blacklists the current token using remaining token lifetime', async () => {
    const token = authTokenFor(USER_ID);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toMatch(/logged out/i);

    expect(redisClient.set).toHaveBeenCalledTimes(1);

    const [key, value, exKeyword, ttlSeconds] = redisClient.set.mock.calls[0];
    expect(key).toBe(buildJwtBlacklistKey(token));
    expect(value).toBe('1');
    expect(exKeyword).toBe('EX');
    expect(Number.isInteger(ttlSeconds)).toBe(true);
    expect(ttlSeconds).toBeGreaterThan(0);
  });

  test('protect middleware rejects blacklisted tokens', async () => {
    const token = authTokenFor(USER_ID);

    redisClient.get.mockResolvedValue('1');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/invalidated/i);
    expect(User.findById).not.toHaveBeenCalled();
  });
});
