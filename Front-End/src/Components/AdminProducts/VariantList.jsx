import { useState } from 'react';

export default function VariantList({ variants = [], onEdit, onDelete, onAdjustStock, isBusy }) {
  const [expandedVariantId, setExpandedVariantId] = useState(null);

  if (!variants || variants.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#090D16] px-4 py-8 text-center text-xs font-mono text-zinc-400">
        No variants configured. Create your first SKU variant to activate multi-option inventory tracking.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {variants.map((variant) => {
        const isExpanded = expandedVariantId === variant._id;
        const stockStatus =
          variant.stockQuantity === 0
            ? 'out-of-stock'
            : variant.stockQuantity < 5
              ? 'low-stock'
              : 'in-stock';
        const stockColor =
          stockStatus === 'out-of-stock'
            ? 'text-rose-400'
            : stockStatus === 'low-stock'
              ? 'text-amber-400'
              : 'text-emerald-400';

        return (
          <div
            key={variant._id}
            className="rounded-xl border border-zinc-800/80 bg-[#090D16] shadow-sm hover:border-zinc-700 transition-all"
          >
            <button
              onClick={() => setExpandedVariantId(isExpanded ? null : variant._id)}
              className="w-full px-4 py-3.5 text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-zinc-100">{variant.sku}</p>
                  <div className="mt-1.5 flex gap-2 flex-wrap text-xs text-zinc-400">
                    {variant.attributes?.size && (
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                        Size: {variant.attributes.size}
                      </span>
                    )}
                    {variant.attributes?.color && (
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                        Color: {variant.attributes.color}
                      </span>
                    )}
                    {variant.attributes?.type && (
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                        Type: {variant.attributes.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`font-mono text-sm font-bold ${stockColor}`}>
                  {variant.stockQuantity} units
                </div>
                <svg
                  className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180 text-amber-400' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-zinc-800/80 bg-zinc-950/60 px-4 py-3.5 space-y-3">
                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Stock Units</p>
                    <p className={`mt-1 font-mono text-lg font-bold ${stockColor}`}>
                      {variant.stockQuantity}
                    </p>
                  </div>
                  {variant.price && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                        Price Override
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-zinc-100">
                        ${Number(variant.price || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => onAdjustStock(variant)}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    disabled={isBusy}
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onEdit(variant)}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(variant._id)}
                    className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
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
