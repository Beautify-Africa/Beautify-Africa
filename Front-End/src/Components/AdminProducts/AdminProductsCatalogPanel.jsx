import ImageUploader from './ImageUploader';

export default function AdminProductsCatalogPanel({
  products,
  pagination,
  activeProductFilters,
  isLoading,
  lowStockProducts,
  onSearchChange,
  onArchiveChange,
  onLowStockChange,
  onRefresh,
  onPrevPage,
  onNextPage,
  canGoNext,
  onEditProduct,
  onArchiveProduct,
}) {
  return (
    <section>
      <ImageUploader />

      <div className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Search</label>
            <input type="text" value={activeProductFilters.search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Name, brand, category" className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Archive</label>
            <select value={activeProductFilters.archived} onChange={(event) => onArchiveChange(event.target.value)} className="mt-2 rounded-xl border border-stone-200 px-3 py-2 text-sm">
              <option value="false">Active</option>
              <option value="true">Archived</option>
              <option value="all">All</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
            <input type="checkbox" checked={Boolean(activeProductFilters.lowStockOnly)} onChange={(event) => onLowStockChange(event.target.checked)} />
            Low stock only
          </label>

          <button type="button" onClick={onRefresh} className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">Refresh</button>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Low stock alert</p>
            <p className="mt-2 text-sm text-amber-900">{lowStockProducts.length} product(s) on this page are at or below their low-stock threshold.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map((product) => <span key={product._id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">{product.name}</span>)}
            </div>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.16em] text-stone-500">
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Stock</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-6 text-center text-stone-500">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-stone-500">No products found.</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-stone-100 align-top">
                    <td className="py-3 pr-3"><p className="font-medium text-stone-900">{product.name}</p><p className="text-xs text-stone-500">{product.brand} · {product.category}</p></td>
                    <td className="py-3 pr-3">${Number(product.price || 0).toFixed(2)}</td>
                    <td className="py-3 pr-3"><p>{product.stockQuantity ?? 0}</p><p className="text-xs text-stone-500">Low at {product.lowStockThreshold ?? 5}</p></td>
                    <td className="py-3 pr-3">{product.isArchived ? <span className="rounded-full border border-stone-300 px-2 py-1 text-xs">Archived</span> : (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 5) ? <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700">Low stock</span> : <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Healthy</span>}</td>
                    <td className="py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onEditProduct(product)} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-700">Edit</button><button type="button" onClick={() => onArchiveProduct(product)} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-700">{product.isArchived ? 'Restore' : 'Archive'}</button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
          <p>{pagination.totalCount || 0} product(s)</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={(activeProductFilters.page || 1) <= 1} onClick={onPrevPage} className="rounded border border-stone-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">Prev</button>
            <span>Page {activeProductFilters.page || 1} / {Math.max(1, pagination.totalPages || 1)}</span>
            <button type="button" disabled={!canGoNext} onClick={onNextPage} className="rounded border border-stone-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </section>
  );
}