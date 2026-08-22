const { Product, ProductVariant } = require('../models/Product');
const { bumpProductCacheVersion } = require('./productController.cache');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/products/:id/variants
async function getVariants(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const variants = await ProductVariant.findAll({
      where: { productId: req.params.id },
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const mappedVariants = variants.map((v) => ({ ...v, _id: v.id }));

    return res.status(200).json({
      status: 'success',
      count: mappedVariants.length,
      data: mappedVariants,
    });
  } catch (error) {
    console.error('getVariants error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch variants' });
  }
}

// POST /api/products/:id/variants
async function addVariant(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    const { sku, attributes = {}, stockQuantity = 0, price = null } = req.body;

    if (!sku || sku.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'SKU is required' });
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ status: 'error', message: 'Stock quantity must be non-negative integer' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const existingSku = await ProductVariant.findOne({
      where: { productId: req.params.id, sku: sku.trim() },
    });
    if (existingSku) {
      return res.status(400).json({ status: 'error', message: `SKU "${sku}" already exists for this product` });
    }

    const variant = await ProductVariant.create({
      productId: product.id,
      sku: sku.trim(),
      size: attributes.size || null,
      color: attributes.color || null,
      type: attributes.type || null,
      stockQuantity,
      price: price !== null ? Number(price) : null,
      inStock: stockQuantity > 0,
    });

    // Update product inStock if variant has stock
    if (stockQuantity > 0 && !product.inStock) {
      await product.update({ inStock: true });
    }

    await bumpProductCacheVersion();

    const variantJson = variant.toJSON();
    variantJson._id = variantJson.id;

    return res.status(201).json({
      status: 'success',
      message: 'Variant added',
      data: variantJson,
    });
  } catch (error) {
    console.error('addVariant error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid variant data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to add variant' });
  }
}

// PUT /api/products/:id/variants/:variantId
async function updateVariant(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!UUID_REGEX.test(String(req.params.variantId || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const { sku, attributes, stockQuantity, price } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const variant = await ProductVariant.findOne({
      where: { id: req.params.variantId, productId: req.params.id },
    });

    if (!variant) {
      return res.status(404).json({ status: 'error', message: 'Variant not found' });
    }

    if (sku !== undefined && sku !== variant.sku) {
      const skuExists = await ProductVariant.findOne({
        where: { productId: req.params.id, sku: sku.trim() },
      });
      if (skuExists && skuExists.id !== variant.id) {
        return res.status(400).json({ status: 'error', message: `SKU "${sku}" already exists for this product` });
      }
      variant.sku = sku.trim();
    }

    if (attributes !== undefined) {
      if (attributes.size !== undefined) variant.size = attributes.size;
      if (attributes.color !== undefined) variant.color = attributes.color;
      if (attributes.type !== undefined) variant.type = attributes.type;
    }

    if (stockQuantity !== undefined) {
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        return res.status(400).json({ status: 'error', message: 'Stock quantity must be non-negative integer' });
      }
      variant.stockQuantity = stockQuantity;
      variant.inStock = stockQuantity > 0;
    }

    if (price !== undefined) {
      variant.price = price !== null ? Number(price) : null;
    }

    await variant.save();

    // Recompute product inStock
    const allVariants = await ProductVariant.findAll({
      where: { productId: req.params.id },
      attributes: ['stockQuantity'],
      raw: true,
    });
    const hasStock = allVariants.some((v) => v.stockQuantity > 0) || (product.stockQuantity > 0);
    await product.update({ inStock: hasStock });

    await bumpProductCacheVersion();

    const variantJson = variant.toJSON();
    variantJson._id = variantJson.id;

    return res.status(200).json({
      status: 'success',
      message: 'Variant updated',
      data: variantJson,
    });
  } catch (error) {
    console.error('updateVariant error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid variant data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to update variant' });
  }
}

// DELETE /api/products/:id/variants/:variantId
async function removeVariant(req, res) {
  try {
    if (!UUID_REGEX.test(String(req.params.id || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    if (!UUID_REGEX.test(String(req.params.variantId || ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid variant ID' });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const deletedCount = await ProductVariant.destroy({
      where: { id: req.params.variantId, productId: req.params.id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Variant not found' });
    }

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
