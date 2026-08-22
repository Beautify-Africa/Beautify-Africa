// models/index.js
const { sequelize } = require('../config/db');
const User = require('./User');
const { Product, ProductVariant, ProductReview } = require('./Product');
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('./Order');
const { Cart, CartItem } = require('./Cart');
const { Wishlist, WishlistProduct } = require('./Wishlist');
const Newsletter = require('./Newsletter');
const InventoryLedger = require('./InventoryLedger');

// Cross-model associations
Order.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'SET NULL' });

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product', onDelete: 'SET NULL' });

Cart.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product', onDelete: 'CASCADE' });

Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Wishlist.belongsToMany(Product, { through: WishlistProduct, foreignKey: 'wishlistId', as: 'products', onDelete: 'CASCADE' });
Product.belongsToMany(Wishlist, { through: WishlistProduct, foreignKey: 'productId', as: 'wishlists', onDelete: 'CASCADE' });

InventoryLedger.belongsTo(Product, { foreignKey: 'productId', as: 'product', onDelete: 'CASCADE' });
InventoryLedger.belongsTo(User, { foreignKey: 'createdById', as: 'creator', onDelete: 'SET NULL' });
InventoryLedger.belongsTo(Order, { foreignKey: 'relatedOrderId', as: 'relatedOrder', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  User,
  Product,
  ProductVariant,
  ProductReview,
  Order,
  OrderItem,
  OrderShippingAddress,
  AdminTimelineEntry,
  Cart,
  CartItem,
  Wishlist,
  WishlistProduct,
  Newsletter,
  InventoryLedger,
};
