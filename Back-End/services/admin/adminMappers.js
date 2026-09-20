// services/admin/adminMappers.js

function createOrderReference(orderId = '') {
  return `BA-${String(orderId).slice(-6).toUpperCase()}`;
}

function getCustomerName(order = {}) {
  const addr = order.shippingAddress || {};
  const fullName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
  if (fullName) return fullName;
  return order.user?.name || addr.email || 'Guest checkout';
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

function mapPriorityOrder(order, { getStatusMeta, getOrderLane, formatDateLabel, formatCurrency, getOrderActions }) {
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

function mapAdminTimelineEntries(timeline = [], formatDateLabel) {
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

function mapAdminOrderDetail(
  order = {},
  { getStatusMeta, formatDateLabel, formatCurrency, getOrderActions, mapAdminTimelineEntries }
) {
  const statusMeta = getStatusMeta(order);
  const timeline = mapAdminTimelineEntries(
    Array.isArray(order.adminTimeline) ? order.adminTimeline : [],
    formatDateLabel
  );
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
  createOrderReference,
  getCustomerName,
  sortOrdersForPriority,
  mapPriorityOrder,
  mapAdminTimelineEntries,
  mapAdminOrderDetail,
};
