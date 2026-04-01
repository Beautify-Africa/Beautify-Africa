const express = require('express');
const { getProducts, getProductByIdOrSlug, createProductReview } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductByIdOrSlug);
router.post('/products/:id/reviews', protect, createProductReview);

module.exports = router;