// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
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

module.exports = {
  getProducts,
  getProductCatalog,
  getProductByIdOrSlug,
  createProductReview,
};
