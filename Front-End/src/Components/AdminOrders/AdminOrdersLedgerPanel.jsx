import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export default function AdminOrdersLedgerPanel({
  filters,
  orders,
  pagination,
  isLoading,
  error,
  busyActionKey,
  onFilterChange,
  onPageChange,
  onRefresh,
  onOrderAction,
  onOpenOrderDetail,
}) {
  const canGoPrevious = (pagination.page || 1) > 1;
  const canGoNext = (pagination.page || 1) < (pagination.totalPages || 1);

  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-[0_20px_55px_rgba(28,25,23,0.08)] md:p-7">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Order ledger</p>
          <h2 className="mt-3 font-serif text-4xl text-stone-900">All admin orders in one operational view</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
            Search the queue, narrow by state, and keep action buttons close to the data that matters.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full bg-stone-900 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
        >
          Refresh ledger
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.7fr))]">
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onFilterChange('search', event.target.value)}
          placeholder="Search customer, city, country, or item"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm"
        />
        <select
          value={filters.status}
          onChange={(event) => onFilterChange('status', event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
        <select
          value={filters.payment}
          onChange={(event) => onFilterChange('payment', event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm"
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Awaiting payment</option>
        </select>
        <input
          type="text"
          value={filters.country}
          onChange={(event) => onFilterChange('country', event.target.value)}
          placeholder="Country"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm"
        />
        <select
          value={filters.sort}
          onChange={(event) => onFilterChange('sort', event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total_high">Highest total</option>
          <option value="total_low">Lowest total</option>
        </select>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-[1.6rem] border border-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500">No orders matched the current filters.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">{order.reference}</p>
                    <p className="mt-2 font-semibold text-stone-900">{order.customer}</p>
                    <p className="mt-1 text-xs text-stone-500">{order.email || 'No customer email available'}</p>
                    <p className="mt-1 text-xs text-stone-500">{order.itemCount} item(s) / {order.lane}</p>
                  </td>
                  <td className="px-4 py-4 text-stone-600">
                    <p>{order.city}</p>
                    <p className="mt-1 text-xs text-stone-500">{order.country}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-stone-900">{order.total}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs ${
                      order.isPaid
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}>
                      {order.paymentLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-400">{order.fulfillmentLabel}</p>
                  </td>
                  <td className="px-4 py-4 text-stone-600">{order.placedAtLabel}</td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenOrderDetail(order.id)}
                        className="rounded-full border border-stone-300 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
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
                        <span className="self-center text-xs font-medium uppercase tracking-[0.14em] text-stone-400">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {pagination.totalCount || 0} order(s) / page {pagination.page || 1} of {Math.max(1, pagination.totalPages || 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange((pagination.page || 1) - 1)}
            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange((pagination.page || 1) + 1)}
            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

