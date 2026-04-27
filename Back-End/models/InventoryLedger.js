const mongoose = require('mongoose');

const inventoryLedgerSchema = new mongoose.Schema(
  {
    // ===== References =====
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      // Reference to specific variant within product.variants array
      // If null, applies to main product stockQuantity
    },
    // ===== Movement Details =====
    type: {
      type: String,
      enum: ['purchase', 'adjustment', 'restock', 'return', 'correction'],
      required: [true, 'Movement type is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity change is required'],
      // Positive for inbound (restock, return, correction)
      // Negative for outbound (purchase, adjustment out)
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      // e.g., "Customer order #12345", "Manual restock", "Inventory correction"
    },
    notes: {
      type: String,
      default: '',
      // Optional additional details
    },
    // ===== Audit Trail =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Admin or system user who recorded this movement
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      // If this movement relates to an order, link it
    },
    // ===== State Snapshot =====
    stockBefore: {
      type: Number,
      required: [true, 'Stock before movement is required'],
    },
    stockAfter: {
      type: Number,
      required: [true, 'Stock after movement is required'],
    },
  },
  {
    timestamps: true,
    // Immutable by default: prevent updates after creation
    collection: 'inventoryledgers',
  }
);

// ===== Indexes =====
// Fast lookups by product and date
inventoryLedgerSchema.index({ product: 1, createdAt: -1 });
// Quick filtering by type and date
inventoryLedgerSchema.index({ type: 1, createdAt: -1 });
// Find movements for a specific variant
inventoryLedgerSchema.index({ product: 1, variant: 1, createdAt: -1 });
// Find by related order (for order-triggered movements)
inventoryLedgerSchema.index({ relatedOrder: 1 }, { sparse: true });
// Date range queries
inventoryLedgerSchema.index({ createdAt: -1 });

// ===== Pre-Save Hook: Validate stock transition logic =====
inventoryLedgerSchema.pre('save', async function validateStockTransition() {
  // Ensure stockAfter = stockBefore + quantity
  const calculatedStockAfter = this.stockBefore + this.quantity;
  if (calculatedStockAfter !== this.stockAfter) {
    throw new Error(
      `Stock calculation mismatch: ${this.stockBefore} + ${this.quantity} = ${calculatedStockAfter}, but stockAfter is ${this.stockAfter}`
    );
  }

  // Ensure final stock is not negative
  if (this.stockAfter < 0) {
    throw new Error(
      `Invalid inventory transition: would result in negative stock (${this.stockAfter})`
    );
  }
});

// ===== Static Method: Record Movement =====
// Simplified factory method to create and save a ledger entry
inventoryLedgerSchema.statics.recordMovement = async function recordMovement({
  product,
  variant = null,
  type,
  quantity,
  reason,
  notes = '',
  createdBy = null,
  relatedOrder = null,
  stockBefore,
  stockAfter,
}) {
  const movement = new this({
    product,
    variant,
    type,
    quantity,
    reason,
    notes,
    createdBy,
    relatedOrder,
    stockBefore,
    stockAfter,
  });

  await movement.save();
  return movement;
};

// ===== Static Method: Get Stock History =====
// Retrieve movement history for a product or variant
inventoryLedgerSchema.statics.getStockHistory = async function getStockHistory(
  productId,
  options = {}
) {
  const { variantId = null, limit = 50, skip = 0, types = null } = options;

  const query = { product: productId };
  if (variantId) {
    query.variant = variantId;
  }
  if (types && Array.isArray(types) && types.length > 0) {
    query.type = { $in: types };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('product', 'name sku')
    .populate('createdBy', 'name email');
};

module.exports = mongoose.model('InventoryLedger', inventoryLedgerSchema);
