// controllers/cartController.js
const redisClient = require('../config/redis');
const {
  findCartByUser,
  findOrCreateCart,
  findInStockProduct,
  addOrMergeCartItem,
  updateCartItemQuantity,
  removeCartItemByProductId,
  syncLocalCartItems,
} = require('../services/cartService');

// ============================================================
// Redis Cart Cache Helpers
// All cart data is stored per-user with a 24-hour TTL.
// We use a Write-Through strategy: MongoDB is always the
// source of truth; Redis is the fast read layer.
// ============================================================
const CART_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

function buildCartCacheKey(userId) {
  return `cart:v1:${userId}`;
}

async function readCartCache(userId) {
  try {
    const key = buildCartCacheKey(userId);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('Redis cart read failed:', err.message);
    return null;
  }
}

async function writeCartCache(userId, cartItems) {
  try {
    const key = buildCartCacheKey(userId);
    await redisClient.set(key, JSON.stringify(cartItems), 'EX', CART_CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn('Redis cart write failed:', err.message);
  }
}

async function invalidateCartCache(userId) {
  try {
    const key = buildCartCacheKey(userId);
    await redisClient.del(key);
  } catch (err) {
    console.warn('Redis cart invalidation failed:', err.message);
  }
}

// ============================================================

function sendServiceError(res, error) {
  return res.status(error.statusCode).json({
    status: 'error',
    message: error.message,
  });
}

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Intercept: Check Redis first
    const cachedItems = await readCartCache(userId);
    if (cachedItems) {
      return res.status(200).json({ status: 'success', data: cachedItems });
    }

    // Cache miss: fetch from MongoDB and populate cache
    const cart = await findOrCreateCart(userId);
    await writeCartCache(userId, cart.cartItems);

    res.status(200).json({ status: 'success', data: cart.cartItems });
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while fetching your cart.' });
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { product, variant, quantity } = req.body;
  const userId = req.user._id;

  try {
    const { product: dbProduct, error: productError } = await findInStockProduct(
      product,
      'Product is fully out of stock'
    );
    if (productError) return sendServiceError(res, productError);

    const cart = await findOrCreateCart(userId);

    addOrMergeCartItem(cart, {
      productId: product,
      dbProduct,
      variant,
      quantity,
    });

    const updatedCart = await cart.save();

    // Write-through: overwrite Redis with the latest cart state
    await writeCartCache(userId, updatedCart.cartItems);

    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while adding to cart.' });
  }
};

// @desc    Update single cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItemQty = async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;
  const userId = req.user._id;

  try {
    const cart = await findCartByUser(userId);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

    const { error: productError } = await findInStockProduct(
      productId,
      'Product is currently out of stock'
    );
    if (productError) return sendServiceError(res, productError);

    const updated = updateCartItemQuantity(cart, productId, quantity);

    if (!updated) {
      res.status(404).json({ status: 'error', message: 'Item not found in cart' });
      return;
    }

    const updatedCart = await cart.save();

    // Write-through: overwrite Redis with the latest cart state
    await writeCartCache(userId, updatedCart.cartItems);

    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    console.error('updateCartItemQty error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while updating the cart.' });
  }
};

// @desc    Remove single item entirely from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  try {
    const cart = await findCartByUser(userId);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

    removeCartItemByProductId(cart, productId);

    const updatedCart = await cart.save();

    // Write-through: overwrite Redis with the latest (trimmed) cart state
    await writeCartCache(userId, updatedCart.cartItems);

    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    console.error('removeFromCart error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while removing the cart item.' });
  }
};

// @desc    Clear entire cart (e.g. after checkout)
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await findCartByUser(userId);
    if (!cart) {
      await invalidateCartCache(userId);
      return res.status(200).json({ status: 'success', data: [] });
    }

    cart.cartItems = [];
    const updatedCart = await cart.save();

    // Invalidate: user's cart is empty, no point caching an empty array
    await invalidateCartCache(userId);

    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    console.error('clearCart error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while clearing the cart.' });
  }
};

// @desc    Sync local storage cart items up to the database matching on login
// @route   POST /api/cart/sync
// @access  Private
const syncCart = async (req, res) => {
  const { localItems } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(localItems)) {
    return res.status(400).json({ status: 'error', message: 'Expected an array of items' });
  }

  try {
    const cart = await findOrCreateCart(userId);

    await syncLocalCartItems(cart, localItems);

    const updatedCart = await cart.save();

    // Write-through: overwrite Redis with synced cart state
    await writeCartCache(userId, updatedCart.cartItems);

    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    console.error('syncCart error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while syncing the cart.' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
  syncCart,
};
