// services/wishlistService.js
const { Op } = require('sequelize');
const { Wishlist, WishlistProduct } = require('../models/Wishlist');
const { Product } = require('../models/Product');
const {
  createServiceError,
  normalizeProductId,
  validateProductId,
  resolveProductId,
  normalizeIncomingProductIds,
} = require('./wishlistHelpers');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRODUCT_SELECT_FIELDS = [
  'id', 'name', 'slug', 'brand', 'category', 'price', 'originalPrice',
  'rating', 'numReviews', 'inStock', 'image', 'images', 'isNewProduct', 'isBestSeller',
];

async function ensureProductExists(productId) {
  const product = await Product.findByPk(productId, { attributes: ['id'] });
  if (!product) return { error: createServiceError(404, 'Product not found') };
  return { product };
}

async function findOrCreateWishlist(userId) {
  const [wishlist] = await Wishlist.findOrCreate({ where: { userId }, defaults: { userId } });
  return wishlist;
}

async function getWishlistProductIds(wishlistId) {
  const items = await WishlistProduct.findAll({ where: { wishlistId }, attributes: ['productId'] });
  return items.map((i) => i.productId);
}

async function populateWishlistProducts(wishlistId) {
  const productIds = await getWishlistProductIds(wishlistId);
  if (productIds.length === 0) return [];
  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    attributes: PRODUCT_SELECT_FIELDS,
    raw: true,
  });
  // Map _id for compat
  return products.map((p) => ({ ...p, _id: p.id }));
}

async function getWishlistProductsForUser(userId) {
  const wishlist = await findOrCreateWishlist(userId);
  const products = await populateWishlistProducts(wishlist.id);
  return { products };
}

async function addProductToWishlist(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const normalizedProductId = normalizeProductId(productId);
  const { error: productError } = await ensureProductExists(normalizedProductId);
  if (productError) return { error: productError };

  const wishlist = await findOrCreateWishlist(userId);

  await WishlistProduct.findOrCreate({
    where: { wishlistId: wishlist.id, productId: normalizedProductId },
  });

  const products = await populateWishlistProducts(wishlist.id);
  return { inWishlist: true, products };
}

async function toggleWishlistProduct(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const normalizedProductId = normalizeProductId(productId);
  const wishlist = await findOrCreateWishlist(userId);

  const existing = await WishlistProduct.findOne({
    where: { wishlistId: wishlist.id, productId: normalizedProductId },
  });

  let action;
  if (existing) {
    await existing.destroy();
    action = 'removed';
  } else {
    const { error: productError } = await ensureProductExists(normalizedProductId);
    if (productError) return { error: productError };
    await WishlistProduct.create({ wishlistId: wishlist.id, productId: normalizedProductId });
    action = 'added';
  }

  const products = await populateWishlistProducts(wishlist.id);
  return { action, inWishlist: action === 'added', products };
}

async function removeProductFromWishlist(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const normalizedProductId = normalizeProductId(productId);
  const wishlist = await Wishlist.findOne({ where: { userId } });

  if (!wishlist) return { inWishlist: false, products: [] };

  await WishlistProduct.destroy({
    where: { wishlistId: wishlist.id, productId: normalizedProductId },
  });

  const products = await populateWishlistProducts(wishlist.id);
  return { inWishlist: false, products };
}

async function syncWishlistProducts(userId, localItems) {
  if (!Array.isArray(localItems)) {
    return { error: createServiceError(400, 'Expected an array of items') };
  }

  const normalizedIds = [
    ...new Set(
      normalizeIncomingProductIds(localItems).filter((id) => UUID_REGEX.test(id))
    ),
  ];

  const wishlist = await findOrCreateWishlist(userId);
  const existingIds = new Set(await getWishlistProductIds(wishlist.id));
  const newIds = normalizedIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    const existingProducts = await Product.findAll({
      where: { id: { [Op.in]: newIds } },
      attributes: ['id'],
      raw: true,
    });
    const validIds = existingProducts.map((p) => p.id);
    if (validIds.length > 0) {
      await WishlistProduct.bulkCreate(
        validIds.map((productId) => ({ wishlistId: wishlist.id, productId })),
        { ignoreDuplicates: true }
      );
    }
  }

  const products = await populateWishlistProducts(wishlist.id);
  return { count: products.length, products };
}

async function clearWishlistForUser(userId) {
  const wishlist = await Wishlist.findOne({ where: { userId } });
  if (!wishlist) return { products: [] };
  await WishlistProduct.destroy({ where: { wishlistId: wishlist.id } });
  return { products: [] };
}

module.exports = {
  resolveProductId,
  normalizeIncomingProductIds,
  findOrCreateWishlist,
  populateWishlistProducts,
  getWishlistProductsForUser,
  addProductToWishlist,
  toggleWishlistProduct,
  removeProductFromWishlist,
  syncWishlistProducts,
  clearWishlistForUser,
};
