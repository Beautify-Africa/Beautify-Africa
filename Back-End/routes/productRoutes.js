const express = require('express');
const { getProducts, getProductByIdOrSlug } = require('../controllers/productController');

const router = express.Router();

router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductByIdOrSlug);

module.exports = router;