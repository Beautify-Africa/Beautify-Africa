const Product = require('../models/Product');

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

async function buildVerifiedOrderItems(orderItems = []) {
  const verifiedOrderItems = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    const productId = item.product || item.id;
    const quantity = Number(item.qty);

    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      return {
        error: {
          statusCode: 400,
          message: 'Invalid order item payload',
        },
      };
    }

    const dbProduct = await Product.findById(productId);

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
