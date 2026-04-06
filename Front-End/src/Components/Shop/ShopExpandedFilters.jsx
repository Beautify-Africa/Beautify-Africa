import PriceRangeSlider from './PriceRangeSlider';

function chipClass(active) {
  return `rounded-full border px-3 py-1.5 text-[10px] transition-all sm:text-xs ${
    active
      ? 'border-stone-900 bg-stone-900 text-white'
      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
  }`;
}

export default function ShopExpandedFilters({
  showFilters,
  filterLabels,
  brandOptions,
  selectedBrand,
  onBrandChange,
  skinTypeOptions,
  selectedSkinType,
  onSkinTypeChange,
  maxPrice,
  maxPriceCap,
  onMaxPriceChange,
  sortOption,
  onSortChange,
  sortableOptions,
}) {
  return (
    <div
      id="filter-panel"
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        showFilters ? 'mt-4 max-h-[500px] opacity-100' : 'mt-0 max-h-0 opacity-0'
      }`}
      aria-hidden={!showFilters}
    >
      <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-md">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
              {filterLabels.brand}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {brandOptions.map((brand) => (
                <button
                  key={brand}
                  onClick={() => onBrandChange(brand)}
                  className={chipClass(selectedBrand === brand)}
                  aria-pressed={selectedBrand === brand}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
              {filterLabels.skinType}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skinTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => onSkinTypeChange(type)}
                  className={chipClass(selectedSkinType === type)}
                  aria-pressed={selectedSkinType === type}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
              {filterLabels.priceRange}
            </h3>
            <PriceRangeSlider value={maxPrice} max={maxPriceCap} onChange={onMaxPriceChange} />
          </div>
        </div>

        <div className="mt-4 border-t border-stone-100 pt-4 sm:hidden">
          <label
            htmlFor="sort-select-mobile"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900"
          >
            Sort by
          </label>
          <select
            id="sort-select-mobile"
            value={sortOption}
            onChange={(event) => onSortChange(event.target.value)}
            className="w-full cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-900"
          >
            {sortableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
