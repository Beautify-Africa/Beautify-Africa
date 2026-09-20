// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const { getCurrencyRates, convertPrice } = require('../controllers/paymentController');
const { setEdgeCdnCache } = require('../middlewares/cacheHeaders');

router.get('/rates', setEdgeCdnCache(300, 43200, 3600), getCurrencyRates);
router.get('/convert', setEdgeCdnCache(60, 3600, 300), convertPrice);

module.exports = router;
