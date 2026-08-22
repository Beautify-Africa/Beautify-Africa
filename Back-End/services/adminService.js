// services/adminService.js
const { Op } = require('sequelize');
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('../models/Order');
const { Product } = require('../models/Product');
const User = require('../models/User');
const redisClient = require('../config/redis');
const inventoryService = require('../services/inventoryService');
const analytics = require('./adminService.analytics');

const {
  createAdminError,
  normalizeAdminAction,
  parsePositiveInteger,
  normalizeAdminQueryEnum,
  ensureValidOrderId,
  ensurePaidOrder,
  ensureOrderStatus,
  formatCurrency,
  formatDateLabel,
  formatPercent,
  createOrderReference,
  getCustomerName,
  getRegionLabel,
  getOrderLane,
  getStatusMeta,
  getOrderActions,
  sortOrdersForPriority,
  mapPriorityOrder,
  mapAdminTimelineEntries,
  mapAdminOrderDetail,
  DAY_IN_MS,
} = require('./adminService.helpers');

const FULFILLMENT_STATUSES = ['processing', 'packed', 'shipped', 'delivered'];
const SUPPORTED_ADMIN_ACTIONS = ['mark_paid', 'pack', 'ship', 'deliver'];
const SUPPORTED_ADMIN_ORDER_SORTS = ['newest', 'oldest', 'total_high', 'total_low'];
const PRODUCT_CACHE_VERSION_KEY = 'products:version';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ======================== ORDER INCLUDES ========================

const ORDER_USER_INCLUDE = { model: User, as: 'user', attributes: ['id', 'name', 'email', 'createdAt'], required: false };
const ORDER_SHIPPING_INCLUDE = { model: OrderShippingAddress, as: 'shippingAddress', required: false };
const ORDER_ITEMS_INCLUDE = { model: OrderItem, as: 'orderItems', required: false };
const ORDER_TIMELINE_INCLUDE = { model: AdminTimelineEntry, as: 'adminTimeline', required: false };

function buildFullOrderInclude() {
  return [ORDER_USER_INCLUDE, ORDER_SHIPPING_INCLUDE, ORDER_ITEMS_INCLUDE, ORDER_TIMELINE_INCLUDE];
}

// ======================== DASHBOARD ========================

function buildRegionalPulse(orders = [], now = new Date()) {
  if (orders.length === 0) return [];
  const currentWindowStart = new Date(now.getTime() - 7 * DAY_IN_MS);
  const previousWindowStart = new Date(now.getTime() - 14 * DAY_IN_MS);
  const grouped = new Map();

  for (const order of orders) {
    const addr = order.shippingAddress || {};
    const region = getRegionLabel(addr.country);
    const bucket = grouped.get(region) || { count: 0, current: 0, previous: 0 };
    bucket.count += 1;
    const createdAt = new Date(order.createdAt);
    if (createdAt >= currentWindowStart) bucket.current += 1;
    else if (createdAt >= previousWindowStart) bucket.previous += 1;
    grouped.set(region, bucket);
  }

  return [...grouped.entries()]
    .sort((l, r) => r[1].count - l[1].count)
    .slice(0, 3)
    .map(([region, bucket]) => {
      const share = orders.length ? (bucket.count / orders.length) * 100 : 0;
      const movement = bucket.current - bucket.previous;
      return {
        region,
        share: formatPercent(share),
        movement: `${movement >= 0 ? '+' : ''}${movement}`,
        movementValue: movement,
        count: bucket.count,
      };
    });
}

function buildAdminDashboardFromOrders(orders = [], lowStockCount = 0, now = new Date()) {
  const paidOrders = orders.filter((order) => order.isPaid);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const recentPaidOrders = paidOrders.filter((order) => now - new Date(order.paidAt || order.createdAt) <= 7 * DAY_IN_MS);
  const recentRevenue = recentPaidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const priorityOrders = sortOrdersForPriority(orders.filter((o) => !o.isDelivered).slice(0, 20), now);

  return {
    metrics: {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      totalRevenue: formatCurrency(totalRevenue),
      totalRevenueValue: totalRevenue,
      recentRevenue: formatCurrency(recentRevenue),
      recentRevenueValue: recentRevenue,
      averageOrderValue: formatCurrency(averageOrderValue),
      averageOrderValueValue: averageOrderValue,
      lowStockItemsCount: lowStockCount,
    },
    priorityQueue: priorityOrders.map(mapPriorityOrder),
    regionalPulse: buildRegionalPulse(orders, now),
  };
}

