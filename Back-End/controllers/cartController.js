// controllers/cartController.js
const {
  findCartByUser,
  findOrCreateCart,
  findInStockProduct,
  addOrMergeCartItem,
  updateCartItemQuantity,
  removeCartItemByProductId,
  syncLocalCartItems,
} = require('../services/cartService');

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
    const cart = await findOrCreateCart(req.user._id);

    res.status(200).json({ status: 'success', data: cart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { product, variant, quantity } = req.body;

  try {
    const { product: dbProduct, error: productError } = await findInStockProduct(
      product,
      'Product is fully out of stock'
    );
    if (productError) return sendServiceError(res, productError);

    const cart = await findOrCreateCart(req.user._id);

    addOrMergeCartItem(cart, {
      productId: product,
      dbProduct,
      variant,
      quantity,
    });

    const updatedCart = await cart.save();
    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Update single cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItemQty = async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;

  try {
    const cart = await findCartByUser(req.user._id);
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
    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Remove single item entirely from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  const productId = req.params.productId;

  try {
    const cart = await findCartByUser(req.user._id);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

    removeCartItemByProductId(cart, productId);
    
    const updatedCart = await cart.save();
    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Clear entire cart (e.g. after checkout)
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await findCartByUser(req.user._id);
    if (!cart) return res.status(200).json({ status: 'success', data: [] });

    cart.cartItems = [];
    const updatedCart = await cart.save();
    
    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Sync local storage cart items up to the database matching on login
// @route   POST /api/cart/sync
// @access  Private
const syncCart = async (req, res) => {
  const { localItems } = req.body;

  if (!Array.isArray(localItems)) {
    return res.status(400).json({ status: 'error', message: 'Expected an array of items' });
  }

  try {
    const cart = await findOrCreateCart(req.user._id);

    await syncLocalCartItems(cart, localItems);

    const updatedCart = await cart.save();
    res.status(200).json({ status: 'success', data: updatedCart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
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
