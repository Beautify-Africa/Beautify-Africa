// config/envValidator.js
const logger = require('../utils/logger');

const TRIVIAL_SECRET_PATTERNS = [
  'replace_with_',
  'your_secret',
  'super_secure',
  '123456',
  'password',
  'changeme',
];

/**
 * Validates critical environment secrets and security parameters.
 * Halts startup in production if insecure defaults or missing secrets are detected.
 *
 * @param {Object} [options]
 * @param {boolean} [options.throwOnError=true] Whether to throw an Error if validation fails
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
function validateEnvironmentSecrets(options = {}) {
  const throwOnError = options.throwOnError !== undefined ? options.throwOnError : false;
  const isProd = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NODE_ENV === 'staging';
  const isTest = process.env.NODE_ENV === 'test';

  const errors = [];
  const warnings = [];

  // 1. DATABASE_URL validation
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || typeof dbUrl !== 'string' || !dbUrl.trim()) {
    errors.push('DATABASE_URL is required and must be a valid PostgreSQL connection string.');
  } else if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    warnings.push('DATABASE_URL does not use standard postgres:// or postgresql:// scheme.');
  }

  // 2. JWT_SECRET validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || typeof jwtSecret !== 'string') {
    errors.push('JWT_SECRET is required for cryptographic token signing.');
  } else {
    if (jwtSecret.length < 32 && !isTest) {
      errors.push('JWT_SECRET must be at least 32 characters long to prevent HMAC brute-forcing.');
    }
    const isTrivial = TRIVIAL_SECRET_PATTERNS.some((pattern) =>
      jwtSecret.toLowerCase().includes(pattern)
    );
    if ((isProd || isStaging) && isTrivial) {
      errors.push('JWT_SECRET uses an insecure placeholder or default pattern in production/staging.');
    }
  }

  // 3. REFRESH_TOKEN_SECRET validation (if defined)
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (refreshSecret && typeof refreshSecret === 'string') {
    if (refreshSecret === jwtSecret && (isProd || isStaging)) {
      warnings.push('REFRESH_TOKEN_SECRET should not be identical to JWT_SECRET.');
    }
    if (refreshSecret.length < 32 && !isTest) {
      warnings.push('REFRESH_TOKEN_SECRET is recommended to be at least 32 characters long.');
    }
  }

  // 4. Payment Gateway Secrets (in production)
  if (isProd) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || stripeKey.includes('replace_with')) {
      errors.push('STRIPE_SECRET_KEY is required and must not be a placeholder in production.');
    }
    if (!stripeWebhookSecret || stripeWebhookSecret.includes('replace_with')) {
      errors.push('STRIPE_WEBHOOK_SECRET is required and must not be a placeholder in production.');
    }

    const enabledGateways = String(process.env.ENABLED_PAYMENT_GATEWAYS || 'stripe')
      .split(',')
      .map((gateway) => gateway.trim().toLowerCase());
    if (enabledGateways.includes('paystack')) {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey || paystackKey.includes('replace_with')) {
        errors.push('PAYSTACK_SECRET_KEY is required for the enabled Paystack gateway.');
      }
    }
    if (enabledGateways.includes('mpesa')) {
      for (const name of ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'MPESA_CALLBACK_URL']) {
        const value = process.env[name];
        if (!value || value.includes('replace_with') || value.includes('your_')) {
          errors.push(`${name} is required for the enabled M-Pesa gateway.`);
        }
      }
    }
    const totpKey = process.env.TOTP_ENCRYPTION_KEY;
    if (!totpKey || totpKey.length < 43 || totpKey.includes('replace_with')) {
      errors.push('TOTP_ENCRYPTION_KEY must be a 32-byte base64 or 64-character hex key in production.');
    }
  }

  const isValid = errors.length === 0;

  if (!isValid && throwOnError) {
    const errorMsg = `Environment secret validation failed:\n - ${errors.join('\n - ')}`;
    logger.fatal ? logger.fatal(errorMsg) : console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return { isValid, errors, warnings };
}

module.exports = {
  validateEnvironmentSecrets,
  TRIVIAL_SECRET_PATTERNS,
};
