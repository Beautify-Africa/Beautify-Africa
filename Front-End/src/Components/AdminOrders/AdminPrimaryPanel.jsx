import DispatchCadenceCard from './DispatchCadenceCard';
import EmptyPanel from './EmptyPanel';
import FadeIn from '../Shared/FadeIn';
import OrderCard from './OrderCard';
import StatusBadge from './StatusBadge';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

const DEFAULT_QUEUE_FILTERS = {
  search: '',
  focus: 'all',
  sort: 'priority',
};

const QUEUE_FOCUS_OPTIONS = [
  { value: 'all', label: 'All live' },
  { value: 'ready_to_pack', label: 'Ready to pack' },
  { value: 'payment_review', label: 'Payment review' },
  { value: 'awaiting_courier', label: 'Awaiting courier' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'cross_border', label: 'Cross-border' },
  { value: 'high_value', label: 'High value' },
  { value: 'with_notes', label: 'With notes' },
];

function normalizeSearchValue(value = '') {
  return String(value).trim().toLowerCase();
}

function matchesQueueFocus(order = {}, focus = 'all') {
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

function matchesQueueSearch(order = {}, searchTerm = '') {
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

function sortQueueOrders(orders = [], sort = 'priority') {
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

export default function AdminPrimaryPanel({
  dashboard,
  busyActionKey,
  timelineByOrderId,
  onOrderAction,
  onAddOrderNote,
  onLoadOrderTimeline,
  onOpenOrderDetail,
}) {
  const [queueFilters, setQueueFilters] = useLocalStorageState(
    'beautify-africa:priority-queue-filters',
    DEFAULT_QUEUE_FILTERS
  );
  const activeQueueFilters = {
    ...DEFAULT_QUEUE_FILTERS,
    ...(queueFilters || {}),
  };

  const orders = Array.isArray(dashboard.priorityOrders) ? dashboard.priorityOrders : [];
  const cadence = dashboard.dispatchCadence;
  const normalizedSearch = normalizeSearchValue(activeQueueFilters.search);
  const filteredOrders = sortQueueOrders(
    orders.filter(
      (order) =>
        matchesQueueFocus(order, activeQueueFilters.focus) &&
        matchesQueueSearch(order, normalizedSearch)
    ),
    activeQueueFilters.sort
  );
  const hasActiveFilters =
    Boolean(normalizedSearch) ||
    activeQueueFilters.focus !== DEFAULT_QUEUE_FILTERS.focus ||
    activeQueueFilters.sort !== DEFAULT_QUEUE_FILTERS.sort;

  function updateQueueFilter(field, value) {
    setQueueFilters((previous) => ({
      ...DEFAULT_QUEUE_FILTERS,
      ...(previous || {}),
      [field]: value,
    }));
  }

  function resetQueueFilters() {
    setQueueFilters(DEFAULT_QUEUE_FILTERS);
  }

  return (
    <FadeIn className="h-full">
      <div className="flex h-full flex-col gap-6">
        <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                Priority Dispatch Queue
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                Orders Needing Direct Action
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              Target active fulfillment cards by status, review flags, or search criteria before ledger export.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.7fr)_auto]">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Search Queue
                </label>
                <input
                  type="text"
                  value={activeQueueFilters.search}
                  onChange={(event) => updateQueueFilter('search', event.target.value)}
                  placeholder="Reference, customer, city, or SKU..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Sort Order
                </label>
                <select
                  value={activeQueueFilters.sort}
                  onChange={(event) => updateQueueFilter('sort', event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="priority">Priority Score</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_total">Highest Total</option>
                  <option value="notes_first">Notes First</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetQueueFilters}
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Reset Focus
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUEUE_FOCUS_OPTIONS.map((option) => {
                const count = orders.filter((order) =>
                  matchesQueueFocus(order, option.value)
                ).length;
                const isActive = activeQueueFilters.focus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateQueueFilter('focus', option.value)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {option.label} <span className="ml-1.5 opacity-70 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
              Displaying {filteredOrders.length} of {orders.length} active priority card
              {orders.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  timeline={timelineByOrderId[order.id] || []}
                  busyActionKey={busyActionKey}
                  onOrderAction={onOrderAction}
                  onAddOrderNote={onAddOrderNote}
                  onLoadOrderTimeline={onLoadOrderTimeline}
                  onOpenOrderDetail={onOpenOrderDetail}
                />
              ))
            ) : (
              <EmptyPanel
                title={hasActiveFilters ? 'No orders match this focus' : 'Priority queue empty'}
                message={
                  hasActiveFilters
                    ? 'Adjust the dashboard focus above or clear the filters to restore the wider queue.'
                    : 'No orders currently require immediate manual attention.'
                }
              />
            )}
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-2 border-b border-zinc-800/80 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                Dispatch Rhythm
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
                Fulfillment Velocity &amp; Carrier Windows
              </h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {cadence.length > 0 ? (
              cadence.map((item) => <DispatchCadenceCard key={item.label} {...item} />)
            ) : (
              <EmptyPanel
                title="No cadence data"
                message="Dispatch timing cards will appear once active fulfillment data is available."
              />
            )}
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <StatusBadge tone="amber">{dashboard.atelierNote.title}</StatusBadge>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              {dashboard.atelierNote.body}
            </p>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}
