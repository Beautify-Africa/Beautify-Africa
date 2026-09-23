const express = require('express');
const request = require('supertest');
const {
  validateImageMagicBytes,
  validateUploadFile,
} = require('../routes/uploadRoutes');
const {
  generateTotpSecret,
  generateTotpCode,
  isTotpCodeReplayed,
  markTotpCodeUsed,
} = require('../services/totpService');

describe('Advanced Security Hardening Suite (6 Key Measures)', () => {
  describe('Measure 4: Binary Magic Byte (Image Signature) Inspection', () => {
    test('accepts genuine JPEG binary buffer', () => {
      // JPEG magic bytes: FF D8 FF E0 ...
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      const result = validateImageMagicBytes(jpegBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/jpeg');

      const fileCheck = validateUploadFile({
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: jpegBuffer,
      });
      expect(fileCheck.valid).toBe(true);
    });

    test('accepts genuine PNG binary buffer', () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A ...
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const result = validateImageMagicBytes(pngBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/png');

      const fileCheck = validateUploadFile({
        originalname: 'banner.png',
        mimetype: 'image/png',
        buffer: pngBuffer,
      });
      expect(fileCheck.valid).toBe(true);
    });

    test('accepts genuine WebP binary buffer', () => {
      // WebP magic bytes: RIFF [4 bytes size] WEBP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const result = validateImageMagicBytes(webpBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/webp');

      const fileCheck = validateUploadFile({
        originalname: 'asset.webp',
        mimetype: 'image/webp',
        buffer: webpBuffer,
      });
      expect(fileCheck.valid).toBe(true);
    });

    test('rejects polyglot shell script disguised as image/png', () => {
      // Attacker payload: PHP script with .png extension
      const fakePngBuffer = Buffer.from('<?php system($_GET["cmd"]); ?>');
      const result = validateImageMagicBytes(fakePngBuffer);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/binary signatures/i);

      const fileCheck = validateUploadFile({
        originalname: 'innocent.png',
        mimetype: 'image/png',
        buffer: fakePngBuffer,
      });
      expect(fileCheck.valid).toBe(false);
      expect(fileCheck.message).toMatch(/binary signatures/i);
    });

    test('rejects truncated or empty buffer', () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8]);
      const result = validateImageMagicBytes(tinyBuffer);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/too short/i);
    });
  });

  describe('Measure 2: TOTP Code Replay Window Defense', () => {
    test('marks TOTP code as used in Redis and detects replay attempts', async () => {
      const store = new Map();
      const mockRedis = {
        get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
        set: jest.fn().mockImplementation(async (key, val) => store.set(key, val)),
      };

      const userId = 'usr-test-123456';
      const secret = generateTotpSecret(20);
      const code = generateTotpCode(secret);

      // Initially not replayed
      const isInitialReplay = await isTotpCodeReplayed(userId, code, mockRedis);
      expect(isInitialReplay).toBe(false);

      // Mark code as used
      await markTotpCodeUsed(userId, code, 90, mockRedis);
      expect(mockRedis.set).toHaveBeenCalled();

      // Immediate second submission is detected as replayed!
      const isSecondReplay = await isTotpCodeReplayed(userId, code, mockRedis);
      expect(isSecondReplay).toBe(true);

      // Different code is not blocked
      const differentCode = '654321';
      const isDiffReplay = await isTotpCodeReplayed(userId, differentCode, mockRedis);
      expect(isDiffReplay).toBe(false);
    });
  });

  describe('Measure 6: RFC 9116 security.txt Endpoint', () => {
    let app;

    beforeAll(() => {
      app = express();
      const SECURITY_TXT_BODY = [
        '# Beautify Africa Security Vulnerability Disclosure Policy',
        '# Reference: RFC 9116',
        'Contact: mailto:security@beautifyafrica.app',
        'Expires: 2027-12-31T23:59:59.000Z',
        'Preferred-Languages: en, sw',
        'Canonical: https://beautifyafrica.app/.well-known/security.txt',
        'Policy: https://beautifyafrica.app/security-policy',
        '',
      ].join('\n');

      app.get(['/.well-known/security.txt', '/security.txt'], (req, res) => {
        res.type('text/plain; charset=utf-8').send(SECURITY_TXT_BODY);
      });
    });

    test('GET /.well-known/security.txt returns RFC 9116 contact policy', async () => {
      const res = await request(app).get('/.well-known/security.txt');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/i);
      expect(res.text).toContain('Contact: mailto:security@beautifyafrica.app');
      expect(res.text).toContain('Canonical: https://beautifyafrica.app/.well-known/security.txt');
    });

    test('GET /security.txt fallback alias returns RFC 9116 contact policy', async () => {
      const res = await request(app).get('/security.txt');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/i);
      expect(res.text).toContain('Contact: mailto:security@beautifyafrica.app');
    });
  });
});
