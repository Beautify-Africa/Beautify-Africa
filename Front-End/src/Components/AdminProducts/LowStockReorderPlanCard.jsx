export default function LowStockReorderPlanCard({
  reorderPlan,
  isLoadingReorderPlan,
  isExportingPlan,
  onDownloadPlanCsv,
}) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Automated Reorder Engine
          </p>
          <h3 className="mt-1 text-base font-bold text-white tracking-tight">
            Recommended Replenishment Plan
          </h3>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            Algorithmic predictions synthesize stock velocity and supplier lead-times to prevent stockouts.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadPlanCsv}
          disabled={isLoadingReorderPlan || isExportingPlan || !reorderPlan?.csv}
          className="rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40 self-start shrink-0"
        >
          {isExportingPlan ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      {isLoadingReorderPlan ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-700 border-t-amber-500" />
        </div>
      ) : reorderPlan?.recommendations?.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Recommendations</p>
              <p className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
                {reorderPlan.summary.recommendationCount}
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">High Priority</p>
              <p className="mt-1 font-mono text-xl font-bold text-amber-300 tabular-nums">
                {reorderPlan.summary.highPriorityCount}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Target Lead Time</p>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-300 tabular-nums">
                {reorderPlan.summary.leadTimeDays}d
              </p>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {reorderPlan.recommendations.slice(0, 6).map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'main'}`}
                className="rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-white tracking-tight truncate">{item.productName}</p>
                    <p className="mt-0.5 text-[11px] font-mono text-zinc-400">
                      SKU: {item.sku || 'N/A'} &bull;{' '}
                      {item.type === 'variant' ? 'Variant' : 'Main SKU'}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{item.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Order Qty</p>
                    <p className="font-mono text-xl font-bold text-amber-400 tabular-nums">{item.recommendedOrderQty}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">{item.urgency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-5 text-center text-xs text-zinc-500">
          No automated replenishment recommendations at this time.
        </div>
      )}
    </div>
  );
}
