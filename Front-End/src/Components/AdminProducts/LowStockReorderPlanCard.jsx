export default function LowStockReorderPlanCard({ reorderPlan, isLoadingReorderPlan, isExportingPlan, onDownloadPlanCsv }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Automated Reorder Rules</p>
          <h3 className="mt-1 text-lg font-semibold text-stone-900">Recommended replenishment plan</h3>
          <p className="mt-1 text-sm text-stone-600">Recommendations blend low stock with recent sales so the team can reorder before items stall.</p>
        </div>
        <button type="button" onClick={onDownloadPlanCsv} disabled={isLoadingReorderPlan || isExportingPlan || !reorderPlan?.csv} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50">
          {isExportingPlan ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      {isLoadingReorderPlan ? (
        <div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-900" /></div>
      ) : reorderPlan?.recommendations?.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-stone-50 p-3"><p className="text-xs uppercase tracking-wide text-stone-500">Recommendations</p><p className="mt-1 text-2xl font-bold text-stone-900">{reorderPlan.summary.recommendationCount}</p></div>
            <div className="rounded-lg bg-amber-50 p-3"><p className="text-xs uppercase tracking-wide text-amber-700">High priority</p><p className="mt-1 text-2xl font-bold text-amber-900">{reorderPlan.summary.highPriorityCount}</p></div>
            <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs uppercase tracking-wide text-emerald-700">Lead time</p><p className="mt-1 text-2xl font-bold text-emerald-900">{reorderPlan.summary.leadTimeDays}d</p></div>
          </div>
          <div className="space-y-2">
            {reorderPlan.recommendations.slice(0, 6).map((item) => (
              <div key={`${item.productId}-${item.variantId || 'main'}`} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">{item.productName}</p>
                    <p className="text-sm text-stone-600">SKU: {item.sku || 'N/A'} • {item.type === 'variant' ? 'Variant' : 'Main stock'}</p>
                    <p className="mt-1 text-xs text-stone-500">{item.note}</p>
                  </div>
                  <div className="text-right shrink-0"><p className="text-xs uppercase text-stone-500">Reorder</p><p className="text-2xl font-bold text-stone-900">{item.recommendedOrderQty}</p><p className="text-xs text-stone-500 capitalize">{item.urgency}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-6 text-center text-stone-600">No reorder recommendations right now.</div>
      )}
    </div>
  );
}