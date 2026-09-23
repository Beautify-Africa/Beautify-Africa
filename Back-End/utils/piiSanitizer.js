// utils/piiSanitizer.js
/**
 * Utility for masking and sanitizing Personally Identifiable Information (PII)
 * such as email addresses, phone numbers, and physical addresses to prevent
 * accidental data leakage in logs, analytics, and non-sensitive API projections.
 */

function maskEmail(email = '') {
  if (typeof email !== 'string' || !email.includes('@')) {
    return '[REDACTED_EMAIL]';
  }

  const [localPart, domain] = email.trim().split('@');
  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}*@${domain}`;
  }

  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}${'*'.repeat(Math.min(localPart.length - 2, 5))}${last}@${domain}`;
}

function maskPhone(phone = '') {
  if (typeof phone !== 'string' || !phone.trim()) {
    return '[REDACTED_PHONE]';
  }

  const cleaned = phone.trim();
  if (cleaned.length <= 4) {
    return '***'.padEnd(cleaned.length, '*');
  }

  const visibleTrailing = cleaned.slice(-4);
  const leadingLength = Math.max(0, cleaned.length - 4);
  return `${'*'.repeat(leadingLength)}${visibleTrailing}`;
}

function maskAddress(address = '') {
  if (typeof address !== 'string' || !address.trim()) {
    return '[REDACTED_ADDRESS]';
  }

  const words = address.trim().split(/\s+/);
  if (words.length <= 2) {
    return `${words[0]} ***`;
  }

  return `${words[0]} *** ${words[words.length - 1]}`;
}

const PII_FIELDS = new Set([
  'password',
  'newPassword',
  'oldPassword',
  'pin',
  'token',
  'refreshToken',
  'jwt',
  'apiKey',
  'clientSecret',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'cardNumber',
  'cvv',
  'expiry',
  'pan',
  'securityCode',
  'accountNumber',
  'phone',
  'phoneNumber',
  'PartyA',
  'PartyB',
  'ssn',
  'nationalId',
  'taxId',
]);

function sanitizePiiObject(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Buffer.isBuffer(obj)) {
    return '[BINARY_BUFFER]';
  }

  if (seen.has(obj)) {
    return '[CIRCULAR]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePiiObject(item, seen));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.has(key) || PII_FIELDS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey === 'email' && typeof value === 'string') {
      sanitized[key] = maskEmail(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePiiObject(value, seen);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  maskEmail,
  maskPhone,
  maskAddress,
  sanitizePiiObject,
};
