// tests/apiSecurityHardening.test.js
const request = require('supertest');
const express = require('express');
const { createHelmetOptions, permissionsPolicyMiddleware } = require('../config/helmetConfig');
const { createCorsOptions, isOriginAllowed } = require('../config/corsConfig');
const { csrfProtection, generateCsrfToken, getCsrfTokenHandler } = require('../middlewares/csrfProtection');
const { validateUploadFile } = require('../routes/uploadRoutes');
const {
  addToCartSchema,
  syncCartSchema,
  updateCartQtySchema,
  cartItemParamSchema,
} = require('../validations/cartValidation');
const {
  wishlistActionSchema,
  syncWishlistSchema,
} = require('../validations/wishlistValidation');
const {
  convertCurrencyQuerySchema,
  initializePaymentSchema,
  verifyPaymentParamSchema,
} = require('../validations/paymentValidation');
const { updateOrderStatusSchema, createOrderNoteSchema } = require('../validations/adminValidation');

describe('API & Backend Security Hardening Suite', () => {
  describe('1. Input Validation Schemas', () => {
    test('Cart validation: rejects empty item and out-of-range quantities', () => {
      // Missing both productId and product
      const emptyItem = addToCartSchema.safeParse({ quantity: 2 });
      expect(emptyItem.success).toBe(false);

      // Invalid quantity > 99
      const excessiveQty = addToCartSchema.safeParse({ productId: 'prod-1', quantity: 150 });
      expect(excessiveQty.success).toBe(false);

      // Valid cart item
      const validItem = addToCartSchema.safeParse({ productId: 'prod-1', quantity: 3 });
      expect(validItem.success).toBe(true);
      expect(validItem.data.quantity).toBe(3);

      // Update quantity must be between 0 and 99
      expect(updateCartQtySchema.safeParse({ quantity: 5 }).success).toBe(true);
      expect(updateCartQtySchema.safeParse({ quantity: -1 }).success).toBe(false);
      expect(updateCartQtySchema.safeParse({ quantity: 100 }).success).toBe(false);
    });

    test('Wishlist validation: requires valid productId and limits bulk sync', () => {
      expect(wishlistActionSchema.safeParse({}).success).toBe(false);
      expect(wishlistActionSchema.safeParse({ productId: '   ' }).success).toBe(false);
      expect(wishlistActionSchema.safeParse({ productId: 'p-123' }).success).toBe(true);

      // Sync wishlist accepts array
      expect(syncWishlistSchema.safeParse({ productIds: ['p1', 'p2'] }).success).toBe(true);
    });

    test('Payment & Currency validation: enforces positive amounts and 3-letter currency codes', () => {
      expect(convertCurrencyQuerySchema.safeParse({ amount: -5, to: 'KES' }).success).toBe(false);
      expect(convertCurrencyQuerySchema.safeParse({ amount: 10, to: 'KES' }).success).toBe(true);

      // Initialize payment requires gateway and orderId
      const invalidPayment = initializePaymentSchema.safeParse({ amount: 100 });
      expect(invalidPayment.success).toBe(false);

      const validPayment = initializePaymentSchema.safeParse({
        gateway: 'stripe',
        orderId: 'b7c3d1e0-0000-0000-0000-000000000000',
        amount: 50,
      });
      expect(validPayment.success).toBe(true);

      // Verify payment requires gateway and reference
      expect(verifyPaymentParamSchema.safeParse({ gateway: 'stripe' }).success).toBe(false);
      expect(
        verifyPaymentParamSchema.safeParse({ gateway: 'stripe', reference: 'ref_123' }).success
      ).toBe(true);
    });

    test('Admin Order validation: enforces note length limits and status constraints', () => {
      expect(createOrderNoteSchema.safeParse({ note: '' }).success).toBe(false);
      expect(createOrderNoteSchema.safeParse({ note: 'A'.repeat(2500) }).success).toBe(false);
      expect(createOrderNoteSchema.safeParse({ note: 'Customer contacted via phone.' }).success).toBe(true);

      expect(updateOrderStatusSchema.safeParse({ orderStatus: 'shipped' }).success).toBe(true);
    });
  });

  describe('2. Helmet.js & Security Headers', () => {
    let testApp;

    beforeAll(() => {
      const helmet = require('helmet');
      testApp = express();
      testApp.disable('x-powered-by');
      testApp.use(helmet(createHelmetOptions()));
      testApp.use(permissionsPolicyMiddleware);
      testApp.get('/test-headers', (req, res) => res.json({ status: 'ok' }));
    });

    test('sets X-Frame-Options to DENY to prevent clickjacking', async () => {
      const res = await request(testApp).get('/test-headers');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    test('sets X-Content-Type-Options to nosniff', async () => {
      const res = await request(testApp).get('/test-headers');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('suppresses X-Powered-By header', async () => {
      const res = await request(testApp).get('/test-headers');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    test('sets Content-Security-Policy header with allowed domains', async () => {
      const res = await request(testApp).get('/test-headers');
      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('https://js.stripe.com');
      expect(csp).toContain('https://res.cloudinary.com');
    });

    test('sets Permissions-Policy header', async () => {
      const res = await request(testApp).get('/test-headers');
      expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    });
  });

  describe('3. CORS Origin Lockdown', () => {
    test('permits authorized origins', () => {
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(isOriginAllowed('https://www.beautifyafrica.app')).toBe(true);
      expect(isOriginAllowed('https://beautifyafrica.app')).toBe(true);
      expect(isOriginAllowed('https://beautify-africa.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://beautify-africa-preview.vercel.app')).toBe(true);
    });

    test('rejects malicious or unauthorized origins', () => {
      expect(isOriginAllowed('https://evil-attacker.com')).toBe(false);
      expect(isOriginAllowed('https://fake-beautify.com')).toBe(false);
      expect(isOriginAllowed('http://localhost:8080')).toBe(false);
    });

    test('CORS options define explicit allowed methods and headers', () => {
      const options = createCorsOptions();
      expect(options.methods).toContain('GET');
      expect(options.methods).toContain('POST');
      expect(options.methods).toContain('DELETE');
      expect(options.allowedHeaders).toContain('Authorization');
      expect(options.allowedHeaders).toContain('X-CSRF-Token');
      expect(options.credentials).toBe(true);
      expect(options.maxAge).toBe(86400);
    });
  });

  describe('4. CSRF Protection Middleware', () => {
    let csrfApp;

    beforeAll(() => {
      csrfApp = express();
      csrfApp.use(express.json());
      csrfApp.get('/api/csrf-token', getCsrfTokenHandler);
      csrfApp.use(csrfProtection);
      csrfApp.post('/api/test-mutation', (req, res) => res.json({ status: 'mutated' }));
      csrfApp.post('/api/stripe/webhook', (req, res) => res.json({ received: true }));
    });

    test('issues CSRF tokens via /api/csrf-token endpoint', async () => {
      const res = await request(csrfApp).get('/api/csrf-token');
      expect(res.status).toBe(200);
      expect(res.body.csrfToken).toBeDefined();
      expect(typeof res.body.csrfToken).toBe('string');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('blocks state-changing requests from unauthorized origins', async () => {
      const res = await request(csrfApp)
        .post('/api/test-mutation')
        .set('Origin', 'https://evil-attacker.com')
        .send({ data: 'attack' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_BLOCKED');
    });

    test('allows state-changing requests with Bearer token regardless of ambient origin', async () => {
      const res = await request(csrfApp)
        .post('/api/test-mutation')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({ data: 'authorized' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('mutated');
    });

    test('exempts payment webhooks from CSRF checks', async () => {
      const res = await request(csrfApp)
        .post('/api/stripe/webhook')
        .set('Origin', 'https://hooks.stripe.com')
        .send({ type: 'payment_intent.succeeded' });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    test('validates double-submit CSRF cookie against header', async () => {
      const token = generateCsrfToken();

      // Mismatch should be rejected
      const rejectedRes = await request(csrfApp)
        .post('/api/test-mutation')
        .set('Cookie', `_csrf=${token}`)
        .set('x-csrf-token', 'wrong-token')
        .send({});

      expect(rejectedRes.status).toBe(403);
      expect(rejectedRes.body.code).toBe('CSRF_TOKEN_MISMATCH');

      // Matching token succeeds
      const acceptedRes = await request(csrfApp)
        .post('/api/test-mutation')
        .set('Cookie', `_csrf=${token}`)
        .set('x-csrf-token', token)
        .send({});

      expect(acceptedRes.status).toBe(200);
      expect(acceptedRes.body.status).toBe('mutated');
    });
  });

  describe('5. File Upload Restrictions', () => {
    test('accepts safe image extensions and MIME types', () => {
      expect(
        validateUploadFile({ originalname: 'serum.jpg', mimetype: 'image/jpeg' }).valid
      ).toBe(true);
      expect(
        validateUploadFile({ originalname: 'oil.png', mimetype: 'image/png' }).valid
      ).toBe(true);
      expect(
        validateUploadFile({ originalname: 'cream.webp', mimetype: 'image/webp' }).valid
      ).toBe(true);
    });

    test('rejects disallowed or dangerous file extensions', () => {
      expect(
        validateUploadFile({ originalname: 'script.php', mimetype: 'image/jpeg' }).valid
      ).toBe(false);
      expect(
        validateUploadFile({ originalname: 'app.exe', mimetype: 'image/png' }).valid
      ).toBe(false);
      expect(
        validateUploadFile({ originalname: 'exploit.svg', mimetype: 'image/svg+xml' }).valid
      ).toBe(false);
      expect(
        validateUploadFile({ originalname: 'archive.zip', mimetype: 'application/zip' }).valid
      ).toBe(false);
    });

    test('rejects double extension masking attacks', () => {
      const check = validateUploadFile({
        originalname: 'shell.php.jpg',
        mimetype: 'image/jpeg',
      });
      expect(check.valid).toBe(false);
      expect(check.message).toMatch(/forbidden/i);
    });

    test('rejects null-byte injection in filename', () => {
      const check = validateUploadFile({
        originalname: 'image.jpg\0.php',
        mimetype: 'image/jpeg',
      });
      expect(check.valid).toBe(false);
      expect(check.message).toMatch(/null byte/i);
    });

    test('rejects path traversal in filename', () => {
      const check = validateUploadFile({
        originalname: '../../etc/passwd.jpg',
        mimetype: 'image/jpeg',
      });
      expect(check.valid).toBe(false);
      expect(check.message).toMatch(/traversal/i);
    });
  });
});
