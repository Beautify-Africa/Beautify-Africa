// routes/productRoutes.js
// This router is mounted at /api/products in server.js
const express = require('express');
const {
  getProducts,
  getProductCatalog,
  getProductByIdOrSlug,
  createProductReview,
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { setPublicCache } = require('../middlewares/cacheHeaders');

const router = express.Router();

router.get('/', setPublicCache(60, 300), getProducts);
router.get('/catalog', setPublicCache(300, 1800), getProductCatalog);
router.get('/:idOrSlug', setPublicCache(120, 600), getProductByIdOrSlug);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;
