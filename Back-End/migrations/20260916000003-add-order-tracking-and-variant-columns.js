// migrations/20260916000003-add-order-tracking-and-variant-columns.js
const { DataTypes } = require('sequelize');

/**
 * Migration to align orders and order_items tables with domain models:
 * Adds tracking attributes and soft-delete to orders, and variant details to order_items.
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    // 0. Ensure all enum values exist in enum_orders_fulfillmentStatus
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE "enum_orders_fulfillmentStatus" ADD VALUE IF NOT EXISTS 'pending_payment';
        ALTER TYPE "enum_orders_fulfillmentStatus" ADD VALUE IF NOT EXISTS 'cancelled';
        ALTER TYPE "enum_orders_fulfillmentStatus" ADD VALUE IF NOT EXISTS 'refunded';
      EXCEPTION
        WHEN undefined_object THEN null;
      END $$;
    `);

    // 1. Orders table tracking and soft-delete columns
    const ordersTable = await queryInterface.describeTable('orders');

    if (!ordersTable.trackingNumber) {
      await queryInterface.addColumn('orders', 'trackingNumber', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!ordersTable.shippingCarrier) {
      await queryInterface.addColumn('orders', 'shippingCarrier', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!ordersTable.trackingUrl) {
      await queryInterface.addColumn('orders', 'trackingUrl', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!ordersTable.estimatedDeliveryDate) {
      await queryInterface.addColumn('orders', 'estimatedDeliveryDate', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!ordersTable.deletedAt) {
      await queryInterface.addColumn('orders', 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }

    // Add index on orders.trackingNumber if missing
    const [trackingIndexes] = await queryInterface.sequelize.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'orders_tracking_number_idx';"
    );
    if (!trackingIndexes || trackingIndexes.length === 0) {
      await queryInterface
        .addIndex('orders', ['trackingNumber'], {
          name: 'orders_tracking_number_idx',
        })
        .catch(() => {});
    }

    // 2. Order items variant columns
    const orderItemsTable = await queryInterface.describeTable('order_items');

    if (!orderItemsTable.variantId) {
      await queryInterface
        .addColumn('order_items', 'variantId', {
          type: DataTypes.UUID,
          allowNull: true,
          defaultValue: null,
          references: { model: 'product_variants', key: 'id' },
          onDelete: 'SET NULL',
        })
        .catch(async () => {
          // Fallback without foreign key constraint if product_variants id type differs
          await queryInterface.addColumn('order_items', 'variantId', {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
          });
        });
    }

    if (!orderItemsTable.sku) {
      await queryInterface.addColumn('order_items', 'sku', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!orderItemsTable.variantName) {
      await queryInterface.addColumn('order_items', 'variantName', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('orders', 'trackingNumber').catch(() => {});
    await queryInterface.removeColumn('orders', 'shippingCarrier').catch(() => {});
    await queryInterface.removeColumn('orders', 'trackingUrl').catch(() => {});
    await queryInterface.removeColumn('orders', 'estimatedDeliveryDate').catch(() => {});
    await queryInterface.removeColumn('orders', 'deletedAt').catch(() => {});
    await queryInterface.removeColumn('order_items', 'variantId').catch(() => {});
    await queryInterface.removeColumn('order_items', 'sku').catch(() => {});
    await queryInterface.removeColumn('order_items', 'variantName').catch(() => {});
  },
};
