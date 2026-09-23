// services/totpService.js
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to RFC 4648 Base32 string (no padding).
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string into a buffer.
 */
function base32Decode(base32Str) {
  const cleaned = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for Google Authenticator (default 20 bytes = 160 bits).
 */
function generateTotpSecret(byteLength = 20) {
  const randomBytes = crypto.randomBytes(byteLength);
  return base32Encode(randomBytes);
}

/**
 * Generates standard otpauth URI compatible with Google Authenticator, Authy, and 1Password.
 */
function generateOtpAuthUri({ secret, email, issuer = 'Beautify Africa' }) {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes a 6-digit TOTP code for a given timestamp according to RFC 6238 / RFC 4226.
 */
function generateTotpCode(secret, timestampOrStep = Date.now(), timeStep = 30) {
  const key = base32Decode(secret);
  const counter =
    timestampOrStep > 1e10
      ? Math.floor(timestampOrStep / 1000 / timeStep)
      : Math.floor(timestampOrStep);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code allowing ±window steps (default 1 = ±30s) for clock drift.
 */
function verifyTotpCode({ secret, code, window = 1, timestamp = Date.now(), timeStep = 30 }) {
  if (!secret || !code) return false;

  const sanitizedCode = String(code).trim().replace(/\s+/g, '');
  if (sanitizedCode.length !== 6 || !/^\d{6}$/.test(sanitizedCode)) {
    return false;
  }

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const windowTimestamp = timestamp + errorWindow * timeStep * 1000;
    const expectedCode = generateTotpCode(secret, windowTimestamp, timeStep);

    if (crypto.timingSafeEqual(Buffer.from(sanitizedCode), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates single-use backup recovery codes.
 */
function generateRecoveryCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars, e.g. 3F8A2B9C1E
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    plainCodes.push(formatted);

    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verifies and consumes a single-use backup recovery code.
 */
function verifyAndConsumeRecoveryCode(hashedCodes = [], providedCode = '') {
  if (!Array.isArray(hashedCodes) || !providedCode) {
    return { isValid: false, remainingCodes: hashedCodes || [] };
  }

  const normalized = String(providedCode).trim().toUpperCase();
  const providedHash = crypto.createHash('sha256').update(normalized).digest('hex');

  const matchIndex = hashedCodes.findIndex((storedHash) => storedHash === providedHash);
  if (matchIndex === -1) {
    return { isValid: false, remainingCodes: hashedCodes };
  }

  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(matchIndex, 1);

  return { isValid: true, remainingCodes };
}

/**
 * Builds Redis key for tracking consumed TOTP codes within valid time windows.
 */
function buildTotpUsedKey(userId, code) {
  const codeHash = crypto
    .createHash('sha256')
    .update(String(code).trim().replace(/\s+/g, ''))
    .digest('hex')
    .slice(0, 16);
  return `totp:used:${userId}:${codeHash}`;
}

/**
 * Checks if a TOTP code was already submitted and verified for this user.
 */
async function isTotpCodeReplayed(userId, code, redisInstance) {
  if (!userId || !code) return false;
  try {
    const redis = redisInstance || require('../config/redis');
    const key = buildTotpUsedKey(userId, code);
    const used = await redis.get(key);
    return Boolean(used);
  } catch {
    return false;
  }
}

/**
 * Marks a TOTP code as used in Redis with a TTL covering the full clock drift window.
 */
async function markTotpCodeUsed(userId, code, ttlSeconds = 90, redisInstance) {
  if (!userId || !code) return;
  try {
    const redis = redisInstance || require('../config/redis');
    const key = buildTotpUsedKey(userId, code);
    await redis.set(key, '1', 'EX', ttlSeconds);
  } catch {
    // Non-blocking fallback
  }
}

module.exports = {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateOtpAuthUri,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  buildTotpUsedKey,
  isTotpCodeReplayed,
  markTotpCodeUsed,
};
