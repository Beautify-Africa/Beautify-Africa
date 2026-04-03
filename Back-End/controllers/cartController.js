// controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, cartItems: [] });
    }

    res.status(200).json({ status: 'success', data: cart.cartItems });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { product, name, price, image, variant, quantity } = req.body;

  try {
    const dbProduct = await Product.findById(product);
    if (!dbProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    if (!dbProduct.inStock) {
      return res.status(400).json({ status: 'error', message: 'Product is fully out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, cartItems: [] });

    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === product.toString()
    );

    const requestedQty = Number(quantity);

    if (existingItemIndex >= 0) {
      // Backend cap to prevent integer overflow abuse
      const maxAllowed = 100;
      const newQty = cart.cartItems[existingItemIndex].quantity + requestedQty;
      cart.cartItems[existingItemIndex].quantity = Math.min(newQty, maxAllowed);
    } else {
      // Zero-Trust Pricing mapping
      cart.cartItems.push({ 
        product, 
        name: dbProduct.name, 
        price: dbProduct.price, // Trust Database Pricing
        image: dbProduct.image, 
        variant, 
        quantity: Math.min(requestedQty, 100) 
      });
    }

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
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

    const dbProduct = await Product.findById(productId);
    if (!dbProduct) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (!dbProduct.inStock) return res.status(400).json({ status: 'error', message: 'Product is currently out of stock' });

    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingItemIndex >= 0) {
      const parsedQty = Number(quantity);
      if (parsedQty < 1) {
        cart.cartItems.splice(existingItemIndex, 1);
      } else {
        cart.cartItems[existingItemIndex].quantity = Math.min(parsedQty, 100);
      }
      const updatedCart = await cart.save();
      res.status(200).json({ status: 'success', data: updatedCart.cartItems });
    } else {
      res.status(404).json({ status: 'error', message: 'Item not found in cart' });
    }
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
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

    cart.cartItems = cart.cartItems.filter(
      (item) => item.product.toString() !== productId.toString()
    );
    
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
    let cart = await Cart.findOne({ user: req.user._id });
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
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, cartItems: [] });

    for (let currentItem of localItems) {
      if (!currentItem.product && !currentItem.id) continue;
      
      const pId = currentItem.product || currentItem.id;
      
      // Zero-Trust Check against DB
      const dbProd = await Product.findById(pId).catch(() => null);
      if (!dbProd || !dbProd.inStock) continue; // Skip invalid or out-of-stock items safely

      const existingItemIndex = cart.cartItems.findIndex(
        (ci) => ci.product.toString() === pId.toString()
      );

      const parsedQty = Number(currentItem.quantity || 1);

      if (existingItemIndex >= 0) {
        const newQty = cart.cartItems[existingItemIndex].quantity + parsedQty;
        cart.cartItems[existingItemIndex].quantity = Math.min(newQty, 100);
      } else {
        cart.cartItems.push({
          product: pId,
          name: dbProd.name,
          price: dbProd.price, // Guarantee Database Price over LocalStorage spoofing
          image: dbProd.image,
          variant: currentItem.variant,
          quantity: Math.min(parsedQty, 100),
        });
      }
    }

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