async function fetchAdminDashboard() {
  const [orders, lowStockData] = await Promise.all([
    Order.findAll({
      include: buildFullOrderInclude(),
      order: [['createdAt', 'DESC']],
    }),
    inventoryService.getLowStockItems(10, { limit: 1 }),
  ]);

  return buildAdminDashboardFromOrders(orders, lowStockData.totalCount, new Date());
}

async function fetchAdminAnalytics() {
  const [orders, lowStockData] = await Promise.all([
    Order.findAll({
      include: [ORDER_USER_INCLUDE, ORDER_ITEMS_INCLUDE, ORDER_SHIPPING_INCLUDE],
      order: [['createdAt', 'DESC']],
    }),
    inventoryService.getLowStockItems(10, { limit: 1 }),
  ]);

  return analytics.buildAdminAnalyticsFromOrders(orders, lowStockData.totalCount, new Date());
}

// ======================== ORDER TIMELINE ========================

function normalizeAdminNote(note) {
  const trimmedNote = String(note || '').trim();
  return trimmedNote.length > 600 ? `${trimmedNote.substring(0, 597)}...` : trimmedNote;
}

async function appendOrderTimelineEntry(order, { type, action = '', note = '', adminUser = null }) {
  const adminUserName = adminUser?.name || 'Admin';
  const adminUserEmail = adminUser?.email || '';

  await AdminTimelineEntry.create({
    orderId: order.id,
    type,
    action: action || '',
    note: note || '',
    adminName: adminUserName,
    adminEmail: adminUserEmail,
  });
}

// ======================== ORDER ACTIONS ========================

function applyAdminOrderAction(order, action) {
  if (!order) throw createAdminError('Order not found', 404);
  const normalizedAction = normalizeAdminAction(action);
  if (!normalizedAction) throw createAdminError('Action is required');
  if (!SUPPORTED_ADMIN_ACTIONS.includes(normalizedAction)) throw createAdminError(`Unsupported admin action: ${action}`);

  if (normalizedAction === 'mark_paid') {
    if (!order.isPaid) { order.isPaid = true; order.paidAt = new Date(); }
    return order;
  }
  ensurePaidOrder(order);
  if (normalizedAction === 'pack') {
    ensureOrderStatus(order, 'processing', 'pack');
    order.fulfillmentStatus = 'packed'; order.isDelivered = false; order.deliveredAt = null;
    return order;
  }
  if (normalizedAction === 'ship') {
    ensureOrderStatus(order, 'packed', 'ship');
    order.fulfillmentStatus = 'shipped'; order.isDelivered = false; order.deliveredAt = null;
    return order;
  }
  if (normalizedAction === 'deliver') {
    ensureOrderStatus(order, 'shipped', 'deliver');
    order.fulfillmentStatus = 'delivered'; order.isDelivered = true; order.deliveredAt = new Date();
    return order;
  }
  throw createAdminError(`Unsupported admin action: ${action}`);
}

async function updateAdminOrder(orderId, action, adminUser = null, note = '') {
  ensureValidOrderId(orderId);

  const order = await Order.findByPk(orderId, { include: buildFullOrderInclude() });
  if (!order) throw createAdminError('Order not found', 404);

  const normalizedAction = normalizeAdminAction(action);
  applyAdminOrderAction(order, normalizedAction);
  await order.save();
  await appendOrderTimelineEntry(order, { type: 'action', action: normalizedAction, adminUser, note });

  // Re-fetch with fresh data
  return Order.findByPk(orderId, { include: buildFullOrderInclude() });
}

async function addAdminOrderNote(orderId, note, adminUser) {
  ensureValidOrderId(orderId);
  const normalizedNote = normalizeAdminNote(note);
  if (!normalizedNote) throw createAdminError('Note is required');

  const order = await Order.findByPk(orderId);
  if (!order) throw createAdminError('Order not found', 404);

  await appendOrderTimelineEntry(order, { type: 'note', note: normalizedNote, adminUser });
  return { orderId: order.id, note: normalizedNote };
}

async function fetchAdminOrderTimeline(orderId) {
  ensureValidOrderId(orderId);

  const order = await Order.findByPk(orderId, { include: [ORDER_TIMELINE_INCLUDE] });
  if (!order) throw createAdminError('Order not found', 404);

  return mapAdminTimelineEntries(order.adminTimeline || []);
}

async function fetchAdminOrderDetail(orderId) {
  ensureValidOrderId(orderId);

  const order = await Order.findByPk(orderId, { include: buildFullOrderInclude() });
  if (!order) throw createAdminError('Order not found', 404);

  return mapAdminOrderDetail(order);
}

