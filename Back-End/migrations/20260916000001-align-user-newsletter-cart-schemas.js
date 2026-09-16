// migrations/20260916000001-align-user-newsletter-cart-schemas.js
const { DataTypes } = require('sequelize');

/**
 * Migration to align user, newsletter, and cart_items schemas with domain models.
 * Ensures role, brute force tracking, newsletter unsubscribe timestamps,
 * and cart snapshot fields exist in PostgreSQL.
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Users table alignment
    const userTable = await queryInterface.describeTable('users');
    if (!userTable.role) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_role" AS ENUM('customer', 'admin', 'manager', 'support');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.addColumn('users', 'role', {
        type: DataTypes.ENUM('customer', 'admin', 'manager', 'support'),
        defaultValue: 'customer',
      });
    }
    if (!userTable.failedLoginAttempts) {
      await queryInterface.addColumn('users', 'failedLoginAttempts', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      });
    }
    if (!userTable.lockUntil) {
      await queryInterface.addColumn('users', 'lockUntil', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }

    // 2. Newsletters table alignment
    const newsletterTable = await queryInterface.describeTable('newsletters');
    if (!newsletterTable.unsubscribedAt) {
      await queryInterface.addColumn('newsletters', 'unsubscribedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }

    // 3. Cart Items table alignment
    await queryInterface.sequelize.query(`
      ALTER TABLE cart_items ALTER COLUMN "createdAt" SET DEFAULT NOW();
      ALTER TABLE cart_items ALTER COLUMN "updatedAt" SET DEFAULT NOW();
      DO $$ BEGIN
        ALTER TABLE cart_items ALTER COLUMN "qty" DROP NOT NULL;
      EXCEPTION
        WHEN undefined_column THEN null;
      END $$;
    `);

    const cartItemsTable = await queryInterface.describeTable('cart_items');
    if (!cartItemsTable.name) {
      await queryInterface.addColumn('cart_items', 'name', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
      });
    }
    if (!cartItemsTable.price) {
      await queryInterface.addColumn('cart_items', 'price', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      });
    }
    if (!cartItemsTable.image) {
      await queryInterface.addColumn('cart_items', 'image', {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
      });
    }
    if (!cartItemsTable.variant) {
      await queryInterface.addColumn('cart_items', 'variant', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!cartItemsTable.quantity) {
      await queryInterface.addColumn('cart_items', 'quantity', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
      if (cartItemsTable.qty) {
        await queryInterface.sequelize.query(
          'UPDATE cart_items SET quantity = qty WHERE qty IS NOT NULL;'
        );
      }
    }
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('newsletters', 'unsubscribedAt').catch(() => {});
    await queryInterface.removeColumn('users', 'lockUntil').catch(() => {});
    await queryInterface.removeColumn('users', 'failedLoginAttempts').catch(() => {});
    await queryInterface.removeColumn('users', 'role').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";').catch(() => {});
    await queryInterface.removeColumn('cart_items', 'variant').catch(() => {});
    await queryInterface.removeColumn('cart_items', 'image').catch(() => {});
    await queryInterface.removeColumn('cart_items', 'price').catch(() => {});
    await queryInterface.removeColumn('cart_items', 'name').catch(() => {});
    await queryInterface.removeColumn('cart_items', 'quantity').catch(() => {});
  },
};
