// migrations/20260916000002-add-multicurrency-payment-gateways.js
const { DataTypes } = require('sequelize');

/**
 * Migration to add multi-currency and payment gateway orchestration fields
 * to the orders table. Backward-compatible with existing Stripe orders.
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    const ordersTable = await queryInterface.describeTable('orders');

    if (!ordersTable.currency) {
      await queryInterface.addColumn('orders', 'currency', {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      });
    }

    if (!ordersTable.exchangeRate) {
      await queryInterface.addColumn('orders', 'exchangeRate', {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0,
      });
    }

    if (!ordersTable.paymentGateway) {
      await queryInterface.addColumn('orders', 'paymentGateway', {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'stripe',
      });
    }

    if (!ordersTable.gatewayReference) {
      await queryInterface.addColumn('orders', 'gatewayReference', {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!ordersTable.gatewayFee) {
      await queryInterface.addColumn('orders', 'gatewayFee', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    // Add index on gatewayReference for quick webhook and verification lookups
    const [indexes] = await queryInterface.sequelize.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'orders_gateway_reference_idx';"
    );
    if (!indexes || indexes.length === 0) {
      await queryInterface.addIndex('orders', ['gatewayReference'], {
        name: 'orders_gateway_reference_idx',
      });
    }
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('orders', 'orders_gateway_reference_idx').catch(() => {});
    await queryInterface.removeColumn('orders', 'gatewayFee').catch(() => {});
    await queryInterface.removeColumn('orders', 'gatewayReference').catch(() => {});
    await queryInterface.removeColumn('orders', 'paymentGateway').catch(() => {});
    await queryInterface.removeColumn('orders', 'exchangeRate').catch(() => {});
    await queryInterface.removeColumn('orders', 'currency').catch(() => {});
  },
};
