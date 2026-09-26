import { useState } from 'react';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

export default function StockAdjustmentModal({ isOpen, onClose, variant, onAdjust, isSaving }) {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('restock');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleReset = () => {
    setQuantity(0);
    setReason('restock');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quantity || quantity === 0) {
      setError('Quantity must be a non-zero number (positive to add stock, negative to remove)');
      return;
    }

    try {
      await onAdjust({
        quantity: parseInt(quantity, 10),
        reason,
        notes: notes.trim(),
      });
      handleReset();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  if (!isOpen || !variant) {
    return null;
  }

  const newStock = (variant.stockQuantity || 0) + parseInt(quantity || 0);
  const isNegative = newStock < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
          <h2 className="text-base font-bold tracking-tight text-white">Adjust Stock: {variant.sku}</h2>
          <span className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
            Ledger Offset
          </span>
        </div>

        {error && <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />}

        <div className="mb-5 rounded-xl border border-zinc-800 bg-[#090D16] p-4 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Active Units:</span>
            <span className="text-base font-bold text-zinc-100">{variant.stockQuantity || 0}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-zinc-800/80 pt-2">
            <span className="text-xs text-zinc-400">Projected Units:</span>
            <span className={`text-base font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
              {newStock}
            </span>
          </div>
          {isNegative && (
            <p className="mt-2 text-xs text-rose-400 font-semibold">
              ⚠️ Inadmissible: stock quantity cannot drop below zero.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Quantity Offset (Positive to add, negative to decrement) *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. +50 or -10"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Audit Reason Code *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="restock">Inbound Restock</option>
              <option value="adjustment">Discrepancy Adjustment</option>
              <option value="return">Customer Return</option>
              <option value="correction">Inventory Correction</option>
              <option value="purchase">Direct Procurement</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Internal Context Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide reason notes or PO reference..."
              rows="2"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-sm"
              disabled={isSaving || isNegative}
            >
              {isSaving ? 'Posting Ledger...' : 'Commit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
