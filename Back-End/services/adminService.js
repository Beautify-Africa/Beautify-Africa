const mongoose = require('mongoose');
const Order = require('../models/Order');

const FULFILLMENT_STATUSES = ['processing', 'packed', 'shipped', 'delivered'];
const SUPPORTED_ADMIN_ACTIONS = ['mark_paid', 'pack', 'ship', 'deliver'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function createAdminError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAdminAction(action = '') {
  return String(action).trim().toLowerCase();
}

function ensureValidOrderId(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
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
  const fullName = `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim();

  if (fullName) {
    return fullName;
  }

  return order.user?.name || order.shippingAddress?.email || 'Guest checkout';
}

function getRegionLabel(country = '') {
  return country || 'Unassigned region';
}

function getOrderLane(order = {}) {
  const country = order.shippingAddress?.country || '';
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

  return {
    id: order._id,
    reference: createOrderReference(order._id),
    customer: getCustomerName(order),
    city: order.shippingAddress?.city || 'Unknown city',
    country: order.shippingAddress?.country || 'Unknown country',
    lane: getOrderLane(order),
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    total: formatCurrency(order.totalPrice),
    eta: statusMeta.nextMilestone,
    items: (order.orderItems || []).map((item) => item.name),
    placedAt: formatDateLabel(order.createdAt),
    paymentLabel: order.isPaid ? 'Paid' : 'Awaiting payment',
    fulfillmentLabel: order.fulfillmentStatus || 'processing',
    availableActions: getOrderActions(order),
  };
}

function buildRegionalPulse(orders = [], now = new Date()) {
  if (orders.length === 0) return [];

  const currentWindowStart = new Date(now.getTime() - 7 * DAY_IN_MS);
  const previousWindowStart = new Date(now.getTime() - 14 * DAY_IN_MS);
  const grouped = new Map();

  for (const order of orders) {
    const region = getRegionLabel(order.shippingAddress?.country);
    const bucket = grouped.get(region) || {
      count: 0,
      current: 0,
      previous: 0,
    };

    bucket.count += 1;

    const createdAt = new Date(order.createdAt);
    if (createdAt >= currentWindowStart) {
      bucket.current += 1;
    } else if (createdAt >= previousWindowStart) {
      bucket.previous += 1;
    }

    grouped.set(region, bucket);
  }

  return [...grouped.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 3)
    .map(([region, bucket]) => {
      const share = orders.length ? (bucket.count / orders.length) * 100 : 0;
      const movement = bucket.current - bucket.previous;

      return {
        region,
        share: formatPercent(share),
        movement: `${movement >= 0 ? '+' : ''}${movement}`,
        note:
          bucket.current > 0
            ? `${bucket.current} recent order${bucket.current === 1 ? '' : 's'} landed here in the last 7 days.`
            : 'No fresh orders landed in this region during the last 7 days.',
      };
    });
}

function buildWatchlist(orders = [], now = new Date()) {
  const unpaidOrders = orders.filter((order) => !order.isPaid);
  const staleProcessing = orders.filter(
    (order) =>
      order.isPaid &&
      order.fulfillmentStatus === 'processing' &&
      now - new Date(order.createdAt) > DAY_IN_MS
  );
  const shippedOrders = orders.filter((order) => order.fulfillmentStatus === 'shipped');
  const crossBorderOrders = orders.filter(
    (order) => (order.shippingAddress?.country || '').trim().toLowerCase() !== 'kenya'
  );

  const watchItems = [];

  if (unpaidOrders.length > 0) {
    watchItems.push({
      title: 'Payment hold',
      detail: `${unpaidOrders.length} order${unpaidOrders.length === 1 ? '' : 's'} still need payment confirmation before fulfillment can advance.`,
      tone: 'amber',
    });
  }

  if (staleProcessing.length > 0) {
    watchItems.push({
      title: 'Packing backlog',
      detail: `${staleProcessing.length} paid order${staleProcessing.length === 1 ? '' : 's'} have remained in processing for more than 24 hours.`,
      tone: 'rose',
    });
  }

  if (shippedOrders.length > 0) {
    watchItems.push({
      title: 'Courier follow-up',
      detail: `${shippedOrders.length} shipment${shippedOrders.length === 1 ? '' : 's'} are in transit and need delivery confirmation monitoring.`,
      tone: 'emerald',
    });
  }

  if (crossBorderOrders.length > 0) {
    watchItems.push({
      title: 'Cross-border checks',
      detail: `${crossBorderOrders.length} order${crossBorderOrders.length === 1 ? '' : 's'} are heading outside Kenya and may need address or customs review.`,
      tone: 'stone',
    });
  }

  if (watchItems.length === 0) {
    watchItems.push({
      title: 'Studio calm',
      detail: 'No urgent blockers are showing in the live queue right now.',
      tone: 'emerald',
    });
  }

  return watchItems.slice(0, 3);
}

function buildDispatchCadence(orders = [], now = new Date()) {
  const readyToPack = orders.filter((order) => order.isPaid && order.fulfillmentStatus === 'processing').length;
  const packed = orders.filter((order) => order.fulfillmentStatus === 'packed').length;
  const shipped = orders.filter((order) => order.fulfillmentStatus === 'shipped').length;

  return [
    {
      label: 'Pack wave',
      time: readyToPack > 0 ? 'Now' : 'Clear',
      note:
        readyToPack > 0
          ? `${readyToPack} paid order${readyToPack === 1 ? '' : 's'} are ready to move into the packing lane.`
          : 'No paid orders are waiting for the next packing wave.',
      tone: readyToPack > 0 ? 'amber' : 'stone',
    },
    {
      label: 'Courier handoff',
      time: packed > 0 ? 'Next pickup' : 'Quiet',
      note:
        packed > 0
          ? `${packed} parcel${packed === 1 ? '' : 's'} are packed and waiting for courier pickup.`
          : 'Nothing is sealed and waiting in the courier bay right now.',
      tone: packed > 0 ? 'stone' : 'emerald',
    },
    {
      label: 'Delivery loop',
      time: shipped > 0 ? formatDateLabel(now) : 'Standby',
      note:
        shipped > 0
          ? `${shipped} order${shipped === 1 ? '' : 's'} are in transit and should be watched for confirmation updates.`
          : 'No in-transit deliveries need follow-up at the moment.',
      tone: shipped > 0 ? 'emerald' : 'stone',
    },
  ];
}

function buildRitualChecklist(orders = []) {
  const readyToPack = orders.filter((order) => order.isPaid && order.fulfillmentStatus === 'processing').length;
  const packed = orders.filter((order) => order.fulfillmentStatus === 'packed').length;
  const unpaid = orders.filter((order) => !order.isPaid).length;
  const crossBorder = orders.filter(
    (order) => (order.shippingAddress?.country || '').trim().toLowerCase() !== 'kenya'
  ).length;

  const items = [];

  if (readyToPack > 0) {
    items.push(`Pack ${readyToPack} paid order${readyToPack === 1 ? '' : 's'} before the next courier wave.`);
  }

  if (packed > 0) {
    items.push(`Move ${packed} sealed parcel${packed === 1 ? '' : 's'} into the courier handoff queue.`);
  }

  if (unpaid > 0) {
    items.push(`Review ${unpaid} checkout${unpaid === 1 ? '' : 's'} that are still waiting for payment confirmation.`);
  }

  if (crossBorder > 0) {
    items.push(`Double-check address details on ${crossBorder} cross-border order${crossBorder === 1 ? '' : 's'}.`);
  }

  if (items.length === 0) {
    items.push('The live queue is quiet right now. Keep an eye on new checkouts and courier confirmations.');
  }

  return items.slice(0, 4);
}

function buildLaneCards(orders = []) {
  const readyToPack = orders.filter((order) => order.isPaid && order.fulfillmentStatus === 'processing').length;
  const paymentReview = orders.filter((order) => !order.isPaid).length;
  const awaitingCourier = orders.filter((order) => order.fulfillmentStatus === 'packed').length;
  const inTransit = orders.filter((order) => order.fulfillmentStatus === 'shipped').length;

  return [
    {
      title: 'Ready To Pack',
      count: readyToPack,
      note:
        readyToPack > 0
          ? 'These paid orders can move directly into wrapping and label prep.'
          : 'No paid orders are waiting for the packing bench.',
      tone: 'amber',
    },
    {
      title: 'Payment Review',
      count: paymentReview,
      note:
        paymentReview > 0
          ? 'Hold these carts until payment clears or a manual override is confirmed.'
          : 'No orders are blocked by payment right now.',
      tone: 'rose',
    },
    {
      title: 'Awaiting Courier',
      count: awaitingCourier,
      note:
        awaitingCourier > 0
          ? 'Packed parcels are queued and ready for the next courier scan.'
          : 'The courier bay is clear at the moment.',
      tone: 'stone',
    },
    {
      title: 'In Transit',
      count: inTransit,
      note:
        inTransit > 0
          ? 'These orders have left the studio and now need delivery follow-through.'
          : 'No active courier trips are open right now.',
      tone: 'emerald',
    },
  ];
}

function buildStats(orders = [], now = new Date()) {
  const liveOrders = orders.filter((order) => order.fulfillmentStatus !== 'delivered').length;
  const recentPaidRevenue = orders
    .filter((order) => order.isPaid && order.paidAt && now - new Date(order.paidAt) <= DAY_IN_MS)
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const vipFollowUps = orders.filter(
    (order) =>
      !order.isPaid ||
      order.fulfillmentStatus === 'packed' ||
      (order.fulfillmentStatus === 'processing' && now - new Date(order.createdAt) > 12 * 60 * 60 * 1000)
  ).length;
  const payableLiveOrders = orders.filter((order) => order.fulfillmentStatus !== 'delivered');
  const readyForDispatch = payableLiveOrders.filter((order) => order.isPaid).length;
  const readiness = payableLiveOrders.length ? (readyForDispatch / payableLiveOrders.length) * 100 : 100;

  return [
    {
      label: 'Live Order Queue',
      value: String(liveOrders),
      note:
        liveOrders > 0
          ? `${readyForDispatch} already cleared for dispatch movement.`
          : 'No open orders are waiting in the studio queue.',
      tone: 'amber',
    },
    {
      label: 'Revenue Locked',
      value: formatCurrency(recentPaidRevenue),
      note: 'Captured from paid orders in the last 24 hours.',
      tone: 'stone',
    },
    {
      label: 'Follow-Ups Needed',
      value: String(vipFollowUps).padStart(2, '0'),
      note: 'Orders needing manual attention, payment review, or courier action.',
      tone: 'emerald',
    },
    {
      label: 'Packaging Readiness',
      value: formatPercent(readiness),
      note: 'Share of live orders that are already paid and ready to move forward.',
      tone: 'rose',
    },
  ];
}

function buildRecentLedger(orders = []) {
  return orders.slice(0, 6).map((order) => {
    const statusMeta = getStatusMeta(order);

    return {
      id: order._id,
      reference: createOrderReference(order._id),
      customer: getCustomerName(order),
      city: order.shippingAddress?.city || 'Unknown city',
      total: formatCurrency(order.totalPrice),
      paymentLabel: order.isPaid ? 'Paid' : 'Awaiting payment',
      statusLabel: statusMeta.label,
      tone: statusMeta.tone,
      placedAt: formatDateLabel(order.createdAt),
    };
  });
}

function buildHeroBadges(orders = []) {
  const processing = orders.filter((order) => order.fulfillmentStatus === 'processing' && order.isPaid).length;
  const packed = orders.filter((order) => order.fulfillmentStatus === 'packed').length;
  const unpaid = orders.filter((order) => !order.isPaid).length;

  return [
    { label: `${processing} ready for pack review`, tone: 'amber' },
    { label: `${packed} in courier prep`, tone: 'stone' },
    { label: `${unpaid} awaiting payment`, tone: unpaid > 0 ? 'rose' : 'emerald' },
  ];
}

function buildAtelierNote(orders = []) {
  const liveOrders = orders.filter((order) => order.fulfillmentStatus !== 'delivered').length;
  const delivered = orders.filter((order) => order.fulfillmentStatus === 'delivered').length;

  return {
    title: 'Operations note',
    body:
      liveOrders > 0
        ? `${liveOrders} active order${liveOrders === 1 ? '' : 's'} are still moving through the studio while ${delivered} delivered order${delivered === 1 ? '' : 's'} now sit in the archive lane. Keep the queue progressing in payment, packing, courier, and delivery order.`
        : 'The active queue is clear right now. This is a good moment to audit recent deliveries and prepare for the next checkout wave.',
  };
}

function buildAdminDashboardFromOrders(orders = [], now = new Date()) {
  const sortedOrders = orders;

  return {
    heroBadges: buildHeroBadges(sortedOrders),
    stats: buildStats(sortedOrders, now),
    ritualChecklist: buildRitualChecklist(sortedOrders),
    priorityOrders: sortOrdersForPriority(sortedOrders, now).slice(0, 4).map(mapPriorityOrder),
    lanes: buildLaneCards(sortedOrders),
    watchlist: buildWatchlist(sortedOrders, now),
    regionalPulse: buildRegionalPulse(sortedOrders, now),
    dispatchCadence: buildDispatchCadence(sortedOrders, now),
    atelierNote: buildAtelierNote(sortedOrders),
    recentOrders: buildRecentLedger(sortedOrders),
  };
}

async function fetchAdminDashboard() {
  const orders = await Order.find({})
    .select(
      'user orderItems shippingAddress totalPrice isPaid paidAt fulfillmentStatus isDelivered deliveredAt createdAt'
    )
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return buildAdminDashboardFromOrders(orders, new Date());
}

function applyAdminOrderAction(order, action) {
  if (!order) {
    throw createAdminError('Order not found', 404);
  }

  const normalizedAction = normalizeAdminAction(action);

  if (!normalizedAction) {
    throw createAdminError('Action is required');
  }

  if (!SUPPORTED_ADMIN_ACTIONS.includes(normalizedAction)) {
    throw createAdminError(`Unsupported admin action: ${action}`);
  }

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
    order.deliveredAt = undefined;
    return order;
  }

  if (normalizedAction === 'ship') {
    ensureOrderStatus(order, 'packed', 'ship');
    order.fulfillmentStatus = 'shipped';
    order.isDelivered = false;
    order.deliveredAt = undefined;
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

async function updateAdminOrder(orderId, action) {
  ensureValidOrderId(orderId);

  const order = await Order.findById(orderId);
  applyAdminOrderAction(order, action);
  await order.save();

  return order;
}

module.exports = {
  FULFILLMENT_STATUSES,
  SUPPORTED_ADMIN_ACTIONS,
  buildAdminDashboardFromOrders,
  fetchAdminDashboard,
  updateAdminOrder,
  applyAdminOrderAction,
};
