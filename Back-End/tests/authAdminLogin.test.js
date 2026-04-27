const express = require('express');
const request = require('supertest');

jest.mock('../models/User');

const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

const ADMIN_EMAIL = 'stephenmutheu@gmail.com';
const ADMIN_PASSWORD = 'Mutheu@2020';
const ADMIN_USER_ID = '507f1f77bcf86cd799439099';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('POST /api/auth/admin-login', () => {
  let app;
  let server;

  beforeAll(() => {
    process.env.JWT_SECRET = 'admin-login-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
    process.env.ADMIN_DASHBOARD_PASSWORD = ADMIN_PASSWORD;
    app = createApp();
  });

  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });

  test('returns 503 when admin credentials are not configured', async () => {
    process.env.ADMIN_DASHBOARD_PASSWORD = '';

    const response = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/not configured/i);
  });

  test('rejects invalid admin credentials', async () => {
    const response = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: ADMIN_EMAIL, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid admin dashboard credentials');
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('logs in with configured credentials and creates admin user when missing', async () => {
    const selectMock = jest.fn().mockResolvedValue(null);
    User.findOne.mockReturnValue({ select: selectMock });
    User.create.mockResolvedValue({
      _id: ADMIN_USER_ID,
      name: 'Admin User',
      email: ADMIN_EMAIL,
      isAdmin: true,
    });

    const response = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe(ADMIN_EMAIL);
    expect(response.body.user.isAdmin).toBe(true);

    expect(User.findOne).toHaveBeenCalledWith({ email: ADMIN_EMAIL });
    expect(selectMock).toHaveBeenCalledWith('+password');
    expect(User.create).toHaveBeenCalledWith({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      isAdmin: true,
    });
  });

  test('elevates and updates existing user password when credentials match server config', async () => {
    const userDoc = {
      _id: ADMIN_USER_ID,
      name: 'Stephen',
      email: ADMIN_EMAIL,
      isAdmin: false,
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const selectMock = jest.fn().mockResolvedValue(userDoc);
    User.findOne.mockReturnValue({ select: selectMock });

    const response = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(userDoc.comparePassword).toHaveBeenCalledWith(ADMIN_PASSWORD);
    expect(userDoc.isAdmin).toBe(true);
    expect(userDoc.password).toBe(ADMIN_PASSWORD);
    expect(userDoc.save).toHaveBeenCalledTimes(1);
  });
});
