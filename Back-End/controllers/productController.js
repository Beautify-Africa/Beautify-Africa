// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');
const inventoryService = require('../services/inventoryService');
const redisClient = require('../config/redis');
const {
  PRODUCT_LIST_SELECT_FIELDS,
  buildProductFilter,
  buildProductSortOption,
  buildProductPagination,
  buildCatalogPayload,
  normalizeReviewPayload,
  buildReviewFromUser,
  updateReviewAggregates,
  findProductByIdOrSlug,
} = require('../services/productService');

const PRODUCT_CACHE_VERSION_KEY = 'products:version';
const PRODUCT_LIST_CACHE_TTL_SECONDS = 60 * 10;
const PRODUCT_CATALOG_CACHE_TTL_SECONDS = 60 * 60;

function normalizeCacheValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeCacheValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = normalizeCacheValue(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

async function getProductCacheVersion() {
  try {
    const existingVersion = await redisClient.get(PRODUCT_CACHE_VERSION_KEY);
    if (existingVersion) {
      return existingVersion;
    }

    await redisClient.set(PRODUCT_CACHE_VERSION_KEY, '1');
    return '1';
  } catch (error) {
    console.warn('Redis version lookup failed for product cache:', error.message);
    return null;
  }
}

async function buildVersionedCacheKey(scope, query = {}) {
  const version = await getProductCacheVersion();
  if (!version) {
    return null;
  }

  return `${scope}:v${version}:${JSON.stringify(normalizeCacheValue(query))}`;
}

async function readCache(key) {
  if (!key) return null;

  try {
    const cachedData = await redisClient.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.warn('Redis read failed for product cache:', error.message);
    return null;
  }
}

async function writeCache(key, payload, ttlSeconds) {
  if (!key) return;

  try {
    await redisClient.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
  } catch (error) {
    console.warn('Redis write failed for product cache:', error.message);
  }
}

async function bumpProductCacheVersion() {
  try {
    await redisClient.incr(PRODUCT_CACHE_VERSION_KEY);
  } catch (error) {
    console.warn('Redis cache version bump failed for products:', error.message);
  }
}

// GET /api/products
// Supports query parameters: category, brand, skinType, inStock, minPrice, maxPrice, q, sort, page, limit, ids
async function getProducts(req, res) {
  try {
    const cacheKey = await buildVersionedCacheKey('products:list', req.query);
    const cachedData = await readCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const filter = buildProductFilter(req.query);
    const sortOption = buildProductSortOption(req.query.sort);
    const { page, limit, skip } = buildProductPagination(req.query);

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .select(PRODUCT_LIST_SELECT_FIELDS)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

    const payload = {
      status: 'success',
      count: products.length,
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
      data: products,
    };

    await writeCache(cacheKey, payload, PRODUCT_LIST_CACHE_TTL_SECONDS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching products.',
    });
  }
}

// GET /api/products/catalog
// Returns catalog filters and price range metadata for the shop UI.
async function getProductCatalog(req, res) {
  try {
    const cacheKey = await buildVersionedCacheKey('products:catalog', {});
    const cachedData = await readCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const [categoryRows, brands, skinTypes, priceStats] = await Promise.all([
      Product.aggregate([
        {
          $match: {
            category: { $type: 'string', $ne: '' },
          },
        },
        {
          $project: {
            category: 1,
            subcategory: {
              $cond: [
                { $eq: [{ $type: '$subcategory' }, 'string'] },
                '$subcategory',
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: '$category',
            subcategories: { $addToSet: '$subcategory' },
          },
        },
      ]),
      Product.distinct('brand', { brand: { $type: 'string', $ne: '' } }),
      Product.distinct('skinType', { skinType: { $exists: true, $ne: [] } }),
      Product.aggregate([
        {
          $group: {
            _id: null,
            maxPrice: { $max: '$price' },
          },
        },
      ]),
    ]);

    const catalog = buildCatalogPayload({
      categoryRows,
      brands,
      skinTypes,
      maxPrice: priceStats[0]?.maxPrice || 0,
    });

    const payload = {
      status: 'success',
      data: catalog,
    };

    await writeCache(cacheKey, payload, PRODUCT_CATALOG_CACHE_TTL_SECONDS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('getProductCatalog error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching product catalog filters.',
    });
  }
}

// GET /api/products/:idOrSlug
// Find a single product by its MongoDB _id or by its slug
async function getProductByIdOrSlug(req, res) {
  try {
    const key = req.params.idOrSlug;
    
    // Check Redis Cache
    const cacheKey = await buildVersionedCacheKey('product:detail', { idOrSlug: key });
    const cachedData = await readCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const product = await findProductByIdOrSlug(key);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const payload = {
      status: 'success',
      data: product,
    };

    // Store in Redis Cache
    await writeCache(cacheKey, payload, PRODUCT_LIST_CACHE_TTL_SECONDS);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('getProductByIdOrSlug error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID format.' });
    }

    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching the product.',
    });
  }
}

