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
  adjustVariantStock,
  getStockHistory,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { setPublicCache } = require('../middlewares/cacheHeaders');

const router = express.Router();

// ===== Public Product Routes =====
router.get('/', setPublicCache(60, 300), getProducts);
router.get('/catalog', setPublicCache(300, 1800), getProductCatalog);
router.get('/:idOrSlug', setPublicCache(120, 600), getProductByIdOrSlug);
router.post('/:id/reviews', protect, createProductReview);

// ===== PHASE 3: Variant & Status Management Routes (Admin Only) =====
// Get variants (public)
router.get('/:id/variants', getVariants);

// Get stock history (public)
router.get('/:id/stock-history', getStockHistory);

// Add variant (admin only)
router.post('/:id/variants', protect, requireAdmin, addVariant);

// Update variant (admin only)
router.put('/:id/variants/:variantId', protect, requireAdmin, updateVariant);

// Adjust variant stock (admin only)
router.post('/:id/variants/:variantId/stock', protect, requireAdmin, adjustVariantStock);

// Remove variant (admin only)
router.delete('/:id/variants/:variantId', protect, requireAdmin, removeVariant);

// Change product status (admin only)
router.patch('/:id/status', protect, requireAdmin, setProductStatus);

// Duplicate product (admin only)
router.post('/:id/duplicate', protect, requireAdmin, duplicateProduct);

module.exports = router;
