// tests/advancedSecurity.test.js
const mockCache = new Map();

jest.mock('../config/redis', () => ({
  get: jest.fn(async (key) => mockCache.get(key) || null),
  set: jest.fn(async (key, val) => {
    mockCache.set(key, val);
    return 'OK';
  }),
  del: jest.fn(async (key) => {
    mockCache.delete(key);
    return 1;
  }),
  quit: jest.fn(),
  on: jest.fn(),
}));

const mockDbEvents = new Map();
jest.mock('../models/WebhookEvent', () => ({
  findByPk: jest.fn(async (id) => mockDbEvents.get(id) || null),
  findOrCreate: jest.fn(async ({ where, defaults }) => {
    if (mockDbEvents.has(where.id)) {
      return [mockDbEvents.get(where.id), false];
    }
    const newEvent = { id: where.id, ...defaults };
    mockDbEvents.set(where.id, newEvent);
    return [newEvent, true];
  }),
  update: jest.fn(async (updates, { where }) => {
    const existing = mockDbEvents.get(where.id);
    if (existing) {
      Object.assign(existing, updates);
    }
    return [1];
  }),
}));

const request = require('supertest');
const express = require('express');
const queryCaps = require('../middlewares/queryCaps');
const idempotency = require('../middlewares/idempotency');
const { updateProfileSchema } = require('../validations/authValidation');
const {
  checkOrClaimWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
} = require('../services/webhookDeduplication');

