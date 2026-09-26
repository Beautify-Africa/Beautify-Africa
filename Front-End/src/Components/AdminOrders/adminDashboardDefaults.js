const EMPTY_ATELIER_NOTE = {
  title: 'Operations note',
  body: 'No active operations note is available right now.',
};

const FALLBACK_HERO_BADGES = [
  { label: 'Queue review', tone: 'stone' },
  { label: 'Courier wave aligned', tone: 'emerald' },
  { label: 'Payment signals monitored', tone: 'amber' },
];

export const DEFAULT_ADMIN_DASHBOARD = {
  heroBadges: FALLBACK_HERO_BADGES,
  stats: [],
  ritualChecklist: [],
  priorityOrders: [],
  lanes: [],
  watchlist: [],
  regionalPulse: [],
  dispatchCadence: [],
  atelierNote: EMPTY_ATELIER_NOTE,
  recentOrders: [],
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asAtelierNote(value) {
  if (!value || typeof value !== 'object') {
    return EMPTY_ATELIER_NOTE;
  }

  return {
    title: value.title || EMPTY_ATELIER_NOTE.title,
    body: value.body || EMPTY_ATELIER_NOTE.body,
  };
}

export function normalizeAdminDashboard(payload = {}) {
  const stats = asArray(payload.stats);
  const priorityOrders = asArray(
    payload.priorityOrders && payload.priorityOrders.length > 0
      ? payload.priorityOrders
      : payload.priorityQueue
  );

  const derivedStats =
    stats.length > 0
      ? stats
      : payload.metrics
        ? [
            {
              label: 'Live Order Queue',
              value: String(payload.metrics.totalOrders ?? 0),
              note: `${payload.metrics.paidOrders ?? 0} settled payments`,
              tone: 'stone',
            },
            {
              label: 'Gross Settlement',
              value: String(payload.metrics.totalRevenue ?? '$0.00'),
              note: `${payload.metrics.recentRevenue ?? '$0.00'} in last 7d`,
              tone: 'emerald',
            },
            {
              label: 'Average Basket',
              value: String(payload.metrics.averageOrderValue ?? '$0.00'),
              note: 'Per transaction realized',
              tone: 'amber',
            },
            {
              label: 'Inventory Alerts',
              value: String(payload.metrics.lowStockItemsCount ?? 0),
              note: 'SKUs requiring replenishment',
              tone: Number(payload.metrics.lowStockItemsCount || 0) > 0 ? 'rose' : 'emerald',
            },
          ]
        : [];

  return {
    heroBadges: asArray(payload.heroBadges).length > 0 ? payload.heroBadges : FALLBACK_HERO_BADGES,
    stats: derivedStats,
    ritualChecklist: asArray(payload.ritualChecklist),
    priorityOrders,
    lanes: asArray(payload.lanes),
    watchlist: asArray(payload.watchlist),
    regionalPulse: asArray(payload.regionalPulse),
    dispatchCadence: asArray(payload.dispatchCadence),
    atelierNote: asAtelierNote(payload.atelierNote),
    recentOrders: asArray(payload.recentOrders),
  };
}
