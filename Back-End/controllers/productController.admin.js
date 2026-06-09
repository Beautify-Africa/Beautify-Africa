const mongoose = require('mongoose');
const Product = require('../models/Product');
const { bumpProductCacheVersion } = require('./productController.cache');

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
      status: 'draft',
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

module.exports = {
  setProductStatus,
  duplicateProduct,
};
