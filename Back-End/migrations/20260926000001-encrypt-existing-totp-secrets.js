const { encryptTotpSecret, isEncryptedTotpSecret } = require('../services/totpSecretCipher');

/**
 * Encrypt legacy plaintext TOTP secrets using the deployment's TOTP_ENCRYPTION_KEY.
 * The key is intentionally not stored in the database or migration history.
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    const table = await queryInterface.describeTable('users');
    if (!table.twoFactorSecret) return;

    const [users] = await queryInterface.sequelize.query(
      'SELECT "id", "twoFactorSecret" FROM "users" WHERE "twoFactorSecret" IS NOT NULL'
    );

    for (const user of users) {
      if (!isEncryptedTotpSecret(user.twoFactorSecret)) {
        await queryInterface.sequelize.query(
          'UPDATE "users" SET "twoFactorSecret" = :secret WHERE "id" = :id',
          { replacements: { id: user.id, secret: encryptTotpSecret(user.twoFactorSecret) } }
        );
      }
    }
  },

  // Encryption is deliberately one-way from the database perspective; rollback preserves protected data.
  down: async () => {},
};
