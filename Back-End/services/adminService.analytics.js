const Order = require('../models/Order');
const inventoryService = require('../services/inventoryService');

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
      const key = String(item.product?._id || item.product || item.name || 'unknown');
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

function escapeCsvCell(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsvFromRows(headers, rows) {
  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(row.map(escapeCsvCell).join(','));
  });

  return `${lines.join('\n')}\n`;
}

function buildProductDemandProfile(orders = [], now = new Date(), windowDays = 30) {
  const cutoff = now.getTime() - windowDays * DAY_IN_MS;
  const profile = new Map();

  orders.forEach((order) => {
    if (!order.isPaid) {
      return;
    }

    const orderDate = new Date(getOrderValueDate(order)).getTime();
    if (Number.isNaN(orderDate) || orderDate < cutoff) {
      return;
    }

    (order.orderItems || []).forEach((item) => {
      const key = String(item.product?._id || item.product || item.name || '').trim();
      if (!key) {
        return;
      }

      const quantity = Number(item.qty || 0);
      const unitPrice = Number(item.price || 0);
      const current = profile.get(key) || {
        productId: key,
        productName: item.name || 'Unknown product',
        unitsSold: 0,
        revenue: 0,
        lastSoldAt: null,
      };

      current.unitsSold += quantity;
      current.revenue += quantity * unitPrice;
      current.lastSoldAt = current.lastSoldAt
        ? new Date(Math.max(new Date(current.lastSoldAt).getTime(), orderDate)).toISOString()
        : new Date(orderDate).toISOString();

      profile.set(key, current);
    });
  });

  return profile;
}

function buildReorderRecommendations(lowStockItems = [], demandProfile = new Map(), options = {}) {
  const leadTimeDays = Math.max(Number(options.leadTimeDays || 14), 1);
  const windowDays = Math.max(Number(options.windowDays || 30), 7);

  return lowStockItems.map((item) => {
    const demand = demandProfile.get(String(item.productId)) || {
      unitsSold: 0,
      revenue: 0,
      lastSoldAt: null,
    };

    const currentStock = Number(item.stock || 0);
    const threshold = Number(item.threshold || 10);
    const recentUnitsSold = Number(demand.unitsSold || 0);
    const dailyRunRate = recentUnitsSold / windowDays;
    const demandTarget = Math.ceil(dailyRunRate * leadTimeDays * 1.25);
    const baselineTarget = threshold * 2;
    const recommendedTarget = Math.max(baselineTarget, demandTarget);
    const recommendedOrderQty = Math.max(0, recommendedTarget - currentStock);

    let urgency = 'medium';
    if (currentStock === 0 || recommendedOrderQty >= threshold) {
      urgency = 'high';
    } else if (currentStock < Math.ceil(threshold / 2)) {
      urgency = 'elevated';
    }

    return {
      productId: item.productId,
      variantId: item.variantId || null,
      productName: item.productName,
      sku: item.sku || '',
      type: item.type,
      currentStock,
      threshold,
      recentUnitsSold,
      dailyRunRate: Number(dailyRunRate.toFixed(2)),
      leadTimeDays,
      recommendedOrderQty,
      targetStock: recommendedTarget,
      urgency,
      lastSoldAt: demand.lastSoldAt,
      note:
        urgency === 'high'
          ? 'Place this order first to avoid a stockout.'
          : urgency === 'elevated'
            ? 'Reorder soon to stay ahead of recent demand.'
            : 'Monitor and combine with other replenishment items.',
    };
  });
}

function buildReorderCsv(recommendations = []) {
  return buildCsvFromRows(
    [
      'productName',
      'sku',
      'type',
      'currentStock',
      'threshold',
      'recentUnitsSold',
      'dailyRunRate',
      'leadTimeDays',
      'recommendedOrderQty',
      'targetStock',
      'urgency',
      'note',
    ],
    recommendations.map((item) => [
      item.productName,
      item.sku,
      item.type,
      item.currentStock,
      item.threshold,
      item.recentUnitsSold,
      item.dailyRunRate,
      item.leadTimeDays,
      item.recommendedOrderQty,
      item.targetStock,
      item.urgency,
      item.note,
    ])
  );
}

function buildAdminAnalyticsFromOrders(orders = [], lowStockCount = 0, now = new Date()) {
  const paidOrders = orders.filter((order) => order.isPaid);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const recentPaidOrders = paidOrders.filter((order) => now - new Date(getOrderValueDate(order)) <= 7 * DAY_IN_MS);
  const previousPaidOrders = paidOrders.filter((order) => {
    const orderDate = new Date(getOrderValueDate(order));
    return now - orderDate > 7 * DAY_IN_MS && now - orderDate <= 14 * DAY_IN_MS;
  });

  const recentRevenue7d = recentPaidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const previousRevenue7d = previousPaidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const recentOrders7d = recentPaidOrders.length;
  const previousOrders7d = previousPaidOrders.length;
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const revenueTrend = formatTrendLabel(recentRevenue7d, previousRevenue7d);
  const orderTrend = formatTrendLabel(recentOrders7d, previousOrders7d);
  const growthFactor = 1 + Math.max(-0.35, Math.min(0.35, ((recentRevenue7d - previousRevenue7d) / (previousRevenue7d || 1)) / 2));

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
      trendValue: `${((growthFactor - 1) * 100 >= 0 ? '+' : '')}${((growthFactor - 1) * 100).toFixed(1)}%`,
    },
  };
}

async function fetchReorderPlan({ threshold = 10, leadTimeDays = 14, windowDays = 30 } = {}) {
  const parsedThreshold = Math.max(Number(threshold) || 10, 1);
  const parsedLeadTimeDays = Math.max(Number(leadTimeDays) || 14, 1);
  const parsedWindowDays = Math.max(Number(windowDays) || 30, 7);

  const [lowStockData, orders] = await Promise.all([
    inventoryService.getLowStockItems(parsedThreshold, { limit: 500, includeArchived: false }),
    Order.find({})
      .select('orderItems totalPrice isPaid paidAt createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const demandProfile = buildProductDemandProfile(orders, new Date(), parsedWindowDays);
  const recommendations = buildReorderRecommendations(lowStockData.items, demandProfile, {
    leadTimeDays: parsedLeadTimeDays,
    windowDays: parsedWindowDays,
  });
  const csv = buildReorderCsv(recommendations);

  return {
    summary: {
      threshold: parsedThreshold,
      leadTimeDays: parsedLeadTimeDays,
      windowDays: parsedWindowDays,
      lowStockCount: lowStockData.totalCount,
      recommendationCount: recommendations.length,
      highPriorityCount: recommendations.filter((item) => item.urgency === 'high').length,
      elevatedPriorityCount: recommendations.filter((item) => item.urgency === 'elevated').length,
    },
    recommendations,
    csv,
    filename: `beautify-africa-reorder-plan-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

module.exports = {
  buildDailySalesSeries,
  buildTopSellingProducts,
  buildFulfillmentBreakdown,
  buildProductDemandProfile,
  buildReorderRecommendations,
  buildReorderCsv,
  fetchReorderPlan,
  buildAdminAnalyticsFromOrders,
};
