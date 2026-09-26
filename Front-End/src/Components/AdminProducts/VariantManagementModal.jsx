import { useState } from 'react';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

export default function VariantManagementModal({
  isOpen,
  onClose,
  variant = null,
  onSave,
  isSaving,
}) {
  const [formData, setFormData] = useState(() => ({
    sku: variant?.sku || '',
    size: variant?.attributes?.size || '',
    color: variant?.attributes?.color || '',
    type: variant?.attributes?.type || '',
    stockQuantity: variant?.stockQuantity || 0,
    price: variant?.price || '',
  }));

  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.sku || formData.sku.trim() === '') {
      errors.sku = 'SKU is required';
    }

    if (typeof formData.stockQuantity !== 'number' || formData.stockQuantity < 0) {
      errors.stockQuantity = 'Stock quantity must be a non-negative number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const variantPayload = {
        sku: formData.sku.trim(),
        attributes: {
          size: formData.size.trim(),
          color: formData.color.trim(),
          type: formData.type.trim(),
        },
        stockQuantity: formData.stockQuantity,
      };

      if (formData.price) {
        variantPayload.price = parseFloat(formData.price);
      }

      await onSave(variantPayload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save variant');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
          <h2 className="text-base font-bold tracking-tight text-white">
            {variant ? 'Edit SKU Variant' : 'New SKU Variant'}
          </h2>
          <span className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
            Catalog Schema
          </span>
        </div>

        {error && <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* SKU */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              SKU Identifier *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="e.g., BOT-SERUM-50ML"
              className={`mt-1.5 w-full rounded-xl border font-mono text-sm px-3.5 py-2 text-zinc-100 bg-[#090D16] ${
                validationErrors.sku ? 'border-rose-500' : 'border-zinc-800'
              } focus:border-amber-400 focus:outline-none`}
            />
            {validationErrors.sku && (
              <p className="mt-1 text-xs text-rose-400">{validationErrors.sku}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Size */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="50ml, L"
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Color/Tone
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="Ebony, Gold"
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Type
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="Travel, Refill"
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              min="0"
              className={`mt-1.5 w-full rounded-xl border font-mono text-sm px-3.5 py-2 text-zinc-100 bg-[#090D16] ${
                validationErrors.stockQuantity ? 'border-rose-500' : 'border-zinc-800'
              } focus:border-amber-400 focus:outline-none`}
            />
            {validationErrors.stockQuantity && (
              <p className="mt-1 text-xs text-rose-400">{validationErrors.stockQuantity}</p>
            )}
          </div>

          {/* Price (Optional) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Price Override (Optional USD)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Leave blank to adopt base product price"
              step="0.01"
              min="0"
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#090D16] px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-sm"
              disabled={isSaving}
            >
              {isSaving ? 'Committing...' : 'Save Variant Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
