const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../models/User');
jest.mock('../config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
}));

const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');
const {
  generateTotpSecret,
  generateOtpAuthUri,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
} = require('../services/totpService');
const { signToken } = require('../services/authService');

const ADMIN_EMAIL = 'admin@beautifyafrica.app';
const ADMIN_PASSWORD = 'AdminSecure@2026';
const USER_ID = 'u111a111-a111-a111-a111-a111a111a111';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Two-Factor Authentication (TOTP) & Session Revocation Suite', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'totp-auth-test-secret-key-32chars';
    process.env.TOTP_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
    process.env.ADMIN_DASHBOARD_PASSWORD = ADMIN_PASSWORD;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('RFC 6238 TOTP Cryptographic Service', () => {
    test('generateTotpSecret produces standard Base32 encoded secret of sufficient length', () => {
      const secret = generateTotpSecret(20);
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(32);
      expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
    });

    test('generateOtpAuthUri constructs RFC-compliant URI for Google Authenticator', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const uri = generateOtpAuthUri({
        secret,
        email: 'user@example.com',
        issuer: 'Beautify Africa',
      });

      expect(uri).toContain('otpauth://totp/Beautify%20Africa:user%40example.com');
      expect(uri).toContain(`secret=${secret}`);
      expect(uri).toContain('issuer=Beautify%20Africa');
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    test('generateTotpCode generates 6-digit zero-padded numeric string', () => {
      const secret = generateTotpSecret(20);
      const code = generateTotpCode(secret);
      expect(code).toMatch(/^\d{6}$/);
    });

    test('verifyTotpCode accepts code within clock drift window and rejects invalid codes', () => {
      const secret = generateTotpSecret(20);
      const now = Date.now();
      const validCode = generateTotpCode(secret, now);

      // Verify current code
      expect(verifyTotpCode({ secret, code: validCode, window: 1, timestamp: now })).toBe(true);

      // Verify ±1 window tolerance (clock drift)
      const pastCode = generateTotpCode(secret, now - 30 * 1000);
      const futureCode = generateTotpCode(secret, now + 30 * 1000);
      expect(verifyTotpCode({ secret, code: pastCode, window: 1, timestamp: now })).toBe(true);
      expect(verifyTotpCode({ secret, code: futureCode, window: 1, timestamp: now })).toBe(true);

      // Reject codes outside window
      const ancientCode = generateTotpCode(secret, now - 90 * 1000);
      expect(verifyTotpCode({ secret, code: ancientCode, window: 1, timestamp: now })).toBe(false);

      // Reject bad / invalid strings
      expect(verifyTotpCode({ secret, code: '000000', window: 0, timestamp: now })).toBe(false);
      expect(verifyTotpCode({ secret, code: 'badcode' })).toBe(false);
      expect(verifyTotpCode({ secret: '', code: validCode })).toBe(false);
    });

    test('recovery codes can be generated and consumed exactly once', () => {
      const { plainCodes, hashedCodes } = generateRecoveryCodes(4);
      expect(plainCodes).toHaveLength(4);
      expect(hashedCodes).toHaveLength(4);

      const targetCode = plainCodes[0];
      const result = verifyAndConsumeRecoveryCode(hashedCodes, targetCode);
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toHaveLength(3);

      // Consumed code cannot be reused
      const secondAttempt = verifyAndConsumeRecoveryCode(result.remainingCodes, targetCode);
      expect(secondAttempt.isValid).toBe(false);
      expect(secondAttempt.remainingCodes).toHaveLength(3);

      // Completely incorrect code fails
      const badAttempt = verifyAndConsumeRecoveryCode(result.remainingCodes, 'wrong-code-xyz');
      expect(badAttempt.isValid).toBe(false);
    });
  });

  describe('2FA HTTP Endpoints', () => {
    test('POST /api/auth/2fa/setup initializes secret and recovery codes for authenticated user', async () => {
      const mockUser = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Test User',
        email: 'user@beautifyafrica.app',
        tokenVersion: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { id: USER_ID, email: mockUser.email, tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.secret).toBeTruthy();
      expect(response.body.otpAuthUrl).toContain('otpauth://totp/');
      expect(response.body.recoveryCodes).toHaveLength(8);
      expect(mockUser.twoFactorSecret).not.toBe(response.body.secret);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('POST /api/auth/2fa/enable activates 2FA with valid TOTP code', async () => {
      const secret = generateTotpSecret(20);
      const validCode = generateTotpCode(secret);

      const mockUser = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Test User',
        email: 'user@beautifyafrica.app',
        twoFactorSecret: secret,
        twoFactorEnabled: false,
        tokenVersion: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { id: USER_ID, email: mockUser.email, tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      // Fails with invalid code
      const failResponse = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '999999' });

      expect(failResponse.status).toBe(400);
      expect(failResponse.body.message).toMatch(/invalid verification code/i);

      // Succeeds with valid code
      const successResponse = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: validCode });

      expect(successResponse.status).toBe(200);
      expect(successResponse.body.status).toBe('success');
      expect(mockUser.twoFactorEnabled).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('Admin login challenges with require2FA when 2FA is enabled and code is absent', async () => {
      const secret = generateTotpSecret(20);
      const mockAdmin = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Admin User',
        email: ADMIN_EMAIL,
        isAdmin: true,
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        recordSuccessfulLogin: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockAdmin);

      // Attempt login without twoFactorCode
      const challengeResponse = await request(app)
        .post('/api/auth/admin-login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

      expect(challengeResponse.status).toBe(200);
      expect(challengeResponse.body.require2FA).toBe(true);
      expect(challengeResponse.body.message).toMatch(/Two-factor authentication code required/i);
      expect(challengeResponse.body.token).toBeUndefined();

      // Attempt login with invalid twoFactorCode
      const invalidResponse = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          twoFactorCode: '000000',
        });

      expect(invalidResponse.status).toBe(401);
      expect(invalidResponse.body.message).toMatch(/invalid two-factor/i);

      // Attempt login with valid twoFactorCode
      const validCode = generateTotpCode(secret);
      const successResponse = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          twoFactorCode: validCode,
        });

      expect(successResponse.status).toBe(200);
      expect(successResponse.body.status).toBe('success');
      expect(successResponse.body.token).toBeUndefined();
    });

    test('Admin login succeeds with emergency recovery code', async () => {
      const secret = generateTotpSecret(20);
      const { plainCodes, hashedCodes } = generateRecoveryCodes(2);
      const recoveryCode = plainCodes[0];

      const mockAdmin = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Admin User',
        email: ADMIN_EMAIL,
        isAdmin: true,
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: hashedCodes,
        comparePassword: jest.fn().mockResolvedValue(true),
        recordSuccessfulLogin: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          twoFactorCode: recoveryCode,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeUndefined();
      expect(mockAdmin.twoFactorRecoveryCodes).toHaveLength(1);
    });

    test('POST /api/auth/2fa/disable disables 2FA upon correct password verification', async () => {
      const mockUser = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Test User',
        email: 'user@beautifyafrica.app',
        twoFactorEnabled: true,
        twoFactorSecret: generateTotpSecret(20),
        twoFactorRecoveryCodes: ['hashed'],
        comparePassword: jest.fn().mockImplementation(async (pw) => pw === 'CorrectPassword123!'),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const token = jwt.sign({ id: USER_ID, email: mockUser.email }, process.env.JWT_SECRET);

      // Wrong password
      const wrongPwResponse = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword!' });

      expect(wrongPwResponse.status).toBe(401);
      expect(wrongPwResponse.body.message).toMatch(/invalid password/i);

      // Correct password
      const successResponse = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: 'CorrectPassword123!',
          code: generateTotpCode(mockUser.twoFactorSecret),
        });

      expect(successResponse.status).toBe(200);
      expect(successResponse.body.status).toBe('success');
      expect(mockUser.twoFactorEnabled).toBe(false);
      expect(mockUser.twoFactorSecret).toBeNull();
      expect(mockUser.twoFactorRecoveryCodes).toEqual([]);
    });
  });

  describe('Centralized Session Invalidation & Token Revocation', () => {
    test('incrementing tokenVersion invalidates all active JWT tokens across all devices', async () => {
      const mockUser = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Test User',
        email: 'user@beautifyafrica.app',
        tokenVersion: 1, // Current DB token version is 1
        save: jest.fn().mockResolvedValue(true),
      };

      User.findByPk.mockResolvedValue(mockUser);

      // Old token generated with tokenVersion 0
      const oldToken = jwt.sign(
        { id: USER_ID, email: mockUser.email, tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      // Current token generated with tokenVersion 1
      const currentToken = jwt.sign(
        { id: USER_ID, email: mockUser.email, tokenVersion: 1 },
        process.env.JWT_SECRET
      );

      // Old token must be rejected with 401
      const oldResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(oldResponse.status).toBe(401);
      expect(oldResponse.body.message).toMatch(/revoked/i);
      expect(User.findByPk).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ attributes: expect.arrayContaining(['tokenVersion']) })
      );

      // Current token must succeed with 200
      const currentResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${currentToken}`);

      expect(currentResponse.status).toBe(200);
      expect(currentResponse.body.status).toBe('success');
      expect(currentResponse.body.user.email).toBe(mockUser.email);
    });

    test('POST /api/auth/revoke-all-sessions increments tokenVersion without returning a token', async () => {
      const mockUser = {
        id: USER_ID,
        _id: USER_ID,
        name: 'Test User',
        email: 'user@beautifyafrica.app',
        tokenVersion: 1,
        save: jest.fn().mockImplementation(async function () {
          return this;
        }),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { id: USER_ID, email: mockUser.email, tokenVersion: 1 },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .post('/api/auth/revoke-all-sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeUndefined();
      expect(mockUser.tokenVersion).toBe(2);
    });
  });
});
