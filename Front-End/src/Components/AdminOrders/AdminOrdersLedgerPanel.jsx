import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export default function AdminOrdersLedgerPanel({
  filters = {},
  orders = [],
  pagination = {},
  isLoading,
  error,
  busyActionKey,
  onFilterChange,
  onPageChange,
  onRefresh,
  onOrderAction,
  onOpenOrderDetail,
}) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safePagination = pagination && typeof pagination === 'object' ? pagination : {};
  const safeFilters = filters && typeof filters === 'object' ? filters : {};
  const canGoPrevious = (safePagination.page || 1) > 1;
  const canGoNext = (safePagination.page || 1) < (safePagination.totalPages || 1);

  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              Operations Ledger
            </span>
            <span className="text-[10px] font-mono text-zinc-500">LIVE SYNC</span>
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Comprehensive Order Registry
          </h2>
          <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Query transactions, filter by fulfillment state, inspect order timelines, and trigger manual dispatch events.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="self-start xl:self-auto rounded-xl border border-zinc-700/80 bg-zinc-800/70 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Registry
        </button>
      </div>

      <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,0.7fr))]">
        <input
          type="text"
          value={safeFilters.search || ''}
          onChange={(event) => onFilterChange('search', event.target.value)}
          placeholder="Search customer, city, country, or SKU..."
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
        <select
          value={safeFilters.status || 'all'}
          onChange={(event) => onFilterChange('status', event.target.value)}
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
        <select
          value={safeFilters.payment || 'all'}
          onChange={(event) => onFilterChange('payment', event.target.value)}
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Awaiting Payment</option>
        </select>
        <input
          type="text"
          value={safeFilters.country || ''}
          onChange={(event) => onFilterChange('country', event.target.value)}
          placeholder="Filter country..."
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
        />
        <select
          value={safeFilters.sort || 'newest'}
          onChange={(event) => onFilterChange('sort', event.target.value)}
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="total_high">Highest Value</option>
          <option value="total_low">Lowest Value</option>
        </select>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800/90">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3">Order &amp; Customer</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-[#0E131F]/40">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  <div className="mx-auto h-6 w-6 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin mb-2" />
                  Streaming orders from registry...
                </td>
              </tr>
            ) : safeOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No orders matched the current criteria.
                </td>
              </tr>
            ) : (
              safeOrders.map((order) => (
                <tr key={order.id} className="align-top hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-amber-400 font-bold tracking-wider text-xs">
                      {order.reference}
                    </span>
                    <p className="mt-1 font-bold text-white text-sm tracking-tight">{order.customer}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 truncate max-w-xs">
                      {order.email || 'No customer email'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 font-mono">
                      {order.itemCount} items &bull; {order.lane}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-300">
                    <p className="font-medium text-white">{order.city}</p>
                    <p className="text-[11px] text-zinc-500">{order.country}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {order.total}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono ${
                        order.isPaid
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {order.paymentLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                      {order.fulfillmentLabel}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                    {order.placedAtLabel}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-[200px] flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenOrderDetail(order.id)}
                        className="rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        Detail
                      </button>
                      {order.availableActions?.length > 0 ? (
                        order.availableActions.map((action) => (
                          <ActionButton
                            key={`${order.id}:${action.type}`}
                            action={action}
                            isBusy={busyActionKey === `${order.id}:${action.type}`}
                            onClick={() => onOrderAction(order.id, action.type)}
                          />
                        ))
                      ) : (
                        <span className="self-center text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                          No actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-zinc-500">
          Showing {safeOrders.length} of {safePagination.totalCount || 0} order(s) &bull; Page{' '}
          {safePagination.page || 1} of {Math.max(1, safePagination.totalPages || 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange((safePagination.page || 1) - 1)}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            &larr; Previous
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange((safePagination.page || 1) + 1)}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