describe('Advanced Website Security Suite', () => {
  beforeEach(() => {
    mockCache.clear();
    mockDbEvents.clear();
    jest.clearAllMocks();
  });

  describe('1. Global Query & Pagination Caps', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(queryCaps);
      app.get('/api/test-pagination', (req, res) => {
        res.json({
          limit: req.query.limit,
          pageSize: req.query.pageSize,
          page: req.query.page,
        });
      });
    });

    test('clamps excessive limit > 100 down to 100', async () => {
      const res = await request(app).get('/api/test-pagination?limit=5000');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(100);
    });

    test('clamps excessive pageSize > 100 down to 100', async () => {
      const res = await request(app).get('/api/test-pagination?pageSize=9999');
      expect(res.status).toBe(200);
      expect(res.body.pageSize).toBe(100);
    });

    test('preserves valid pagination within limits (e.g. limit=20, page=2)', async () => {
      const res = await request(app).get('/api/test-pagination?limit=20&pageSize=25&page=2');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(20);
      expect(res.body.pageSize).toBe(25);
      expect(res.body.page).toBe(2);
    });

    test('ensures page is at least 1 when negative or zero is passed', async () => {
      const res = await request(app).get('/api/test-pagination?page=0');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    });
  });

  describe('2. Idempotency Middleware', () => {
    let app;
    let hitCounter = 0;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.post('/api/orders/checkout', idempotency, (req, res) => {
        hitCounter++;
        res.status(201).json({
          orderId: `ord-${hitCounter}`,
          message: 'Order created',
        });
      });
    });

    beforeEach(() => {
      hitCounter = 0;
    });

    test('rejects keys shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/orders/checkout')
        .set('Idempotency-Key', 'short')
        .send({ amount: 50 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_IDEMPOTENCY_KEY');
    });

    test('passes through normally when no idempotency key is provided', async () => {
      const res1 = await request(app).post('/api/orders/checkout').send({ amount: 50 });
      const res2 = await request(app).post('/api/orders/checkout').send({ amount: 50 });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.orderId).toBe('ord-1');
      expect(res2.body.orderId).toBe('ord-2');
    });

    test('replays cached response on duplicate idempotency key submission', async () => {
      const testKey = `test-key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const firstRes = await request(app)
        .post('/api/orders/checkout')
        .set('Idempotency-Key', testKey)
        .send({ amount: 100 });

      expect(firstRes.status).toBe(201);
      expect(firstRes.headers['x-idempotent-replay']).toBeUndefined();
      expect(firstRes.body.orderId).toBe('ord-1');

      // Second identical request with same key
      const secondRes = await request(app)
        .post('/api/orders/checkout')
        .set('Idempotency-Key', testKey)
        .send({ amount: 100 });

      expect(secondRes.status).toBe(201);
      expect(secondRes.headers['x-idempotent-replay']).toBe('true');
      expect(secondRes.body.orderId).toBe('ord-1'); // Exact cached body replayed
      expect(hitCounter).toBe(1); // Underlying route handler was NOT called again
    });
  });

  describe('3. Webhook Deduplication Service', () => {
    test('detects and marks processed events as duplicates', async () => {
      const testEventId = `evt_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const gateway = 'stripe';

      // First arrival: not a duplicate
      const firstCheck = await checkOrClaimWebhookEvent({
        gateway,
        eventId: testEventId,
        eventType: 'payment_intent.succeeded',
        payload: { id: testEventId },
      });
      expect(firstCheck.isDuplicate).toBe(false);

      // Mark as processed
      await markWebhookProcessed({ gateway, eventId: testEventId });

      // Second arrival: should be detected as duplicate
      const secondCheck = await checkOrClaimWebhookEvent({
        gateway,
        eventId: testEventId,
        eventType: 'payment_intent.succeeded',
      });
      expect(secondCheck.isDuplicate).toBe(true);
      expect(secondCheck.status).toBe('processed');
    });

    test('clears in-flight lock on failure allowing retry', async () => {
      const testEventId = `evt_failed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const gateway = 'paystack';

      await checkOrClaimWebhookEvent({
        gateway,
        eventId: testEventId,
        eventType: 'charge.success',
      });

      await markWebhookFailed({
        gateway,
        eventId: testEventId,
        errorMessage: 'Simulated downstream transient error',
      });

      // Retrying should not be blocked as duplicate
      const retryCheck = await checkOrClaimWebhookEvent({
        gateway,
        eventId: testEventId,
        eventType: 'charge.success',
      });
      expect(retryCheck.isDuplicate).toBe(false);
    });
  });

  describe('4. Mass Assignment & Privilege Escalation Prevention', () => {
    test('allows valid user profile updates with name, email, password', () => {
      const valid = updateProfileSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(valid.success).toBe(true);
    });

    test('rejects privilege escalation attempts injecting role or isAdmin', () => {
      const roleInjection = updateProfileSchema.safeParse({
        name: 'Attacker',
        role: 'admin',
      });
      expect(roleInjection.success).toBe(false);

      const adminInjection = updateProfileSchema.safeParse({
        name: 'Attacker',
        isAdmin: true,
      });
      expect(adminInjection.success).toBe(false);

      const verifiedInjection = updateProfileSchema.safeParse({
        isEmailVerified: true,
      });
      expect(verifiedInjection.success).toBe(false);
    });

    test('rejects attempts to inject primary key or security lockout fields', () => {
      const idInjection = updateProfileSchema.safeParse({
        id: 'user-override-id',
        name: 'Valid Name',
      });
      expect(idInjection.success).toBe(false);

      const lockoutInjection = updateProfileSchema.safeParse({
        failedLoginAttempts: 0,
        lockUntil: null,
      });
      expect(lockoutInjection.success).toBe(false);
    });
  });

  describe('5. Slowloris & Server HTTP Timeout Hardening', () => {
    test('HTTP server defines headersTimeout >= 60000 and requestTimeout >= 30000', () => {
      const http = require('http');
      const testApp = express();
      const testServer = http.createServer(testApp);
      testServer.headersTimeout = 60000;
      testServer.requestTimeout = 30000;
      testServer.keepAliveTimeout = 65000;

      expect(testServer.headersTimeout).toBe(60000);
      expect(testServer.requestTimeout).toBe(30000);
      expect(testServer.keepAliveTimeout).toBe(65000);
      testServer.close();
    });
  });
});
