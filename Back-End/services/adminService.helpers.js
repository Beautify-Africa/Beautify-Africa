// services/adminService.helpers.js
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

function normalizeAdminQueryEnum(value, supportedValues = [], label = 'value', fallbackValue = 'all') {
  const normalized = String(value || fallbackValue).trim().toLowerCase();
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

function createOrderReference(orderId = '') {
  return `BA-${String(orderId).slice(-6).toUpperCase()}`;
}

function getCustomerName(order = {}) {
  const addr = order.shippingAddress || {};
  const fullName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();

  if (fullName) {
    return fullName;
  }

  return order.user?.name || addr.email || 'Guest checkout';
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

function sortOrdersForPriority(orders = [], now = new Date()) {
  return [...orders].sort((left, right) => {
    const leftPriority =
      (left.isPaid ? 10 : 30) +
      (left.fulfillmentStatus === 'processing' ? 20 : 0) +
      (left.fulfillmentStatus === 'packed' ? 15 : 0) +
      Math.min(Math.round((now - new Date(left.createdAt)) / (60 * 60 * 1000)), 48) +
      Number(left.totalPrice || 0) / 10;
    const rightPriority =
      (right.isPaid ? 10 : 30) +
      (right.fulfillmentStatus === 'processing' ? 20 : 0) +
      (right.fulfillmentStatus === 'packed' ? 15 : 0) +
      Math.min(Math.round((now - new Date(right.createdAt)) / (60 * 60 * 1000)), 48) +
      Number(right.totalPrice || 0) / 10;

    return rightPriority - leftPriority;
  });
}

function mapPriorityOrder(order) {
  const statusMeta = getStatusMeta(order);
  const timeline = Array.isArray(order.adminTimeline) ? order.adminTimeline : [];
  const lastActivity = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const latestNote = [...timeline].reverse().find((entry) => entry.type === 'note' && entry.note);
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    : 0;
  const addr = order.shippingAddress || {};
  const country = addr.country || 'Unknown country';

  return {
    id: order.id || order._id,
    reference: createOrderReference(order.id || order._id),
    customer: getCustomerName(order),
    email: addr.email || order.user?.email || '',
    city: addr.city || 'Unknown city',
    country,
    lane: getOrderLane(order),
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    total: formatCurrency(order.totalPrice),
    totalValue: Number(order.totalPrice || 0),
    eta: statusMeta.nextMilestone,
    items: (order.orderItems || []).map((item) => item.name),
    placedAt: formatDateLabel(order.createdAt),
    placedAtRaw: order.createdAt,
    paymentLabel: order.isPaid ? 'Paid' : 'Awaiting payment',
    isPaid: Boolean(order.isPaid),
    fulfillmentLabel: order.fulfillmentStatus || 'processing',
    availableActions: getOrderActions(order),
    itemCount,
    timelineCount: timeline.length,
    isCrossBorder: country.trim().toLowerCase() !== 'kenya',
    hasNote: Boolean(latestNote),
    lastActivity: lastActivity
      ? {
          label:
            lastActivity.type === 'note'
              ? `Note added by ${lastActivity.adminName || 'Admin'}`
              : `${String(lastActivity.action || 'updated').replace(/_/g, ' ')} by ${lastActivity.adminName || 'Admin'}`,
          at: formatDateLabel(lastActivity.createdAt),
        }
      : null,
    latestNote: latestNote
      ? {
          text: latestNote.note,
          by: latestNote.adminName || 'Admin',
          at: formatDateLabel(latestNote.createdAt),
        }
      : null,
  };
}

function mapAdminTimelineEntries(timeline = []) {
  return [...timeline]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((entry) => ({
      type: entry.type,
      action: entry.action,
      note: entry.note,
      adminName: entry.adminName,
      adminEmail: entry.adminEmail,
      createdAt: entry.createdAt,
      createdAtLabel: formatDateLabel(entry.createdAt),
    }));
}

function mapAdminOrderDetail(order = {}) {
  const statusMeta = getStatusMeta(order);
  const timeline = mapAdminTimelineEntries(Array.isArray(order.adminTimeline) ? order.adminTimeline : []);
  const addr = order.shippingAddress || {};
  const shippingEmail = addr.email || '';
  const accountCreatedAt = order.user?.createdAt || null;

  return {
    id: order.id || order._id,
    reference: createOrderReference(order.id || order._id),
    customer: {
      name: getCustomerName(order),
      shippingEmail,
      accountName: order.user?.name || '',
      accountEmail: order.user?.email || '',
      isGuest: !order.user,
      accountCreatedAt,
      accountCreatedAtLabel: accountCreatedAt ? formatDateLabel(accountCreatedAt) : '',
    },
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    eta: statusMeta.nextMilestone,
    paymentLabel: order.isPaid ? 'Paid' : 'Awaiting payment',
    isPaid: Boolean(order.isPaid),
    isDelivered: Boolean(order.isDelivered),
    fulfillmentLabel: order.fulfillmentStatus || 'processing',
    availableActions: getOrderActions(order),
    placedAt: order.createdAt,
    placedAtLabel: formatDateLabel(order.createdAt),
    updatedAt: order.updatedAt,
    updatedAtLabel: order.updatedAt ? formatDateLabel(order.updatedAt) : '',
    paidAt: order.paidAt,
    paidAtLabel: order.paidAt ? formatDateLabel(order.paidAt) : '',
    deliveredAt: order.deliveredAt,
    deliveredAtLabel: order.deliveredAt ? formatDateLabel(order.deliveredAt) : '',
    shippingAddress: {
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      email: shippingEmail,
      address: addr.address || '',
      city: addr.city || '',
      zip: addr.zip || '',
      country: addr.country || '',
    },
    payment: {
      method: order.paymentMethod || 'Credit Card',
      stripePaymentIntentId: order.stripePaymentIntentId || '',
      resultId: order.paymentResultId || '',
      resultStatus: order.paymentResultStatus || (order.isPaid ? 'paid' : 'pending'),
      updateTime: order.paymentResultUpdateTime || '',
      emailAddress: order.paymentResultEmail || '',
    },
    totals: {
      items: formatCurrency(order.itemsPrice),
      itemsValue: Number(order.itemsPrice || 0),
      shipping: formatCurrency(order.shippingPrice),
      shippingValue: Number(order.shippingPrice || 0),
      tax: formatCurrency(order.taxPrice),
      taxValue: Number(order.taxPrice || 0),
      total: formatCurrency(order.totalPrice),
      totalValue: Number(order.totalPrice || 0),
    },
    items: (order.orderItems || []).map((item) => {
      const quantity = Number(item.qty || 0);
      const unitPriceValue = Number(item.price || 0);
      const lineTotalValue = quantity * unitPriceValue;

      return {
        productId: item.productId || '',
        name: item.name,
        qty: quantity,
        image: item.image || '',
        unitPrice: formatCurrency(unitPriceValue),
        unitPriceValue,
        lineTotal: formatCurrency(lineTotalValue),
        lineTotalValue,
      };
    }),
    timeline,
  };
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
};
