// services/inventoryService.js
// Core inventory operations supporting stock management and audit trails
const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');

/**
 * Adjust stock for a variant and record in ledger (atomic operation)
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (or null for main product stock)
 * @param {number} delta - Quantity change (positive=inbound, negative=outbound)
 * @param {string} reason - Reason for adjustment (required)
 * @param {string} notes - Additional notes (optional)
 * @param {string} createdBy - User ID making the adjustment (optional)
 * @param {string} relatedOrder - Related order ID if applicable (optional)
 * @returns {Promise<Object>} - Updated variant/product data
 * @throws {Error} - Validation errors or operation failures
 */
async function adjustStock(
  productId,
  variantId,
  delta,
  reason,
  notes = '',
  createdBy = null,
  relatedOrder = null
) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid product ID');
  }

  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error('Delta must be a non-zero integer');
  }

  if (!reason || reason.trim() === '') {
    throw new Error('Reason is required');
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  let stockBefore, stockAfter;
  let updateTarget;

  // Determine if adjusting variant or main stock
  if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
    const variant = product.variants.id(variantId);

    if (!variant) {
      throw new Error('Variant not found');
    }

    stockBefore = variant.stockQuantity;
    stockAfter = stockBefore + delta;
    updateTarget = { type: 'variant', variantId, variant };
  } else {
    // Adjust main product stock
    stockBefore = product.stockQuantity || 0;
    stockAfter = stockBefore + delta;
    updateTarget = { type: 'main', variant: null };
  }

  // Prevent negative stock
  if (stockAfter < 0) {
    throw new Error(
      `Cannot adjust stock: would result in negative quantity (${stockAfter})`
    );
  }

  // Update stock in product
  if (updateTarget.type === 'variant') {
    updateTarget.variant.stockQuantity = stockAfter;
  } else {
    product.stockQuantity = stockAfter;
  }

  await product.save();

  // Record in ledger
  const ledgerEntry = await InventoryLedger.recordMovement({
    product: product._id,
    variant: updateTarget.variant ? updateTarget.variant._id : null,
    type: delta > 0 ? 'restock' : 'adjustment',
    quantity: delta,
    reason: reason.trim(),
    notes: notes.trim(),
    createdBy,
    relatedOrder,
    stockBefore,
    stockAfter,
  });

  return {
    productId: product._id,
    variantId: updateTarget.variant ? updateTarget.variant._id : null,
    sku: updateTarget.variant ? updateTarget.variant.sku : product.sku,
    stockBefore,
    stockAfter,
    adjustment: delta,
    ledgerId: ledgerEntry._id,
  };
}

/**
 * Record an inventory movement without directly updating stock
 * Primarily used for manual ledger entries or when stock is updated externally
 * @param {Object} movement - Movement data
 * @returns {Promise<Object>} - Created ledger entry
 */
async function recordInventoryMovement(movement) {
  return InventoryLedger.recordMovement(movement);
}

/**
 * Retrieve stock history for a product or specific variant
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (optional, null=all variants)
 * @param {number} limit - Max results (default 50, max 500)
 * @param {number} skip - Pagination offset (default 0)
 * @param {string|string[]} types - Filter by movement type(s)
 * @returns {Promise<Object>} - Paginated ledger entries
 */
async function getStockHistory(productId, variantId = null, limit = 50, skip = 0, types = null) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid product ID');
  }

  const parsedLimit = Math.min(Math.max(limit, 1), 500);
  const parsedSkip = Math.max(skip, 0);

  const query = { product: productId };

  if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
    query.variant = variantId;
  }

  if (types) {
    const typeArray = Array.isArray(types) ? types : [types];
    const validTypes = typeArray.filter((t) =>
      ['purchase', 'adjustment', 'restock', 'return', 'correction'].includes(t)
    );

    if (validTypes.length > 0) {
      query.type = { $in: validTypes };
    }
  }

  const [movements, totalCount] = await Promise.all([
    InventoryLedger.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip)
      .populate('createdBy', 'name email')
      .lean(),
    InventoryLedger.countDocuments(query),
  ]);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / parsedLimit) : 0;
  const currentPage = Math.floor(parsedSkip / parsedLimit) + 1;

  return {
    movements,
    totalCount,
    page: currentPage,
    limit: parsedLimit,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1 && totalPages > 0,
  };
}

