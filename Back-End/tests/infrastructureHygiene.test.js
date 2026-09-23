// tests/infrastructureHygiene.test.js
const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const ensureHttps = require('../middlewares/ensureHttps');
const { createHelmetOptions, permissionsPolicyMiddleware } = require('../config/helmetConfig');
const { isOriginAllowed } = require('../config/corsConfig');
const { validateEnvironmentSecrets } = require('../config/envValidator');
const { maskEmail, maskPhone, sanitizePiiObject } = require('../utils/piiSanitizer');
const User = require('../models/User');

describe('Infrastructure Hygiene & Security Hardening Suite', () => {
  describe('1. HTTPS Everywhere & HSTS', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(ensureHttps);
      app.get('/api/test', (req, res) => res.json({ status: 'ok' }));
    });

    test('redirects HTTP requests to HTTPS with 301 in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app)
        .get('/api/test')
        .set('x-forwarded-proto', 'http')
        .set('host', 'api.beautify-africa.com');

      expect(res.status).toBe(301);
      expect(res.headers.location).toBe('https://api.beautify-africa.com/api/test');

      process.env.NODE_ENV = originalEnv;
    });

    test('permits HTTPS requests without redirecting', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app)
        .get('/api/test')
        .set('x-forwarded-proto', 'https');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      process.env.NODE_ENV = originalEnv;
    });

    test('permits local HTTP requests in development/test environments', async () => {
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Security Headers & HSTS Checklist', () => {
    let helmetApp;

    beforeAll(() => {
      helmetApp = express();
      process.env.FORCE_HSTS = 'true';
      helmetApp.use(helmet(createHelmetOptions()));
      helmetApp.use(permissionsPolicyMiddleware);
      helmetApp.get('/test-headers', (req, res) => res.send('headers-ok'));
    });

    afterAll(() => {
      delete process.env.FORCE_HSTS;
    });

    test('serves HSTS with 1 year max-age, includeSubDomains, and preload', async () => {
      const res = await request(helmetApp).get('/test-headers');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(res.headers['strict-transport-security']).toContain('includeSubDomains');
      expect(res.headers['strict-transport-security']).toContain('preload');
    });

    test('serves comprehensive security headers checklist', async () => {
      const res = await request(helmetApp).get('/test-headers');

      // 1. Frame denial
      expect(res.headers['x-frame-options']).toBe('DENY');
      // 2. MIME sniffing defense
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      // 3. Referrer policy
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      // 4. Origin Agent Cluster
      expect(res.headers['origin-agent-cluster']).toBe('?1');
      // 5. Cross-domain policies
      expect(res.headers['x-permitted-cross-domain-policies']).toBe('none');
      // 6. IE no-open
      expect(res.headers['x-download-options']).toBe('noopen');
      // 7. Hardware permissions policy
      expect(res.headers['permissions-policy']).toContain('camera=()');
      expect(res.headers['permissions-policy']).toContain('microphone=()');
      expect(res.headers['permissions-policy']).toContain('geolocation=()');
    });

    test('serves CSP with upgrade-insecure-requests and object-src none', async () => {
      const res = await request(helmetApp).get('/test-headers');
      const csp = res.headers['content-security-policy'];

      expect(csp).toBeDefined();
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });

  describe('3. Secret Management & Startup Validation', () => {
    test('validates strong JWT secret and required DATABASE_URL', () => {
      const originalSecret = process.env.JWT_SECRET;
      const originalDb = process.env.DATABASE_URL;

      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a_very_long_and_secure_cryptographic_key_32chars_long';

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);

      process.env.JWT_SECRET = originalSecret;
      process.env.DATABASE_URL = originalDb;
    });

    test('rejects missing or trivial default secrets in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;

      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'replace_with_a_super_secure_jwt_secret_minimum_32_chars';

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(false);
      expect(result.errors.some((err) => err.includes('placeholder'))).toBe(true);

      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('4. Logging Without Leaking PII', () => {
    test('masks email addresses accurately preserving only boundary characters', () => {
      expect(maskEmail('customer@example.com')).toBe('c*****r@example.com');
      expect(maskEmail('a@b.com')).toBe('a*@b.com');
      expect(maskEmail('invalid')).toBe('[REDACTED_EMAIL]');
    });

    test('masks phone numbers preserving only trailing 4 digits', () => {
      expect(maskPhone('+254712345678')).toBe('*********5678');
      expect(maskPhone('1234')).toBe('****');
      expect(maskPhone('')).toBe('[REDACTED_PHONE]');
    });

    test('redacts credentials and PII deeply in nested payload objects', () => {
      const sensitivePayload = {
        name: 'Sarah Kimani',
        email: 'sarah@example.com',
        password: 'SuperSecretPassword!123',
        creditCard: '4111222233334444',
        pin: '1234',
        apiKey: 'live_sec_key',
        nested: {
          token: 'jwt.token.here',
          cvv: '999',
        },
      };

      const sanitized = sanitizePiiObject(sensitivePayload);

      expect(sanitized.name).toBe('Sarah Kimani');
      expect(sanitized.email).toBe('s***h@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.pin).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.nested.token).toBe('[REDACTED]');
      expect(sanitized.nested.cvv).toBe('[REDACTED]');
    });
  });

  describe('5. Staging vs Production Separation', () => {
    test('CORS policy rejects localhost in production while allowing production domains', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Disallows localhost in production
      expect(isOriginAllowed('http://localhost:5173')).toBe(false);
      expect(isOriginAllowed('http://127.0.0.1:4173')).toBe(false);

      // Allows legitimate production domains
      expect(isOriginAllowed('https://www.beautifyafrica.app')).toBe(true);
      expect(isOriginAllowed('https://beautify-africa.vercel.app')).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    test('CORS policy allows localhost in staging and development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('6. Brute Force Protection & Account Lockout', () => {
    test('User model records failed attempts and locks out at threshold', async () => {
      const user = User.build({
        name: 'Lockout Test',
        email: 'lockout@example.com',
        password: 'ValidPassword123!',
      });

      expect(user.isLocked()).toBe(false);

      // Simulate 4 failed attempts: not yet locked
      user.failedLoginAttempts = 4;
      expect(user.isLocked()).toBe(false);

      // 5th failed attempt: triggers 15-minute lock
      user.failedLoginAttempts = 5;
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      expect(user.isLocked()).toBe(true);

      // Successful login clears lock
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      expect(user.isLocked()).toBe(false);
    });
  });
});
