const { Product, ProductVariant } = require('../models/Product');
const { buildProductFilter, buildProductSortOption } = require('../services/productService');
const { bumpProductCacheVersion } = require('./productController.cache');
const {
  csvEscape,
  pipeJoinList,
  parseDelimitedList,
  parseCsvBoolean,
  parseCsvNumber,
  parseCsvRows,
  parseCsvVariants,
} = require('./productController.csvParsers');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BULK_PRODUCT_CSV_HEADERS = [
  '_id',
  'name',
  'brand',
  'category',
  'subcategory',
  'description',
  'image',
  'images',
  'price',
  'originalPrice',
  'stockQuantity',
  'lowStockThreshold',
  'skinType',
  'ingredients',
  'howToUse',
  'tags',
  'isNewProduct',
  'isBestSeller',
  'status',
  'variants',
];

function serializeVariantsForCsv(variants = []) {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  const normalizedVariants = variants.map((variant) => ({
    sku: variant?.sku || '',
    attributes: {
      size: variant?.size || undefined,
      color: variant?.color || undefined,
      type: variant?.type || undefined,
      ...(variant?.attributes || {}),
    },
    stockQuantity: Number(variant?.stockQuantity || 0),
    price: variant?.price === null || variant?.price === undefined ? null : Number(variant.price),
    inStock: Boolean(variant?.inStock),
  }));
  return JSON.stringify(normalizedVariants);
}

function buildProductCsv(products) {
  const lines = [BULK_PRODUCT_CSV_HEADERS.join(',')];
  products.forEach((product) => {
    const row = [
      product.id || product._id,
      product.name,
      product.brand,
      product.category,
      product.subcategory || '',
      product.description || '',
      product.image,
      pipeJoinList(product.images),
      product.price,
      product.originalPrice === null || product.originalPrice === undefined ? '' : product.originalPrice,
      product.stockQuantity,
      product.lowStockThreshold,
      pipeJoinList(product.skinType),
      product.ingredients || '',
      product.howToUse || '',
      pipeJoinList(product.tags),
      product.isNewProduct ? 'true' : 'false',
      product.isBestSeller ? 'true' : 'false',
      product.status || 'published',
      serializeVariantsForCsv(product.variants),
    ];
    lines.push(row.map(csvEscape).join(','));
  });
  return `${lines.join('\n')}\n`;
}

function normalizeBulkProductPayload(rawProduct = {}) {
  return {
    name: String(rawProduct.name || '').trim(),
    brand: String(rawProduct.brand || '').trim(),
    category: String(rawProduct.category || '').trim(),
    subcategory: String(rawProduct.subcategory || '').trim(),
    description: String(rawProduct.description || '').trim(),
    image: String(rawProduct.image || '').trim(),
    images: parseDelimitedList(rawProduct.images),
    price: parseCsvNumber(rawProduct.price, NaN),
    originalPrice:
      rawProduct.originalPrice === '' || rawProduct.originalPrice === null || rawProduct.originalPrice === undefined
        ? null
        : parseCsvNumber(rawProduct.originalPrice, NaN),
    stockQuantity: parseCsvNumber(rawProduct.stockQuantity, 0),
    lowStockThreshold: parseCsvNumber(rawProduct.lowStockThreshold, 5),
    skinType: parseDelimitedList(rawProduct.skinType, ['All']),
    ingredients: String(rawProduct.ingredients || '').trim(),
    howToUse: String(rawProduct.howToUse || '').trim(),
    tags: parseDelimitedList(rawProduct.tags),
    isNewProduct: parseCsvBoolean(rawProduct.isNewProduct),
    isBestSeller: parseCsvBoolean(rawProduct.isBestSeller),
    status: ['draft', 'published', 'archived'].includes(String(rawProduct.status || '').trim())
      ? String(rawProduct.status).trim()
      : 'draft',
    variants: parseCsvVariants(rawProduct.variants),
  };
}

