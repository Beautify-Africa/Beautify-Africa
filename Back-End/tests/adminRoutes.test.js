const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User');
jest.mock('../services/adminService', () => ({
  fetchAdminDashboard: jest.fn(),
  updateAdminOrder: jest.fn(),
}));

const User = require('../models/User');
const { fetchAdminDashboard, updateAdminOrder } = require('../services/adminService');
const adminRoutes = require('../routes/adminRoutes');

const USER_ID = '507f1f77bcf86cd799439011';
const ADMIN_ID = '507f1f77bcf86cd799439099';
const ORDER_ID = '507f1f77bcf86cd799439012';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  return app;
}

describe('Admin routes', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'admin-route-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAILS = '';
    app = createApp();
  });

  function authTokenFor(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET);
  }

  test('rejects unauthenticated dashboard requests', async () => {
    const response = await request(app).get('/api/admin/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  test('rejects authenticated non-admin users', async () => {
    User.findById.mockResolvedValue({
      _id: USER_ID,
      name: 'Regular User',
      email: 'user@test.com',
      isAdmin: false,
    });

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${authTokenFor(USER_ID)}`);

    expect(response.status).toBe(403);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Admin access required');
  });

  test('allows admin users to fetch dashboard', async () => {
    User.findById.mockResolvedValue({
      _id: ADMIN_ID,
      name: 'Admin User',
      email: 'admin@test.com',
      isAdmin: true,
    });
    fetchAdminDashboard.mockResolvedValue({
      stats: [{ label: 'Live Order Queue', value: '1' }],
      priorityOrders: [],
    });

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${authTokenFor(ADMIN_ID)}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(fetchAdminDashboard).toHaveBeenCalledTimes(1);
    expect(response.body.data.stats).toHaveLength(1);
  });

  test('patches order using provided action', async () => {
    User.findById.mockResolvedValue({
      _id: ADMIN_ID,
      name: 'Admin User',
      email: 'admin@test.com',
      isAdmin: true,
    });
    updateAdminOrder.mockResolvedValue({ _id: ORDER_ID, fulfillmentStatus: 'packed' });

    const response = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${authTokenFor(ADMIN_ID)}`)
      .send({ action: 'pack' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(updateAdminOrder).toHaveBeenCalledWith(ORDER_ID, 'pack');
  });

  test('returns service errors with their status code', async () => {
    User.findById.mockResolvedValue({
      _id: ADMIN_ID,
      name: 'Admin User',
      email: 'admin@test.com',
      isAdmin: true,
    });

    const serviceError = new Error('Unsupported admin action: refund');
    serviceError.statusCode = 400;
    updateAdminOrder.mockRejectedValue(serviceError);

    const response = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${authTokenFor(ADMIN_ID)}`)
      .send({ action: 'refund' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Unsupported admin action: refund');
  });
});
