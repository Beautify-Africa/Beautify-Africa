const Product = require('../models/Product');
const Cart = require('../models/Cart');

function calculateOrderTotals(itemsPrice) {
  const shippingPrice = itemsPrice > 100 ? 0 : 15;
  const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  return {
    shippingPrice,
    taxPrice,
    totalPrice,
  };
}

function getOrderItemProductId(item = {}) {
  if (typeof item.product === 'string') return item.product;
  if (item.product && typeof item.product === 'object') {
    return item.product._id || item.product.id || null;
  }

  return item.productId || item.id || null;
}

async function resolveProduct(productId, userId) {
  const dbProduct = await Product.findById(productId);
  if (dbProduct) return dbProduct;

  if (!userId) {
    return null;
  }

  const cart = await Cart.findOne({
    user: userId,
    'cartItems._id': productId,
  });

  const matchingCartItem = cart?.cartItems?.find(
    (cartItem) => cartItem._id.toString() === productId.toString()
  );

  if (!matchingCartItem) {
    return null;
  }

  return Product.findById(matchingCartItem.product);
}

async function buildVerifiedOrderItems(orderItems = [], userId = null) {
  const verifiedOrderItems = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    const productId = getOrderItemProductId(item);
    const quantity = Number(item.qty ?? item.quantity);

    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      return {
        error: {
          statusCode: 400,
          message: 'Invalid order item payload',
        },
      };
    }

    const dbProduct = await resolveProduct(productId, userId);

    if (!dbProduct) {
      return {
        error: {
          statusCode: 404,
          message: `Product not found: ${item.name || productId}`,
        },
      };
    }

    if (!dbProduct.inStock) {
      return {
        error: {
          statusCode: 400,
          message: `Product is completely out of stock: ${dbProduct.name}`,
        },
      };
    }

    itemsPrice += dbProduct.price * quantity;

    verifiedOrderItems.push({
      name: dbProduct.name,
      qty: quantity,
      image: dbProduct.image,
      price: dbProduct.price,
      product: dbProduct._id,
    });
  }

  return {
    verifiedOrderItems,
    itemsPrice,
  };
}

module.exports = {
  buildVerifiedOrderItems,
  calculateOrderTotals,
};
