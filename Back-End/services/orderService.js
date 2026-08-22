// services/orderService.js
const { Op } = require('sequelize');
const { Product } = require('../models/Product');
const { Cart, CartItem } = require('../models/Cart');
const { withInventoryLock } = require('./inventoryLock');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function calculateOrderTotals(itemsPrice) {
  const shippingPrice = itemsPrice > 100 ? 0 : 15;
  const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));
  return { shippingPrice, taxPrice, totalPrice };
}

function getOrderItemProductId(item = {}) {
  if (typeof item.product === 'string') return item.product;
  if (item.product && typeof item.product === 'object') {
    return item.product.id || item.product._id || null;
  }
  return item.productId || item.id || null;
}

async function findProductsByIds(productIds = []) {
  if (productIds.length === 0) return [];
  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    attributes: ['id', 'name', 'price', 'image', 'inStock'],
    raw: true,
  });
  return products.map((p) => ({ ...p, _id: p.id }));
}

async function buildProductLookupMaps(orderItems = [], userId = null) {
  const requestedIds = [
    ...new Set(orderItems.map((item) => getOrderItemProductId(item)).filter(Boolean)),
  ];

  const directProducts = await findProductsByIds(requestedIds);
  const directProductMap = new Map(directProducts.map((p) => [p.id.toString(), p]));

  const unresolvedIds = requestedIds.filter((id) => !directProductMap.has(id.toString()));
  const cartProductMap = new Map();

  if (userId && unresolvedIds.length > 0) {
    const cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, as: 'cartItems', where: { id: { [Op.in]: unresolvedIds } }, required: false }],
    });

    const cartItemToProductId = new Map(
      (cart?.cartItems || []).map((cartItem) => [
        cartItem.id.toString(),
        cartItem.productId?.toString?.() || String(cartItem.productId),
      ])
    );

    const fallbackProductIds = [...new Set([...cartItemToProductId.values()].filter(Boolean))];
    if (fallbackProductIds.length > 0) {
      const fallbackProducts = await findProductsByIds(fallbackProductIds);
      const fallbackProductMap = new Map(fallbackProducts.map((p) => [p.id.toString(), p]));

      cartItemToProductId.forEach((fallbackProductId, cartItemId) => {
        const matchedProduct = fallbackProductMap.get(fallbackProductId);
        if (matchedProduct) cartProductMap.set(cartItemId, matchedProduct);
      });
    }
  }

  return { directProductMap, cartProductMap };
}

async function buildVerifiedOrderItems(orderItems = [], userId = null) {
  const verifiedOrderItems = [];
  let itemsPrice = 0;
  const { directProductMap, cartProductMap } = await buildProductLookupMaps(orderItems, userId);

  for (const item of orderItems) {
    const productId = getOrderItemProductId(item);
    const quantity = Number(item.qty ?? item.quantity);

    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      return { error: { statusCode: 400, message: 'Invalid order item payload' } };
    }

    const normalizedProductId = productId.toString();
    const dbProduct =
      directProductMap.get(normalizedProductId) || cartProductMap.get(normalizedProductId);

    if (!dbProduct) {
      return { error: { statusCode: 404, message: `Product not found: ${item.name || productId}` } };
    }

    if (!dbProduct.inStock) {
      return { error: { statusCode: 400, message: `Product is completely out of stock: ${dbProduct.name}` } };
    }

    const { conflict } = await withInventoryLock(normalizedProductId, async () => {
      itemsPrice += dbProduct.price * quantity;
      verifiedOrderItems.push({
        name: dbProduct.name,
        qty: quantity,
        image: dbProduct.image,
        price: dbProduct.price,
        productId: dbProduct.id,
      });
    });

    if (conflict) {
      return {
        error: {
          statusCode: 409,
          message: `"${dbProduct.name}" is currently being reserved by another customer. Please try again in a moment.`,
        },
      };
    }
  }

  return { verifiedOrderItems, itemsPrice };
}

module.exports = { buildVerifiedOrderItems, calculateOrderTotals };
