// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');
const { validateBody, validateParams } = require('../middlewares/validate');
const {
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
} = require('../validations/orderValidation');

router.use(setPrivateNoStore);

router.post('/', optionalProtect, validateBody(createOrderSchema), addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', optionalProtect, validateParams(orderIdParamSchema), getOrderById);
router.put(
  '/:id/cancel',
  protect,
  validateParams(orderIdParamSchema),
  validateBody(cancelOrderSchema),
  cancelOrder
);

module.exports = router;
