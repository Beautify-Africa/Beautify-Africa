// services/adminService.helpers.js
const mappers = require('./admin/adminMappers');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function createAdminError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAdminAction(action = '') {
  return String(action).trim().toLowerCase();
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInteger(value, { defaultValue, min = 1, max = 100, label = 'Value' } = {}) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    throw createAdminError(`${label} must be a whole number.`);
  }

  const parsed = Number.parseInt(normalized, 10);
  if (parsed < min || parsed > max) {
    throw createAdminError(`${label} must be between ${min} and ${max}.`);
  }

  return parsed;
}

function normalizeAdminQueryEnum(
  value,
  supportedValues = [],
  label = 'value',
  fallbackValue = 'all'
) {
  const normalized = String(value || fallbackValue)
    .trim()
    .toLowerCase();
  if (!supportedValues.includes(normalized)) {
    throw createAdminError(`Unsupported ${label}: ${value}`);
  }

  return normalized;
}

function ensureValidOrderId(orderId) {
  if (!UUID_REGEX.test(String(orderId || ''))) {
    throw createAdminError('Invalid order ID format');
  }
}

function ensurePaidOrder(order) {
  if (!order.isPaid) {
    throw createAdminError('Payment must be confirmed before advancing fulfillment.');
  }
}

function ensureOrderStatus(order, expectedStatus, actionLabel) {
  const currentStatus = order.fulfillmentStatus || 'processing';

  if (currentStatus !== expectedStatus) {
    throw createAdminError(
      `Cannot ${actionLabel} an order in "${currentStatus}". Expected "${expectedStatus}".`
    );
  }
}

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

function getRegionLabel(country = '') {
  return country || 'Unassigned region';
}

function getOrderLane(order = {}) {
  const addr = order.shippingAddress || {};
  const country = addr.country || '';
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    : 0;

  if (order.fulfillmentStatus === 'shipped') return 'Courier lane';
  if (!order.isPaid) return 'Payment review';
  if (order.totalPrice >= 180) return 'High-value ritual';
  if (itemCount >= 4) return 'Bundle dispatch';
  if (country && country.toLowerCase() !== 'kenya') return 'Cross-border dispatch';

  return 'Studio standard';
}

function getStatusMeta(order = {}) {
  if (!order.isPaid) {
    return {
      label: 'Awaiting payment',
      tone: 'rose',
      nextMilestone: 'Confirm payment before the packing lane advances this order.',
    };
  }

  if (order.fulfillmentStatus === 'packed') {
    return {
      label: 'Packed for courier',
      tone: 'stone',
      nextMilestone: 'Queue this parcel for the next courier handoff.',
    };
  }

  if (order.fulfillmentStatus === 'shipped') {
    return {
      label: 'In courier lane',
      tone: 'emerald',
      nextMilestone: 'Track the shipment and confirm final delivery.',
    };
  }

  if (order.fulfillmentStatus === 'delivered' || order.isDelivered) {
    return {
      label: 'Delivered',
      tone: 'emerald',
      nextMilestone: order.deliveredAt
        ? `Delivered ${formatDateLabel(order.deliveredAt)}`
        : 'Delivered and ready for archive.',
    };
  }

  return {
    label: 'Ready to pack',
    tone: 'amber',
    nextMilestone: 'Move this paid order into the next packing wave.',
  };
}

function getOrderActions(order = {}) {
  const actions = [];

  if (!order.isPaid) {
    actions.push({ type: 'mark_paid', label: 'Mark Paid', tone: 'amber' });
    return actions;
  }

  if (order.fulfillmentStatus === 'processing') {
    actions.push({ type: 'pack', label: 'Mark Packed', tone: 'amber' });
  }

  if (order.fulfillmentStatus === 'packed') {
    actions.push({ type: 'ship', label: 'Send To Courier', tone: 'stone' });
  }

  if (order.fulfillmentStatus === 'shipped') {
    actions.push({ type: 'deliver', label: 'Mark Delivered', tone: 'emerald' });
  }

  return actions;
}

function mapPriorityOrder(order) {
  return mappers.mapPriorityOrder(order, {
    getStatusMeta,
    getOrderLane,
    formatDateLabel,
    formatCurrency,
    getOrderActions,
  });
}

function mapAdminTimelineEntries(timeline = []) {
  return mappers.mapAdminTimelineEntries(timeline, formatDateLabel);
}

function mapAdminOrderDetail(order = {}) {
  return mappers.mapAdminOrderDetail(order, {
    getStatusMeta,
    formatDateLabel,
    formatCurrency,
    getOrderActions,
    mapAdminTimelineEntries,
  });
}

module.exports = {
  DAY_IN_MS,
  createAdminError,
  normalizeAdminAction,
  escapeRegex,
  parsePositiveInteger,
  normalizeAdminQueryEnum,
  ensureValidOrderId,
  ensurePaidOrder,
  ensureOrderStatus,
  formatCurrency,
  formatDateLabel,
  formatPercent,
  createOrderReference: mappers.createOrderReference,
  getCustomerName: mappers.getCustomerName,
  getRegionLabel,
  getOrderLane,
  getStatusMeta,
  getOrderActions,
  sortOrdersForPriority: mappers.sortOrdersForPriority,
  mapPriorityOrder,
  mapAdminTimelineEntries,
  mapAdminOrderDetail,
};
