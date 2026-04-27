import { useState } from 'react';

export default function VariantList({ variants = [], onEdit, onDelete, onAdjustStock, isBusy }) {
  const [expandedVariantId, setExpandedVariantId] = useState(null);

  if (!variants || variants.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-600">
        No variants. Create your first variant to enable multi-option inventory.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {variants.map((variant) => {
        const isExpanded = expandedVariantId === variant._id;
        const stockStatus =
          variant.stockQuantity === 0
            ? 'out-of-stock'
            : variant.stockQuantity < 5
              ? 'low-stock'
              : 'in-stock';
        const stockColor =
          stockStatus === 'out-of-stock' ? 'text-red-600' : stockStatus === 'low-stock' ? 'text-amber-600' : 'text-green-600';

        return (
          <div
            key={variant._id}
            className="rounded-lg border border-stone-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => setExpandedVariantId(isExpanded ? null : variant._id)}
              className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900">{variant.sku}</p>
                  <div className="mt-1 flex gap-2 flex-wrap text-xs text-stone-600">
                    {variant.attributes?.size && (
                      <span className="bg-stone-100 px-2 py-1 rounded">{variant.attributes.size}</span>
                    )}
                    {variant.attributes?.color && (
                      <span className="bg-stone-100 px-2 py-1 rounded">{variant.attributes.color}</span>
                    )}
                    {variant.attributes?.type && (
                      <span className="bg-stone-100 px-2 py-1 rounded">{variant.attributes.type}</span>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-bold ${stockColor}`}>
                  {variant.stockQuantity} in stock
                </div>
                <svg
                  className={`w-4 h-4 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 space-y-3">
                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-stone-600 uppercase">Stock Quantity</p>
                    <p className={`mt-1 text-lg font-bold ${stockColor}`}>
                      {variant.stockQuantity}
                    </p>
                  </div>
                  {variant.price && (
                    <div>
                      <p className="text-xs font-semibold text-stone-600 uppercase">Price Override</p>
                      <p className="mt-1 text-lg font-bold text-stone-900">${variant.price.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-stone-200">
                  <button
                    onClick={() => onAdjustStock(variant)}
                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
                    disabled={isBusy}
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onEdit(variant)}
                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(variant._id)}
                    className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
