// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
  syncCart,
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

const { validateBody, validateParams } = require('../middlewares/validate');
const {
  addToCartSchema,
  syncCartSchema,
  updateCartQtySchema,
  cartItemParamSchema,
} = require('../validations/cartValidation');

// All cart operations require an authenticated user
router.use(setPrivateNoStore);
router.use(protect);

router
  .route('/')
  .get(getCart)
  .post(validateBody(addToCartSchema), addToCart)
  .delete(clearCart);

router.post('/sync', validateBody(syncCartSchema), syncCart);

router
  .route('/:productId')
  .put(validateParams(cartItemParamSchema), validateBody(updateCartQtySchema), updateCartItemQty)
  .delete(validateParams(cartItemParamSchema), removeFromCart);

module.exports = router;
