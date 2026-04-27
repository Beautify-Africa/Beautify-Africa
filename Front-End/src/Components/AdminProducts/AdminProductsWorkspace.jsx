import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminConfirmDialog from '../AdminShared/AdminConfirmDialog';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import AdminShell from '../AdminShared/AdminShell';
import RestrictedState from '../AdminOrders/RestrictedState';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import ImageUploader from './ImageUploader';
import VariantManagementModal from './VariantManagementModal';
import VariantList from './VariantList';
import StockAdjustmentModal from './StockAdjustmentModal';
import {
  createAdminProduct,
  fetchAdminProducts,
  setAdminProductArchived,
  updateAdminProduct,
  getProductVariants,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  adjustVariantStock,
} from '../../services/adminApi';

const EMPTY_FORM = {
  name: '',
  brand: '',
  category: '',
  subcategory: '',
  description: '',
  image: '',
  price: '',
  originalPrice: '',
  stockQuantity: 0,
  lowStockThreshold: 5,
  skinType: 'All',
  tags: '',
  isNewProduct: false,
  isBestSeller: false,
};

const DEFAULT_PRODUCT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  archived: 'false',
  lowStockOnly: false,
};

function WorkspaceLoading() {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-16 text-center shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading product studio...</p>
    </section>
  );
}

