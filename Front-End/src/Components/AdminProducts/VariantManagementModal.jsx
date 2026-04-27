import { useEffect, useState } from 'react';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

export default function VariantManagementModal({
  isOpen,
  onClose,
  product,
  variant = null,
  onSave,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    sku: '',
    size: '',
    color: '',
    type: '',
    stockQuantity: 0,
    price: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (variant) {
      setFormData({
        sku: variant.sku || '',
        size: variant.attributes?.size || '',
        color: variant.attributes?.color || '',
        type: variant.attributes?.type || '',
        stockQuantity: variant.stockQuantity || 0,
        price: variant.price || '',
      });
    } else {
      setFormData({
        sku: '',
        size: '',
        color: '',
        type: '',
        stockQuantity: 0,
        price: '',
      });
    }
    setValidationErrors({});
    setError('');
  }, [isOpen, variant]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">
          {variant ? 'Edit Variant' : 'Add New Variant'}
        </h2>

        {error && <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SKU */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">SKU *</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="e.g., PRODUCT-SKU-001"
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                validationErrors.sku ? 'border-red-500' : 'border-stone-300'
              } focus:outline-none focus:ring-2 focus:ring-stone-400`}
            />
            {validationErrors.sku && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.sku}</p>
            )}
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              placeholder="e.g., S, M, L, XL"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              placeholder="e.g., Red, Blue, Black"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              placeholder="e.g., Premium, Standard"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">Stock Quantity *</label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              min="0"
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                validationErrors.stockQuantity ? 'border-red-500' : 'border-stone-300'
              } focus:outline-none focus:ring-2 focus:ring-stone-400`}
            />
            {validationErrors.stockQuantity && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.stockQuantity}</p>
            )}
          </div>

          {/* Price (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-stone-900">
              Price (Optional Override)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Leave empty to use product price"
              step="0.01"
              min="0"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <p className="mt-1 text-xs text-stone-500">If set, this overrides the product price</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
