const {
  encryptTotpSecret,
  decryptTotpSecret,
  isEncryptedTotpSecret,
} = require('../services/totpSecretCipher');

describe('TOTP secret encryption', () => {
  beforeAll(() => {
    process.env.TOTP_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  test('uses authenticated encryption and round-trips the original secret', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptTotpSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(isEncryptedTotpSecret(encrypted)).toBe(true);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  test('keeps legacy plaintext readable during the migration rollout', () => {
    expect(decryptTotpSecret('JBSWY3DPEHPK3PXP')).toBe('JBSWY3DPEHPK3PXP');
  });
});
