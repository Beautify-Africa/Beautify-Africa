export default function ProductBasicFields({ formState, onChangeField }) {
  return (
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
  );
}
