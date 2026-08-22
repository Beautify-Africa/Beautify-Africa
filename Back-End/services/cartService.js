// services/cartService.js
const { Cart, CartItem } = require('../models/Cart');
const { Product } = require('../models/Product');

const MAX_CART_ITEM_QUANTITY = 100;

function normalizeQuantity(quantity, fallback = 1) {
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity)) return fallback;
  if (parsedQuantity < 1) return parsedQuantity;
  return Math.min(Math.floor(parsedQuantity), MAX_CART_ITEM_QUANTITY);
}

function resolveIncomingProductId(item = {}) {
  if (typeof item === 'string') return item;
  return item.product || item.id;
}

async function findCartByUser(userId) {
  return Cart.findOne({
    where: { userId },
    include: [{ model: CartItem, as: 'cartItems' }],
  });
}

async function findOrCreateCart(userId) {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
    include: [{ model: CartItem, as: 'cartItems' }],
  });
  // Eagerly load cartItems if just created
  if (!cart.cartItems) {
    cart.cartItems = [];
  }
  return cart;
}

async function findInStockProduct(productId, outOfStockMessage) {
  let product = null;
  try {
    product = await Product.findByPk(productId, {
      attributes: ['id', 'name', 'price', 'image', 'inStock'],
      raw: true,
    });
  } catch {
    product = null;
  }

  if (!product) return { error: { statusCode: 404, message: 'Product not found' } };
  if (!product.inStock) return { error: { statusCode: 400, message: outOfStockMessage } };
  // Add _id for compat
  product._id = product.id;
  return { product };
}

async function addOrMergeCartItem(cart, { productId, dbProduct, variant, quantity }) {
  const requestedQuantity = Math.max(normalizeQuantity(quantity, 1), 1);

  const existingItem = (cart.cartItems || []).find(
    (item) => String(item.productId) === String(productId)
  );

  if (existingItem) {
    const mergedQuantity = Math.min(existingItem.quantity + requestedQuantity, MAX_CART_ITEM_QUANTITY);
    await CartItem.update(
      { quantity: mergedQuantity },
      { where: { id: existingItem.id } }
    );
    existingItem.quantity = mergedQuantity;
  } else {
    const newItem = await CartItem.create({
      cartId: cart.id,
      productId,
      name: dbProduct.name,
      price: dbProduct.price,
      image: dbProduct.image,
      variant: variant || null,
      quantity: Math.min(requestedQuantity, MAX_CART_ITEM_QUANTITY),
    });
    cart.cartItems = [...(cart.cartItems || []), newItem];
  }
}

async function updateCartItemQuantity(cart, productId, quantity) {
  const existingItem = (cart.cartItems || []).find(
    (item) => String(item.productId) === String(productId)
  );

  if (!existingItem) return false;

  const normalizedQuantity = normalizeQuantity(quantity, 1);

  if (normalizedQuantity < 1) {
    await CartItem.destroy({ where: { id: existingItem.id } });
    cart.cartItems = (cart.cartItems || []).filter((item) => item.id !== existingItem.id);
    return true;
  }

  const newQty = Math.min(normalizedQuantity, MAX_CART_ITEM_QUANTITY);
  await CartItem.update({ quantity: newQty }, { where: { id: existingItem.id } });
  existingItem.quantity = newQty;
  return true;
}

async function removeCartItemByProductId(cart, productId) {
  await CartItem.destroy({ where: { cartId: cart.id, productId } });
  cart.cartItems = (cart.cartItems || []).filter(
    (item) => String(item.productId) !== String(productId)
  );
}

async function syncLocalCartItems(cart, localItems) {
  for (const localItem of localItems) {
    const productId = resolveIncomingProductId(localItem);
    if (!productId) continue;

    const { product: dbProduct } = await findInStockProduct(productId, 'Product is currently out of stock');
    if (!dbProduct) continue;

    await addOrMergeCartItem(cart, {
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
