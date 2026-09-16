const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} = require('../middlewares/validate');
const requestIdMiddleware = require('../middlewares/requestId');
const logger = require('../utils/logger');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/authValidation');
const {
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
} = require('../validations/orderValidation');
const {
  productIdParamSchema,
  createReviewSchema,
  adjustStockSchema,
} = require('../validations/productValidation');

describe('Observability & Validation Subsystem', () => {
  describe('RequestId Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);
      app.get('/test-id', (req, res) => {
        res.json({ id: req.id, hasLogger: Boolean(req.log) });
      });
    });

    test('generates a new x-request-id when none is supplied', async () => {
      const response = await request(app).get('/test-id');

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id'].length).toBeGreaterThan(10);
      expect(response.body.id).toBe(response.headers['x-request-id']);
      expect(response.body.hasLogger).toBe(true);
    });

    test('propagates existing x-request-id header from incoming request', async () => {
      const customId = 'custom-correlation-id-9988';
      const response = await request(app).get('/test-id').set('x-request-id', customId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(customId);
      expect(response.body.id).toBe(customId);
    });
  });

  describe('Validation Middleware (Zod)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      const sampleSchema = z.object({
        name: z.string({ message: 'Name is required' }).min(2, 'Name too short'),
        count: z.coerce.number().int().min(1, 'Count must be at least 1'),
      });

      const querySchema = z.object({
        page: z.coerce.number().int().min(1),
      });

      const paramsSchema = z.object({
        id: z
          .string()
          .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            'Invalid ID parameter'
          ),
      });

      app.post('/validate-body', validateBody(sampleSchema), (req, res) => {
        res.json({ status: 'success', data: req.body });
      });

      app.get('/validate-query', validateQuery(querySchema), (req, res) => {
        res.json({ status: 'success', query: req.query });
      });

      app.get('/validate-param/:id', validateParams(paramsSchema), (req, res) => {
        res.json({ status: 'success', params: req.params });
      });
    });

    test('passes valid body payload and coerces types', async () => {
      const response = await request(app)
        .post('/validate-body')
        .send({ name: 'Valid Name', count: '5' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Valid Name');
      expect(response.body.data.count).toBe(5);
    });

    test('returns structured 400 error when body validation fails', async () => {
      const response = await request(app).post('/validate-body').send({ name: 'A', count: 0 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors[0]).toHaveProperty('field');
      expect(response.body.errors[0]).toHaveProperty('message');
    });

    test('validates query parameters and coerces integer values', async () => {
      const validRes = await request(app).get('/validate-query?page=3');
      expect(validRes.status).toBe(200);
      expect(validRes.body.query.page).toBe(3);

      const invalidRes = await request(app).get('/validate-query?page=-1');
      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.code).toBe('VALIDATION_ERROR');
    });

    test('validates route parameters against UUID schema', async () => {
      const validRes = await request(app).get(
        '/validate-param/a111a111-a111-a111-a111-a111a111a111'
      );
      expect(validRes.status).toBe(200);

      const invalidRes = await request(app).get('/validate-param/invalid-uuid-string');
      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.code).toBe('VALIDATION_ERROR');
      expect(invalidRes.body.errors[0].message).toMatch(/Invalid ID parameter/);
    });
  });

  describe('Auth Validation Schemas', () => {
    test('validates register payload complexity', () => {
      const invalid = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'weak',
      });
      expect(invalid.success).toBe(false);

      const valid = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
      });
      expect(valid.success).toBe(true);
    });

    test('validates login payload requirements', () => {
      const missing = loginSchema.safeParse({});
      expect(missing.success).toBe(false);

      const valid = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('Order & Product Validation Schemas', () => {
    test('requires order items and valid address for order creation', () => {
      const emptyOrder = createOrderSchema.safeParse({ orderItems: [] });
      expect(emptyOrder.success).toBe(false);

      const validOrder = createOrderSchema.safeParse({
        orderItems: [
          {
            productId: 'b111b111-b111-b111-b111-b111b111b111',
            qty: 2,
            price: 25.0,
          },
        ],
        shippingAddress: {
          firstName: 'Amina',
          lastName: 'Kiprono',
          email: 'amina@example.com',
          address: 'Kenyatta Ave 123',
          city: 'Nairobi',
          zip: '00100',
          country: 'Kenya',
        },
        paymentMethod: 'Stripe',
      });
      expect(validOrder.success).toBe(true);
    });

    test('validates product reviews rating boundaries (1 to 5)', () => {
      const tooLow = createReviewSchema.safeParse({ rating: 0, comment: 'Bad' });
      expect(tooLow.success).toBe(false);

      const tooHigh = createReviewSchema.safeParse({ rating: 6, comment: 'Good' });
      expect(tooHigh.success).toBe(false);

      const validReview = createReviewSchema.safeParse({ rating: 4, comment: 'Excellent product' });
      expect(validReview.success).toBe(true);
    });
  });

  describe('Health Probes', () => {
    let app;

    beforeEach(() => {
      app = express();

      app.get('/health/live', (req, res) => {
        res.status(200).json({
          status: 'ok',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        });
      });

      app.get('/health/ready', async (req, res) => {
        res.status(200).json({
          status: 'ready',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          checks: { database: 'up', redis: 'up' },
        });
      });

      app.get('/health', async (req, res) => {
        res.status(200).json({
          status: 'ok',
          database: 'connected',
        });
      });
    });

    test('responds 200 on /health/live with process uptime', async () => {
      const response = await request(app).get('/health/live');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.timestamp).toBeDefined();
    });

    test('responds 200 on /health/ready with component status', async () => {
      const response = await request(app).get('/health/ready');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.checks.database).toBe('up');
      expect(response.body.checks.redis).toBe('up');
    });

    test('responds 200 on legacy /health', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
    });
  });
});
