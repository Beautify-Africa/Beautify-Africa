const mongoose = require('mongoose');

function createServiceError(statusCode, message) {
  return {
    statusCode,
    message,
  };
}

function normalizeProductId(productId) {
  if (typeof productId === 'string') return productId.trim();
  if (productId && typeof productId.toString === 'function') return productId.toString();
  return productId;
}

function validateProductId(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return {
      error: createServiceError(400, 'Invalid product ID'),
    };
  }

  return {};
}

function wishlistContainsProduct(wishlist, productId) {
  const normalizedProductId = normalizeProductId(productId);
  return wishlist.items.some((item) => item.toString() === normalizedProductId);
}

function resolveProductId(payload = {}) {
  const candidate = payload.productId || payload.product;
  if (typeof candidate === 'string') return candidate.trim();
  return candidate;
}

function normalizeIncomingProductIds(localItems) {
  return localItems
    .map((item) => {
      if (typeof item === 'string') return item.trim();

      if (item && typeof item === 'object') {
        const resolved = resolveProductId(item);
        if (typeof resolved === 'string') return resolved.trim();
        if (resolved) return resolved.toString();
      }

      return null;
    })
    .filter(Boolean);
}

module.exports = {
  createServiceError,
  normalizeProductId,
  validateProductId,
  wishlistContainsProduct,
  resolveProductId,
  normalizeIncomingProductIds,
};
