export const DEFAULT_QUEUE_FILTERS = {
  search: '',
  focus: 'all',
  sort: 'priority',
};

export const QUEUE_FOCUS_OPTIONS = [
  { value: 'all', label: 'All live' },
  { value: 'ready_to_pack', label: 'Ready to pack' },
  { value: 'payment_review', label: 'Payment review' },
  { value: 'awaiting_courier', label: 'Awaiting courier' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'cross_border', label: 'Cross-border' },
  { value: 'high_value', label: 'High value' },
  { value: 'with_notes', label: 'With notes' },
];

export function normalizeSearchValue(value = '') {
  return String(value).trim().toLowerCase();
}

export function matchesQueueFocus(order = {}, focus = 'all') {
  if (focus === 'ready_to_pack') {
    return order.isPaid && order.fulfillmentLabel === 'processing';
  }

  if (focus === 'payment_review') {
    return !order.isPaid;
  }

  if (focus === 'awaiting_courier') {
    return order.fulfillmentLabel === 'packed';
  }

  if (focus === 'in_transit') {
    return order.fulfillmentLabel === 'shipped';
  }

  if (focus === 'cross_border') {
    return Boolean(order.isCrossBorder);
  }

  if (focus === 'high_value') {
    return Number(order.totalValue || 0) >= 180;
  }

  if (focus === 'with_notes') {
    return Boolean(order.hasNote);
  }

  return true;
}

export function matchesQueueSearch(order = {}, searchTerm = '') {
  if (!searchTerm) {
    return true;
  }

  const fields = [
    order.reference,
    order.customer,
    order.email,
    order.city,
    order.country,
    order.lane,
    order.status,
    order.paymentLabel,
    order.fulfillmentLabel,
    ...(Array.isArray(order.items) ? order.items : []),
    order.latestNote?.text,
    order.lastActivity?.label,
  ];

  return fields.some((field) => normalizeSearchValue(field).includes(searchTerm));
}

export function sortQueueOrders(orders = [], sort = 'priority') {
  if (sort === 'newest') {
    return [...orders].sort(
      (left, right) => new Date(right.placedAtRaw) - new Date(left.placedAtRaw)
    );
  }

  if (sort === 'oldest') {
    return [...orders].sort(
      (left, right) => new Date(left.placedAtRaw) - new Date(right.placedAtRaw)
    );
  }

  if (sort === 'highest_total') {
    return [...orders].sort(
      (left, right) => Number(right.totalValue || 0) - Number(left.totalValue || 0)
    );
  }

  if (sort === 'notes_first') {
    return [...orders].sort(
      (left, right) => Number(Boolean(right.hasNote)) - Number(Boolean(left.hasNote))
    );
  }

  return orders;
}
