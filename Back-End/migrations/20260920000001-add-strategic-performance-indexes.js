// migrations/20260920000001-add-strategic-performance-indexes.js
/**
 * Migration adding strategic composite & search indexes for high-frequency queries:
 * - Product catalog filtering (isArchived + category / brand / inStock / createdAt / price)
 * - Order queries (userId + createdAt, fulfillmentStatus + isPaid + createdAt)
 * - Variant inventory availability (productId + inStock / stockQuantity)
 * - Product review timelines and Inventory ledger audits
 * - Order shipping address email lookup
 */
module.exports = {
  up: async ({ context: queryInterface }) => {
    const safeAddIndex = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (err) {
        // Index might already exist or table not initialized yet in non-standard test setups
      }
    };

    // 1. Products Indexes
    await safeAddIndex('products', ['isArchived', 'category'], {
      name: 'products_is_archived_category_idx',
    });
    await safeAddIndex('products', ['isArchived', 'brand'], {
      name: 'products_is_archived_brand_idx',
    });
    await safeAddIndex('products', ['isArchived', 'inStock'], {
      name: 'products_is_archived_in_stock_idx',
    });
    await safeAddIndex('products', ['isArchived', 'createdAt'], {
      name: 'products_is_archived_created_at_idx',
    });
    await safeAddIndex('products', ['isArchived', 'price'], {
      name: 'products_is_archived_price_idx',
    });
    await safeAddIndex('products', ['name'], {
      name: 'products_name_idx',
    });

    // 2. Orders Indexes
    await safeAddIndex('orders', ['userId', 'createdAt'], {
      name: 'orders_user_id_created_at_idx',
    });
    await safeAddIndex('orders', ['fulfillmentStatus', 'isPaid', 'createdAt'], {
      name: 'orders_fulfillment_is_paid_created_at_idx',
    });
    await safeAddIndex('orders', ['isPaid', 'createdAt'], {
      name: 'orders_is_paid_created_at_idx',
    });

    // 3. Product Variants Indexes
    await safeAddIndex('product_variants', ['productId', 'inStock'], {
      name: 'product_variants_product_id_in_stock_idx',
    });
    await safeAddIndex('product_variants', ['productId', 'stockQuantity'], {
      name: 'product_variants_product_id_stock_qty_idx',
    });

    // 4. Inventory Ledgers Indexes
    await safeAddIndex('inventory_ledgers', ['productId', 'createdAt'], {
      name: 'inventory_ledgers_product_id_created_at_idx',
    });

    // 5. Product Reviews Indexes
    await safeAddIndex('product_reviews', ['productId', 'createdAt'], {
      name: 'product_reviews_product_id_created_at_idx',
    });

    // 6. Order Shipping Addresses Indexes
    await safeAddIndex('order_shipping_addresses', ['email', 'orderId'], {
      name: 'order_shipping_addresses_email_order_id_idx',
    });

    // 7. Cart Items Indexes
    await safeAddIndex('cart_items', ['cartId', 'productId'], {
      name: 'cart_items_cart_id_product_id_idx',
    });
  },

  down: async ({ context: queryInterface }) => {
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        await queryInterface.removeIndex(tableName, indexName);
      } catch (err) {}
    };

    await safeRemoveIndex('cart_items', 'cart_items_cart_id_product_id_idx');
    await safeRemoveIndex('order_shipping_addresses', 'order_shipping_addresses_email_order_id_idx');
    await safeRemoveIndex('product_reviews', 'product_reviews_product_id_created_at_idx');
    await safeRemoveIndex('inventory_ledgers', 'inventory_ledgers_product_id_created_at_idx');
    await safeRemoveIndex('product_variants', 'product_variants_product_id_stock_qty_idx');
    await safeRemoveIndex('product_variants', 'product_variants_product_id_in_stock_idx');
    await safeRemoveIndex('orders', 'orders_is_paid_created_at_idx');
    await safeRemoveIndex('orders', 'orders_fulfillment_is_paid_created_at_idx');
    await safeRemoveIndex('orders', 'orders_user_id_created_at_idx');
    await safeRemoveIndex('products', 'products_name_idx');
    await safeRemoveIndex('products', 'products_is_archived_price_idx');
    await safeRemoveIndex('products', 'products_is_archived_created_at_idx');
    await safeRemoveIndex('products', 'products_is_archived_in_stock_idx');
    await safeRemoveIndex('products', 'products_is_archived_brand_idx');
    await safeRemoveIndex('products', 'products_is_archived_category_idx');
  },
};
