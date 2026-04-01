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

// All cart operations require an authenticated user
router.use(protect);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.post('/sync', syncCart);

router.route('/:productId')
  .put(updateCartItemQty)
  .delete(removeFromCart);

module.exports = router;
