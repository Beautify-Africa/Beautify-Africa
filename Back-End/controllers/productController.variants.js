const mongoose = require('mongoose');
const Product = require('../models/Product');
const { bumpProductCacheVersion } = require('./productController.cache');

// GET /api/products/:id/variants
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

    const skuExists = product.variants.some((v) => v.sku === sku);
    if (skuExists) {
      return res.status(400).json({ status: 'error', message: `SKU "${sku}" already exists for this product` });
    }

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

    if (sku !== undefined && sku !== variant.sku) {
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

module.exports = {
  getVariants,
  addVariant,
  updateVariant,
  removeVariant,
};
