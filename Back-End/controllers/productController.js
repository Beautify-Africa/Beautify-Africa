// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const {
  buildProductFilter,
  buildProductSortOption,
  normalizeReviewPayload,
  buildReviewFromUser,
  updateReviewAggregates,
  findProductByIdOrSlug,
} = require('../services/productService');

// GET /api/products
// Supports query parameters: category, brand, skinType, inStock, minPrice, maxPrice, q, sort
async function getProducts(req, res) {
  try {
    const filter = buildProductFilter(req.query);
    const sortOption = buildProductSortOption(req.query.sort);

    const products = await Product.find(filter).sort(sortOption);

    return res.status(200).json({
      status: 'success',
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching products.',
    });
  }
}

// GET /api/products/:idOrSlug
// Find a single product by its MongoDB _id or by its slug
async function getProductByIdOrSlug(req, res) {
  try {
    const key = req.params.idOrSlug;
    const product = await findProductByIdOrSlug(key);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: product,
    });
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
  getProductByIdOrSlug,
  createProductReview,
};