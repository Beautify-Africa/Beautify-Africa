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

async function resolveProjectedQuery(queryOrPromise, projection) {
  if (queryOrPromise && typeof queryOrPromise.select === 'function') {
    const selectedQuery = queryOrPromise.select(projection);
    return typeof selectedQuery.lean === 'function' ? selectedQuery.lean() : selectedQuery;
  }

  return queryOrPromise;
}

async function findProductsByIds(productIds = []) {
  if (productIds.length === 0) {
    return [];
  }

  const products = await resolveProjectedQuery(
    Product.find({ _id: { $in: productIds } }),
    'name price image inStock'
  );

  return Array.isArray(products) ? products : [];
}

async function buildProductLookupMaps(orderItems = [], userId = null) {
  const requestedIds = [...new Set(orderItems.map((item) => getOrderItemProductId(item)).filter(Boolean))];

  const directProducts = await findProductsByIds(requestedIds);
  const directProductMap = new Map(
    directProducts.map((product) => [product._id.toString(), product])
  );

  const unresolvedIds = requestedIds.filter((id) => !directProductMap.has(id.toString()));
  const cartProductMap = new Map();

  if (userId && unresolvedIds.length > 0) {
    const cartFilter =
      unresolvedIds.length === 1
        ? {
            user: userId,
            'cartItems._id': unresolvedIds[0],
          }
        : {
            user: userId,
            'cartItems._id': { $in: unresolvedIds },
          };
    const cart = await resolveProjectedQuery(
      Cart.findOne(cartFilter),
      'cartItems._id cartItems.product'
    );

    const cartItemToProductId = new Map(
      (cart?.cartItems || []).map((cartItem) => [
        cartItem._id.toString(),
        cartItem.product?.toString?.() || String(cartItem.product),
      ])
    );

    const fallbackProductIds = [...new Set([...cartItemToProductId.values()].filter(Boolean))];
    if (fallbackProductIds.length > 0) {
      const fallbackProducts = await findProductsByIds(fallbackProductIds);
      const fallbackProductMap = new Map(
        fallbackProducts.map((product) => [product._id.toString(), product])
      );

      cartItemToProductId.forEach((fallbackProductId, cartItemId) => {
        const matchedProduct = fallbackProductMap.get(fallbackProductId);
        if (matchedProduct) {
          cartProductMap.set(cartItemId, matchedProduct);
        }
      });
    }
  }

  return {
    directProductMap,
    cartProductMap,
  };
}

async function buildVerifiedOrderItems(orderItems = [], userId = null) {
  const verifiedOrderItems = [];
  let itemsPrice = 0;
  const { directProductMap, cartProductMap } = await buildProductLookupMaps(orderItems, userId);

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

    const normalizedProductId = productId.toString();
    const dbProduct =
      directProductMap.get(normalizedProductId) || cartProductMap.get(normalizedProductId);

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