// ======================== ORDER LIST ========================

const SUPPORTED_FULFILLMENT_FILTER_VALUES = ['all', 'processing', 'packed', 'shipped', 'delivered'];
const SUPPORTED_PAYMENT_FILTER_VALUES = ['all', 'paid', 'unpaid'];

function buildAdminOrderFilter(query = {}) {
  const where = {};
  const normalizedFilters = {};

  // Payment filter
  const payment = String(query.payment || 'all').trim().toLowerCase();
  if (payment === 'paid') where.isPaid = true;
  else if (payment === 'unpaid') where.isPaid = false;
  normalizedFilters.payment = payment;

  // Fulfillment status filter
  const fulfillment = String(query.fulfillment || 'all').trim().toLowerCase();
  if (fulfillment !== 'all' && FULFILLMENT_STATUSES.includes(fulfillment)) where.fulfillmentStatus = fulfillment;
  normalizedFilters.fulfillment = fulfillment;

  // Country filter (via shippingAddress join — handled at query level below)
  const country = String(query.country || '').trim().toLowerCase();
  normalizedFilters.country = country;

  // Search filter — will be applied post-fetch if needed
  const search = String(query.search || '').trim();
  normalizedFilters.search = search;

  return { where, normalizedFilters };
}

function buildAdminOrderSort(sortValue = 'newest') {
  const sort = String(sortValue || 'newest').trim().toLowerCase();
  if (sort === 'oldest') return { sort, order: [['createdAt', 'ASC']] };
  if (sort === 'total_high') return { sort, order: [['totalPrice', 'DESC'], ['createdAt', 'DESC']] };
  if (sort === 'total_low') return { sort, order: [['totalPrice', 'ASC'], ['createdAt', 'DESC']] };
  return { sort, order: [['createdAt', 'DESC']] };
}

function mapAdminOrderRow(order = {}) {
  const statusMeta = getStatusMeta(order);
  const addr = order.shippingAddress || {};
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0) : 0;

  return {
    id: order.id,
    reference: createOrderReference(order.id),
    customer: getCustomerName(order),
    email: addr.email || order.user?.email || '',
    city: addr.city || 'Unknown city',
    country: addr.country || 'Unknown country',
    lane: getOrderLane(order),
    total: formatCurrency(order.totalPrice),
    totalValue: Number(order.totalPrice || 0),
    itemCount,
    paymentLabel: order.isPaid ? 'Paid' : 'Awaiting payment',
    isPaid: Boolean(order.isPaid),
    fulfillmentLabel: order.fulfillmentStatus || 'processing',
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    placedAt: order.createdAt,
    placedAtLabel: formatDateLabel(order.createdAt),
    availableActions: getOrderActions(order),
  };
}

async function fetchAdminOrders(query = {}) {
  const { where, normalizedFilters } = buildAdminOrderFilter(query);
  const page = parsePositiveInteger(query.page, { defaultValue: 1, min: 1, max: 1000, label: 'Page' });
  const limit = parsePositiveInteger(query.limit, { defaultValue: 12, min: 1, max: 50, label: 'Limit' });
  const { sort, order } = buildAdminOrderSort(query.sort);
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    Order.findAll({
      where,
      include: [ORDER_USER_INCLUDE, ORDER_SHIPPING_INCLUDE, ORDER_ITEMS_INCLUDE],
      order,
      offset: skip,
      limit,
    }),
    Order.count({ where }),
  ]);

  return {
    orders: orders.map(mapAdminOrderRow),
    pagination: { page, limit, totalCount, totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0 },
    filters: { ...normalizedFilters, sort },
  };
}

// ======================== PRODUCT HELPERS ========================

function ensureValidProductId(productId) {
  if (!UUID_REGEX.test(String(productId || ''))) throw createAdminError('Invalid product ID format');
}

function normalizeNumberInput(value, fallbackValue = 0) {
  if (value === undefined || value === null || value === '') return fallbackValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function normalizeStringArray(value = []) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  return [];
}

