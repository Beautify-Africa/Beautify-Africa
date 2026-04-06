const {
  resolveProductId,
  getWishlistProductsForUser,
  addProductToWishlist,
  toggleWishlistProduct,
  removeProductFromWishlist,
  syncWishlistProducts,
  clearWishlistForUser,
} = require('../services/wishlistService');

function sendServiceError(res, error) {
  return res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
  });
}

// @desc    Get authenticated user's wishlist
// @route   GET /api/wishlist
// @access  Private
async function getWishlist(req, res) {
  try {
    const { products } = await getWishlistProductsForUser(req.user._id);

    return res.status(200).json({
      status: 'success',
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
async function addToWishlist(req, res) {
  try {
    const productId = resolveProductId(req.body);

    if (!productId) {
      return res.status(400).json({ status: 'error', message: 'Product ID is required' });
    }

    const { error, inWishlist, products } = await addProductToWishlist(req.user._id, productId);
    if (error) return sendServiceError(res, error);

    return res.status(200).json({
      status: 'success',
      inWishlist,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
async function toggleWishlistItem(req, res) {
  try {
    const productId = resolveProductId(req.body);

    if (!productId) {
      return res.status(400).json({ status: 'error', message: 'Product ID is required' });
    }

    const { error, action, inWishlist, products } = await toggleWishlistProduct(
      req.user._id,
      productId
    );
    if (error) return sendServiceError(res, error);

    return res.status(200).json({
      status: 'success',
      action,
      inWishlist,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
async function removeFromWishlist(req, res) {
  try {
    const { error, inWishlist, products } = await removeProductFromWishlist(
      req.user._id,
      req.params.productId
    );
    if (error) return sendServiceError(res, error);

    return res.status(200).json({
      status: 'success',
      inWishlist,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

// @desc    Merge guest wishlist into authenticated wishlist
// @route   POST /api/wishlist/sync
// @access  Private
async function syncWishlist(req, res) {
  try {
    const { error, count, products } = await syncWishlistProducts(req.user._id, req.body.localItems);
    if (error) return sendServiceError(res, error);

    return res.status(200).json({
      status: 'success',
      count,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

// @desc    Clear authenticated user's wishlist
// @route   DELETE /api/wishlist
// @access  Private
async function clearWishlist(req, res) {
  try {
    const { products } = await clearWishlistForUser(req.user._id);

    return res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  toggleWishlistItem,
  removeFromWishlist,
  syncWishlist,
  clearWishlist,
};
