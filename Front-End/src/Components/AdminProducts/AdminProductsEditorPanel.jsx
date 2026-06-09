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
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl text-stone-900">Catalogue Management</h3>
          <p className="mt-2 text-sm text-stone-500">Create and maintain products, inventory thresholds, and merchandising metadata.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onExport} disabled={isBulkExporting} className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-700 disabled:cursor-not-allowed disabled:opacity-60">{isBulkExporting ? 'Exporting...' : 'Export Products'}</button>
          <button type="button" onClick={onCreateNew} className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-700">New Product</button>
        </div>
      </div>

      {bulkOperationMessage ? <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">{bulkOperationMessage}</div> : null}
      {bulkOperationError ? <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{bulkOperationError}</div> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={formState.name} onChange={(event) => onChangeField('name', event.target.value)} placeholder="Product name" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input value={formState.brand} onChange={(event) => onChangeField('brand', event.target.value)} placeholder="Brand" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input value={formState.category} onChange={(event) => onChangeField('category', event.target.value)} placeholder="Category" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input value={formState.subcategory} onChange={(event) => onChangeField('subcategory', event.target.value)} placeholder="Subcategory" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          <input type="number" min="0" step="0.01" value={formState.price} onChange={(event) => onChangeField('price', event.target.value)} placeholder="Price" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input type="number" min="0" step="0.01" value={formState.originalPrice} onChange={(event) => onChangeField('originalPrice', event.target.value)} placeholder="Original price (optional)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          <input type="number" min="0" value={formState.stockQuantity} onChange={(event) => onChangeField('stockQuantity', event.target.value)} placeholder="Stock quantity" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input type="number" min="0" value={formState.lowStockThreshold} onChange={(event) => onChangeField('lowStockThreshold', event.target.value)} placeholder="Low stock threshold" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
          <input value={formState.skinType} onChange={(event) => onChangeField('skinType', event.target.value)} placeholder="Skin types (comma-separated)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          <input value={formState.tags} onChange={(event) => onChangeField('tags', event.target.value)} placeholder="Tags (comma-separated)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
        </div>

        <input value={formState.image} onChange={(event) => onChangeField('image', event.target.value)} placeholder="Primary image URL" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" required />

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Gallery image URLs (comma-separated)</label>
          <textarea rows={3} value={formState.imagesText} onChange={(event) => onChangeField('imagesText', event.target.value)} placeholder="https://.../image-1.jpg, https://.../image-2.jpg" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          {formState.imagesText ? <div className="flex flex-wrap gap-2">{String(formState.imagesText).split(',').map((entry) => entry.trim()).filter(Boolean).slice(0, 4).map((imageUrl) => <img key={imageUrl} src={imageUrl} alt="Gallery preview" className="h-16 w-16 rounded-lg border border-stone-200 object-cover" loading="lazy" />)}</div> : null}
        </div>

        <textarea rows={4} value={formState.description} onChange={(event) => onChangeField('description', event.target.value)} placeholder="Description" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />

        <div className="flex flex-wrap gap-3 text-sm text-stone-700">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={formState.isNewProduct} onChange={(event) => onChangeField('isNewProduct', event.target.checked)} /> New product</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={formState.isBestSeller} onChange={(event) => onChangeField('isBestSeller', event.target.checked)} /> Best seller</label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-70">{isSaving ? 'Saving...' : selectedProduct ? 'Update Product' : 'Create Product'}</button>
          {selectedProduct ? <button type="button" onClick={onCancelEdit} className="rounded-full border border-stone-300 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-stone-700">Cancel Edit</button> : null}
        </div>
      </form>

      <form className="mt-8 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5" onSubmit={onImport}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Bulk Import</h4>
            <p className="mt-1 text-xs text-stone-500">Paste CSV rows with a header row. Nested fields use pipe-delimited lists for <span className="font-semibold">images</span>, <span className="font-semibold">skinType</span>, and <span className="font-semibold">tags</span>; <span className="font-semibold">variants</span> uses JSON inside one CSV cell.</p>
          </div>
          <button type="submit" disabled={isBulkImporting || !bulkImportText.trim()} className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-70">{isBulkImporting ? 'Importing...' : 'Import Products'}</button>
        </div>
        <textarea rows={8} value={bulkImportText} onChange={(event) => onImportTextChange(event.target.value)} placeholder="Paste CSV here" className="mt-4 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
      </form>

      {selectedProduct ? (
        <div className="mt-8 border-t border-stone-200 pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h4 className="font-semibold text-stone-900">Variants</h4><p className="mt-1 text-xs text-stone-500">Manage product variants with separate stock levels</p></div>
            <button type="button" onClick={onOpenAddVariant} className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-700 hover:bg-stone-50">Add Variant</button>
          </div>

          {variantError ? <div className="mb-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{variantError}</div> : null}
          {selectedProduct && isProductLowStock(selectedProduct) ? <div className="mb-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Low stock warning: this product is at or below its threshold. Review variant levels or restock soon.</div> : null}

          <VariantList variants={variants} isBusy={isLoadingVariants} onEdit={onOpenEditVariant} onDelete={onDeleteVariant} onAdjustStock={onAdjustStock} />
        </div>
      ) : null}
    </section>
  );
}