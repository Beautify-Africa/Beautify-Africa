// tests/servicesEndToEndVerification.test.js
const request = require('supertest');
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue({ success: true }));
const { app } = require('../server');
const { sequelize } = require('../config/db');
const { User, Product, Cart, CartItem, Order, Newsletter } = require('../models');
const {
  generateWelcomeNewsletterEmail,
  generateNewsletterUnsubscribeEmail,
  generatePasswordResetEmail,
  generateLuxuryLowStockEmail,
  generateLuxuryRestockEmail,
} = require('../services/emailTemplates');

jest.setTimeout(45000);

describe('Beautify Africa - End-to-End Core Services Verification Suite', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Adaora TestUser',
    email: `adaora.test.${timestamp}@example.com`,
    password: 'Password123!',
  };

  let authToken = null;
  let userId = null;
  let testProductId = null;
  let testProductPrice = 45.0;
  let createdOrderId = null;
  let csrfCookie = '';
  let csrfToken = '';

  async function fetchCsrf() {
    const res = await request(app).get('/api/csrf-token');
    csrfToken = res.body.csrfToken;
    const rawCookies = res.headers['set-cookie'];
    if (rawCookies) {
      csrfCookie = Array.isArray(rawCookies) ? rawCookies[0] : rawCookies;
    }
    return { csrfToken, csrfCookie };
  }

  beforeAll(async () => {
    // Ensure DB connection is active
    await sequelize.authenticate();
    await fetchCsrf();

    // Create an isolated test product for cart & order verification
    const testProduct = await Product.create({
      name: `Verification Botanical Serum ${timestamp}`,
      brand: 'Beautify Botanicals',
      category: 'Skincare',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
      stockQuantity: 100,
      inStock: true,
      status: 'published',
      isArchived: false,
    });
    testProductId = testProduct.id;
    testProductPrice = parseFloat(testProduct.price) || 45.0;
  });

  afterAll(async () => {
    // Clean up created test entities
    try {
      if (testProductId) {
        await Product.destroy({ where: { id: testProductId }, force: true }).catch(() => {});
      }
      if (createdOrderId) {
        await Order.destroy({ where: { id: createdOrderId }, force: true }).catch(() => {});
      }
      if (userId) {
        await Cart.destroy({ where: { userId }, force: true }).catch(() => {});
        await User.destroy({ where: { id: userId }, force: true }).catch(() => {});
      }
      await Newsletter.destroy({ where: { email: testUser.email } }).catch(() => {});
    } catch {
      // ignore cleanup errors
    }
  });

  // =========================================================================
  // 1. HEALTH & METADATA PROBES
  // =========================================================================
  describe('1. Health & Security Probes', () => {
    test('GET /health returns 200 with service UP status', async () => {
      const res = await request(app).get('/health');
      expect([200, 204]).toContain(res.statusCode);
      if (res.body && typeof res.body === 'object') {
        expect(res.body.status || res.body.data?.status).toBeDefined();
      }
    });

    test('GET /api/csrf-token returns valid cryptographic token', async () => {
      const res = await request(app).get('/api/csrf-token');
      expect(res.statusCode).toBe(200);
      expect(res.body.csrfToken).toBeDefined();
      expect(res.body.csrfToken.length).toBeGreaterThan(16);
    });
  });

  // =========================================================================
  // 2. USER AUTHENTICATION & ACCOUNT LIFECYCLE
  // =========================================================================
  describe('2. User Account Lifecycle (Register, Login, Profile)', () => {
    test('POST /api/auth/register creates new account and sets auth cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());

      const cookies = res.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      authToken = tokenCookie.split(';')[0].split('=')[1];
      userId = res.body.user.id || res.body.user._id;
    });

    test('POST /api/auth/register rejects duplicate registration with same email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send(testUser);

      expect([400, 409]).toContain(res.statusCode);
      expect(res.body.status).toBe('error');
    });

    test('POST /api/auth/login authenticates registered user and sets auth cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());

      const cookies = res.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      authToken = tokenCookie.split(';')[0].split('=')[1];
    });

    test('POST /api/auth/login rejects incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: testUser.email,
          password: 'WrongPassword999!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    test('GET /api/auth/me returns current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
    });

    test('GET /api/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    test('POST /api/auth/forgot-password initiates password reset without leaking account existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: testUser.email,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  // =========================================================================
  // 3. PRODUCT CATALOG & BROWSING
  // =========================================================================
  describe('3. Product Catalog & Browsing Services', () => {
    test('GET /api/products returns paginated catalog items', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/products/catalog returns categories, brands, and price taxonomy', async () => {
      const res = await request(app).get('/api/products/catalog');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.categories).toBeDefined();
      expect(res.body.data.brands).toBeDefined();
    });

    test('GET /api/products/:idOrSlug returns single product detail', async () => {
      const res = await request(app).get(`/api/products/${testProductId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(testProductId);
    });

    test('GET /api/products/:id/variants returns product variants list', async () => {
      const res = await request(app).get(`/api/products/${testProductId}/variants`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // =========================================================================
  // 4. CART SERVICE (ADD, FETCH, UPDATE, REMOVE)
  // =========================================================================
  describe('4. Shopping Cart Operations', () => {
    test('GET /api/cart returns user cart structure', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
    });

    test('POST /api/cart adds product to user cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 2,
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.status).toBe('success');

      // Check cart contains the added item
      const cartGet = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      const items = Array.isArray(cartGet.body.data)
        ? cartGet.body.data
        : cartGet.body.data?.items || cartGet.body.data?.cartItems || [];
      const hasItem = items.some((item) => (item.productId || item.product) === testProductId);
      expect(hasItem).toBe(true);
    });

    test('PUT /api/cart/:productId updates item quantity', async () => {
      const res = await request(app)
        .put(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 4 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });

    test('DELETE /api/cart/:productId removes item from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  // =========================================================================
  // 5. WISHLIST SERVICE
  // =========================================================================
  describe('5. Wishlist Operations', () => {
    test('GET /api/wishlist retrieves user wishlist', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });

    test('POST /api/wishlist adds product to wishlist', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  // =========================================================================
  // 6. CHECKOUT & ORDER CREATION
  // =========================================================================
  describe('6. Checkout & Order Lifecycle', () => {
    test('POST /api/orders creates a new customer order', async () => {
      const orderPayload = {
        orderItems: [
          {
            productId: testProductId,
            name: 'Botanical Serum',
            qty: 1,
            price: testProductPrice,
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
          },
        ],
        shippingAddress: {
          firstName: 'Adaora',
          lastName: 'TestUser',
          email: testUser.email,
          address: '45 Kenyatta Avenue',
          city: 'Nairobi',
          zip: '00100',
          country: 'Kenya',
        },
        paymentMethod: 'Credit Card',
        currency: 'USD',
        itemsPrice: testProductPrice,
        shippingPrice: 10.0,
        taxPrice: 5.0,
        totalPrice: testProductPrice + 15.0,
      };

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id || res.body.data._id).toBeDefined();

      createdOrderId = res.body.data.id || res.body.data._id;
    });

    test('GET /api/orders/:id retrieves created order detail for authorized user', async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id || res.body.data._id).toBe(createdOrderId);
    });

    test('GET /api/orders/myorders lists current user orders', async () => {
      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 7. NEWSLETTER & UNRESTRICTED EMAIL TEMPLATES
  // =========================================================================
  describe('7. Newsletter Subscription & Email Template Integrity', () => {
    test('POST /api/newsletter/subscribe registers new subscriber email', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: testUser.email,
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.status).toBe('success');
    });

    test('All luxury brand email templates render cleanly with HTML and text', () => {
      const clientUrl = 'https://beautifyafrica.app';

      // 1. Welcome Newsletter Email
      const welcome = generateWelcomeNewsletterEmail({
        email: testUser.email,
        clientUrl,
        manageNewsletterLink: `${clientUrl}/newsletter/manage`,
      });
      expect(welcome.html).toContain('Welcome to the Inner Circle');
      expect(welcome.text).toContain('BEAUTIFY');
      expect(welcome.html).toContain('BEAUTY10');

      // 2. Unsubscribe Confirmation Email
      const unsubscribe = generateNewsletterUnsubscribeEmail({
        email: testUser.email,
        unsubscribeLink: `${clientUrl}/newsletter/unsubscribe?token=test-token-123`,
        clientUrl,
      });
      expect(unsubscribe.html).toContain('Confirm Unsubscribe');
      expect(unsubscribe.text).toContain('test-token-123');

      // 3. Password Reset Email
      const reset = generatePasswordResetEmail({
        email: testUser.email,
        resetLink: `${clientUrl}/reset-password?token=reset-token-456`,
        clientUrl,
      });
      expect(reset.html).toContain('Reset Your Password');
      expect(reset.html).toContain('reset-token-456');

      // 4. Low Stock Alert Email
      const lowStock = generateLuxuryLowStockEmail({
        items: [{ productName: 'Shea Glow Butter', sku: 'SGB-01', stock: 3, type: 'main' }],
        threshold: 5,
        dashboardUrl: `${clientUrl}/admin`,
      });
      expect(lowStock.html).toContain('Low Stock Notification');
      expect(lowStock.html).toContain('Shea Glow Butter');

      // 5. Restock Complete Email
      const restock = generateLuxuryRestockEmail({
        productName: 'Baobab Facial Oil',
        itemSku: 'BFO-02',
        newStock: 75,
        variantId: null,
        dashboardUrl: `${clientUrl}/admin`,
      });
      expect(restock.html).toContain('Inventory Restocked');
      expect(restock.html).toContain('75 units');
    });
  });
});
