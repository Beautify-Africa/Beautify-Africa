import { useState } from 'react';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  variant,
  onAdjust,
  isSaving,
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Adjust Stock: {variant.sku}</h2>

        {error && <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />}

        <div className="mb-6 rounded-lg bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Current Stock:</span>
            <span className="text-lg font-bold text-stone-900">{variant.stockQuantity || 0}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-stone-600">New Stock:</span>
            <span
              className={`text-lg font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}
            >
              {newStock}
            </span>
          </div>
          {isNegative && (
            <p className="mt-2 text-xs text-red-600 font-semibold">⚠️ This would create negative stock!</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">
              Quantity Change *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Positive to add, negative to remove"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <p className="mt-1 text-xs text-stone-500">
              E.g., enter +50 to add stock or -10 to reduce
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
              <option value="correction">Correction</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context (optional)"
              rows="3"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              disabled={isSaving || isNegative}
            >
              {isSaving ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
