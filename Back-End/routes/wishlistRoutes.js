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

const { validateBody, validateParams } = require('../middlewares/validate');
const {
  wishlistActionSchema,
  syncWishlistSchema,
  wishlistParamSchema,
} = require('../validations/wishlistValidation');

const router = express.Router();

router.use(setPrivateNoStore);
router.use(protect);

router
  .route('/')
  .get(getWishlist)
  .post(validateBody(wishlistActionSchema), addToWishlist)
  .delete(clearWishlist);

router.post('/toggle', validateBody(wishlistActionSchema), toggleWishlistItem);
router.post('/sync', validateBody(syncWishlistSchema), syncWishlist);
router.delete('/:productId', validateParams(wishlistParamSchema), removeFromWishlist);

module.exports = router;
