// services/productService.js
const { Op } = require('sequelize');
const { Product } = require('../models/Product');

const DEFAULT_PRODUCT_PAGE = 1;
const DEFAULT_PRODUCT_LIMIT = 12;
const MAX_PRODUCT_LIMIT = 48;
const DEFAULT_PRICE_RANGE_MAX = 200;
const PRODUCT_LIST_SELECT_FIELDS = [
  'id', 'name', 'slug', 'brand', 'category', 'price', 'originalPrice',
  'rating', 'numReviews', 'inStock', 'image', 'skinType', 'isNewProduct', 'isBestSeller', 'createdAt',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readFirstString(value) {
  if (typeof value === 'string') return value.trim();
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
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function toSlugId(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function sortWithAllFirst(values = []) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  const nonAllValues = uniqueValues.filter((v) => v !== 'All').sort((a, b) => a.localeCompare(b));
  return ['All', ...nonAllValues];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeProductIds(rawIds = []) {
  return [...new Set(rawIds.filter((id) => UUID_REGEX.test(String(id))).map((id) => String(id)))];
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

  const where = {};

  // Archived products excluded from customer catalog
  where.isArchived = false;

  if (ids.length > 0) {
    where.id = { [Op.in]: ids };
  }

  if (category) {
    where.category = { [Op.iLike]: category };
  }

  if (brand) {
    where.brand = { [Op.iLike]: brand };
  }

  if (subcategory) {
    where.subcategory = { [Op.iLike]: subcategory };
  }

  if (skinType) {
    // skinType is a ARRAY(STRING), check if value is contained in the array
    where.skinType = { [Op.contains]: [skinType] };
  }

  if (inStock === 'true' || inStock === 'false') {
    where.inStock = inStock === 'true';
  }

  if (minPrice !== '' || maxPrice !== '') {
    const priceWhere = {};
    if (minPrice !== '' && !Number.isNaN(Number(minPrice))) priceWhere[Op.gte] = Number(minPrice);
    if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) priceWhere[Op.lte] = Number(maxPrice);
    if (priceWhere[Op.gte] !== undefined || priceWhere[Op.lte] !== undefined) where.price = priceWhere;
  }


  if (q) {
    const searchPattern = `%${q}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchPattern } },
      { brand: { [Op.iLike]: searchPattern } },
      { category: { [Op.iLike]: searchPattern } },
    ];
  }

  return where;
}

function buildProductSortOption(sort) {
  if (sort === 'price-low') return [['price', 'ASC'], ['id', 'ASC']];
  if (sort === 'price-high') return [['price', 'DESC'], ['id', 'ASC']];
  if (sort === 'rating') return [['rating', 'DESC'], ['numReviews', 'DESC'], ['id', 'ASC']];
  if (sort === 'best-selling') return [['isBestSeller', 'DESC'], ['numReviews', 'DESC'], ['id', 'ASC']];
  return [['createdAt', 'DESC'], ['id', 'ASC']];
}

function buildProductPagination(query = {}) {
  const parsedPage = Number.parseInt(readFirstString(query.page), 10);
  const parsedLimit = Number.parseInt(readFirstString(query.limit), 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PRODUCT_PAGE;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_PRODUCT_LIMIT)
      : DEFAULT_PRODUCT_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

function buildCatalogCategories(categoryRows = []) {
  const normalizedRows = categoryRows
    .filter((row) => typeof row?.category === 'string' && row.category.trim())
    .map((row) => ({
      label: row.category.trim(),
      subcategories: [],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Deduplicate
  const seen = new Set();
  const deduplicated = normalizedRows.filter((row) => {
    if (seen.has(row.label)) return false;
    seen.add(row.label);
    return true;
  });

  return [
    { id: 'all', label: 'All', subcategories: [] },
    ...deduplicated.map((row) => ({ id: toSlugId(row.label), label: row.label, subcategories: [] })),
  ];
}

function buildCatalogPayload({ categoryRows = [], brands = [], skinTypes = [], maxPrice = 0 }) {
  const roundedMaxPrice =
    maxPrice > 0 ? Math.max(DEFAULT_PRICE_RANGE_MAX, Math.ceil(maxPrice / 10) * 10) : DEFAULT_PRICE_RANGE_MAX;

  return {
    categories: buildCatalogCategories(categoryRows),
    brands: sortWithAllFirst(brands),
    skinTypes: sortWithAllFirst(skinTypes),
    priceRange: { min: 0, max: roundedMaxPrice },
  };
}

function normalizeReviewPayload(payload = {}) {
  const normalizedRating = Number(payload.rating);
  const normalizedComment =
    typeof payload.comment === 'string' ? payload.comment.trim().substring(0, 500) : '';
  return { normalizedRating, normalizedComment };
}

function buildReviewFromUser(user, rating, comment) {
  return {
    name: user.name,
    rating,
    comment,
    userId: user.id || user._id,
    productId: null, // set when creating
  };
}

function updateReviewAggregates(product, reviews) {
  product.numReviews = reviews.length;
  const rawRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  product.rating = Math.round(rawRating * 10) / 10;
}

async function findProductByIdOrSlug(idOrSlug) {
  let product = null;

  if (UUID_REGEX.test(idOrSlug)) {
    product = await Product.findByPk(idOrSlug, { raw: true });
  }

  if (!product) {
    product = await Product.findOne({ where: { slug: idOrSlug.toLowerCase() }, raw: true });
  }

  if (product) product._id = product.id;
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
