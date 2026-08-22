const inventoryService = require('../services/inventoryService');
const { bumpProductCacheVersion } = require('./productController.cache');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/products/:id/variants/:variantId/stock
// Adjust stock for a specific variant and record in ledger
async function adjustVariantStock(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!UUID_REGEX.test(String(req.params.variantId || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const { quantity, reason = '', notes = '' } = req.body;

    if (!Number.isInteger(quantity) || quantity === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be a non-zero integer (positive for restock, negative for adjustment)',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Reason is required' });
    }

    const result = await inventoryService.adjustStock(
      req.params.id,
      req.params.variantId,
      quantity,
      reason,
      notes,
      req.user?.id || req.user?._id || null
    );

    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Stock adjusted',
      data: result,
    });
  } catch (error) {
    console.error('adjustVariantStock error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ status: 'error', message: error.message });
  }
}

// GET /api/products/:id/stock-history
// Retrieve inventory ledger history for a product or specific variant
async function getStockHistory(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { variantId = null, limit = 50, skip = 0, type = null } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const history = await inventoryService.getStockHistory(
      req.params.id,
      variantId && UUID_REGEX.test(String(variantId)) ? variantId : null,
      parsedLimit,
      parsedSkip,
      type
    );

    return res.status(200).json({
      status: 'success',
      count: history.movements.length,
      totalCount: history.totalCount,
      page: history.page,
      limit: history.limit,
      totalPages: history.totalPages,
      hasNextPage: history.hasNextPage,
      hasPreviousPage: history.hasPreviousPage,
      data: history.movements,
    });
  } catch (error) {
    console.error('getStockHistory error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  adjustVariantStock,
  getStockHistory,
};
