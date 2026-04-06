import { SHOP_CONTENT } from './shopConfig';

export default function ShopEmptyState({ mode, hasSavedItems, onClearFilters, onShowAllProducts }) {
  if (mode === 'saved') {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-xl text-stone-500">
          {hasSavedItems ? 'No saved items match your current filters.' : 'You have no saved items yet.'}
        </p>
        <button
          type="button"
          onClick={hasSavedItems ? onClearFilters : onShowAllProducts}
          className="mt-4 border-b border-stone-900 text-xs font-bold uppercase tracking-widest text-stone-900"
        >
          {hasSavedItems ? SHOP_CONTENT.clearFiltersLabel : 'Browse all products'}
        </button>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <p className="font-serif text-xl text-stone-500">{SHOP_CONTENT.noResultsMessage}</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 border-b border-stone-900 text-xs font-bold uppercase tracking-widest text-stone-900"
      >
        {SHOP_CONTENT.clearFiltersLabel}
      </button>
    </div>
  );
}
