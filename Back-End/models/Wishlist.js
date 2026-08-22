// models/Wishlist.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== WishlistProduct junction table =====
class WishlistProduct extends Model {}
WishlistProduct.init(
  {
    wishlistId: { type: DataTypes.UUID, allowNull: false, references: { model: 'wishlists', key: 'id' } },
    productId: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
  },
  {
    sequelize,
    modelName: 'WishlistProduct',
    tableName: 'wishlist_products',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['wishlistId', 'productId'] },
      { fields: ['productId'] },
    ],
  }
);

// ===== Wishlist =====
class Wishlist extends Model {
  get _id() { return this.id; }
  get user() { return this.userId; }
}

Wishlist.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
  },
  {
    sequelize,
    modelName: 'Wishlist',
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
    ],
  }
);

module.exports = { Wishlist, WishlistProduct };
