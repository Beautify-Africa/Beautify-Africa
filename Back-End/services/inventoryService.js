// services/inventoryService.js
const { Op } = require('sequelize');
const { Product, ProductVariant } = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function adjustStock(productId, variantId, delta, reason, notes = '', createdBy = null, relatedOrder = null) {
  if (!UUID_REGEX.test(String(productId || ''))) throw new Error('Invalid product ID');
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Delta must be a non-zero integer');
  if (!reason || reason.trim() === '') throw new Error('Reason is required');

  const product = await Product.findByPk(productId, {
    include: [{ model: ProductVariant, as: 'variants' }],
  });
  if (!product) throw new Error('Product not found');

  let stockBefore, stockAfter, updateTarget;

  if (variantId && UUID_REGEX.test(String(variantId))) {
    const variant = (product.variants || []).find((v) => v.id === variantId);
    if (!variant) throw new Error('Variant not found');

    stockBefore = variant.stockQuantity;
    stockAfter = stockBefore + delta;
    updateTarget = { type: 'variant', variantId, variant };
  } else {
    stockBefore = product.stockQuantity || 0;
    stockAfter = stockBefore + delta;
    updateTarget = { type: 'main', variant: null };
  }

  if (stockAfter < 0) throw new Error(`Cannot adjust stock: would result in negative quantity (${stockAfter})`);

  if (updateTarget.type === 'variant') {
    await ProductVariant.update(
      { stockQuantity: stockAfter, inStock: stockAfter > 0 },
      { where: { id: variantId } }
    );
    // Recompute product inStock from variants
    const allVariants = await ProductVariant.findAll({ where: { productId }, attributes: ['stockQuantity'], raw: true });
    const hasStock = allVariants.some((v) => v.stockQuantity > 0);
    await Product.update({ inStock: hasStock }, { where: { id: productId } });
  } else {
    await Product.update(
      { stockQuantity: stockAfter, inStock: stockAfter > 0 },
      { where: { id: productId } }
    );
  }

  const ledgerEntry = await InventoryLedger.recordMovement({
    product: productId,
    variant: updateTarget.variant ? updateTarget.variant.id : null,
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
    productId,
    variantId: updateTarget.variant ? updateTarget.variant.id : null,
    sku: updateTarget.variant ? updateTarget.variant.sku : null,
    stockBefore,
    stockAfter,
    adjustment: delta,
    ledgerId: ledgerEntry.id,
  };
}

async function recordInventoryMovement(movement) {
  return InventoryLedger.recordMovement(movement);
}

async function getStockHistory(productId, variantId = null, limit = 50, skip = 0, types = null) {
  if (!UUID_REGEX.test(String(productId || ''))) throw new Error('Invalid product ID');

  const parsedLimit = Math.min(Math.max(limit, 1), 500);
  const parsedSkip = Math.max(skip, 0);

  const where = { productId };
  if (variantId && UUID_REGEX.test(String(variantId))) where.variantId = variantId;
  if (types) {
    const typeArray = Array.isArray(types) ? types : [types];
    const validTypes = typeArray.filter((t) =>
      ['purchase', 'adjustment', 'restock', 'return', 'correction'].includes(t)
    );
    if (validTypes.length > 0) where.type = { [Op.in]: validTypes };
  }

  const [movements, totalCount] = await Promise.all([
    InventoryLedger.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset: parsedSkip,
      raw: true,
    }),
    InventoryLedger.count({ where }),
  ]);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / parsedLimit) : 0;
  const currentPage = Math.floor(parsedSkip / parsedLimit) + 1;

  return {
    movements: movements.map((m) => ({ ...m, _id: m.id })),
    totalCount,
    page: currentPage,
    limit: parsedLimit,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1 && totalPages > 0,
  };
}

async function getCurrentStock(productId, variantId = null) {
  if (!UUID_REGEX.test(String(productId || ''))) throw new Error('Invalid product ID');

  if (variantId && UUID_REGEX.test(String(variantId))) {
    const variant = await ProductVariant.findOne({ where: { id: variantId, productId }, raw: true });
    if (!variant) throw new Error('Variant not found');
    return variant.stockQuantity;
  }

  const product = await Product.findByPk(productId, { attributes: ['stockQuantity'], raw: true });
  if (!product) throw new Error('Product not found');
  return product.stockQuantity || 0;
}

async function getLowStockItems(threshold = 10, options = {}) {
  const { limit = 100, skip = 0, includeArchived = false } = options;

  const where = {
    [Op.or]: [
      { stockQuantity: { [Op.lt]: threshold, [Op.gte]: 0 } },
    ],
  };

  if (!includeArchived) where.status = { [Op.ne]: 'archived' };

  const [products, totalCount] = await Promise.all([
    Product.findAll({
      where,
      attributes: ['id', 'name', 'stockQuantity', 'status'],
      include: [{ model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'stockQuantity'], required: false }],
      limit,
      offset: skip,
    }),
    Product.count({ where }),
  ]);

  const lowStockItems = [];

  products.forEach((product) => {
    if (product.stockQuantity < threshold && product.stockQuantity >= 0) {
      lowStockItems.push({
        type: 'main',
        productId: product.id,
        productName: product.name,
        sku: null,
        stock: product.stockQuantity,
        threshold,
        status: product.status,
      });
    }

    (product.variants || []).forEach((variant) => {
      if (variant.stockQuantity < threshold && variant.stockQuantity >= 0) {
        lowStockItems.push({
          type: 'variant',
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          sku: variant.sku,
          stock: variant.stockQuantity,
          threshold,
          status: product.status,
        });
      }
    });
  });

  return { items: lowStockItems, totalCount, limit, skip, hasMore: skip + limit < totalCount };
}

async function processPurchase(productId, variantId, quantity, orderId, userId) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive integer');
  try {
    return await adjustStock(productId, variantId || null, -quantity, 'purchase', `Order: ${orderId}`, userId, orderId);
  } catch (error) {
    throw new Error(`Purchase processing failed: ${error.message}`);
  }
}

async function processReturn(productId, variantId, quantity, orderId, reason = '', userId) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive integer');
  try {
    return await adjustStock(productId, variantId || null, quantity, 'return', `Order: ${orderId} | Reason: ${reason}`, userId, orderId);
  } catch (error) {
    throw new Error(`Return processing failed: ${error.message}`);
  }
}

module.exports = { adjustStock, recordInventoryMovement, getStockHistory, getCurrentStock, getLowStockItems, processPurchase, processReturn };
