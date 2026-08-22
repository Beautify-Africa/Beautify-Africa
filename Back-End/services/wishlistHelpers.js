// services/wishlistHelpers.js
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createServiceError(statusCode, message) {
  return { statusCode, message };
}

function normalizeProductId(productId) {
  if (typeof productId === 'string') return productId.trim();
  if (productId && typeof productId.toString === 'function') return productId.toString();
  return productId;
}

function validateProductId(productId) {
  if (!UUID_REGEX.test(String(productId || '').trim())) {
    return { error: createServiceError(400, 'Invalid product ID') };
  }
  return {};
}

function wishlistContainsProduct(wishlist, productId) {
  const normalizedProductId = normalizeProductId(productId);
  // wishlist.items is an array of product UUIDs (strings)
  return (wishlist.items || []).some((id) => String(id) === normalizedProductId);
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
