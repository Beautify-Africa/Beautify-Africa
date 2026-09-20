const reorderService = require('./admin/adminReorderService');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatCurrency(amount = 0) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return 'Just now';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getOrderValueDate(order = {}) {
  return order.paidAt || order.createdAt || new Date();
}

function formatTrendLabel(currentValue = 0, previousValue = 0) {
  if (!previousValue && !currentValue) {
    return '0.0%';
  }

  if (!previousValue) {
    return '+100.0%';
  }

  const percent = ((currentValue - previousValue) / previousValue) * 100;
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

function buildDailySalesSeries(orders = [], windowDays = 14, now = new Date()) {
  const series = [];

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    series.push({
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      orders: 0,
      revenue: 0,
    });
  }

  const seriesMap = new Map(series.map((entry) => [entry.key, entry]));

  orders.forEach((order) => {
    if (!order.isPaid) {
      return;
    }

    const bucketKey = new Date(getOrderValueDate(order)).toISOString().slice(0, 10);
    const bucket = seriesMap.get(bucketKey);

    if (!bucket) {
      return;
    }

    bucket.orders += 1;
    bucket.revenue += Number(order.totalPrice || 0);
  });

  return series;
}

function buildTopSellingProducts(orders = [], limit = 5) {
  const productMap = new Map();

  orders.forEach((order) => {
    if (!order.isPaid) {
      return;
    }

    (order.orderItems || []).forEach((item) => {
      const quantity = Number(item.qty || 0);
      const unitPrice = Number(item.price || 0);
      const key = String(
        item.productId ||
          item.product?.id ||
          item.product?._id ||
          item.product ||
          item.name ||
          'unknown'
      );
      const current = productMap.get(key) || {
        id: key,
        name: item.name || 'Unknown product',
        quantity: 0,
        revenue: 0,
      };

      current.quantity += quantity;
      current.revenue += quantity * unitPrice;
      productMap.set(key, current);
    });
  });

  return [...productMap.values()]
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      revenueLabel: formatCurrency(item.revenue),
    }));
}

function buildFulfillmentBreakdown(orders = []) {
  const counts = orders.reduce((accumulator, order) => {
    const status = order.fulfillmentStatus || 'processing';
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});

  return ['processing', 'packed', 'shipped', 'delivered'].map((status) => ({
    status,
    count: counts[status] || 0,
  }));
}

function buildAdminAnalyticsFromOrders(orders = [], lowStockCount = 0, now = new Date()) {
  const paidOrders = orders.filter((order) => order.isPaid);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const recentPaidOrders = paidOrders.filter(
    (order) => now - new Date(getOrderValueDate(order)) <= 7 * DAY_IN_MS
  );
  const previousPaidOrders = paidOrders.filter((order) => {
    const orderDate = new Date(getOrderValueDate(order));
    return now - orderDate > 7 * DAY_IN_MS && now - orderDate <= 14 * DAY_IN_MS;
  });

  const recentRevenue7d = recentPaidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );
  const previousRevenue7d = previousPaidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );
  const recentOrders7d = recentPaidOrders.length;
  const previousOrders7d = previousPaidOrders.length;
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const revenueTrend = formatTrendLabel(recentRevenue7d, previousRevenue7d);
  const orderTrend = formatTrendLabel(recentOrders7d, previousOrders7d);
  const growthFactor =
    1 +
    Math.max(
      -0.35,
      Math.min(0.35, (recentRevenue7d - previousRevenue7d) / (previousRevenue7d || 1) / 2)
    );

  return {
    summary: {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      unpaidOrders: orders.length - paidOrders.length,
      grossRevenue: formatCurrency(totalRevenue),
      grossRevenueValue: totalRevenue,
      averageOrderValue: formatCurrency(averageOrderValue),
      averageOrderValueValue: averageOrderValue,
      recentRevenue7d: formatCurrency(recentRevenue7d),
      recentRevenue7dValue: recentRevenue7d,
      recentOrders7d,
      previousOrders7d,
      paidOrderRate: formatPercent(orders.length ? (paidOrders.length / orders.length) * 100 : 0),
      lowStockCount,
    },
    velocity: {
      salesSeries: buildDailySalesSeries(orders, 14, now),
      revenueTrend,
      orderTrend,
    },
    topProducts: buildTopSellingProducts(orders, 5),
    fulfillmentBreakdown: buildFulfillmentBreakdown(orders),
    forecast: {
      next7dRevenue: formatCurrency(recentRevenue7d * growthFactor),
      next7dRevenueValue: recentRevenue7d * growthFactor,
      next7dOrders: Math.round(recentOrders7d * growthFactor),
      inventoryPressure: Math.max(lowStockCount, Math.round(recentOrders7d / 2)),
      trendLabel: growthFactor >= 1.05 ? 'Rising' : growthFactor <= 0.95 ? 'Cooling' : 'Stable',
      trendValue: `${(growthFactor - 1) * 100 >= 0 ? '+' : ''}${((growthFactor - 1) * 100).toFixed(1)}%`,
    },
  };
}

module.exports = {
  buildDailySalesSeries,
  buildTopSellingProducts,
  buildFulfillmentBreakdown,
  buildProductDemandProfile: reorderService.buildProductDemandProfile,
  buildReorderRecommendations: reorderService.buildReorderRecommendations,
  buildReorderCsv: reorderService.buildReorderCsv,
  fetchReorderPlan: reorderService.fetchReorderPlan,
  buildAdminAnalyticsFromOrders,
};
