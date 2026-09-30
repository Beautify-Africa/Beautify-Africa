// services/admin/adminReorderService.js
const { Order, OrderItem } = require('../../models/Order');
const inventoryService = require('../inventoryService');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getOrderValueDate(order = {}) {
  return order.paidAt || order.createdAt || new Date();
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
    if (!order.isPaid) return;

    const orderDate = new Date(getOrderValueDate(order)).getTime();
    if (Number.isNaN(orderDate) || orderDate < cutoff) return;

    (order.orderItems || []).forEach((item) => {
      const key = String(
        item.productId || item.product?.id || item.product?._id || item.product || item.name || ''
      ).trim();
      if (!key) return;

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

async function fetchReorderPlan({ threshold = 10, leadTimeDays = 14, windowDays = 30 } = {}) {
  const parsedThreshold = Math.max(Number(threshold) || 10, 1);
  const parsedLeadTimeDays = Math.max(Number(leadTimeDays) || 14, 1);
  const parsedWindowDays = Math.max(Number(windowDays) || 30, 7);

  const [lowStockData, orders] = await Promise.all([
    inventoryService.getLowStockItems(parsedThreshold, { limit: 500, includeArchived: false }),
    Order.findAll({
      attributes: ['totalPrice', 'isPaid', 'paidAt', 'createdAt'],
      include: [{ model: OrderItem, as: 'orderItems' }],
      order: [['createdAt', 'DESC']],
    }),
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
  escapeCsvCell,
  buildCsvFromRows,
  buildProductDemandProfile,
  buildReorderRecommendations,
  buildReorderCsv,
  fetchReorderPlan,
};
