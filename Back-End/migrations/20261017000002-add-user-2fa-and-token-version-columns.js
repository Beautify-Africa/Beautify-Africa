// migrations/20261017000002-add-user-2fa-and-token-version-columns.js
/**
 * Migration to add missing two-factor authentication and token invalidation columns
 * to the users table in PostgreSQL.
 * Resolves column missing errors during registration, login, and profile operations.
 */
module.exports = {
  up: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE IF EXISTS public.users
        ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "twoFactorRecoveryCodes" JSON NOT NULL DEFAULT '[]'::json,
        ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
    `);
  },

  down: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE IF EXISTS public.users
        DROP COLUMN IF EXISTS "twoFactorEnabled",
        DROP COLUMN IF EXISTS "twoFactorSecret",
        DROP COLUMN IF EXISTS "twoFactorRecoveryCodes",
        DROP COLUMN IF EXISTS "tokenVersion";
    `);
  },
};
