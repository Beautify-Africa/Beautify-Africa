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
  return {
    heroBadges: asArray(payload.heroBadges).length > 0 ? payload.heroBadges : FALLBACK_HERO_BADGES,
    stats: asArray(payload.stats),
    ritualChecklist: asArray(payload.ritualChecklist),
    priorityOrders: asArray(payload.priorityOrders),
    lanes: asArray(payload.lanes),
    watchlist: asArray(payload.watchlist),
    regionalPulse: asArray(payload.regionalPulse),
    dispatchCadence: asArray(payload.dispatchCadence),
    atelierNote: asAtelierNote(payload.atelierNote),
    recentOrders: asArray(payload.recentOrders),
  };
}
