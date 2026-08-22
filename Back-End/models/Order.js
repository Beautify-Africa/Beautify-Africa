// models/Order.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== OrderItem =====
class OrderItem extends Model {
  get _id() { return this.id; }
}
OrderItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
    productId: { type: DataTypes.UUID, allowNull: true, references: { model: 'products', key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    image: { type: DataTypes.TEXT, allowNull: false },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('price');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: false,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['productId'] },
    ],
  }
);

// ===== OrderShippingAddress =====
class OrderShippingAddress extends Model {}
OrderShippingAddress.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'orders', key: 'id' } },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'OrderShippingAddress',
    tableName: 'order_shipping_addresses',
    timestamps: false,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['email'] },
    ],
  }
);

// ===== AdminTimelineEntry =====
class AdminTimelineEntry extends Model {
  get _id() { return this.id; }
}
AdminTimelineEntry.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
    type: { type: DataTypes.ENUM('action', 'note'), allowNull: false },
    action: { type: DataTypes.STRING, defaultValue: '' },
    note: { type: DataTypes.STRING(600), defaultValue: '' },
    adminName: { type: DataTypes.STRING, defaultValue: 'Admin' },
    adminEmail: { type: DataTypes.STRING, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'AdminTimelineEntry',
    tableName: 'admin_timeline_entries',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['createdAt'] },
    ],
  }
);

// ===== Order =====
class Order extends Model {
  get _id() { return this.id; }
}

Order.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    stripePaymentIntentId: { type: DataTypes.STRING, allowNull: true },
    paymentMethod: { type: DataTypes.STRING, defaultValue: 'Credit Card' },
    // Flattened paymentResult fields
    paymentResultId: { type: DataTypes.STRING, allowNull: true },
    paymentResultStatus: { type: DataTypes.STRING, allowNull: true },
    paymentResultUpdateTime: { type: DataTypes.STRING, allowNull: true },
    paymentResultEmail: { type: DataTypes.STRING, allowNull: true },
    itemsPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('itemsPrice');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
    taxPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('taxPrice');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
    shippingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('shippingPrice');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue('totalPrice');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
    isPaid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    isDelivered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fulfillmentStatus: {
      type: DataTypes.ENUM('processing', 'packed', 'shipped', 'delivered'),
      defaultValue: 'processing',
    },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['stripePaymentIntentId'] },
      { fields: ['createdAt'] },
      { fields: ['fulfillmentStatus'] },
      { fields: ['isPaid'] },
    ],
  }
);

// Associations
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasOne(OrderShippingAddress, { foreignKey: 'orderId', as: 'shippingAddress', onDelete: 'CASCADE' });
OrderShippingAddress.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(AdminTimelineEntry, { foreignKey: 'orderId', as: 'adminTimeline', onDelete: 'CASCADE' });
AdminTimelineEntry.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry };
