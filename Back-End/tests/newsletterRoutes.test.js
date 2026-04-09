const crypto = require('crypto');
const express = require('express');
const request = require('supertest');

jest.mock('../models/Newsletter');
jest.mock('../utils/sendEmail');

const Newsletter = require('../models/Newsletter');
const sendEmail = require('../utils/sendEmail');
const newsletterRoutes = require('../routes/newsletterRoutes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/newsletter', newsletterRoutes);
  return app;
}

function createSubscriberDoc(overrides = {}) {
  const subscriber = {
    email: 'subscriber@test.com',
    isActive: true,
    unsubscribeToken: undefined,
    unsubscribeTokenExpires: undefined,
    unsubscribedAt: null,
    save: jest.fn(),
    ...overrides,
  };

  subscriber.save.mockImplementation(async function save() {
    return this;
  });

  return subscriber;
}

describe('Newsletter unsubscribe routes', () => {
  let app;

  beforeAll(() => {
    process.env.CLIENT_URL = 'http://localhost:5173';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test('validates unsubscribe request email', async () => {
    const response = await request(app)
      .post('/api/newsletter/unsubscribe/request')
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('returns generic success for unknown subscriber email', async () => {
    Newsletter.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/newsletter/unsubscribe/request')
      .send({ email: 'missing@test.com' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toMatch(/If that email is subscribed/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('creates unsubscribe token and sends email for active subscriber', async () => {
    const subscriber = createSubscriberDoc({ email: 'subscriber@test.com' });
    Newsletter.findOne.mockResolvedValue(subscriber);
    sendEmail.mockResolvedValue();

    const response = await request(app)
      .post('/api/newsletter/unsubscribe/request')
      .send({ email: 'subscriber@test.com' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Newsletter.findOne).toHaveBeenCalledWith({
      email: 'subscriber@test.com',
      isActive: true,
    });
    expect(subscriber.save).toHaveBeenCalledTimes(1);
    expect(subscriber.unsubscribeToken).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(subscriber.unsubscribeTokenExpires).toBeInstanceOf(Date);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'subscriber@test.com',
        subject: 'Beautify Africa Newsletter Unsubscribe',
      })
    );
    expect(sendEmail.mock.calls[0][0].html).toContain('/newsletter/unsubscribe?token=');
  });

  test('clears token and returns 500 when unsubscribe email delivery fails', async () => {
    const subscriber = createSubscriberDoc({ email: 'subscriber@test.com' });
    Newsletter.findOne.mockResolvedValue(subscriber);
    sendEmail.mockRejectedValue(new Error('smtp unavailable'));

    const response = await request(app)
      .post('/api/newsletter/unsubscribe/request')
      .send({ email: 'subscriber@test.com' });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('error');
    expect(subscriber.save).toHaveBeenCalledTimes(2);
    expect(subscriber.unsubscribeToken).toBeUndefined();
    expect(subscriber.unsubscribeTokenExpires).toBeUndefined();
  });

  test('rejects unsubscribe confirmation without token', async () => {
    const response = await request(app)
      .post('/api/newsletter/unsubscribe/confirm')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/token is required/i);
  });

  test('rejects unsubscribe confirmation with invalid token', async () => {
    Newsletter.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/newsletter/unsubscribe/confirm')
      .send({ token: 'invalid-token' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/invalid or has expired/i);
  });

  test('deactivates subscriber when unsubscribe token is valid', async () => {
    const rawToken = 'valid-unsubscribe-token';
    const expectedHashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const subscriber = createSubscriberDoc({
      email: 'subscriber@test.com',
      isActive: true,
      unsubscribeToken: expectedHashedToken,
      unsubscribeTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    Newsletter.findOne.mockResolvedValue(subscriber);

    const response = await request(app)
      .post('/api/newsletter/unsubscribe/confirm')
      .send({ token: rawToken });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toMatch(/unsubscribed/i);
    expect(subscriber.isActive).toBe(false);
    expect(subscriber.unsubscribedAt).toBeInstanceOf(Date);
    expect(subscriber.unsubscribeToken).toBeUndefined();
    expect(subscriber.unsubscribeTokenExpires).toBeUndefined();
    expect(subscriber.save).toHaveBeenCalledTimes(1);

    const query = Newsletter.findOne.mock.calls[0][0];
    expect(query.unsubscribeToken).toBe(expectedHashedToken);
    expect(query.unsubscribeTokenExpires.$gt).toBeInstanceOf(Date);
  });
});
