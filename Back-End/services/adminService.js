const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const redisClient = require('../config/redis');

const FULFILLMENT_STATUSES = ['processing', 'packed', 'shipped', 'delivered'];
const SUPPORTED_ADMIN_ACTIONS = ['mark_paid', 'pack', 'ship', 'deliver'];
const SUPPORTED_ADMIN_ORDER_SORTS = ['newest', 'oldest', 'total_high', 'total_low'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PRODUCT_CACHE_VERSION_KEY = 'products:version';

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
  const timeline = Array.isArray(order.adminTimeline) ? order.adminTimeline : [];
  const lastActivity = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const latestNote = [...timeline].reverse().find((entry) => entry.type === 'note' && entry.note);
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    : 0;
  const country = order.shippingAddress?.country || 'Unknown country';

  return {
    id: order._id,
    reference: createOrderReference(order._id),
    customer: getCustomerName(order),
    email: order.shippingAddress?.email || order.user?.email || '',
    city: order.shippingAddress?.city || 'Unknown city',
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
  const shippingEmail = order.shippingAddress?.email || '';
  const accountCreatedAt = order.user?.createdAt || null;

  return {
    id: order._id,
    reference: createOrderReference(order._id),
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
      firstName: order.shippingAddress?.firstName || '',
      lastName: order.shippingAddress?.lastName || '',
      email: shippingEmail,
      address: order.shippingAddress?.address || '',
      city: order.shippingAddress?.city || '',
      zip: order.shippingAddress?.zip || '',
      country: order.shippingAddress?.country || '',
    },
    payment: {
      method: order.paymentMethod || 'Credit Card',
      stripePaymentIntentId: order.stripePaymentIntentId || '',
      resultId: order.paymentResult?.id || '',
      resultStatus: order.paymentResult?.status || (order.isPaid ? 'paid' : 'pending'),
      updateTime: order.paymentResult?.update_time || '',
      emailAddress: order.paymentResult?.email_address || '',
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
        productId: item.product?._id || item.product || '',
        productSlug: item.product?.slug || '',
        productBrand: item.product?.brand || '',
        productCategory: item.product?.category || '',
        name: item.name,
        qty: quantity,
        image: item.image || item.product?.image || '',
        unitPrice: formatCurrency(unitPriceValue),
        unitPriceValue,
        lineTotal: formatCurrency(lineTotalValue),
        lineTotalValue,
      };
    }),
    timeline,
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
    priorityOrders: sortOrdersForPriority(sortedOrders, now).slice(0, 8).map(mapPriorityOrder),
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
      'user orderItems shippingAddress totalPrice isPaid paidAt fulfillmentStatus isDelivered deliveredAt createdAt adminTimeline'
    )
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return buildAdminDashboardFromOrders(orders, new Date());
}

function normalizeAdminNote(note = '') {
  return String(note || '').trim().replace(/\s+/g, ' ').slice(0, 600);
}

function appendOrderTimelineEntry(order, { type, action = '', note = '', adminUser = null }) {
  if (!order) return;

  const normalizedNote = normalizeAdminNote(note);
  if (type === 'note' && !normalizedNote) {
    return;
  }

  order.adminTimeline = Array.isArray(order.adminTimeline) ? order.adminTimeline : [];
  order.adminTimeline.push({
    type,
    action,
    note: normalizedNote,
    adminName: adminUser?.name || 'Admin',
    adminEmail: adminUser?.email || '',
  });
}

function buildAdminOrderFilter(query = {}) {
  const filter = {};
  const status = normalizeAdminQueryEnum(
    query.status,
    ['all', ...FULFILLMENT_STATUSES],
    'order status'
  );
  const payment = normalizeAdminQueryEnum(query.payment, ['all', 'paid', 'unpaid'], 'payment filter');
  const country = String(query.country || '').trim();
  const search = String(query.search || '').trim();

  if (status !== 'all') {
    filter.fulfillmentStatus = status;
  }

  if (payment === 'paid') {
    filter.isPaid = true;
  } else if (payment === 'unpaid') {
    filter.isPaid = false;
  }

  if (country) {
    filter['shippingAddress.country'] = new RegExp(`^${escapeRegex(country)}$`, 'i');
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    const searchConditions = [
      { 'shippingAddress.firstName': searchRegex },
      { 'shippingAddress.lastName': searchRegex },
      { 'shippingAddress.email': searchRegex },
      { 'shippingAddress.city': searchRegex },
      { 'shippingAddress.country': searchRegex },
      { 'orderItems.name': searchRegex },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchConditions.push({ _id: search });
    }

    filter.$or = searchConditions;
  }

  return {
    filter,
    normalizedFilters: {
      status,
      payment,
      country,
      search,
    },
  };
}

function buildAdminOrderSort(sortValue = 'newest') {
  const sort = normalizeAdminQueryEnum(
    sortValue,
    SUPPORTED_ADMIN_ORDER_SORTS,
    'order sort',
    'newest'
  );

  if (sort === 'oldest') {
    return {
      sort,
      sortDefinition: { createdAt: 1 },
    };
  }

  if (sort === 'total_high') {
    return {
      sort,
      sortDefinition: { totalPrice: -1, createdAt: -1 },
    };
  }

  if (sort === 'total_low') {
    return {
      sort,
      sortDefinition: { totalPrice: 1, createdAt: -1 },
    };
  }

  return {
    sort,
    sortDefinition: { createdAt: -1 },
  };
}

