import { QUEUE_FOCUS_OPTIONS, matchesQueueFocus } from './adminPrimaryPanelFilters';

export default function PrimaryQueueFilterBar({
  orders = [],
  activeQueueFilters,
  filteredOrdersCount,
  onUpdateFilter,
  onResetFilters,
}) {
  return (
    <div className="mt-5 rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.7fr)_auto]">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Search Queue
          </label>
          <input
            type="text"
            value={activeQueueFilters.search}
            onChange={(event) => onUpdateFilter('search', event.target.value)}
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
            onChange={(event) => onUpdateFilter('sort', event.target.value)}
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
            onClick={onResetFilters}
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
              onClick={() => onUpdateFilter('focus', option.value)}
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
        Displaying {filteredOrdersCount} of {orders.length} active priority card
        {orders.length === 1 ? '' : 's'}.
      </p>
    </div>
  );
}
