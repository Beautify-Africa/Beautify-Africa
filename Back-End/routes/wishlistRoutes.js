const express = require('express');
const {
  getWishlist,
  addToWishlist,
  toggleWishlistItem,
  removeFromWishlist,
  syncWishlist,
  clearWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

const router = express.Router();

router.use(setPrivateNoStore);
router.use(protect);

router.route('/').get(getWishlist).post(addToWishlist).delete(clearWishlist);
router.post('/toggle', toggleWishlistItem);
router.post('/sync', syncWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
