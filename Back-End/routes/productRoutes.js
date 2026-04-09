// routes/productRoutes.js
// This router is mounted at /api/products in server.js
const express = require('express');
const { getProducts, getProductByIdOrSlug, createProductReview } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/:idOrSlug', getProductByIdOrSlug);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;