export default function AdminProductsWorkspace() {
  const { user, token, isAuthenticated, isRestoringSession } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });
  const [productFilters, setProductFilters] = useLocalStorageState(
    'beautify-africa:admin-product-filters',
    DEFAULT_PRODUCT_FILTERS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveBusy, setIsArchiveBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantModals, setVariantModals] = useState({
    isAddModalOpen: false,
    isEditModalOpen: false,
    isStockModalOpen: false,
  });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantError, setVariantError] = useState('');

  const activeProductFilters = {
    ...DEFAULT_PRODUCT_FILTERS,
    ...(productFilters || {}),
  };

  const loadProducts = useCallback(async () => {
    if (!token || !isAuthenticated || !isAdmin) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchAdminProducts(
        {
          page: activeProductFilters.page,
          limit: activeProductFilters.limit,
          search: activeProductFilters.search,
          archived: activeProductFilters.archived,
          lowStock: activeProductFilters.lowStockOnly,
        },
        token
      );

      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, totalPages: 0, totalCount: 0 });
    } catch (loadError) {
      setError(loadError.message || 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeProductFilters.archived,
    activeProductFilters.limit,
    activeProductFilters.lowStockOnly,
    activeProductFilters.page,
    activeProductFilters.search,
    isAdmin,
    isAuthenticated,
    token,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const loadVariants = useCallback(
    async (productId) => {
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
    },
    [token]
  );

  useEffect(() => {
    if (selectedProduct) {
      setFormState({
        name: selectedProduct.name || '',
        brand: selectedProduct.brand || '',
        category: selectedProduct.category || '',
        subcategory: selectedProduct.subcategory || '',
        description: selectedProduct.description || '',
        image: selectedProduct.image || '',
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
    setVariantModals({
      isAddModalOpen: false,
      isEditModalOpen: false,
      isStockModalOpen: false,
    });
  }, [selectedProduct, loadVariants]);

  function startCreate() {
    setSelectedProduct(null);
    setFormState(EMPTY_FORM);
    setError('');
  }

  function startEdit(product) {
    setSelectedProduct(product);
    setError('');
  }

  function updateFormField(field, value) {
    setFormState((previous) => ({ ...previous, [field]: value }));
  }

  function updateFilter(field, value) {
    setProductFilters((previous) => ({
      ...DEFAULT_PRODUCT_FILTERS,
      ...(previous || {}),
      [field]: value,
      page: 1,
    }));
  }

  function updatePage(nextPage) {
    setProductFilters((previous) => ({
      ...DEFAULT_PRODUCT_FILTERS,
      ...(previous || {}),
      page: Math.max(1, nextPage),
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError('');

    const payload = {
      ...formState,
      price: Number(formState.price),
      originalPrice:
        formState.originalPrice === '' || formState.originalPrice === null
          ? null
          : Number(formState.originalPrice),
      stockQuantity: Number(formState.stockQuantity),
      lowStockThreshold: Number(formState.lowStockThreshold),
      skinType: String(formState.skinType || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      tags: String(formState.tags || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
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
      setError(saveError.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  }

  function requestArchiveToggle(product) {
    setArchiveTarget(product);
    setError('');
  }

  function closeArchiveDialog() {
    setArchiveTarget(null);
  }

  async function confirmArchiveToggle() {
    if (!token || !archiveTarget?._id) {
      return;
    }

    setIsArchiveBusy(true);
    setError('');

    try {
      await setAdminProductArchived(archiveTarget._id, !archiveTarget.isArchived, token);
      await loadProducts();
      if (selectedProduct?._id === archiveTarget._id) {
        setSelectedProduct((previous) =>
          previous ? { ...previous, isArchived: !archiveTarget.isArchived } : previous
        );
      }
      setSuccessMessage(
        archiveTarget.isArchived ? 'Product restored to the active catalog.' : 'Product archived successfully.'
      );
      setArchiveTarget(null);
    } catch (archiveError) {
      setError(archiveError.message || 'Failed to update archive state.');
    } finally {
      setIsArchiveBusy(false);
    }
  }

  const canGoNext = (pagination.page || activeProductFilters.page) < (pagination.totalPages || 0);

  // Variant handlers
  function openAddVariantModal() {
    setSelectedVariant(null);
    setVariantModals((prev) => ({ ...prev, isAddModalOpen: true }));
  }

  function closeAddVariantModal() {
    setVariantModals((prev) => ({ ...prev, isAddModalOpen: false }));
  }

  function openEditVariantModal(variant) {
    setSelectedVariant(variant);
    setVariantModals((prev) => ({ ...prev, isEditModalOpen: true }));
  }

  function closeEditVariantModal() {
    setVariantModals((prev) => ({ ...prev, isEditModalOpen: false }));
    setSelectedVariant(null);
  }

  function openStockAdjustmentModal(variant) {
    setSelectedVariant(variant);
    setVariantModals((prev) => ({ ...prev, isStockModalOpen: true }));
  }

  function closeStockAdjustmentModal() {
    setVariantModals((prev) => ({ ...prev, isStockModalOpen: false }));
    setSelectedVariant(null);
  }

  async function handleAddVariant(variantData) {
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
  }

  async function handleUpdateVariant(variantData) {
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
  }

  async function handleDeleteVariant(variantToDelete) {
    if (!token || !selectedProduct?._id || !variantToDelete?._id) return;
    try {
      setVariantError('');
      await deleteProductVariant(selectedProduct._id, variantToDelete._id, token);
      await loadVariants(selectedProduct._id);
      setSuccessMessage('Variant deleted successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to delete variant');
    }
  }

  async function handleAdjustStock(quantity, reason, notes) {
    if (!token || !selectedProduct?._id || !selectedVariant?._id) return;
    try {
      setVariantError('');
      await adjustVariantStock(
        selectedProduct._id,
        selectedVariant._id,
        quantity,
        reason,
        notes,
        token
      );
      await loadVariants(selectedProduct._id);
      closeStockAdjustmentModal();
      setSuccessMessage('Stock adjusted successfully.');
    } catch (err) {
      setVariantError(err.message || 'Failed to adjust stock');
    }
  }

  return (
    <>
      <Seo
        title="Admin Products Studio | Beautify Africa"
        description="Private operations workspace for Beautify Africa product management."
        path="/admin/products"
      />
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>

      <AdminShell
        sectionLabel="Products"
        title="Product Studio"
        description="Shared catalog workspace for inventory checks, product editing, merchandising, and media operations."
        headerContent={
          <div className="rounded-[1.4rem] border border-stone-200 bg-[#fffdf9] px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Phase 1 gain</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Product filters now persist between sessions, and archive actions are routed through a safer confirmation step.
            </p>
          </div>
        }
      >
        {isRestoringSession ? (
          <WorkspaceLoading />
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : (
          <>
            <div className="space-y-4">
              <AdminFlashNotice tone="success" message={successMessage} onDismiss={() => setSuccessMessage('')} />
              <AdminFlashNotice tone="error" message={error} onDismiss={() => setError('')} />
            </div>

            <main className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <section>
                <ImageUploader />

                <div className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)]">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px] flex-1">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Search</label>
                      <input
                        type="text"
                        value={activeProductFilters.search}
                        onChange={(event) => updateFilter('search', event.target.value)}
                        placeholder="Name, brand, category"
                        className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Archive</label>
                      <select
                        value={activeProductFilters.archived}
                        onChange={(event) => updateFilter('archived', event.target.value)}
                        className="mt-2 rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      >
                        <option value="false">Active</option>
                        <option value="true">Archived</option>
                        <option value="all">All</option>
                      </select>
                    </div>

                    <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={Boolean(activeProductFilters.lowStockOnly)}
                        onChange={(event) => updateFilter('lowStockOnly', event.target.checked)}
                      />
                      Low stock only
                    </label>

                    <button
                      type="button"
                      onClick={loadProducts}
                      className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.16em] text-stone-500">
                          <th className="py-2 pr-3">Product</th>
                          <th className="py-2 pr-3">Price</th>
                          <th className="py-2 pr-3">Stock</th>
                          <th className="py-2 pr-3">State</th>
                          <th className="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-stone-500">Loading products...</td>
                          </tr>
                        ) : products.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-stone-500">No products found.</td>
                          </tr>
                        ) : (
                          products.map((product) => (
                            <tr key={product._id} className="border-b border-stone-100 align-top">
                              <td className="py-3 pr-3">
                                <p className="font-medium text-stone-900">{product.name}</p>
                                <p className="text-xs text-stone-500">{product.brand} · {product.category}</p>
                              </td>
                              <td className="py-3 pr-3">${Number(product.price || 0).toFixed(2)}</td>
                              <td className="py-3 pr-3">
                                <p>{product.stockQuantity ?? 0}</p>
                                <p className="text-xs text-stone-500">Low at {product.lowStockThreshold ?? 5}</p>
                              </td>
                              <td className="py-3 pr-3">
                                {product.isArchived ? (
                                  <span className="rounded-full border border-stone-300 px-2 py-1 text-xs">Archived</span>
                                ) : (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 5) ? (
                                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700">Low stock</span>
                                ) : (
                                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Healthy</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(product)}
                                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestArchiveToggle(product)}
                                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-700"
                                  >
                                    {product.isArchived ? 'Restore' : 'Archive'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                    <p>{pagination.totalCount || 0} product(s)</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={(activeProductFilters.page || 1) <= 1}
                        onClick={() => updatePage((activeProductFilters.page || 1) - 1)}
                        className="rounded border border-stone-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span>Page {activeProductFilters.page || 1} / {Math.max(1, pagination.totalPages || 1)}</span>
                      <button
                        type="button"
                        disabled={!canGoNext}
                        onClick={() => updatePage((activeProductFilters.page || 1) + 1)}
                        className="rounded border border-stone-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)]">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-stone-900">Catalogue Management</h3>
                    <p className="mt-2 text-sm text-stone-500">
                      Create and maintain products, inventory thresholds, and merchandising metadata.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-700"
                  >
                    New Product
                  </button>
                </div>

                <form className="space-y-4" onSubmit={saveProduct}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={formState.name} onChange={(event) => updateFormField('name', event.target.value)} placeholder="Product name" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input value={formState.brand} onChange={(event) => updateFormField('brand', event.target.value)} placeholder="Brand" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input value={formState.category} onChange={(event) => updateFormField('category', event.target.value)} placeholder="Category" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input value={formState.subcategory} onChange={(event) => updateFormField('subcategory', event.target.value)} placeholder="Subcategory" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                    <input type="number" min="0" step="0.01" value={formState.price} onChange={(event) => updateFormField('price', event.target.value)} placeholder="Price" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input type="number" min="0" step="0.01" value={formState.originalPrice} onChange={(event) => updateFormField('originalPrice', event.target.value)} placeholder="Original price (optional)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                    <input type="number" min="0" value={formState.stockQuantity} onChange={(event) => updateFormField('stockQuantity', event.target.value)} placeholder="Stock quantity" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input type="number" min="0" value={formState.lowStockThreshold} onChange={(event) => updateFormField('lowStockThreshold', event.target.value)} placeholder="Low stock threshold" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" required />
                    <input value={formState.skinType} onChange={(event) => updateFormField('skinType', event.target.value)} placeholder="Skin types (comma-separated)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                    <input value={formState.tags} onChange={(event) => updateFormField('tags', event.target.value)} placeholder="Tags (comma-separated)" className="rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                  </div>

                  <input value={formState.image} onChange={(event) => updateFormField('image', event.target.value)} placeholder="Primary image URL" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" required />

                  <textarea
                    rows={4}
                    value={formState.description}
                    onChange={(event) => updateFormField('description', event.target.value)}
                    placeholder="Description"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  />

                  <div className="flex flex-wrap gap-3 text-sm text-stone-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formState.isNewProduct}
                        onChange={(event) => updateFormField('isNewProduct', event.target.checked)}
                      />
                      New product
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formState.isBestSeller}
                        onChange={(event) => updateFormField('isBestSeller', event.target.checked)}
                      />
                      Best seller
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSaving ? 'Saving...' : selectedProduct ? 'Update Product' : 'Create Product'}
                    </button>
                    {selectedProduct ? (
                      <button
                        type="button"
                        onClick={startCreate}
                        className="rounded-full border border-stone-300 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-stone-700"
                      >
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>

                {/* Variant Management Section */}
                {selectedProduct && (
                  <div className="mt-8 border-t border-stone-200 pt-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-stone-900">Variants</h4>
                        <p className="mt-1 text-xs text-stone-500">
                          Manage product variants with separate stock levels
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddVariantModal}
                        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-700 hover:bg-stone-50"
                      >
                        Add Variant
                      </button>
                    </div>

                    {variantError && (
                      <AdminFlashNotice type="error" message={variantError} onDismiss={() => setVariantError('')} />
                    )}

                    <VariantList
                      variants={variants}
                      isBusy={isLoadingVariants}
                      onEdit={openEditVariantModal}
                      onDelete={handleDeleteVariant}
                      onAdjustStock={openStockAdjustmentModal}
                    />
                  </div>
                )}
              </section>
            </main>
          </>
        )}
      </AdminShell>

      <AdminConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title={archiveTarget?.isArchived ? 'Restore this product?' : 'Archive this product?'}
        description={
          archiveTarget?.isArchived
            ? 'This will return the product to the active catalog so it can appear in admin active views again.'
            : 'This will move the product out of the active catalog while keeping its data available for admin review.'
        }
        confirmLabel={archiveTarget?.isArchived ? 'Restore product' : 'Archive product'}
        tone={archiveTarget?.isArchived ? 'stone' : 'amber'}
        isBusy={isArchiveBusy}
        onConfirm={confirmArchiveToggle}
        onCancel={closeArchiveDialog}
      />

      {/* Variant Modals */}
      <VariantManagementModal
        isOpen={variantModals.isAddModalOpen}
        onClose={closeAddVariantModal}
        product={selectedProduct}
        onSave={handleAddVariant}
        isSaving={false}
      />

      <VariantManagementModal
        isOpen={variantModals.isEditModalOpen}
        onClose={closeEditVariantModal}
        product={selectedProduct}
        variant={selectedVariant}
        onSave={handleUpdateVariant}
        isSaving={false}
      />

      <StockAdjustmentModal
        isOpen={variantModals.isStockModalOpen}
        onClose={closeStockAdjustmentModal}
        variant={selectedVariant}
        onAdjust={handleAdjustStock}
        isSaving={false}
      />
    </>
  );
}

