const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Variant sub-schema for product variations (size, color, type, etc.)
// Each variant tracks its own SKU and stock independently
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required for variant'],
      trim: true,
    },
    attributes: {
      size: { type: String, default: null },
      color: { type: String, default: null },
      type: { type: String, default: null },
      // Additional attributes can be added here
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    price: {
      type: Number,
      default: null, // If null, inherits from parent product price
    },
    inStock: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    // ===== Status & Lifecycle =====
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    // For backward compatibility: keep isArchived but status takes precedence
    isArchived: {
      type: Boolean,
      default: false,
      deprecated: true, // Use status field instead
    },
    // ===== Pricing =====
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    // ===== Images & Gallery =====
    image: {
      type: String,
      required: [true, 'Product image is required'],
      // Primary/base image displayed in listings
    },
    images: {
      type: [String],
      default: [],
      // Gallery of additional product images
    },
    // ===== Stock & Inventory =====
    stockQuantity: {
      type: Number,
      min: [0, 'Stock quantity cannot be negative'],
      default: 25,
      // Total stock when no variants exist; otherwise sum of variant stock
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low stock threshold cannot be negative'],
      default: 5,
    },
    inStock: {
      type: Boolean,
      default: true,
      // Computed from stockQuantity or variant stock
    },
    // ===== Product Variants (Size, Color, Type, etc.) =====
    variants: {
      type: [variantSchema],
      default: [],
      // If empty, product uses single stockQuantity model
      // If populated, each variant has independent stock tracking
    },
    // ===== Stock History Audit Trail =====
    stockHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLedger',
      },
    ],
    // ===== Ratings & Reviews =====
    rating: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    numReviews: {
      type: Number,
      default: 0,
    },
    // ===== Product Details =====
    description: {
      type: String,
      default: '',
    },
    skinType: {
      type: [String],
      default: ['All'],
    },
    ingredients: {
      type: String,
      default: '',
    },
    howToUse: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    // ===== Flags =====
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optimize common product listing sorts.
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isBestSeller: -1, numReviews: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ brand: 1, createdAt: -1 });
productSchema.index({ skinType: 1, createdAt: -1 });
productSchema.index({ inStock: 1, createdAt: -1 });
// Phase 3: Indexes for status filtering and variants
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1 });
// Unique index on variant SKU within each product
productSchema.index({ 'variants.sku': 1 }, { sparse: true, unique: false });
productSchema.index(
  { name: 'text', brand: 'text', category: 'text', description: 'text' },
  {
    weights: {
      name: 5,
      brand: 3,
      category: 2,
      description: 1,
    },
  }
);

// Auto-generate a URL-friendly slug from the product name before saving
// Example: "The Velvet Botanique" becomes "the-velvet-botanique"
// Also compute inStock status from stock levels and status field
productSchema.pre('save', function computeProductStatus() {
  // Generate slug if name changed
  if (this.isModified('name')) {
    this.slug = this.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Sync status and isArchived fields (status takes precedence)
  if (this.status === 'archived') {
    this.isArchived = true;
  } else if (this.status === 'draft' || this.status === 'published') {
    // For backward compatibility: isArchived false for non-archived statuses
    this.isArchived = false;
  }

  // Compute inStock based on stock levels and variants
  if (this.variants && this.variants.length > 0) {
    // If variants exist, product is in stock if ANY variant has stock
    const hasVariantStock = this.variants.some((v) => v.stockQuantity > 0);
    // Also update each variant's inStock status
    this.variants.forEach((variant) => {
      variant.inStock = variant.stockQuantity > 0;
    });
    this.inStock = hasVariantStock;
  } else {
    // Otherwise, check main stockQuantity
    this.inStock = Number(this.stockQuantity || 0) > 0;
  }
});

module.exports = mongoose.model('Product', productSchema);
