// controllers/productController.js
const Product = require('../models/Product');

// GET /api/products
// Supports query parameters: category, brand, skinType, inStock, minPrice, maxPrice, q, sort
async function getProducts(req, res) {
  try {
    const { category, brand, skinType, inStock, minPrice, maxPrice, q, sort } = req.query;

    // Build a MongoDB filter object dynamically
    // Only add filters for query params that were actually provided
    const filter = {};

    if (category) {
      // Case-insensitive exact match: "skincare" matches "Skincare"
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (brand) {
      // Case-insensitive exact match: "lumière" matches "Lumière"
      filter.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    if (skinType) {
      // Matches products where skinType array contains this value
      filter.skinType = skinType;
    }

    if (inStock === 'true' || inStock === 'false') {
      filter.inStock = inStock === 'true';
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice); // greater than or equal
      }
      if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice); // less than or equal
      }
    }

    // Text search across name, description, and brand
    if (q) {
      const searchRegex = new RegExp(q, 'i'); // case-insensitive
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
      ];
    }

    // Build sort option — default is newest first
    let sortOption = { createdAt: -1 };

    if (sort === 'price-low')    sortOption = { price: 1 };    // ascending
    if (sort === 'price-high')   sortOption = { price: -1 };   // descending
    if (sort === 'rating')       sortOption = { rating: -1 };  // highest first
    if (sort === 'best-selling') sortOption = { isBestSeller: -1, reviews: -1 };

    // Query MongoDB with the filter and sort
    const products = await Product.find(filter).sort(sortOption);

    return res.status(200).json({
      status: 'success',
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}

// GET /api/products/:idOrSlug
// Find a single product by its MongoDB _id or by its slug
async function getProductByIdOrSlug(req, res) {
  try {
    const key = req.params.idOrSlug;
    let product = null;

    // Check if the key looks like a MongoDB ObjectId (24 hex characters)
    // If so, try finding by _id first
    if (key.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(key);
    }

    // If not found by _id (or key wasn't an ObjectId), try finding by slug
    if (!product) {
      product = await Product.findOne({ slug: key.toLowerCase() });
    }

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
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}

module.exports = {
  getProducts,
  getProductByIdOrSlug,
};