// POST /api/products/:id/reviews
// Create new review. Private route.
async function createProductReview(req, res) {
  try {
    const { normalizedRating, normalizedComment } = normalizeReviewPayload(req.body);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be a number between 1 and 5' });
    }

    if (!normalizedComment) {
      return res.status(400).json({ status: 'error', message: 'Comment is required' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ status: 'error', message: 'Product already reviewed' });
    }

    const review = buildReviewFromUser(req.user, normalizedRating, normalizedComment);

    product.reviews.unshift(review);
    updateReviewAggregates(product);

    await product.save();

    await bumpProductCacheVersion();

    return res.status(201).json({
      status: 'success',
      message: 'Review added',
      data: {
        rating: product.rating,
        numReviews: product.numReviews,
        reviews: product.reviews,
      },
    });
  } catch (error) {
    console.error('createProductReview error:', error);

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid review data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred while submitting the review.' });
  }
}

// ===== PHASE 3: VARIANT ENDPOINTS =====

// GET /api/products/:id/variants
// Get all variants for a product
async function getVariants(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id).select('variants');

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    return res.status(200).json({
      status: 'success',
      count: product.variants.length,
      data: product.variants,
    });
  } catch (error) {
    console.error('getVariants error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch variants' });
  }
}

// POST /api/products/:id/variants
// Add a new variant to a product (admin only)
async function addVariant(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { sku, attributes = {}, stockQuantity = 0, price = null } = req.body;

    if (!sku || sku.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'SKU is required' });
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ status: 'error', message: 'Stock quantity must be non-negative integer' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Check for duplicate SKU within this product
    const skuExists = product.variants.some((v) => v.sku === sku);
    if (skuExists) {
      return res.status(400).json({ status: 'error', message: `SKU "${sku}" already exists for this product` });
    }

    // Add variant
    product.variants.push({
      sku,
      attributes,
      stockQuantity,
      price,
      inStock: stockQuantity > 0,
    });

    await product.save();
    await bumpProductCacheVersion();

    return res.status(201).json({
      status: 'success',
      message: 'Variant added',
      data: product.variants[product.variants.length - 1],
    });
  } catch (error) {
    console.error('addVariant error:', error);

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid variant data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to add variant' });
  }
}

// PUT /api/products/:id/variants/:variantId
// Update a variant (admin only)
async function updateVariant(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.variantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const { sku, attributes, stockQuantity, price } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const variant = product.variants.id(req.params.variantId);

    if (!variant) {
      return res.status(404).json({ status: 'error', message: 'Variant not found' });
    }

    // Update fields if provided
    if (sku !== undefined && sku !== variant.sku) {
      // Check for duplicate SKU
      const skuExists = product.variants.some((v) => v.sku === sku && v._id.toString() !== variant._id.toString());
      if (skuExists) {
        return res.status(400).json({ status: 'error', message: `SKU "${sku}" already exists for this product` });
      }
      variant.sku = sku;
    }

    if (attributes !== undefined) {
      variant.attributes = { ...variant.attributes, ...attributes };
    }

    if (stockQuantity !== undefined) {
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        return res.status(400).json({ status: 'error', message: 'Stock quantity must be non-negative integer' });
      }
      variant.stockQuantity = stockQuantity;
    }

    if (price !== undefined) {
      variant.price = price;
    }

    await product.save();
    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Variant updated',
      data: variant,
    });
  } catch (error) {
    console.error('updateVariant error:', error);

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid variant data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to update variant' });
  }
}

