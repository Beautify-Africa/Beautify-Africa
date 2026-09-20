import DispatchCadenceCard from './DispatchCadenceCard';
import EmptyPanel from './EmptyPanel';
import FadeIn from '../Shared/FadeIn';
import OrderCard from './OrderCard';
import StatusBadge from './StatusBadge';
import PrimaryQueueFilterBar from './PrimaryQueueFilterBar';
import {
  DEFAULT_QUEUE_FILTERS,
  normalizeSearchValue,
  matchesQueueFocus,
  matchesQueueSearch,
  sortQueueOrders,
} from './adminPrimaryPanelFilters';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

export default function AdminPrimaryPanel({
  dashboard = {},
  busyActionKey,
  timelineByOrderId = {},
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

  const orders = Array.isArray(dashboard?.priorityOrders) ? dashboard.priorityOrders : [];
  const cadence = Array.isArray(dashboard?.dispatchCadence) ? dashboard.dispatchCadence : [];
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

          <PrimaryQueueFilterBar
            orders={orders}
            activeQueueFilters={activeQueueFilters}
            filteredOrdersCount={filteredOrders.length}
            onUpdateFilter={updateQueueFilter}
            onResetFilters={resetQueueFilters}
          />

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
            <StatusBadge tone="amber">
              {dashboard?.atelierNote?.title || 'Operations Note'}
            </StatusBadge>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              {dashboard?.atelierNote?.body || 'No active operations note is available right now.'}
            </p>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}
