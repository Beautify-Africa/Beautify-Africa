import VariantList from './VariantList';

export default function AdminProductsEditorPanel({
  formState,
  selectedProduct,
  isSaving,
  isBulkExporting,
  isBulkImporting,
  bulkImportText,
  bulkOperationMessage,
  bulkOperationError,
  variantError,
  variants,
  isLoadingVariants,
  onChangeField,
  onSubmit,
  onExport,
  onImport,
  onImportTextChange,
  onCreateNew,
  onCancelEdit,
  onOpenAddVariant,
  onOpenEditVariant,
  onDeleteVariant,
  onAdjustStock,
  isProductLowStock,
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 shadow-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
              Merchandising Control
            </p>
          </div>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Catalogue Editor</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Create, inspect, and adjust product attributes, pricing curves, and inventory safety margins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={isBulkExporting}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {isBulkExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:bg-amber-300 transition-colors shadow-sm"
          >
            + New Product
          </button>
        </div>
      </div>

      {bulkOperationMessage ? (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
          {bulkOperationMessage}
        </div>
      ) : null}
      {bulkOperationError ? (
        <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
          {bulkOperationError}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Product Title *
            </label>
            <input
              value={formState.name}
              onChange={(event) => onChangeField('name', event.target.value)}
              placeholder="e.g. Shea Butter Hydration Elixir"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Brand Identifier *
            </label>
            <input
              value={formState.brand}
              onChange={(event) => onChangeField('brand', event.target.value)}
              placeholder="e.g. Beautify Africa Botanical"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Category *
            </label>
            <input
              value={formState.category}
              onChange={(event) => onChangeField('category', event.target.value)}
              placeholder="e.g. Skincare"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Subcategory
            </label>
            <input
              value={formState.subcategory}
              onChange={(event) => onChangeField('subcategory', event.target.value)}
              placeholder="e.g. Moisturisers"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Retail Price (USD) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(event) => onChangeField('price', event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Original / Strike Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.originalPrice}
              onChange={(event) => onChangeField('originalPrice', event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              value={formState.stockQuantity}
              onChange={(event) => onChangeField('stockQuantity', event.target.value)}
              placeholder="Units available"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Low Stock Threshold *
            </label>
            <input
              type="number"
              min="0"
              value={formState.lowStockThreshold}
              onChange={(event) => onChangeField('lowStockThreshold', event.target.value)}
              placeholder="Alert when below"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Target Skin Types
            </label>
            <input
              value={formState.skinType}
              onChange={(event) => onChangeField('skinType', event.target.value)}
              placeholder="Dry, Normal, Sensitive (comma separated)"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Discovery Tags
            </label>
            <input
              value={formState.tags}
              onChange={(event) => onChangeField('tags', event.target.value)}
              placeholder="hydrating, natural, organic"
              className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
            Primary Asset URL *
          </label>
          <input
            value={formState.image}
            onChange={(event) => onChangeField('image', event.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Gallery Assets (Comma-separated URLs)
          </label>
          <textarea
            rows={2}
            value={formState.imagesText}
            onChange={(event) => onChangeField('imagesText', event.target.value)}
            placeholder="https://res.cloudinary.com/.../img-1.jpg, https://..."
            className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          {formState.imagesText ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {String(formState.imagesText)
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)
                .slice(0, 4)
                .map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="Gallery preview"
                    className="h-14 w-14 rounded-lg border border-zinc-700 object-cover shadow-sm"
                    loading="lazy"
                  />
                ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
            Merchandising Description
          </label>
          <textarea
            rows={3}
            value={formState.description}
            onChange={(event) => onChangeField('description', event.target.value)}
            placeholder="Describe formulation, active botanical ingredients, usage rituals..."
            className="w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex flex-wrap gap-4 py-1 text-sm text-zinc-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-amber-400 rounded"
              checked={formState.isNewProduct}
              onChange={(event) => onChangeField('isNewProduct', event.target.checked)}
            />{' '}
            Mark as New Release
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-amber-400 rounded"
              checked={formState.isBestSeller}
              onChange={(event) => onChangeField('isBestSeller', event.target.checked)}
            />{' '}
            Mark as Best Seller
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-stone-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-md shadow-amber-950/30"
          >
            {isSaving ? 'Processing Commit...' : selectedProduct ? 'Update Product Record' : 'Create Product Entry'}
          </button>
          {selectedProduct ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <form
        className="mt-8 rounded-2xl border border-zinc-800/80 bg-[#090D16] p-5"
        onSubmit={onImport}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Bulk Ingestion Pipeline</h4>
            <p className="mt-1 text-xs text-zinc-400">
              Paste CSV rows with headers. Nested fields support pipe-delimited values for{' '}
              <span className="font-mono text-amber-300">images</span>,{' '}
              <span className="font-mono text-amber-300">skinType</span>, and{' '}
              <span className="font-mono text-amber-300">tags</span>;{' '}
              <span className="font-mono text-amber-300">variants</span> accepts JSON arrays.
            </p>
          </div>
          <button
            type="submit"
            disabled={isBulkImporting || !bulkImportText.trim()}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {isBulkImporting ? 'Ingesting Batch...' : 'Run Bulk Ingestion'}
          </button>
        </div>
        <textarea
          rows={5}
          value={bulkImportText}
          onChange={(event) => onImportTextChange(event.target.value)}
          placeholder="Paste raw CSV payload here..."
          className="mt-4 w-full rounded-xl border border-zinc-800 bg-[#0E131F] px-3.5 py-2 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
        />
      </form>

      {selectedProduct ? (
        <div className="mt-8 border-t border-zinc-800/80 pt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-white text-base">Inventory Variants</h4>
              <p className="mt-0.5 text-xs text-zinc-400">
                Manage SKU variants with segregated stock units and price points
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddVariant}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              + Add SKU Variant
            </button>
          </div>

          {variantError ? (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
              {variantError}
            </div>
          ) : null}
          {selectedProduct && isProductLowStock(selectedProduct) ? (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Safety warning: product inventory is at or below threshold. Review variant levels or schedule replenishment.
            </div>
          ) : null}

          <VariantList
            variants={variants}
            isBusy={isLoadingVariants}
            onEdit={onOpenEditVariant}
            onDelete={onDeleteVariant}
            onAdjustStock={onAdjustStock}
          />
        </div>
      ) : null}
    </section>
  );
}
