const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const {
  createServiceError,
  normalizeProductId,
  validateProductId,
  wishlistContainsProduct,
  resolveProductId,
  normalizeIncomingProductIds,
} = require('./wishlistHelpers');

const PRODUCT_SELECT_FIELDS =
  'name slug brand category price originalPrice rating numReviews inStock image images isNewProduct isBestSeller';

async function ensureProductExists(productId) {
  const productQuery = Product.findById(productId);
  let product;

  if (productQuery && typeof productQuery.select === 'function') {
    const selected = productQuery.select('_id');
    product = selected && typeof selected.lean === 'function' ? await selected.lean() : await selected;
  } else {
    product = await productQuery;
  }

  if (!product) {
    return {
      error: createServiceError(404, 'Product not found'),
    };
  }

  return { product };
}


async function findOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
}

async function populateWishlistProducts(wishlist) {
  await wishlist.populate({
    path: 'items',
    select: PRODUCT_SELECT_FIELDS,
  });

  const products = wishlist.items.filter((item) => item && item._id);

  if (products.length !== wishlist.items.length) {
    wishlist.items = products.map((product) => product._id);
    await wishlist.save();
  }

  return products;
}

async function getWishlistProductsForUser(userId) {
  const wishlist = await findOrCreateWishlist(userId);
  const products = await populateWishlistProducts(wishlist);

  return { products };
}

async function addProductToWishlist(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const normalizedProductId = normalizeProductId(productId);
  const { error: productError } = await ensureProductExists(normalizedProductId);
  if (productError) return { error: productError };

  const wishlist = await findOrCreateWishlist(userId);

  if (!wishlistContainsProduct(wishlist, normalizedProductId)) {
    wishlist.items.push(normalizedProductId);
    await wishlist.save();
  }

  const products = await populateWishlistProducts(wishlist);

  return {
    inWishlist: true,
    products,
  };
}

async function toggleWishlistProduct(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const normalizedProductId = normalizeProductId(productId);
  const wishlist = await findOrCreateWishlist(userId);

  const existingIndex = wishlist.items.findIndex(
    (item) => item.toString() === normalizedProductId
  );

  let action = 'added';

  if (existingIndex >= 0) {
    wishlist.items.splice(existingIndex, 1);
    action = 'removed';
  } else {
    const { error: productError } = await ensureProductExists(normalizedProductId);
    if (productError) return { error: productError };

    wishlist.items.push(normalizedProductId);
  }

  await wishlist.save();
  const products = await populateWishlistProducts(wishlist);

  return {
    action,
    inWishlist: action === 'added',
    products,
  };
}

async function removeProductFromWishlist(userId, productId) {
  const { error: invalidIdError } = validateProductId(productId);
  if (invalidIdError) return { error: invalidIdError };

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    return {
      inWishlist: false,
      products: [],
    };
  }

  const normalizedProductId = normalizeProductId(productId);

  wishlist.items = wishlist.items.filter((item) => item.toString() !== normalizedProductId);
  await wishlist.save();

  const products = await populateWishlistProducts(wishlist);

  return {
    inWishlist: false,
    products,
  };
}

async function syncWishlistProducts(userId, localItems) {
  if (!Array.isArray(localItems)) {
    return {
      error: createServiceError(400, 'Expected an array of items'),
    };
  }

  const normalizedIds = [
    ...new Set(
      normalizeIncomingProductIds(localItems).filter((id) => mongoose.Types.ObjectId.isValid(id))
    ),
  ];

  const wishlist = await findOrCreateWishlist(userId);
  const existingProductIds = new Set(wishlist.items.map((item) => item.toString()));
  const missingProductIds = normalizedIds.filter((id) => !existingProductIds.has(id));

  if (missingProductIds.length > 0) {
    const existingProductsQuery = Product.find({ _id: { $in: missingProductIds } });
    let existingProducts;

    if (existingProductsQuery && typeof existingProductsQuery.select === 'function') {
      const selected = existingProductsQuery.select('_id');
      existingProducts = selected && typeof selected.lean === 'function'
        ? await selected.lean()
        : await selected;
    } else {
      existingProducts = await existingProductsQuery;
    }

    existingProducts.forEach((product) => {
      wishlist.items.push(product._id);
    });

    if (existingProducts.length > 0) {
      await wishlist.save();
    }
  }

  const products = await populateWishlistProducts(wishlist);

  return {
    count: products.length,
    products,
  };
}

async function clearWishlistForUser(userId) {
  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    return {
      products: [],
    };
  }

  wishlist.items = [];
  await wishlist.save();

  return {
    products: [],
  };
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
