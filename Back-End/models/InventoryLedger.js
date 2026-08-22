// models/InventoryLedger.js
const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../config/db');

class InventoryLedger extends Model {
  get _id() { return this.id; }

  // Static method: Record Movement (factory)
  static async recordMovement({
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
    // Validate stock transition
    const calculatedStockAfter = stockBefore + quantity;
    if (calculatedStockAfter !== stockAfter) {
      throw new Error(
        `Stock calculation mismatch: ${stockBefore} + ${quantity} = ${calculatedStockAfter}, but stockAfter is ${stockAfter}`
      );
    }
    if (stockAfter < 0) {
      throw new Error(
        `Invalid inventory transition: would result in negative stock (${stockAfter})`
      );
    }

    return InventoryLedger.create({
      productId: product,
      variantId: variant || null,
      type,
      quantity,
      reason,
      notes,
      createdById: createdBy || null,
      relatedOrderId: relatedOrder || null,
      stockBefore,
      stockAfter,
    });
  }

  // Static method: Get Stock History
  static async getStockHistory(productId, options = {}) {
    const { variantId = null, limit = 50, skip = 0, types = null } = options;

    const where = { productId };
    if (variantId) where.variantId = variantId;
    if (types && Array.isArray(types) && types.length > 0) {
      where.type = { [Op.in]: types };
    }

    return InventoryLedger.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: skip,
      include: [
        {
          model: sequelize.models.User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });
  }
}

InventoryLedger.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
    variantId: { type: DataTypes.UUID, allowNull: true, defaultValue: null },
    type: {
      type: DataTypes.ENUM('purchase', 'adjustment', 'restock', 'return', 'correction'),
      allowNull: false,
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    notes: { type: DataTypes.TEXT, defaultValue: '' },
    createdById: { type: DataTypes.UUID, allowNull: true, defaultValue: null, references: { model: 'users', key: 'id' } },
    relatedOrderId: { type: DataTypes.UUID, allowNull: true, defaultValue: null, references: { model: 'orders', key: 'id' } },
    stockBefore: { type: DataTypes.INTEGER, allowNull: false },
    stockAfter: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: 'InventoryLedger',
    tableName: 'inventory_ledgers',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['productId'] },
      { fields: ['variantId'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = InventoryLedger;
