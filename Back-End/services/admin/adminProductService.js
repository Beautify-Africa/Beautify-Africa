// services/admin/adminProductService.js
const { Op } = require('sequelize');
const { Product, ProductVariant } = require('../../models/Product');
const redisClient = require('../../config/redis');
const { createAdminError } = require('../adminService.helpers');

const PRODUCT_CACHE_VERSION_KEY = 'products:version';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureValidProductId(productId) {
  if (!UUID_REGEX.test(String(productId || '')))
    throw createAdminError('Invalid product ID format');
}

function normalizeNumberInput(value, fallbackValue = 0) {
  if (value === undefined || value === null || value === '') return fallbackValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function normalizeStringArray(value = []) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  return [];
}

function normalizeProductPayload(payload = {}, { isCreate = false } = {}) {
  const normalized = {
    name: String(payload.name || '').trim(),
    brand: String(payload.brand || '').trim(),
    category: String(payload.category || '').trim(),
    subcategory: String(payload.subcategory || '').trim(),
    description: String(payload.description || '').trim(),
    image: String(payload.image || '').trim(),
    ingredients: String(payload.ingredients || '').trim(),
    howToUse: String(payload.howToUse || '').trim(),
    price: normalizeNumberInput(payload.price, 0),
    originalPrice:
      payload.originalPrice === undefined ||
      payload.originalPrice === null ||
      payload.originalPrice === ''
        ? null
        : normalizeNumberInput(payload.originalPrice, null),
    stockQuantity: normalizeNumberInput(payload.stockQuantity, 0),
    lowStockThreshold: normalizeNumberInput(payload.lowStockThreshold, 5),
    skinType: normalizeStringArray(payload.skinType),
    tags: normalizeStringArray(payload.tags),
    images: normalizeStringArray(payload.images),
    isNewProduct: Boolean(payload.isNewProduct),
    isBestSeller: Boolean(payload.isBestSeller),
    isArchived: Boolean(payload.isArchived),
  };

  if (isCreate) {
    const requiredFields = ['name', 'brand', 'category', 'image'];
    const missing = requiredFields.filter((field) => !normalized[field]);
    if (missing.length > 0)
      throw createAdminError(`Missing required product field(s): ${missing.join(', ')}`);
  }
  if (normalized.stockQuantity < 0) throw createAdminError('Stock quantity cannot be negative');
  if (normalized.lowStockThreshold < 0)
    throw createAdminError('Low stock threshold cannot be negative');
  if (normalized.price < 0) throw createAdminError('Price cannot be negative');
  if (normalized.originalPrice !== null && normalized.originalPrice < 0)
    throw createAdminError('Original price cannot be negative');

  normalized.inStock = normalized.stockQuantity > 0;
  return normalized;
}

function buildAdminProductFilter(query = {}) {
  const where = {};

  const normalizedSearch = String(query.search || '').trim();
  if (normalizedSearch) {
    const searchPattern = `%${normalizedSearch}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchPattern } },
      { brand: { [Op.iLike]: searchPattern } },
      { category: { [Op.iLike]: searchPattern } },
      { subcategory: { [Op.iLike]: searchPattern } },
    ];
  }

  const archived = String(query.archived || '').toLowerCase();
  if (archived === 'true') where.isArchived = true;
  else if (archived === 'false' || archived === '') where.isArchived = false;

  const lowStock = String(query.lowStock || '').toLowerCase();
  if (lowStock === 'true') {
    const { sequelize } = require('../../config/db');
    where[Op.and] = [
      sequelize.literal('"Product"."stockQuantity" <= "Product"."lowStockThreshold"'),
    ];
  }

  return where;
}

async function bumpProductCacheVersion() {
  try {
    await redisClient.incr(PRODUCT_CACHE_VERSION_KEY);
  } catch (error) {
    console.warn('Redis cache version bump failed for products:', error.message);
  }
}

async function fetchAdminProducts(query = {}) {
  const filter = buildAdminProductFilter(query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    Product.findAll({
      where: filter,
      include: [{ model: ProductVariant, as: 'variants', required: false }],
      order: [['updatedAt', 'DESC']],
      offset: skip,
      limit,
    }),
    Product.count({ where: filter }),
  ]);

  return {
    products: products.map((p) => {
      const json = p.toJSON ? p.toJSON() : p;
      return { ...json, _id: json.id };
    }),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    },
  };
}

async function createAdminProduct(payload = {}) {
  const normalizedPayload = normalizeProductPayload(payload, { isCreate: true });
  const product = await Product.create(normalizedPayload);
  await bumpProductCacheVersion();
  return product;
}

async function updateAdminProduct(productId, payload = {}) {
  ensureValidProductId(productId);
  const normalizedPayload = normalizeProductPayload(payload, { isCreate: false });
  const product = await Product.findByPk(productId);
  if (!product) throw createAdminError('Product not found', 404);
  Object.assign(product, normalizedPayload);
  await product.save();
  await bumpProductCacheVersion();
  return product;
}

async function setAdminProductArchived(productId, isArchived) {
  ensureValidProductId(productId);
  const product = await Product.findByPk(productId);
  if (!product) throw createAdminError('Product not found', 404);
  product.isArchived = Boolean(isArchived);
  product.status = product.isArchived ? 'archived' : 'published';
  await product.save();
  await bumpProductCacheVersion();
  return product;
}

module.exports = {
  PRODUCT_CACHE_VERSION_KEY,
  ensureValidProductId,
  normalizeNumberInput,
  normalizeStringArray,
  normalizeProductPayload,
  buildAdminProductFilter,
  bumpProductCacheVersion,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  setAdminProductArchived,
};