function mapAdminOrderRow(order = {}) {
  const statusMeta = getStatusMeta(order);
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
    : 0;

  return {
    id: order._id,
    reference: createOrderReference(order._id),
    customer: getCustomerName(order),
    email: order.shippingAddress?.email || order.user?.email || '',
    city: order.shippingAddress?.city || 'Unknown city',
    country: order.shippingAddress?.country || 'Unknown country',
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

async function updateAdminOrder(orderId, action, adminUser = null, note = '') {
  ensureValidOrderId(orderId);

  const order = await Order.findById(orderId);
  const normalizedAction = normalizeAdminAction(action);
  applyAdminOrderAction(order, normalizedAction);
  appendOrderTimelineEntry(order, {
    type: 'action',
    action: normalizedAction,
    adminUser,
    note,
  });
  await order.save();

  return order;
}

async function addAdminOrderNote(orderId, note, adminUser) {
  ensureValidOrderId(orderId);

  const normalizedNote = normalizeAdminNote(note);
  if (!normalizedNote) {
    throw createAdminError('Note is required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw createAdminError('Order not found', 404);
  }

  appendOrderTimelineEntry(order, {
    type: 'note',
    note: normalizedNote,
    adminUser,
  });

  await order.save();

  return {
    orderId: order._id,
    note: normalizedNote,
  };
}

async function fetchAdminOrderTimeline(orderId) {
  ensureValidOrderId(orderId);

  const order = await Order.findById(orderId)
    .select('adminTimeline')
    .lean();

  if (!order) {
    throw createAdminError('Order not found', 404);
  }

  return mapAdminTimelineEntries(Array.isArray(order.adminTimeline) ? order.adminTimeline : []);
}

async function fetchAdminOrderDetail(orderId) {
  ensureValidOrderId(orderId);

  const order = await Order.findById(orderId)
    .select(
      'user stripePaymentIntentId orderItems shippingAddress paymentMethod paymentResult itemsPrice taxPrice shippingPrice totalPrice isPaid paidAt fulfillmentStatus isDelivered deliveredAt createdAt updatedAt adminTimeline'
    )
    .populate('user', 'name email createdAt')
    .populate('orderItems.product', 'name slug brand category image')
    .lean();

  if (!order) {
    throw createAdminError('Order not found', 404);
  }

  return mapAdminOrderDetail(order);
}

async function fetchAdminOrders(query = {}) {
  const { filter, normalizedFilters } = buildAdminOrderFilter(query);
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
  const { sort, sortDefinition } = buildAdminOrderSort(query.sort);
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .select(
        'user orderItems shippingAddress totalPrice isPaid paidAt fulfillmentStatus isDelivered deliveredAt createdAt'
      )
      .populate('user', 'name email')
      .sort(sortDefinition)
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders: orders.map(mapAdminOrderRow),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    },
    filters: {
      ...normalizedFilters,
      sort,
    },
  };
}

function ensureValidProductId(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createAdminError('Invalid product ID format');
  }
}

function normalizeNumberInput(value, fallbackValue = 0) {
  if (value === undefined || value === null || value === '') {
    return fallbackValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function normalizeStringArray(value = []) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

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
    originalPrice:
      payload.originalPrice === undefined || payload.originalPrice === null || payload.originalPrice === ''
        ? null
        : normalizeNumberInput(payload.originalPrice, null),
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
    if (missing.length > 0) {
      throw createAdminError(`Missing required product field(s): ${missing.join(', ')}`);
    }
  }

  if (normalized.stockQuantity < 0) {
    throw createAdminError('Stock quantity cannot be negative');
  }

  if (normalized.lowStockThreshold < 0) {
    throw createAdminError('Low stock threshold cannot be negative');
  }

  if (normalized.price < 0) {
    throw createAdminError('Price cannot be negative');
  }

  if (normalized.originalPrice !== null && normalized.originalPrice < 0) {
    throw createAdminError('Original price cannot be negative');
  }

  normalized.inStock = normalized.stockQuantity > 0;
  return normalized;
}

function buildAdminProductFilter(query = {}) {
  const filter = {};

  const normalizedSearch = String(query.search || '').trim();
  if (normalizedSearch) {
    const searchRegex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex },
    ];
  }

  const archived = String(query.archived || '').toLowerCase();
  if (archived === 'true') {
    filter.isArchived = true;
  } else if (archived === 'false' || archived === '') {
    filter.isArchived = false;
  }

  const lowStock = String(query.lowStock || '').toLowerCase();
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
  }

  return filter;
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
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    },
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
  const product = await Product.findById(productId);

  if (!product) {
    throw createAdminError('Product not found', 404);
  }

  Object.assign(product, normalizedPayload);
  await product.save();
  await bumpProductCacheVersion();

  return product;
}

async function setAdminProductArchived(productId, isArchived) {
  ensureValidProductId(productId);

  const product = await Product.findById(productId);
  if (!product) {
    throw createAdminError('Product not found', 404);
  }

  product.isArchived = Boolean(isArchived);
  await product.save();
  await bumpProductCacheVersion();

  return product;
}

module.exports = {
  FULFILLMENT_STATUSES,
  SUPPORTED_ADMIN_ACTIONS,
  buildAdminDashboardFromOrders,
  fetchAdminDashboard,
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
