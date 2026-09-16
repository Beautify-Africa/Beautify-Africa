// migrations/20260914000000-baseline-schema.js
const { DataTypes } = require('sequelize');

/**
 * Baseline schema migration for Beautify Africa.
 * Creates all foundational tables if they do not already exist.
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Users
    await queryInterface.createTable('users', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
      passwordResetToken: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      passwordResetExpires: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 2. Products
    await queryInterface.createTable('products', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, unique: true },
      brand: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      subcategory: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      status: { type: DataTypes.STRING, defaultValue: 'published' },
      isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      originalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
      image: { type: DataTypes.TEXT, allowNull: false },
      images: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
      stockQuantity: { type: DataTypes.INTEGER, defaultValue: 25 },
      lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
      inStock: { type: DataTypes.BOOLEAN, defaultValue: true },
      rating: { type: DataTypes.FLOAT, defaultValue: 0 },
      numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
      description: { type: DataTypes.TEXT, defaultValue: '' },
      skinType: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ['All'] },
      ingredients: { type: DataTypes.TEXT, defaultValue: '' },
      howToUse: { type: DataTypes.TEXT, defaultValue: '' },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      isNewProduct: { type: DataTypes.BOOLEAN, defaultValue: false },
      isBestSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 3. Product Variants
    await queryInterface.createTable('product_variants', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      sku: { type: DataTypes.STRING, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      color: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      type: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
      inStock: { type: DataTypes.BOOLEAN, defaultValue: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 4. Product Reviews
    await queryInterface.createTable('product_reviews', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: DataTypes.STRING, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 5. Orders
    await queryInterface.createTable('orders', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      stripePaymentIntentId: { type: DataTypes.STRING, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, defaultValue: 'Credit Card' },
      paymentResultId: { type: DataTypes.STRING, allowNull: true },
      paymentResultStatus: { type: DataTypes.STRING, allowNull: true },
      paymentResultUpdateTime: { type: DataTypes.STRING, allowNull: true },
      paymentResultEmail: { type: DataTypes.STRING, allowNull: true },
      itemsPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      taxPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shippingPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      isPaid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      isDelivered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      fulfillmentStatus: { type: DataTypes.STRING, defaultValue: 'processing' },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
      trackingNumber: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      shippingCarrier: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      trackingUrl: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      estimatedDeliveryDate: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 6. Order Items
    await queryInterface.createTable('order_items', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'products', key: 'id' },
        onDelete: 'SET NULL',
      },
      variantId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'SET NULL',
      },
      sku: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      variantName: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      name: { type: DataTypes.STRING, allowNull: false },
      qty: { type: DataTypes.INTEGER, allowNull: false },
      image: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    });

    // 7. Order Shipping Addresses
    await queryInterface.createTable('order_shipping_addresses', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      zip: { type: DataTypes.STRING, allowNull: false },
      country: { type: DataTypes.STRING, allowNull: false },
    });

    // 8. Admin Timeline Entries
    await queryInterface.createTable('admin_timeline_entries', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: DataTypes.STRING, allowNull: false },
      action: { type: DataTypes.STRING, defaultValue: '' },
      note: { type: DataTypes.STRING(600), defaultValue: '' },
      adminName: { type: DataTypes.STRING, defaultValue: 'Admin' },
      adminEmail: { type: DataTypes.STRING, defaultValue: '' },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 9. Carts
    await queryInterface.createTable('carts', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 10. Cart Items
    await queryInterface.createTable('cart_items', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      cartId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'carts', key: 'id' },
        onDelete: 'CASCADE',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 11. Wishlists
    await queryInterface.createTable('wishlists', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 12. Wishlist Products (join table)
    await queryInterface.createTable('wishlist_products', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      wishlistId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'wishlists', key: 'id' },
        onDelete: 'CASCADE',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 13. Newsletters
    await queryInterface.createTable('newsletters', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      unsubscribeToken: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      unsubscribeTokenExpires: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 14. Inventory Ledgers
    await queryInterface.createTable('inventory_ledgers', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      variantId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      stockBefore: { type: DataTypes.INTEGER, allowNull: false },
      stockAfter: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: false },
      notes: { type: DataTypes.TEXT, defaultValue: '' },
      createdById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      relatedOrderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'orders', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // 15. Webhook Events (Idempotency table)
    await queryInterface.createTable('webhook_events', {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
      payload: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
      errorMessage: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      processedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('webhook_events');
    await queryInterface.dropTable('inventory_ledgers');
    await queryInterface.dropTable('newsletters');
    await queryInterface.dropTable('wishlist_products');
    await queryInterface.dropTable('wishlists');
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('carts');
    await queryInterface.dropTable('admin_timeline_entries');
    await queryInterface.dropTable('order_shipping_addresses');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('product_reviews');
    await queryInterface.dropTable('product_variants');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('users');
  },
};
