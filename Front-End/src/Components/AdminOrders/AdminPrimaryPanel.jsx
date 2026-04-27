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
    return [...orders].sort((left, right) => new Date(right.placedAtRaw) - new Date(left.placedAtRaw));
  }

  if (sort === 'oldest') {
    return [...orders].sort((left, right) => new Date(left.placedAtRaw) - new Date(right.placedAtRaw));
  }

  if (sort === 'highest_total') {
    return [...orders].sort((left, right) => Number(right.totalValue || 0) - Number(left.totalValue || 0));
  }

  if (sort === 'notes_first') {
    return [...orders].sort((left, right) => Number(Boolean(right.hasNote)) - Number(Boolean(left.hasNote)));
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
        <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur-sm md:p-7">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Priority queue</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">Orders needing your eye first</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-stone-500">Search and focus the live cards here before moving into the fuller ledger below.</p>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.7fr)_auto]">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Search queue</label>
                <input
                  type="text"
                  value={activeQueueFilters.search}
                  onChange={(event) => updateQueueFilter('search', event.target.value)}
                  placeholder="Reference, customer, city, country, or item"
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Sort</label>
                <select
                  value={activeQueueFilters.sort}
                  onChange={(event) => updateQueueFilter('sort', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700"
                >
                  <option value="priority">Priority score</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest_total">Highest total</option>
                  <option value="notes_first">Notes first</option>
                </select>
              </div>

              <button
                type="button"
                onClick={resetQueueFilters}
                className="rounded-full border border-stone-300 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700"
              >
                Clear focus
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUEUE_FOCUS_OPTIONS.map((option) => {
                const count = orders.filter((order) => matchesQueueFocus(order, option.value)).length;
                const isActive = activeQueueFilters.focus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateQueueFilter('focus', option.value)}
                    className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                      isActive
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {option.label} <span className="ml-2 opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-stone-400">
              Showing {filteredOrders.length} of {orders.length} priority card{orders.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
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

        <section className="flex-1 rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffdf9,#f5eee7)] p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)] md:p-7">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Dispatch cadence</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">A lower deck that keeps the column in motion</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {cadence.length > 0 ? cadence.map((item) => <DispatchCadenceCard key={item.label} {...item} />) : (
              <EmptyPanel
                title="No cadence data"
                message="Dispatch timing cards will appear once active fulfillment data is available."
              />
            )}
          </div>

          <div className="mt-5 rounded-[1.55rem] border border-stone-200/80 bg-white/80 px-5 py-5">
            <StatusBadge tone="amber">{dashboard.atelierNote.title}</StatusBadge>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">{dashboard.atelierNote.body}</p>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}
