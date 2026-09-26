const crypto = require('crypto');

const VERSION = 'v1';
const ENCRYPTED_PREFIX = `${VERSION}:`;

function getEncryptionKey() {
  const configuredKey = String(process.env.TOTP_ENCRYPTION_KEY || '').trim();
  if (!configuredKey) {
    throw new Error('TOTP_ENCRYPTION_KEY is required to protect two-factor secrets');
  }

  const key = /^[a-f0-9]{64}$/i.test(configuredKey)
    ? Buffer.from(configuredKey, 'hex')
    : Buffer.from(configuredKey, 'base64');
  if (key.length !== 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

function isEncryptedTotpSecret(value) {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);
}

function encryptTotpSecret(secret) {
  if (!secret) return secret;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), authTag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

function decryptTotpSecret(value) {
  if (!value || !isEncryptedTotpSecret(value)) return value;
  const [, encodedIv, encodedTag, encodedCiphertext] = value.split(':');
  if (!encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error('Stored two-factor secret is malformed');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encryptTotpSecret, decryptTotpSecret, isEncryptedTotpSecret };
