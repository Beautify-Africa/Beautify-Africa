const { Product, ProductVariant } = require('../models/Product');
const { bumpProductCacheVersion } = require('./productController.cache');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/products/:id/status
// Change product status (draft/published/archived) - admin only
async function setProductStatus(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be one of: draft, published, archived',
      });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    product.status = status;
    product.isArchived = status === 'archived';
    await product.save();

    await bumpProductCacheVersion();

    return res.status(200).json({
      status: 'success',
      message: 'Product status updated',
      data: {
        _id: product.id,
        id: product.id,
        status: product.status,
        isArchived: product.isArchived,
      },
    });
  } catch (error) {
    console.error('setProductStatus error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid status';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to update product status' });
  }
}

// POST /api/products/:id/duplicate
// Clone a product with all its data (admin only)
async function duplicateProduct(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const sourceProduct = await Product.findByPk(req.params.id, {
      include: [{ model: ProductVariant, as: 'variants' }],
    });

    if (!sourceProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const newName = req.body.name || `${sourceProduct.name} (Copy)`;

    const newProduct = await Product.create({
      name: newName,
      brand: sourceProduct.brand,
      category: sourceProduct.category,
      subcategory: sourceProduct.subcategory,
      price: sourceProduct.price,
      originalPrice: sourceProduct.originalPrice,
      image: sourceProduct.image,
      images: [...(sourceProduct.images || [])],
      description: sourceProduct.description,
      skinType: [...(sourceProduct.skinType || [])],
      ingredients: sourceProduct.ingredients,
      howToUse: sourceProduct.howToUse,
      tags: [...(sourceProduct.tags || [])],
      stockQuantity: sourceProduct.stockQuantity,
      lowStockThreshold: sourceProduct.lowStockThreshold,
      status: 'draft',
      isNewProduct: true,
      isBestSeller: false,
    });

    // Clone variants if present
    if (sourceProduct.variants && sourceProduct.variants.length > 0) {
      await ProductVariant.bulkCreate(
        sourceProduct.variants.map((v) => ({
          productId: newProduct.id,
          sku: `${v.sku}-copy-${Date.now()}`,
          size: v.size,
          color: v.color,
          type: v.type,
          stockQuantity: v.stockQuantity,
          price: v.price,
          inStock: v.stockQuantity > 0,
        }))
      );
    }

    await bumpProductCacheVersion();

    return res.status(201).json({
      status: 'success',
      message: 'Product duplicated',
      data: {
        _id: newProduct.id,
        id: newProduct.id,
        name: newProduct.name,
        status: newProduct.status,
        slug: newProduct.slug,
      },
    });
  } catch (error) {
    console.error('duplicateProduct error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid product data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to duplicate product' });
  }
}

module.exports = {
  setProductStatus,
  duplicateProduct,
};