function normalizeProductPayload(payload = {}, { isCreate = false } = {}) {
  const normalized = {
    name: String(payload.name || '').trim(),
    brand: String(payload.brand || '').trim(),
    category: String(payload.category || '').trim(),
    subcategory: String(payload.subcategory || '').trim(),
    description: String(payload.description || '').trim(),
    image: String(payload.image || '').trim(),
    ingredients: String(payload.ingredients || '').trim(),
    howToUse: String(payload.howToUse || '').trim(),
    price: normalizeNumberInput(payload.price, 0),
    originalPrice: payload.originalPrice === undefined || payload.originalPrice === null || payload.originalPrice === '' ? null : normalizeNumberInput(payload.originalPrice, null),
    stockQuantity: normalizeNumberInput(payload.stockQuantity, 0),
    lowStockThreshold: normalizeNumberInput(payload.lowStockThreshold, 5),
    skinType: normalizeStringArray(payload.skinType),
    tags: normalizeStringArray(payload.tags),
    images: normalizeStringArray(payload.images),
    isNewProduct: Boolean(payload.isNewProduct),
    isBestSeller: Boolean(payload.isBestSeller),
    isArchived: Boolean(payload.isArchived),
  };

  if (isCreate) {
    const requiredFields = ['name', 'brand', 'category', 'image'];
    const missing = requiredFields.filter((field) => !normalized[field]);
    if (missing.length > 0) throw createAdminError(`Missing required product field(s): ${missing.join(', ')}`);
  }
  if (normalized.stockQuantity < 0) throw createAdminError('Stock quantity cannot be negative');
  if (normalized.lowStockThreshold < 0) throw createAdminError('Low stock threshold cannot be negative');
  if (normalized.price < 0) throw createAdminError('Price cannot be negative');
  if (normalized.originalPrice !== null && normalized.originalPrice < 0) throw createAdminError('Original price cannot be negative');

  normalized.inStock = normalized.stockQuantity > 0;
  return normalized;
}

function buildAdminProductFilter(query = {}) {
  const where = {};

  const normalizedSearch = String(query.search || '').trim();
  if (normalizedSearch) {
    const searchPattern = `%${normalizedSearch}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchPattern } },
      { brand: { [Op.iLike]: searchPattern } },
      { category: { [Op.iLike]: searchPattern } },
      { subcategory: { [Op.iLike]: searchPattern } },
    ];
  }

  const archived = String(query.archived || '').toLowerCase();
  if (archived === 'true') where.isArchived = true;
  else if (archived === 'false' || archived === '') where.isArchived = false;

  const lowStock = String(query.lowStock || '').toLowerCase();
  if (lowStock === 'true') {
    // Products where stockQuantity <= lowStockThreshold
    // Use a raw where expression via sequelize.literal
    const { sequelize } = require('../config/db');
    where[Op.and] = [sequelize.literal('"Product"."stockQuantity" <= "Product"."lowStockThreshold"')];
  }

  return where;
}

async function bumpProductCacheVersion() {
  try {
    await redisClient.incr(PRODUCT_CACHE_VERSION_KEY);
  } catch (error) {
    console.warn('Redis cache version bump failed for products:', error.message);
  }
}

async function fetchAdminProducts(query = {}) {
  const filter = buildAdminProductFilter(query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    Product.findAll({ where: filter, order: [['updatedAt', 'DESC']], offset: skip, limit }),
    Product.count({ where: filter }),
  ]);

  return {
    products: products.map((p) => ({ ...p.toJSON(), _id: p.id })),
    pagination: { page, limit, totalCount, totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0 },
  };
}

async function createAdminProduct(payload = {}) {
  const normalizedPayload = normalizeProductPayload(payload, { isCreate: true });
  const product = await Product.create(normalizedPayload);
  await bumpProductCacheVersion();
  return product;
}

async function updateAdminProduct(productId, payload = {}) {
  ensureValidProductId(productId);
  const normalizedPayload = normalizeProductPayload(payload, { isCreate: false });
  const product = await Product.findByPk(productId);
  if (!product) throw createAdminError('Product not found', 404);
  Object.assign(product, normalizedPayload);
  await product.save();
  await bumpProductCacheVersion();
  return product;
}

async function setAdminProductArchived(productId, isArchived) {
  ensureValidProductId(productId);
  const product = await Product.findByPk(productId);
  if (!product) throw createAdminError('Product not found', 404);
  product.isArchived = Boolean(isArchived);
  await product.save();
  await bumpProductCacheVersion();
  return product;
}

async function fetchReorderPlan(options) {
  return analytics.fetchReorderPlan(options);
}

module.exports = {
  FULFILLMENT_STATUSES,
  SUPPORTED_ADMIN_ACTIONS,
  buildAdminDashboardFromOrders,
  fetchAdminDashboard,
  fetchAdminAnalytics,
  fetchReorderPlan,
  updateAdminOrder,
  applyAdminOrderAction,
  addAdminOrderNote,
  fetchAdminOrderTimeline,
  fetchAdminOrderDetail,
  fetchAdminOrders,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  setAdminProductArchived,
  SUPPORTED_ADMIN_ORDER_SORTS,
};
