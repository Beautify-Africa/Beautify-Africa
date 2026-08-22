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
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wishlist.belongsToMany(Product, { through: WishlistProduct, foreignKey: 'wishlistId', as: 'products' });
Product.belongsToMany(Wishlist, { through: WishlistProduct, foreignKey: 'productId', as: 'wishlists' });

InventoryLedger.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
InventoryLedger.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
InventoryLedger.belongsTo(Order, { foreignKey: 'relatedOrderId', as: 'relatedOrder' });

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
