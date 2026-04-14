const mongoose = require('mongoose');
const Product = require('../models/Product');

const DEFAULT_PRODUCT_PAGE = 1;
const DEFAULT_PRODUCT_LIMIT = 12;
const MAX_PRODUCT_LIMIT = 48;
const DEFAULT_PRICE_RANGE_MAX = 200;
const PRODUCT_LIST_SELECT_FIELDS =
  'name slug brand category subcategory price originalPrice rating numReviews inStock image skinType isNewProduct isBestSeller createdAt';

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

function readStringList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function toSlugId(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sortWithAllFirst(values = []) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  const nonAllValues = uniqueValues
    .filter((value) => value !== 'All')
    .sort((left, right) => left.localeCompare(right));

  return ['All', ...nonAllValues];
}

function normalizeProductIds(rawIds = []) {
  return [
    ...new Set(
      rawIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => String(id))
    ),
  ];
}

function buildProductFilter(query = {}) {
  const category = readFirstString(query.category);
  const subcategory = readFirstString(query.subcategory);
  const brand = readFirstString(query.brand);
  const skinType = readFirstString(query.skinType);
  const inStock = readFirstString(query.inStock);
  const minPrice = readFirstString(query.minPrice);
  const maxPrice = readFirstString(query.maxPrice);
  const q = readFirstString(query.q);
  const rawIds = readStringList(query.ids);
  const ids = normalizeProductIds(rawIds);

  const filter = {};

  if (rawIds.length > 0) {
    filter._id = { $in: ids };
  }

  if (category) {
    filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
  }

  if (brand) {
    filter.brand = { $regex: new RegExp(`^${escapeRegex(brand)}$`, 'i') };
  }

  if (subcategory) {
    filter.subcategory = { $regex: new RegExp(`^${escapeRegex(subcategory)}$`, 'i') };
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
      { brand: searchRegex },
      { category: searchRegex },
    ];
  }

  return filter;
}

function buildProductSortOption(sort) {
  if (sort === 'price-low') return { price: 1, _id: 1 };
  if (sort === 'price-high') return { price: -1, _id: 1 };
  if (sort === 'rating') return { rating: -1, numReviews: -1, _id: 1 };
  if (sort === 'best-selling') return { isBestSeller: -1, numReviews: -1, _id: 1 };
  return { createdAt: -1, _id: 1 };
}

function buildProductPagination(query = {}) {
  const parsedPage = Number.parseInt(readFirstString(query.page), 10);
  const parsedLimit = Number.parseInt(readFirstString(query.limit), 10);

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PRODUCT_PAGE;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_PRODUCT_LIMIT)
      : DEFAULT_PRODUCT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function buildCatalogCategories(categoryRows = []) {
  const normalizedRows = categoryRows
    .filter((row) => typeof row?._id === 'string' && row._id.trim())
    .map((row) => ({
      label: row._id.trim(),
      subcategories: [...new Set((row.subcategories || []).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return [
    {
      id: 'all',
      label: 'All',
      subcategories: [],
    },
    ...normalizedRows.map((row) => ({
      id: toSlugId(row.label),
      label: row.label,
      subcategories: row.subcategories,
    })),
  ];
}

function buildCatalogPayload({ categoryRows = [], brands = [], skinTypes = [], maxPrice = 0 }) {
  const roundedMaxPrice =
    maxPrice > 0
      ? Math.max(DEFAULT_PRICE_RANGE_MAX, Math.ceil(maxPrice / 10) * 10)
      : DEFAULT_PRICE_RANGE_MAX;

  return {
    categories: buildCatalogCategories(categoryRows),
    brands: sortWithAllFirst(brands),
    skinTypes: sortWithAllFirst(skinTypes),
    priceRange: {
      min: 0,
      max: roundedMaxPrice,
    },
  };
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
    product = await Product.findById(idOrSlug).lean();
  }

  if (!product) {
    product = await Product.findOne({ slug: idOrSlug.toLowerCase() }).lean();
  }

  return product;
}

module.exports = {
  PRODUCT_LIST_SELECT_FIELDS,
  buildProductFilter,
  buildProductSortOption,
  buildProductPagination,
  buildCatalogPayload,
  normalizeProductIds,
  normalizeReviewPayload,
  buildReviewFromUser,
  updateReviewAggregates,
  findProductByIdOrSlug,
};
