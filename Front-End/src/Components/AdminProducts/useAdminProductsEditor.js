import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addProductVariant, adjustVariantStock, createAdminProduct, deleteProductVariant, getProductVariants, updateAdminProduct, updateProductVariant } from '../../services/adminApi';
import { EMPTY_FORM } from './adminProductsWorkspace.constants';

export default function useAdminProductsEditor({ selectedProduct, setSelectedProduct, loadProducts, setSuccessMessage }) {
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantModals, setVariantModals] = useState({ isAddModalOpen: false, isEditModalOpen: false, isStockModalOpen: false });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantError, setVariantError] = useState('');

  const loadVariants = useCallback(async (productId) => {
    if (!token || !productId) return;
    try {
      setIsLoadingVariants(true);
      setVariantError('');
      const data = await getProductVariants(productId, token);
      setVariants(data.variants || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
      setVariantError(err.message || 'Failed to load variants');
    } finally {
      setIsLoadingVariants(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedProduct) {
      setFormState({
        name: selectedProduct.name || '',
        brand: selectedProduct.brand || '',
        category: selectedProduct.category || '',
        subcategory: selectedProduct.subcategory || '',
        description: selectedProduct.description || '',
        image: selectedProduct.image || '',
        imagesText: Array.isArray(selectedProduct.images) ? selectedProduct.images.join(', ') : '',
        price: selectedProduct.price ?? '',
        originalPrice: selectedProduct.originalPrice ?? '',
        stockQuantity: selectedProduct.stockQuantity ?? 0,
        lowStockThreshold: selectedProduct.lowStockThreshold ?? 5,
        skinType: (selectedProduct.skinType || []).join(', ') || 'All',
        tags: (selectedProduct.tags || []).join(', '),
        isNewProduct: Boolean(selectedProduct.isNewProduct),
        isBestSeller: Boolean(selectedProduct.isBestSeller),
      });
      loadVariants(selectedProduct._id);
      return;
    }

    setFormState(EMPTY_FORM);
    setVariants([]);
    setSelectedVariant(null);
    setVariantModals({ isAddModalOpen: false, isEditModalOpen: false, isStockModalOpen: false });
  }, [loadVariants, selectedProduct, setSelectedProduct]);

  const updateFormField = useCallback((field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  }, []);

  const startCreate = useCallback(() => {
    setSelectedProduct(null);
    setFormState(EMPTY_FORM);
  }, [setSelectedProduct]);

  const startEdit = useCallback((product) => {
    setSelectedProduct(product);
  }, [setSelectedProduct]);

  const saveProduct = useCallback(async (event) => {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    const payload = {
      ...formState,
      images: String(formState.imagesText || '').split(',').map((entry) => entry.trim()).filter(Boolean),
      price: Number(formState.price),
      originalPrice: formState.originalPrice === '' || formState.originalPrice === null ? null : Number(formState.originalPrice),
      stockQuantity: Number(formState.stockQuantity),
      lowStockThreshold: Number(formState.lowStockThreshold),
      skinType: String(formState.skinType || '').split(',').map((entry) => entry.trim()).filter(Boolean),
      tags: String(formState.tags || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    };

    try {
      if (selectedProduct?._id) {
        await updateAdminProduct(selectedProduct._id, payload, token);
        setSuccessMessage('Product updated successfully.');
      } else {
        await createAdminProduct(payload, token);
        setSuccessMessage('Product created successfully.');
      }
      await loadProducts();
      startCreate();
    } catch (saveError) {
      setVariantError(saveError.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  }, [formState, loadProducts, selectedProduct, setSuccessMessage, startCreate, token]);

  const openAddVariantModal = useCallback(() => { setSelectedVariant(null); setVariantModals((prev) => ({ ...prev, isAddModalOpen: true })); }, []);
  const closeAddVariantModal = useCallback(() => { setVariantModals((prev) => ({ ...prev, isAddModalOpen: false })); }, []);
  const openEditVariantModal = useCallback((variant) => { setSelectedVariant(variant); setVariantModals((prev) => ({ ...prev, isEditModalOpen: true })); }, []);
  const closeEditVariantModal = useCallback(() => { setVariantModals((prev) => ({ ...prev, isEditModalOpen: false })); setSelectedVariant(null); }, []);
  const openStockAdjustmentModal = useCallback((variant) => { setSelectedVariant(variant); setVariantModals((prev) => ({ ...prev, isStockModalOpen: true })); }, []);
  const closeStockAdjustmentModal = useCallback(() => { setVariantModals((prev) => ({ ...prev, isStockModalOpen: false })); setSelectedVariant(null); }, []);

  const handleAddVariant = useCallback(async (variantData) => {
    if (!token || !selectedProduct?._id) return;
    try {
      setVariantError('');
      await addProductVariant(selectedProduct._id, variantData, token);
      await loadVariants(selectedProduct._id);
      closeAddVariantModal();
      setSuccessMessage('Variant added successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to add variant');
    }
  }, [closeAddVariantModal, loadVariants, selectedProduct, setSuccessMessage, token]);

  const handleUpdateVariant = useCallback(async (variantData) => {
    if (!token || !selectedProduct?._id || !selectedVariant?._id) return;
    try {
      setVariantError('');
      await updateProductVariant(selectedProduct._id, selectedVariant._id, variantData, token);
      await loadVariants(selectedProduct._id);
      closeEditVariantModal();
      setSuccessMessage('Variant updated successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to update variant');
    }
  }, [closeEditVariantModal, loadVariants, selectedProduct, selectedVariant, setSuccessMessage, token]);

  const handleDeleteVariant = useCallback(async (variantToDelete) => {
    if (!token || !selectedProduct?._id || !variantToDelete?._id) return;
    try {
      setVariantError('');
      await deleteProductVariant(selectedProduct._id, variantToDelete._id, token);
      await loadVariants(selectedProduct._id);
      setSuccessMessage('Variant deleted successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to delete variant');
    }
  }, [loadVariants, selectedProduct, setSuccessMessage, token]);

  const handleAdjustStock = useCallback(async (quantity, reason, notes) => {
    if (!token || !selectedProduct?._id || !selectedVariant?._id) return;
    try {
      setVariantError('');
      await adjustVariantStock(selectedProduct._id, selectedVariant._id, quantity, reason, notes, token);
      await loadVariants(selectedProduct._id);
      closeStockAdjustmentModal();
      setSuccessMessage('Stock adjusted successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to adjust stock');
    }
  }, [closeStockAdjustmentModal, loadVariants, selectedProduct, selectedVariant, setSuccessMessage, token]);

  const isProductLowStock = useCallback((product) => {
    const threshold = Number(product?.lowStockThreshold ?? 5);
    return Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants.some((variant) => Number(variant?.stockQuantity ?? 0) <= threshold)
      : Number(product?.stockQuantity ?? 0) <= threshold;
  }, []);

  return {
    isSaving,
    formState,
    variants,
    isLoadingVariants,
    variantModals,
    selectedVariant,
    variantError,
    updateFormField,
    startCreate,
    startEdit,
    saveProduct,
    openAddVariantModal,
    closeAddVariantModal,
    openEditVariantModal,
    closeEditVariantModal,
    openStockAdjustmentModal,
    closeStockAdjustmentModal,
    handleAddVariant,
    handleUpdateVariant,
    handleDeleteVariant,
    handleAdjustStock,
    isProductLowStock,
    setVariantError,
  };
}
