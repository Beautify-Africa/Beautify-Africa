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
    <section className="space-y-8">
      <ImageUploader />

      <div className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 shadow-xl">
        <div className="flex flex-wrap items-end gap-3 border-b border-zinc-800/80 pb-5">
          <div className="min-w-[220px] flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Filter By Keyword
            </label>
            <input
              type="text"
              value={activeProductFilters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name, brand, category..."
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Archive Status
            </label>
            <select
              value={activeProductFilters.archived}
              onChange={(event) => onArchiveChange(event.target.value)}
              className="mt-2 rounded-xl border border-zinc-800 bg-[#090D16] px-3 py-2 text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="false">Active Only</option>
              <option value="true">Archived Only</option>
              <option value="all">All States</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#090D16] px-3 py-2 text-sm text-zinc-300 hover:border-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              className="accent-amber-400 rounded"
              checked={Boolean(activeProductFilters.lowStockOnly)}
              onChange={(event) => onLowStockChange(event.target.checked)}
            />
            Low stock only
          </label>

          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-950 hover:bg-amber-300 transition-all shadow-sm"
          >
            Refresh Catalog
          </button>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                Low Stock Warning ({lowStockProducts.length} items at risk)
              </p>
            </div>
            <p className="mt-1 text-xs text-amber-200/80">
              The following products are currently tracking below their designated inventory thresholds:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <span
                  key={product._id}
                  className="rounded-md border border-amber-500/30 bg-black/40 px-2.5 py-1 text-xs font-mono font-medium text-amber-300"
                >
                  {product.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                <th className="py-3 pr-4">Product Identifier</th>
                <th className="py-3 pr-4">List Price</th>
                <th className="py-3 pr-4">Stock Cadence</th>
                <th className="py-3 pr-4">Health State</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500 font-mono">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border border-zinc-500 border-t-amber-400 mr-2 align-middle" />
                    Querying product ledger...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500">
                    No products matching current filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-zinc-100">{product.name}</p>
                      <p className="text-xs text-zinc-400 font-mono">
                        {product.brand} · {product.category}
                      </p>
                    </td>
                    <td className="py-3 pr-4 font-mono font-medium text-zinc-200">
                      ${Number(product.price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-mono font-semibold text-zinc-100">{product.stockQuantity ?? 0}</p>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Threshold: {product.lowStockThreshold ?? 5}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {product.isArchived ? (
                        <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
                          Archived
                        </span>
                      ) : (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 5) ? (
                        <span className="inline-flex rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-400">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchiveProduct(product)}
                          className="rounded-lg border border-zinc-700/80 bg-zinc-850 px-3 py-1 text-xs font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                        >
                          {product.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4 text-xs font-mono text-zinc-400">
          <p>{pagination.totalCount || 0} product(s) in catalog</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={(activeProductFilters.page || 1) <= 1}
              onClick={onPrevPage}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-700"
            >
              Prev
            </button>
            <span className="px-2">
              Page {activeProductFilters.page || 1} of {Math.max(1, pagination.totalPages || 1)}
            </span>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={onNextPage}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
