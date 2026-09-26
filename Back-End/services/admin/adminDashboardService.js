// services/admin/adminDashboardService.js
const { Order } = require('../../models/Order');
const inventoryService = require('../inventoryService');
const analytics = require('../adminService.analytics');
const {
  formatCurrency,
  formatPercent,
  sortOrdersForPriority,
  mapPriorityOrder,
  getRegionLabel,
  DAY_IN_MS,
} = require('../adminService.helpers');

const ORDER_USER_INCLUDE = {
  model: require('../../models/User'),
  as: 'user',
  attributes: ['id', 'name', 'email', 'createdAt'],
  required: false,
};
const ORDER_SHIPPING_INCLUDE = {
  model: require('../../models/Order').OrderShippingAddress,
  as: 'shippingAddress',
  required: false,
};
const ORDER_ITEMS_INCLUDE = {
  model: require('../../models/Order').OrderItem,
  as: 'orderItems',
  required: false,
};
const ORDER_TIMELINE_INCLUDE = {
  model: require('../../models/Order').AdminTimelineEntry,
  as: 'adminTimeline',
  required: false,
};

function buildFullOrderInclude() {
  return [ORDER_USER_INCLUDE, ORDER_SHIPPING_INCLUDE, ORDER_ITEMS_INCLUDE, ORDER_TIMELINE_INCLUDE];
}

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
  const recentPaidOrders = paidOrders.filter(
    (order) => now - new Date(order.paidAt || order.createdAt) <= 7 * DAY_IN_MS
  );
  const recentRevenue = recentPaidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const priorityOrders = sortOrdersForPriority(
    orders.filter((o) => !o.isDelivered).slice(0, 20),
    now
  );

  const mappedPriorityOrders = priorityOrders.map(mapPriorityOrder);

  const stats = [
    {
      label: 'Live Order Queue',
      value: String(orders.length),
      note: `${paidOrders.length} settled payments`,
      tone: 'stone',
    },
    {
      label: 'Gross Settlement',
      value: formatCurrency(totalRevenue),
      note: `${formatCurrency(recentRevenue)} in last 7d`,
      tone: 'emerald',
    },
    {
      label: 'Average Basket',
      value: formatCurrency(averageOrderValue),
      note: 'Per transaction realized',
      tone: 'amber',
    },
    {
      label: 'Inventory Alerts',
      value: String(lowStockCount),
      note: 'SKUs requiring replenishment',
      tone: lowStockCount > 0 ? 'rose' : 'emerald',
    },
  ];

  const lanes = [
    {
      title: 'Processing Lane',
      count: orders.filter((o) => o.fulfillmentStatus === 'processing').length,
      note: 'Awaiting fulfillment batching',
      tone: 'stone',
    },
    {
      title: 'Packing Station',
      count: orders.filter((o) => o.fulfillmentStatus === 'packed').length,
      note: 'Prepared for courier handoff',
      tone: 'amber',
    },
    {
      title: 'In Transit',
      count: orders.filter((o) => o.fulfillmentStatus === 'shipped').length,
      note: 'Active regional dispatch',
      tone: 'emerald',
    },
  ];

  const watchlist = orders
    .filter((o) => !o.isPaid || (!o.isDelivered && now - new Date(o.createdAt) > 3 * DAY_IN_MS))
    .slice(0, 3)
    .map((o) => ({
      title: !o.isPaid
        ? `Order #${(o.id || '').slice(0, 8)} Awaiting Payment`
        : `Order #${(o.id || '').slice(0, 8)} Delayed Dispatch`,
      detail: !o.isPaid
        ? 'Customer has not finalized payment settlement.'
        : 'Order has been in processing for > 3 days.',
      tone: !o.isPaid ? 'amber' : 'rose',
    }));

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
    priorityQueue: mappedPriorityOrders,
    priorityOrders: mappedPriorityOrders,
    stats,
    lanes,
    watchlist,
    regionalPulse: buildRegionalPulse(orders, now),
  };
}

const redisClient = require('../../config/redis');

const ADMIN_DASHBOARD_CACHE_KEY = 'admin:dashboard:summary';
const ADMIN_ANALYTICS_CACHE_KEY = 'admin:analytics:summary';
const ADMIN_CACHE_TTL_SECONDS = 30; // 30s cache TTL for live metrics

async function readAdminCache(key) {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    if (redisClient && redisClient.status === 'ready') {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function writeAdminCache(key, payload) {
  if (process.env.NODE_ENV === 'test') return;
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.set(key, JSON.stringify(payload), 'EX', ADMIN_CACHE_TTL_SECONDS);
    }
  } catch {}
}

async function invalidateAdminCache() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(ADMIN_DASHBOARD_CACHE_KEY, ADMIN_ANALYTICS_CACHE_KEY);
    }
  } catch {}
}

async function fetchAdminDashboard() {
  const cached = await readAdminCache(ADMIN_DASHBOARD_CACHE_KEY);
  if (cached) return cached;

  const [orders, lowStockData] = await Promise.all([
    Order.findAll({
      include: buildFullOrderInclude(),
      order: [['createdAt', 'DESC']],
    }),
    inventoryService.getLowStockItems(10, { limit: 1 }),
  ]);

  const result = buildAdminDashboardFromOrders(orders, lowStockData.totalCount, new Date());
  await writeAdminCache(ADMIN_DASHBOARD_CACHE_KEY, result);
  return result;
}

async function fetchAdminAnalytics() {
  const cached = await readAdminCache(ADMIN_ANALYTICS_CACHE_KEY);
  if (cached) return cached;

  const [orders, lowStockData] = await Promise.all([
    Order.findAll({
      include: [ORDER_USER_INCLUDE, ORDER_ITEMS_INCLUDE, ORDER_SHIPPING_INCLUDE],
      order: [['createdAt', 'DESC']],
    }),
    inventoryService.getLowStockItems(10, { limit: 1 }),
  ]);

  const result = analytics.buildAdminAnalyticsFromOrders(orders, lowStockData.totalCount, new Date());
  await writeAdminCache(ADMIN_ANALYTICS_CACHE_KEY, result);
  return result;
}

async function fetchReorderPlan(options) {
  return analytics.fetchReorderPlan(options);
}

module.exports = {
  buildRegionalPulse,
  buildAdminDashboardFromOrders,
  fetchAdminDashboard,
  fetchAdminAnalytics,
  fetchReorderPlan,
  invalidateAdminCache,
  buildFullOrderInclude,
  ORDER_USER_INCLUDE,
  ORDER_SHIPPING_INCLUDE,
  ORDER_ITEMS_INCLUDE,
  ORDER_TIMELINE_INCLUDE,
};
