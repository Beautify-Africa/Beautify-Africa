// tests/securityHardening.test.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { signToken, verifyToken } = require('../services/authService');
const {
  maskEmail,
  maskPhone,
  maskAddress,
  sanitizePiiObject,
} = require('../utils/piiSanitizer');
const paystackAdapter = require('../services/gateways/paystackAdapter');
const stripeAdapter = require('../services/gateways/stripeAdapter');

describe('Security Hardening & Session Safeguards', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-security-super-secret-key-32-bytes!';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  describe('JWT Algorithm Enforcement & Standard Claims', () => {
    it('signs tokens using HS256 algorithm and includes subject claim', () => {
      const token = signToken('user-uuid-1234');
      const decodedHeader = jwt.decode(token, { complete: true });

      expect(decodedHeader.header.alg).toBe('HS256');
      expect(decodedHeader.payload.id).toBe('user-uuid-1234');
      expect(decodedHeader.payload.sub).toBe('user-uuid-1234');
      expect(decodedHeader.payload.exp).toBeDefined();
    });

    it('verifies valid HS256 token successfully', () => {
      const token = signToken('valid-user');
      const verified = verifyToken(token);

      expect(verified.id).toBe('valid-user');
      expect(verified.sub).toBe('valid-user');
    });

    it('rejects forged tokens using "none" algorithm (algorithm confusion attack)', () => {
      // Craft an unverified token with alg: 'none'
      const forgedToken = jwt.sign(
        { id: 'attacker', sub: 'attacker' },
        '',
        { algorithm: 'none' }
      );

      expect(() => verifyToken(forgedToken)).toThrow();
    });

    it('rejects tokens signed with an invalid secret', () => {
      const badToken = jwt.sign(
        { id: 'hacker' },
        'wrong-secret-key-that-does-not-match',
        { algorithm: 'HS256' }
      );

      expect(() => verifyToken(badToken)).toThrow();
    });
  });

  describe('PII Masking & Sanitization', () => {
    it('masks email addresses accurately', () => {
      expect(maskEmail('amara.okafor@beautifyafrica.com')).toBe('a*****r@beautifyafrica.com');
      expect(maskEmail('jo@domain.com')).toBe('j*@domain.com');
      expect(maskEmail('')).toBe('[REDACTED_EMAIL]');
      expect(maskEmail(null)).toBe('[REDACTED_EMAIL]');
    });

    it('masks telephone numbers while keeping trailing digits visible', () => {
      expect(maskPhone('+254712345678')).toBe('*********5678');
      expect(maskPhone('0712345678')).toBe('******5678');
      expect(maskPhone('')).toBe('[REDACTED_PHONE]');
    });

    it('masks physical street addresses', () => {
      expect(maskAddress('142 Kimathi Street, Nairobi')).toBe('142 *** Nairobi');
      expect(maskAddress('Moi Avenue')).toBe('Moi ***');
      expect(maskAddress('')).toBe('[REDACTED_ADDRESS]');
    });

    it('deeply sanitizes PII and authentication credentials in nested objects', () => {
      const rawPayload = {
        name: 'Amina',
        email: 'amina@example.com',
        password: 'SuperSecretPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        phone: '+254700000000',
        shippingAddress: {
          address: '45 Kenyatta Ave',
          zip: '00100',
          city: 'Nairobi',
        },
        metadata: {
          note: 'Customer loyalty tier gold',
        },
      };

      const sanitized = sanitizePiiObject(rawPayload);

      expect(sanitized.name).toBe('Amina');
      expect(sanitized.email).toBe('a***a@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.phone).toBe('[REDACTED]');
      expect(sanitized.metadata.note).toBe('Customer loyalty tier gold');
      expect(sanitized.shippingAddress.city).toBe('Nairobi');
    });
  });

  describe('Webhook Signature Verification Integrity', () => {
    it('verifies Paystack webhooks with valid HMAC-SHA512 signature', () => {
      const secret = 'sk_test_paystack_mock_secret_key';
      paystackAdapter.secretKey = secret;

      const payload = {
        event: 'charge.success',
        data: {
          id: 99999,
          reference: 'pstk_ref_12345',
          amount: 50000,
          metadata: { orderId: 'ord-123' },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const validSignature = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');

      const parsed = paystackAdapter.verifyWebhook(rawBody, validSignature);
      expect(parsed.isSuccessful).toBe(true);
      expect(parsed.reference).toBe('pstk_ref_12345');
      expect(parsed.orderId).toBe('ord-123');
    });

    it('rejects Paystack webhook with timing-safe error when signature is forged', () => {
      const secret = 'sk_test_paystack_mock_secret_key';
      paystackAdapter.secretKey = secret;

      const rawBody = Buffer.from(JSON.stringify({ event: 'charge.success' }), 'utf8');
      const invalidSignature = 'deadbeef'.repeat(16); // 128 chars hex

      expect(() => {
        paystackAdapter.verifyWebhook(rawBody, invalidSignature);
      }).toThrow('Invalid Paystack webhook signature');
    });

    it('rejects Stripe webhook when signature header is missing', () => {
      expect(() => {
        stripeAdapter.verifyWebhook({ id: 'evt_123' }, null);
      }).toThrow('Missing stripe-signature header');
    });
  });

  describe('Database Security & Least-Privileged Access', () => {
    it('covers all 15 application tables with Row Level Security in migration', () => {
      const fs = require('fs');
      const path = require('path');
      const rlsMigrationPath = path.join(
        __dirname,
        '../migrations/20260920000003-enable-row-level-security-and-policies.js'
      );
      expect(fs.existsSync(rlsMigrationPath)).toBe(true);

      const content = fs.readFileSync(rlsMigrationPath, 'utf8');
      const expectedTables = [
        'users',
        'products',
        'product_variants',
        'product_reviews',
        'orders',
        'order_items',
        'order_shipping_addresses',
        'admin_timeline_entries',
        'inventory_ledgers',
        'newsletters',
        'wishlists',
        'wishlist_products',
        'carts',
        'cart_items',
        'webhook_events',
      ];

      for (const table of expectedTables) {
        expect(content).toContain(`'${table}'`);
      }
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');
    });

    it('confirms service_role key is never exposed to client environment', () => {
      const fs = require('fs');
      const path = require('path');
      const frontendEnvLocalPath = path.join(__dirname, '../../Front-End/.env.local');
      const frontendEnvExamplePath = path.join(__dirname, '../../Front-End/.env.example');

      if (fs.existsSync(frontendEnvLocalPath)) {
        const localContent = fs.readFileSync(frontendEnvLocalPath, 'utf8');
        expect(localContent).not.toMatch(/service_role/i);
        expect(localContent).not.toMatch(/SUPABASE_SERVICE_ROLE/i);
      }

      if (fs.existsSync(frontendEnvExamplePath)) {
        const exampleContent = fs.readFileSync(frontendEnvExamplePath, 'utf8');
        expect(exampleContent).not.toMatch(/service_role/i);
        expect(exampleContent).not.toMatch(/SUPABASE_SERVICE_ROLE/i);
      }
    });

    it('provides least-privileged database role provisioning script', () => {
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, '../scripts/setupLeastPrivilegedRole.sql');
      expect(fs.existsSync(sqlPath)).toBe(true);

      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      expect(sqlContent).toContain('beautify_app_user');
      expect(sqlContent).toContain('GRANT SELECT, INSERT, UPDATE, DELETE');
      expect(sqlContent).toContain('REVOKE CREATE ON SCHEMA public');
      expect(sqlContent).toContain('REVOKE ALL PRIVILEGES ON TABLE "SequelizeMeta"');
    });
  });
});
