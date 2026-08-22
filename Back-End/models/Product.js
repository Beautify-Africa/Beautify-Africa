// models/Product.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== ProductVariant =====
class ProductVariant extends Model {
  get _id() { return this.id; }
}
ProductVariant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
    sku: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    color: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    type: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    price: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    inStock: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'ProductVariant', tableName: 'product_variants', timestamps: true }
);

// ===== ProductReview =====
class ProductReview extends Model {
  get _id() { return this.id; }
}
ProductReview.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
    userId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, modelName: 'ProductReview', tableName: 'product_reviews', timestamps: true }
);

// ===== Product =====
class Product extends Model {
  get _id() { return this.id; }
}

Product.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Product name is required' } } },
    slug: { type: DataTypes.STRING, unique: true },
    brand: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Brand is required' } } },
    category: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Category is required' } } },
    subcategory: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'published',
    },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    price: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    originalPrice: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    image: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: { msg: 'Product image is required' } } },
    images: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    stockQuantity: { type: DataTypes.INTEGER, defaultValue: 25, validate: { min: 0 } },
    lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5, validate: { min: 0 } },
    inStock: { type: DataTypes.BOOLEAN, defaultValue: true },
    rating: { type: DataTypes.FLOAT, defaultValue: 0 },
    numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    skinType: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ['All'] },
    ingredients: { type: DataTypes.TEXT, defaultValue: '' },
    howToUse: { type: DataTypes.TEXT, defaultValue: '' },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    isNewProduct: { type: DataTypes.BOOLEAN, defaultValue: false },
    isBestSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    hooks: {
      beforeSave: (product) => {
        // Generate slug from name
        if (product.changed('name') || !product.slug) {
          product.slug = product.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }

        // Sync status and isArchived
        if (product.status === 'archived') {
          product.isArchived = true;
        } else {
          product.isArchived = false;
        }

        // inStock is computed from stockQuantity (variants are handled at service level)
        if (!product.changed('inStock')) {
          product.inStock = Number(product.stockQuantity || 0) > 0;
        }
      },
    },
  }
);

// Associations
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(ProductReview, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
ProductReview.belongsTo(Product, { foreignKey: 'productId' });

module.exports = { Product, ProductVariant, ProductReview };
