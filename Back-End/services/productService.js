const Product = require('../models/Product');

function buildProductFilter(query = {}) {
  const {
    category,
    brand,
    skinType,
    inStock,
    minPrice,
    maxPrice,
    q,
  } = query;

  const filter = {};

  if (category) {
    filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (brand) {
    filter.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
  }

  if (skinType) {
    filter.skinType = skinType;
  }

  if (inStock === 'true' || inStock === 'false') {
    filter.inStock = inStock === 'true';
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (q) {
    const searchRegex = new RegExp(q, 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
    ];
  }

  return filter;
}

function buildProductSortOption(sort) {
  if (sort === 'price-low') return { price: 1 };
  if (sort === 'price-high') return { price: -1 };
  if (sort === 'rating') return { rating: -1 };
  if (sort === 'best-selling') return { isBestSeller: -1, numReviews: -1 };
  return { createdAt: -1 };
}

function normalizeReviewPayload(payload = {}) {
  const normalizedRating = Number(payload.rating);
  const normalizedComment =
    typeof payload.comment === 'string'
      ? payload.comment.trim().substring(0, 500)
      : '';

  return {
    normalizedRating,
    normalizedComment,
  };
}

function buildReviewFromUser(user, rating, comment) {
  return {
    name: user.name,
    rating,
    comment,
    user: user._id,
  };
}

function updateReviewAggregates(product) {
  product.numReviews = product.reviews.length;

  const rawRating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  product.rating = Math.round(rawRating * 10) / 10;
}

async function findProductByIdOrSlug(idOrSlug) {
  let product = null;

  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(idOrSlug);
  }

  if (!product) {
    product = await Product.findOne({ slug: idOrSlug.toLowerCase() });
  }

  return product;
}

module.exports = {
  buildProductFilter,
  buildProductSortOption,
  normalizeReviewPayload,
  buildReviewFromUser,
  updateReviewAggregates,
  findProductByIdOrSlug,
};