/**
 * Get current stock level for a product variant
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (optional, null=main stock)
 * @returns {Promise<number>} - Current stock quantity
 */
async function getCurrentStock(productId, variantId = null) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(productId, 'stockQuantity variants');

  if (!product) {
    throw new Error('Product not found');
  }

  if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
    const variant = product.variants.id(variantId);

    if (!variant) {
      throw new Error('Variant not found');
    }

    return variant.stockQuantity;
  }

  return product.stockQuantity || 0;
}

/**
 * Find products with low stock levels
 * @param {number} threshold - Stock level threshold
 * @param {Object} options - Query options {limit, skip, includeArchived}
 * @returns {Promise<Object>} - Array of low stock products/variants
 */
async function getLowStockItems(threshold = 10, options = {}) {
  const { limit = 100, skip = 0, includeArchived = false } = options;

  // Find products where main stock or any variant is below threshold
  const query = {
    $or: [
      { stockQuantity: { $lt: threshold, $gte: 0 } },
      { 'variants.stockQuantity': { $lt: threshold, $gte: 0 } },
    ],
  };

  if (!includeArchived) {
    query.status = { $ne: 'archived' };
  }

  const products = await Product.find(query)
    .select('_id name sku stockQuantity variants status')
    .limit(limit)
    .skip(skip)
    .lean();

  // Transform to highlight low stock items
  const lowStockItems = [];

  products.forEach((product) => {
    // Check main stock
    if (product.stockQuantity < threshold && product.stockQuantity >= 0) {
      lowStockItems.push({
        type: 'main',
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        stock: product.stockQuantity,
        threshold,
        status: product.status,
      });
    }

    // Check variants
    product.variants.forEach((variant) => {
      if (variant.stockQuantity < threshold && variant.stockQuantity >= 0) {
        lowStockItems.push({
          type: 'variant',
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          sku: variant.sku,
          stock: variant.stockQuantity,
          threshold,
          status: product.status,
        });
      }
    });
  });

  const totalCount = await Product.countDocuments(query);

  return {
    items: lowStockItems,
    totalCount,
    limit,
    skip,
    hasMore: skip + limit < totalCount,
  };
}

/**
 * Process a purchase transaction (reduce stock, record ledger)
 * Called during order checkout or fulfillment
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (optional)
 * @param {number} quantity - Quantity purchased
 * @param {string} orderId - Related order ID
 * @param {string} userId - User ID making the purchase
 * @returns {Promise<Object>} - Purchase record
 */
async function processPurchase(productId, variantId, quantity, orderId, userId) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  try {
    return await adjustStock(
      productId,
      variantId || null,
      -quantity, // Negative = outbound
      'purchase',
      `Order: ${orderId}`,
      userId,
      orderId
    );
  } catch (error) {
    throw new Error(`Purchase processing failed: ${error.message}`);
  }
}

/**
 * Process a return transaction (restore stock, record ledger)
 * Called during order returns or cancellation
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (optional)
 * @param {number} quantity - Quantity returned
 * @param {string} orderId - Related order ID
 * @param {string} reason - Return reason
 * @param {string} userId - User ID processing the return
 * @returns {Promise<Object>} - Return record
 */
async function processReturn(productId, variantId, quantity, orderId, reason = '', userId) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  try {
    return await adjustStock(
      productId,
      variantId || null,
      quantity, // Positive = inbound
      'return',
      `Order: ${orderId} | Reason: ${reason}`,
      userId,
      orderId
    );
  } catch (error) {
    throw new Error(`Return processing failed: ${error.message}`);
  }
}

module.exports = {
  adjustStock,
  recordInventoryMovement,
  getStockHistory,
  getCurrentStock,
  getLowStockItems,
  processPurchase,
  processReturn,
};
