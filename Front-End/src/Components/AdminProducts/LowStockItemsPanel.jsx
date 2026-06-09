export default function LowStockItemsPanel({ items, pagination, threshold, isLoading, isSending, onThresholdChange, onNotifyAdmins, onLoadPage, getStockStatus }) {
  return (
    <>
      <div className="rounded-lg border border-stone-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">Low Stock Threshold</label>
          <div className="flex gap-3 items-end">
            <input type="number" value={threshold} onChange={onThresholdChange} min="1" className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
            <button onClick={onNotifyAdmins} disabled={isSending || items.length === 0} className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors">{isSending ? 'Sending...' : 'Notify Admins'}</button>
          </div>
          <p className="mt-1 text-xs text-stone-500">Items with stock below {threshold} units will be shown below</p>
        </div>
      </div>

      {pagination.totalCount > 0 ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">⚠️ {pagination.totalCount} item(s) with stock below {threshold} units</p></div> : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-8 text-center"><p className="text-stone-600">{threshold === 10 ? 'No items with low stock. Everything looks good!' : `No items below ${threshold} units.`}</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.stock, threshold);
            return (
              <div key={`${item.productId}-${item.variantId || 'main'}`} className="rounded-lg border border-stone-200 bg-white p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{item.productName}</p>
                    <p className="text-sm text-stone-600 mt-1">SKU: {item.sku}</p>
                    <div className="flex gap-2 mt-2 flex-wrap"><span className="text-xs bg-stone-100 px-2 py-1 rounded">{item.type === 'variant' ? 'Variant' : 'Main'}</span><span className="text-xs bg-stone-100 px-2 py-1 rounded capitalize">{item.status || 'published'}</span></div>
                  </div>
                  <div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-stone-600 uppercase">Stock Level</p><p className={`text-2xl font-bold mt-1 ${stockStatus.color}`}>{item.stock}</p><span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold text-white ${stockStatus.label === 'OUT OF STOCK' ? 'bg-red-600' : stockStatus.label === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-600'}`}>{stockStatus.label}</span></div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-600">Page {pagination.page} of {pagination.totalPages} • {pagination.totalCount} total items</p>
          <div className="flex gap-2">
            <button onClick={() => onLoadPage(pagination.page - 1)} disabled={pagination.page === 1 || isLoading} className="px-3 py-1 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50">Previous</button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i;
              if (pageNum > pagination.totalPages) return null;
              return <button key={pageNum} onClick={() => onLoadPage(pageNum)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${pageNum === pagination.page ? 'bg-stone-900 text-white' : 'border border-stone-300 hover:bg-stone-50'}`}>{pageNum}</button>;
            })}
            <button onClick={() => onLoadPage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || isLoading} className="px-3 py-1 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </>
  );
}