// DELETE /api/products/:id/variants/:variantId
// Remove a variant from a product (admin only)
async function removeVariant(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.variantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === req.params.variantId
    );

    if (variantIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Variant not found' });
    }

    product.variants.splice(variantIndex, 1);
    await product.save();
    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Variant removed',
    });
  } catch (error) {
    console.error('removeVariant error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to remove variant' });
  }
}

// PATCH /api/products/:id/status
// Change product status (draft/published/archived) - admin only
async function setProductStatus(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be one of: draft, published, archived',
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Product status updated',
      data: {
        _id: product._id,
        status: product.status,
        isArchived: product.isArchived,
      },
    });
  } catch (error) {
    console.error('setProductStatus error:', error);

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid status';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to update product status' });
  }
}

// POST /api/products/:id/duplicate
// Clone a product with all its data (admin only)
async function duplicateProduct(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const sourceProduct = await Product.findById(req.params.id);

    if (!sourceProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Prepare new product data
    const newName = req.body.name || `${sourceProduct.name} (Copy)`;

    const newProduct = new Product({
      name: newName,
      brand: sourceProduct.brand,
      category: sourceProduct.category,
      price: sourceProduct.price,
      originalPrice: sourceProduct.originalPrice,
      image: sourceProduct.image,
      images: [...sourceProduct.images],
      description: sourceProduct.description,
      skinType: [...sourceProduct.skinType],
      ingredients: sourceProduct.ingredients,
      howToUse: sourceProduct.howToUse,
      tags: [...sourceProduct.tags],
      stockQuantity: sourceProduct.stockQuantity,
      lowStockThreshold: sourceProduct.lowStockThreshold,
      variants: sourceProduct.variants.map((v) => ({
        sku: `${v.sku}-copy-${Date.now()}`,
        attributes: { ...v.attributes },
        stockQuantity: v.stockQuantity,
        price: v.price,
      })),
      status: 'draft', // New products start as draft
      isNewProduct: true,
      isBestSeller: false,
    });

    await newProduct.save();
    await bumpProductCacheVersion();

    return res.status(201).json({
      status: 'success',
      message: 'Product duplicated',
      data: {
        _id: newProduct._id,
        name: newProduct.name,
        status: newProduct.status,
        slug: newProduct.slug,
      },
    });
  } catch (error) {
    console.error('duplicateProduct error:', error);

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid product data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to duplicate product' });
  }
}

// POST /api/products/:id/variants/:variantId/stock
// Adjust stock for a specific variant and record in ledger
async function adjustVariantStock(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.variantId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const { quantity, reason = '', notes = '' } = req.body;

    if (!Number.isInteger(quantity) || quantity === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be a non-zero integer (positive for restock, negative for adjustment)',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Reason is required' });
    }

    const result = await inventoryService.adjustStock(
      req.params.id,
      req.params.variantId,
      quantity,
      reason,
      notes,
      req.user?._id || null
    );

    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Stock adjusted',
      data: result,
    });
  } catch (error) {
    console.error('adjustVariantStock error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ status: 'error', message: error.message });
  }
}

// GET /api/products/:id/stock-history
// Retrieve inventory ledger history for a product or specific variant
async function getStockHistory(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { variantId = null, limit = 50, skip = 0, type = null } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const history = await inventoryService.getStockHistory(
      req.params.id,
      variantId && mongoose.Types.ObjectId.isValid(variantId) ? variantId : null,
      parsedLimit,
      parsedSkip,
      type
    );

    return res.status(200).json({
      status: 'success',
      count: history.movements.length,
      totalCount: history.totalCount,
      page: history.page,
      limit: history.limit,
      totalPages: history.totalPages,
      hasNextPage: history.hasNextPage,
      hasPreviousPage: history.hasPreviousPage,
      data: history.movements,
    });
  } catch (error) {
    console.error('getStockHistory error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  getProducts,
  getProductCatalog,
  getProductByIdOrSlug,
  createProductReview,
  getVariants,
  addVariant,
  updateVariant,
  removeVariant,
  setProductStatus,
  duplicateProduct,
  adjustVariantStock,
  getStockHistory,
};
