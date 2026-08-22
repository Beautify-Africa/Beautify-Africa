// controllers/productController.js
const { Sequelize, Op } = require('sequelize');
const { Product, ProductReview } = require('../models/Product');
const { sequelize } = require('../config/db');
const {
  PRODUCT_LIST_SELECT_FIELDS,
  buildProductFilter,
  buildProductSortOption,
  buildProductPagination,
  buildCatalogPayload,
  normalizeReviewPayload,
  findProductByIdOrSlug,
} = require('../services/productService');
const {
  PRODUCT_LIST_CACHE_TTL_SECONDS,
  PRODUCT_CATALOG_CACHE_TTL_SECONDS,
  buildVersionedCacheKey,
  readCache,
  writeCache,
  bumpProductCacheVersion,
} = require('./productController.cache');
const { getVariants, addVariant, updateVariant, removeVariant } = require('./productController.variants');
const { exportProducts, importProducts } = require('./productController.csv');
const { setProductStatus, duplicateProduct } = require('./productController.admin');
const { adjustVariantStock, getStockHistory } = require('./productController.stock');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getProducts(req, res) {
  try {
    const cacheKey = await buildVersionedCacheKey('products:list', req.query);
    const cachedData = await readCache(cacheKey);
    if (cachedData) return res.status(200).json(cachedData);

    const filter = buildProductFilter(req.query);
    const sortOption = buildProductSortOption(req.query.sort);
    const { page, limit, skip } = buildProductPagination(req.query);

    const [products, totalCount] = await Promise.all([
      Product.findAll({
        where: filter,
        attributes: PRODUCT_LIST_SELECT_FIELDS,
        order: sortOption,
        offset: skip,
        limit,
        raw: true,
      }),
      Product.count({ where: filter }),
    ]);

    const mappedProducts = products.map((p) => ({ ...p, _id: p.id }));
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
    const payload = {
      status: 'success',
      count: mappedProducts.length,
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
      data: mappedProducts,
    };

    await writeCache(cacheKey, payload, PRODUCT_LIST_CACHE_TTL_SECONDS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred while fetching products.' });
  }
}

async function getProductCatalog(req, res) {
  try {
    const cacheKey = await buildVersionedCacheKey('products:catalog', {});
    const cachedData = await readCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const [categoryResults, brandResults, allProducts, maxPriceResult] = await Promise.all([
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
        where: { isArchived: false, category: { [Op.ne]: null } },
        raw: true,
      }),
      Product.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('brand')), 'brand']],
        where: { isArchived: false, brand: { [Op.ne]: null } },
        raw: true,
      }),
      Product.findAll({
        attributes: ['skinType'],
        where: { isArchived: false },
        raw: true,
      }),
      Product.max('price', { where: { isArchived: false } }),
    ]);

    const categoryRows = categoryResults.map((r) => ({ category: r.category }));
    const brands = brandResults.map((r) => r.brand).filter(Boolean);
    const skinTypesSet = new Set();
    allProducts.forEach((p) => {
      if (Array.isArray(p.skinType)) {
        p.skinType.forEach((st) => skinTypesSet.add(st));
      }
    });
    const skinTypes = Array.from(skinTypesSet);
    const maxPrice = Number(maxPriceResult) || 0;

    const catalog = buildCatalogPayload({
      categoryRows,
      brands,
      skinTypes,
      maxPrice,
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

async function getProductByIdOrSlug(req, res) {
  try {
    const key = req.params.idOrSlug;
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

    await writeCache(cacheKey, payload, PRODUCT_LIST_CACHE_TTL_SECONDS);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('getProductByIdOrSlug error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching the product.',
    });
  }
}

async function createProductReview(req, res) {
  try {
    const { normalizedRating, normalizedComment } = normalizeReviewPayload(req.body);

    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be a number between 1 and 5' });
    }

    if (!normalizedComment) {
      return res.status(400).json({ status: 'error', message: 'Comment is required' });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const userId = req.user.id || req.user._id;
    const existingReview = await ProductReview.findOne({
      where: { productId: product.id, userId },
    });

    if (existingReview) {
      return res.status(400).json({ status: 'error', message: 'Product already reviewed' });
    }

    await ProductReview.create({
      productId: product.id,
      userId,
      name: req.user.name,
      rating: normalizedRating,
      comment: normalizedComment,
    });

    // Update aggregates
    const reviews = await ProductReview.findAll({
      where: { productId: product.id },
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    const numReviews = reviews.length;
    const rawRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;
    const rating = Math.round(rawRating * 10) / 10;

    await Product.update({ rating, numReviews }, { where: { id: product.id } });
    await bumpProductCacheVersion();

    return res.status(201).json({
      status: 'success',
      message: 'Review added',
      data: {
        rating,
        numReviews,
        reviews: reviews.map((r) => ({ ...r, _id: r.id })),
      },
    });
  } catch (error) {
    console.error('createProductReview error:', error);
    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred while submitting the review.' });
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
  exportProducts,
  importProducts,
  adjustVariantStock,
  getStockHistory,
};
