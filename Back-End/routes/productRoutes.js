// routes/productRoutes.js
// This router is mounted at /api/products in server.js
const express = require('express');
const {
  getProducts,
  getProductCatalog,
  getProductByIdOrSlug,
  createProductReview,
  getVariants,
  addVariant,
  updateVariant,
  removeVariant,
  setProductStatus,
  duplicateProduct,
  exportProducts,
  importProducts,
  adjustVariantStock,
  getStockHistory,
} = require('../controllers/productController');
const { setPublicCache, setEdgeCdnCache } = require('../middlewares/cacheHeaders');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate');
const { searchLimiter } = require('../middlewares/rateLimiters');
const {
  productIdParamSchema,
  productIdOrSlugParamSchema,
  variantParamSchema,
  createReviewSchema,
  adjustStockSchema,
  addVariantSchema,
  productStatusSchema,
  getProductsQuerySchema,
} = require('../validations/productValidation');

const router = express.Router();

// ===== Public Product Routes =====
router.get(
  '/',
  (req, res, next) => (req.query.q ? searchLimiter(req, res, next) : next()),
  validateQuery(getProductsQuerySchema),
  setEdgeCdnCache(30, 300, 60),
  getProducts
);
router.get('/catalog', setEdgeCdnCache(60, 3600, 600), getProductCatalog);
router.get(
  '/:idOrSlug',
  validateParams(productIdOrSlugParamSchema),
  setEdgeCdnCache(60, 600, 120),
  getProductByIdOrSlug
);
router.post(
  '/:id/reviews',
  protect,
  validateParams(productIdParamSchema),
  validateBody(createReviewSchema),
  createProductReview
);

// ===== PHASE 3: Variant & Status Management Routes (Admin Only) =====
// Bulk import/export (admin only)
router.get('/bulk/export', protect, requireAdmin, exportProducts);
router.post('/bulk/import', protect, requireAdmin, importProducts);

// Get variants (public)
router.get('/:id/variants', getVariants);

// Get stock history (admin only - contains internal ledger & staff emails)
router.get('/:id/stock-history', protect, requireAdmin, getStockHistory);

// Add variant (admin only)
router.post(
  '/:id/variants',
  protect,
  requireAdmin,
  validateParams(productIdParamSchema),
  validateBody(addVariantSchema),
  addVariant
);

// Update variant (admin only)
router.put('/:id/variants/:variantId', protect, requireAdmin, updateVariant);

// Adjust variant stock (admin only)
router.post(
  '/:id/variants/:variantId/stock',
  protect,
  requireAdmin,
  validateParams(variantParamSchema),
  validateBody(adjustStockSchema),
  adjustVariantStock
);

// Remove variant (admin only)
router.delete('/:id/variants/:variantId', protect, requireAdmin, removeVariant);

// Change product status (admin only)
router.patch(
  '/:id/status',
  protect,
  requireAdmin,
  validateParams(productIdParamSchema),
  validateBody(productStatusSchema),
  setProductStatus
);

// Duplicate product (admin only)
router.post('/:id/duplicate', protect, requireAdmin, duplicateProduct);

module.exports = router;
