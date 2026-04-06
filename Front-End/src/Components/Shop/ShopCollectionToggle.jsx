import { HeartIcon } from '../Shared/Icons';

export default function ShopCollectionToggle({
  isSavedCollection,
  savedProductCount,
  onShowAll,
  onShowSaved,
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onShowAll}
        className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
          !isSavedCollection
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
        }`}
        aria-pressed={!isSavedCollection}
      >
        Shop All
      </button>
      <button
        type="button"
        onClick={onShowSaved}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
          isSavedCollection
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
        }`}
        aria-pressed={isSavedCollection}
      >
        <HeartIcon className="h-4 w-4" filled={isSavedCollection && savedProductCount > 0} />
        Saved Items ({savedProductCount})
      </button>
    </div>
  );
}
