export default function LowStockItemsPanel({
  items,
  pagination,
  threshold,
  isLoading,
  isSending,
  onThresholdChange,
  onNotifyAdmins,
  onLoadPage,
  getStockStatus,
}) {
  return (
    <>
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Low Stock Alert Threshold
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <input
                type="number"
                value={threshold}
                onChange={onThresholdChange}
                min="1"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <button
              onClick={onNotifyAdmins}
              disabled={isSending || items.length === 0}
              className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-40"
            >
              {isSending ? 'Transmitting Alert...' : 'Broadcast Low-Stock Alert'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Automated alerts trigger when physical units fall below {threshold} units
          </p>
        </div>
      </div>

      {pagination.totalCount > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>{pagination.totalCount} active item(s) flagged below safety threshold ({threshold} units)</span>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-xs text-zinc-500">
          {threshold === 10
            ? 'Optimal inventory levels across all registered catalog SKUs.'
            : `No items below ${threshold} units.`}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.stock, threshold);
            return (
              <div
                key={`${item.productId}-${item.variantId || 'main'}`}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm tracking-tight truncate">{item.productName}</p>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">SKU: {item.sku}</p>
                    <div className="flex gap-2 mt-2 flex-wrap text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                        {item.type === 'variant' ? 'Variant' : 'Main SKU'}
                      </span>
                      <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 capitalize">
                        {item.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Current Level</p>
                    <p className="text-2xl font-mono font-bold mt-0.5 text-white tabular-nums">{item.stock}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        stockStatus.label === 'OUT OF STOCK'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : stockStatus.label === 'CRITICAL'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
          <p>
            Page {pagination.page} of {pagination.totalPages} &bull; {pagination.totalCount} items
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => onLoadPage(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="px-3 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => onLoadPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className="px-3 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
