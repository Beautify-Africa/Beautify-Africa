const crypto = require('crypto');
const express = require('express');
const request = require('supertest');

jest.mock('../models/User');
jest.mock('../utils/sendEmail', () => jest.fn());

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const authRoutes = require('../routes/authRoutes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Password reset auth flow', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'password-reset-test-secret';
    process.env.PASSWORD_RESET_URL_BASE = 'http://localhost:5173';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test('forgot-password requires email', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({});

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/email is required/i);
  });

  test('forgot-password returns generic success when account does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toMatch(/if an account with that email exists/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('forgot-password stores hashed token and sends email for existing account', async () => {
    const userDoc = {
      email: 'customer@example.com',
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findOne.mockResolvedValue(userDoc);
    sendEmail.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'customer@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');

    expect(userDoc.passwordResetToken).toBeTruthy();
    expect(userDoc.passwordResetExpires).toBeInstanceOf(Date);
    expect(userDoc.save).toHaveBeenCalledWith({ validateBeforeSave: false });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sentPayload = sendEmail.mock.calls[0][0];
    expect(sentPayload.email).toBe('customer@example.com');
    expect(sentPayload.subject).toMatch(/password reset/i);

    const tokenMatch = sentPayload.html.match(/token=([a-f0-9]+)/i);
    expect(tokenMatch).toBeTruthy();

    const hashedTokenFromEmail = crypto
      .createHash('sha256')
      .update(tokenMatch[1])
      .digest('hex');

    expect(hashedTokenFromEmail).toBe(userDoc.passwordResetToken);
  });

  test('forgot-password clears token and returns 500 if email delivery fails', async () => {
    const userDoc = {
      email: 'customer@example.com',
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findOne.mockResolvedValue(userDoc);
    sendEmail.mockRejectedValue(new Error('smtp unavailable'));

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'customer@example.com' });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/unable to deliver password reset email/i);
    expect(userDoc.passwordResetToken).toBeUndefined();
    expect(userDoc.passwordResetExpires).toBeUndefined();
    expect(userDoc.save).toHaveBeenCalledTimes(2);
    expect(userDoc.save).toHaveBeenNthCalledWith(1, { validateBeforeSave: false });
    expect(userDoc.save).toHaveBeenNthCalledWith(2, { validateBeforeSave: false });
  });

  test('reset-password rejects invalid or expired token', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid', password: 'NewPass@123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/invalid or has expired/i);
  });

  test('reset-password updates password and clears reset fields', async () => {
    const userDoc = {
      password: 'old-password',
      passwordResetToken: 'existing-hash',
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findOne.mockResolvedValue(userDoc);

    const rawToken = 'abc123token';
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'NewPass@123' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toMatch(/password reset successful/i);

    expect(User.findOne).toHaveBeenCalledWith({
      passwordResetToken: expectedHash,
      passwordResetExpires: { $gt: expect.any(Date) },
    });

    expect(userDoc.password).toBe('NewPass@123');
    expect(userDoc.passwordResetToken).toBeUndefined();
    expect(userDoc.passwordResetExpires).toBeUndefined();
    expect(userDoc.save).toHaveBeenCalledTimes(1);
  });
});
