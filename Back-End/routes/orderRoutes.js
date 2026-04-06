// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders } = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middlewares/authMiddleware');

router.post('/', optionalProtect, addOrderItems);
router.get('/myorders', protect, getMyOrders);

module.exports = router;
