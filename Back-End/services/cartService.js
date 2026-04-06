const Cart = require('../models/Cart');
const Product = require('../models/Product');

const MAX_CART_ITEM_QUANTITY = 100;

function normalizeQuantity(quantity, fallback = 1) {
  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity)) {
    return fallback;
  }

  if (parsedQuantity < 1) {
    return parsedQuantity;
  }

  return Math.min(Math.floor(parsedQuantity), MAX_CART_ITEM_QUANTITY);
}

function resolveIncomingProductId(item = {}) {
  if (typeof item === 'string') return item;
  return item.product || item.id;
}

async function findCartByUser(userId) {
  return Cart.findOne({ user: userId });
}

async function findOrCreateCart(userId) {
  const existingCart = await findCartByUser(userId);
  if (existingCart) return existingCart;
  return Cart.create({ user: userId, cartItems: [] });
}

async function findInStockProduct(productId, outOfStockMessage) {
  const product = await Product.findById(productId).catch(() => null);

  if (!product) {
    return {
      error: {
        statusCode: 404,
        message: 'Product not found',
      },
    };
  }

  if (!product.inStock) {
    return {
      error: {
        statusCode: 400,
        message: outOfStockMessage,
      },
    };
  }

  return { product };
}

function addOrMergeCartItem(cart, { productId, dbProduct, variant, quantity }) {
  const requestedQuantity = Math.max(normalizeQuantity(quantity, 1), 1);

  const existingItemIndex = cart.cartItems.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItemIndex >= 0) {
    const mergedQuantity = cart.cartItems[existingItemIndex].quantity + requestedQuantity;
    cart.cartItems[existingItemIndex].quantity = Math.min(
      mergedQuantity,
      MAX_CART_ITEM_QUANTITY
    );

    return;
  }

  cart.cartItems.push({
    product: productId,
    name: dbProduct.name,
    price: dbProduct.price,
    image: dbProduct.image,
    variant,
    quantity: Math.min(requestedQuantity, MAX_CART_ITEM_QUANTITY),
  });
}

function updateCartItemQuantity(cart, productId, quantity) {
  const existingItemIndex = cart.cartItems.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItemIndex < 0) {
    return false;
  }

  const normalizedQuantity = normalizeQuantity(quantity, 1);

  if (normalizedQuantity < 1) {
    cart.cartItems.splice(existingItemIndex, 1);
    return true;
  }

  cart.cartItems[existingItemIndex].quantity = Math.min(
    normalizedQuantity,
    MAX_CART_ITEM_QUANTITY
  );

  return true;
}

function removeCartItemByProductId(cart, productId) {
  cart.cartItems = cart.cartItems.filter(
    (item) => item.product.toString() !== productId.toString()
  );
}

async function syncLocalCartItems(cart, localItems) {
  for (const localItem of localItems) {
    const productId = resolveIncomingProductId(localItem);
    if (!productId) continue;

    const { product: dbProduct } = await findInStockProduct(
      productId,
      'Product is currently out of stock'
    );
    if (!dbProduct) continue;

    addOrMergeCartItem(cart, {
      productId,
      dbProduct,
      variant: localItem.variant,
      quantity: localItem.quantity || 1,
    });
  }
}

module.exports = {
  findCartByUser,
  findOrCreateCart,
  findInStockProduct,
  addOrMergeCartItem,
  updateCartItemQuantity,
  removeCartItemByProductId,
  syncLocalCartItems,
};
