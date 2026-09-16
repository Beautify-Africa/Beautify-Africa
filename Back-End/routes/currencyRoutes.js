// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const { getCurrencyRates, convertPrice } = require('../controllers/paymentController');

router.get('/rates', getCurrencyRates);
router.get('/convert', convertPrice);

module.exports = router;
