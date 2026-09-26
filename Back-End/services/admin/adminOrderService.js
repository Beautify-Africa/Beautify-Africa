// services/admin/adminOrderService.js
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('../../models/Order');
const User = require('../../models/User');
const {
  createAdminError,
  normalizeAdminAction,
  parsePositiveInteger,
  ensureValidOrderId,
  ensurePaidOrder,
  ensureOrderStatus,
  formatCurrency,
  formatDateLabel,
  createOrderReference,
  getCustomerName,
  getOrderLane,
  getStatusMeta,
  getOrderActions,
  mapAdminTimelineEntries,
  mapAdminOrderDetail,
} = require('../adminService.helpers');
const {
  buildFullOrderInclude,
  ORDER_USER_INCLUDE,
  ORDER_SHIPPING_INCLUDE,
  ORDER_ITEMS_INCLUDE,
  ORDER_TIMELINE_INCLUDE,
} = require('./adminDashboardService');

const FULFILLMENT_STATUSES = ['processing', 'packed', 'shipped', 'delivered'];
const SUPPORTED_ADMIN_ACTIONS = ['mark_paid', 'pack', 'ship', 'deliver'];
const SUPPORTED_ADMIN_ORDER_SORTS = ['newest', 'oldest', 'total_high', 'total_low'];

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

function applyAdminOrderAction(order, action) {
  if (!order) throw createAdminError('Order not found', 404);
  const normalizedAction = normalizeAdminAction(action);
  if (!normalizedAction) throw createAdminError('Action is required');
  if (!SUPPORTED_ADMIN_ACTIONS.includes(normalizedAction))
    throw createAdminError(`Unsupported admin action: ${action}`);

  if (normalizedAction === 'mark_paid') {
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
    }
    return order;
  }
  ensurePaidOrder(order);
  if (normalizedAction === 'pack') {
    ensureOrderStatus(order, 'processing', 'pack');
    order.fulfillmentStatus = 'packed';
    order.isDelivered = false;
    order.deliveredAt = null;
    return order;
  }
  if (normalizedAction === 'ship') {
    ensureOrderStatus(order, 'packed', 'ship');
    order.fulfillmentStatus = 'shipped';
    order.isDelivered = false;
    order.deliveredAt = null;
    return order;
  }
  if (normalizedAction === 'deliver') {
    ensureOrderStatus(order, 'shipped', 'deliver');
    order.fulfillmentStatus = 'delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();
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
  await appendOrderTimelineEntry(order, {
    type: 'action',
    action: normalizedAction,
    adminUser,
    note,
  });

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

function buildAdminOrderFilter(query = {}) {
  const where = {};
  const normalizedFilters = {};

  const payment = String(query.payment || 'all')
    .trim()
    .toLowerCase();
  if (payment === 'paid') where.isPaid = true;
  else if (payment === 'unpaid') where.isPaid = false;
  normalizedFilters.payment = payment;

  const fulfillment = String(query.fulfillment || query.status || 'all')
    .trim()
    .toLowerCase();
  if (fulfillment !== 'all' && FULFILLMENT_STATUSES.includes(fulfillment))
    where.fulfillmentStatus = fulfillment;
  normalizedFilters.fulfillment = fulfillment;
  normalizedFilters.status = fulfillment;

  const country = String(query.country || '')
    .trim()
    .toLowerCase();
  normalizedFilters.country = country;

  const search = String(query.search || '').trim();
  normalizedFilters.search = search;

  return { where, normalizedFilters };
}

function buildAdminOrderSort(sortValue = 'newest') {
  const sort = String(sortValue || 'newest')
    .trim()
    .toLowerCase();
  if (sort === 'oldest') return { sort, order: [['createdAt', 'ASC']] };
  if (sort === 'total_high')
    return {
      sort,
      order: [
        ['totalPrice', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    };
  if (sort === 'total_low')
    return {
      sort,
      order: [
        ['totalPrice', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    };
  return { sort, order: [['createdAt', 'DESC']] };
}

function mapAdminOrderRow(order = {}) {
  const statusMeta = getStatusMeta(order);
  const addr = order.shippingAddress || {};
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    : 0;

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
  const page = parsePositiveInteger(query.page, {
    defaultValue: 1,
    min: 1,
    max: 1000,
    label: 'Page',
  });
  const limit = parsePositiveInteger(query.limit, {
    defaultValue: 12,
    min: 1,
    max: 50,
    label: 'Limit',
  });
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
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    },
    filters: { ...normalizedFilters, sort },
  };
}

module.exports = {
  FULFILLMENT_STATUSES,
  SUPPORTED_ADMIN_ACTIONS,
  SUPPORTED_ADMIN_ORDER_SORTS,
  normalizeAdminNote,
  appendOrderTimelineEntry,
  applyAdminOrderAction,
  updateAdminOrder,
  addAdminOrderNote,
  fetchAdminOrderTimeline,
  fetchAdminOrderDetail,
  buildAdminOrderFilter,
  buildAdminOrderSort,
  mapAdminOrderRow,
  fetchAdminOrders,
};