// GET /api/products/bulk/export
async function exportProducts(req, res) {
  try {
    const filter = buildProductFilter({
      ...req.query,
      page: undefined,
      limit: undefined,
      skip: undefined,
    });

    const sortOption = buildProductSortOption(req.query.sort);
    const products = await Product.findAll({
      where: filter,
      order: sortOption,
      include: [{ model: ProductVariant, as: 'variants' }],
    });
    const csv = buildProductCsv(products);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="beautify-africa-products.csv"');

    return res.status(200).send(csv);
  } catch (error) {
    console.error('exportProducts error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to export products' });
  }
}

// POST /api/products/bulk/import
async function importProducts(req, res) {
  try {
    const csvText = String(req.body?.csv || '').trim();

    if (!csvText) {
      return res.status(400).json({
        status: 'error',
        message: 'csv is required',
      });
    }

    const rows = parseCsvRows(csvText);

    if (rows.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'CSV must contain a header row and at least one data row',
      });
    }

    const headers = rows[0].map((header) => String(header).trim());
    const importedRows = rows.slice(1);
    const created = [];
    const updated = [];
    const failed = [];

    for (const row of importedRows) {
      const rawProduct = headers.reduce((accumulator, header, index) => {
        accumulator[header] = row[index] ?? '';
        return accumulator;
      }, {});

      try {
        const normalizedProduct = normalizeBulkProductPayload(rawProduct);

        if (!normalizedProduct.name || !normalizedProduct.brand || !normalizedProduct.category || !normalizedProduct.image || !Number.isFinite(normalizedProduct.price)) {
          throw new Error('name, brand, category, image, and price are required');
        }

        const rawId = rawProduct._id || rawProduct.id;
        const hasValidId = rawId && UUID_REGEX.test(String(rawId));

        const variantsToSave = normalizedProduct.variants || [];
        delete normalizedProduct.variants;

        if (hasValidId) {
          const existingProduct = await Product.findByPk(rawId);
          if (existingProduct) {
            Object.assign(existingProduct, normalizedProduct);
            const savedProduct = await existingProduct.save();

            if (variantsToSave.length > 0) {
              for (const v of variantsToSave) {
                if (!v.sku) continue;
                const existingV = await ProductVariant.findOne({
                  where: { productId: savedProduct.id, sku: v.sku },
                });
                if (existingV) {
                  await existingV.update({
                    size: v.attributes?.size || null,
                    color: v.attributes?.color || null,
                    type: v.attributes?.type || null,
                    stockQuantity: v.stockQuantity || 0,
                    price: v.price,
                    inStock: (v.stockQuantity || 0) > 0,
                  });
                } else {
                  await ProductVariant.create({
                    productId: savedProduct.id,
                    sku: v.sku,
                    size: v.attributes?.size || null,
                    color: v.attributes?.color || null,
                    type: v.attributes?.type || null,
                    stockQuantity: v.stockQuantity || 0,
                    price: v.price,
                    inStock: (v.stockQuantity || 0) > 0,
                  });
                }
              }
            }

            updated.push({ _id: savedProduct.id, name: savedProduct.name });
            continue;
          }
        }

        const savedProduct = await Product.create(normalizedProduct);

        if (variantsToSave.length > 0) {
          for (const v of variantsToSave) {
            if (!v.sku) continue;
            await ProductVariant.create({
              productId: savedProduct.id,
              sku: v.sku,
              size: v.attributes?.size || null,
              color: v.attributes?.color || null,
              type: v.attributes?.type || null,
              stockQuantity: v.stockQuantity || 0,
              price: v.price,
              inStock: (v.stockQuantity || 0) > 0,
            });
          }
        }

        created.push({ _id: savedProduct.id, name: savedProduct.name });
      } catch (itemError) {
        failed.push({
          name: rawProduct?.name || 'Unnamed product',
          message: itemError.message,
        });
      }
    }

    if (created.length > 0 || updated.length > 0) {
      await bumpProductCacheVersion();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bulk import processed',
      data: {
        createdCount: created.length,
        updatedCount: updated.length,
        failedCount: failed.length,
        created,
        updated,
        failed,
      },
    });
  } catch (error) {
    console.error('importProducts error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to import products' });
  }
}

module.exports = {
  parseCsvRows,
  normalizeBulkProductPayload,
  buildProductCsv,
  exportProducts,
  importProducts,
};
