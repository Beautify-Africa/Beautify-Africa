// models/Cart.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== CartItem =====
class CartItem extends Model {
  get _id() { return this.id; }
  // Virtual 'product' getter returns productId for backward compat
  get product() { return this.productId; }
}
CartItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cartId: { type: DataTypes.UUID, allowNull: false, references: { model: 'carts', key: 'id' } },
    productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('price');
        return val === null || val === undefined ? 0 : parseFloat(val);
      },
    },
    image: { type: DataTypes.TEXT, allowNull: false },
    variant: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    timestamps: false,
    indexes: [
      { fields: ['cartId'] },
      { fields: ['productId'] },
    ],
  }
);

// ===== Cart =====
class Cart extends Model {
  get _id() { return this.id; }
  get user() { return this.userId; }
}

Cart.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
  },
  {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
    ],
  }
);

// Associations
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'cartItems', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

module.exports = { Cart, CartItem };
