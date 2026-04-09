const Product = require('../models/Product');

// Escapes special RegExp characters in user-supplied strings to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readFirstString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstString = value.find((entry) => typeof entry === 'string');
    return typeof firstString === 'string' ? firstString.trim() : '';
  }

  return '';
}

function buildProductFilter(query = {}) {
  const category = readFirstString(query.category);
  const brand = readFirstString(query.brand);
  const skinType = readFirstString(query.skinType);
  const inStock = readFirstString(query.inStock);
  const minPrice = readFirstString(query.minPrice);
  const maxPrice = readFirstString(query.maxPrice);
  const q = readFirstString(query.q);

  const filter = {};

  if (category) {
    filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
  }

  if (brand) {
    filter.brand = { $regex: new RegExp(`^${escapeRegex(brand)}$`, 'i') };
  }

  if (skinType) {
    filter.skinType = skinType;
  }

  if (inStock === 'true' || inStock === 'false') {
    filter.inStock = inStock === 'true';
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      filter.price.$lte = Number(maxPrice);
    }

    if (Object.keys(filter.price).length === 0) {
      delete filter.price;
    }
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), 'i');
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
