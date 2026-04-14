// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders } = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

router.use(setPrivateNoStore);

router.post('/', optionalProtect, addOrderItems);
router.get('/myorders', protect, getMyOrders);

module.exports = router;
