import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import { exportAdminProducts, fetchAdminProducts, importAdminProducts, setAdminProductArchived } from '../../services/adminApi';
import { DEFAULT_PRODUCT_FILTERS } from './adminProductsWorkspace.constants';

export default function useAdminProductsCatalog() {
  const { token, isAuthenticated, user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });
  const [productFilters, setProductFilters] = useLocalStorageState('beautify-africa:admin-product-filters', DEFAULT_PRODUCT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiveBusy, setIsArchiveBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkOperationMessage, setBulkOperationMessage] = useState('');
  const [bulkOperationError, setBulkOperationError] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);

  const activeProductFilters = useMemo(
    () => ({ ...DEFAULT_PRODUCT_FILTERS, ...(productFilters || {}) }),
    [productFilters]
  );
  const lowStockProducts = products.filter((product) => {
    const threshold = Number(product?.lowStockThreshold ?? 5);
    return Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants.some((variant) => Number(variant?.stockQuantity ?? 0) <= threshold)
      : Number(product?.stockQuantity ?? 0) <= threshold;
  });

  const loadProducts = useCallback(async () => {
    if (!token || !isAuthenticated || !isAdmin) return;
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
  }, [activeProductFilters.archived, activeProductFilters.limit, activeProductFilters.lowStockOnly, activeProductFilters.page, activeProductFilters.search, isAdmin, isAuthenticated, token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const updateFilter = useCallback((field, value) => {
    setProductFilters((previous) => ({ ...DEFAULT_PRODUCT_FILTERS, ...(previous || {}), [field]: value, page: 1 }));
  }, [setProductFilters]);

  const updatePage = useCallback((nextPage) => {
    setProductFilters((previous) => ({ ...DEFAULT_PRODUCT_FILTERS, ...(previous || {}), page: Math.max(1, nextPage) }));
  }, [setProductFilters]);

  const requestArchiveToggle = useCallback((product) => {
    setArchiveTarget(product);
    setError('');
  }, []);

  const closeArchiveDialog = useCallback(() => setArchiveTarget(null), []);

  const confirmArchiveToggle = useCallback(async () => {
    if (!token || !archiveTarget?._id) return;
    setIsArchiveBusy(true);
    setError('');
    try {
      await setAdminProductArchived(archiveTarget._id, !archiveTarget.isArchived, token);
      await loadProducts();
      if (selectedProduct?._id === archiveTarget._id) {
        setSelectedProduct((previous) => (previous ? { ...previous, isArchived: !archiveTarget.isArchived } : previous));
      }
      setSuccessMessage(archiveTarget.isArchived ? 'Product restored to the active catalog.' : 'Product archived successfully.');
      setArchiveTarget(null);
    } catch (archiveError) {
      setError(archiveError.message || 'Failed to update archive state.');
    } finally {
      setIsArchiveBusy(false);
    }
  }, [archiveTarget, loadProducts, selectedProduct, token]);

  const handleExportProducts = useCallback(async () => {
    if (!token) return;
    setIsBulkExporting(true);
    setBulkOperationError('');
    setBulkOperationMessage('');
    try {
      const exportData = await exportAdminProducts({ ...activeProductFilters, limit: 500, page: 1 }, token);
      const blob = new Blob([exportData?.csv || ''], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportData?.filename || `beautify-africa-products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setBulkOperationMessage('Exported products as CSV successfully.');
    } catch (exportError) {
      setBulkOperationError(exportError.message || 'Failed to export products.');
    } finally {
      setIsBulkExporting(false);
    }
  }, [activeProductFilters, token]);

  const handleImportProducts = useCallback(async (event) => {
    event.preventDefault();
    if (!token) return;
    setIsBulkImporting(true);
    setBulkOperationError('');
    setBulkOperationMessage('');
    try {
      if (!bulkImportText.trim()) throw new Error('Paste CSV data before importing.');
      const result = await importAdminProducts(bulkImportText, token);
      setBulkOperationMessage(`Import complete: ${result.createdCount} created, ${result.updatedCount} updated, ${result.failedCount} failed.`);
      setBulkImportText('');
      await loadProducts();
    } catch (importError) {
      setBulkOperationError(importError.message || 'Failed to import products.');
    } finally {
      setIsBulkImporting(false);
    }
  }, [bulkImportText, loadProducts, token]);

  return {
    products,
    selectedProduct,
    setSelectedProduct,
    pagination,
    productFilters,
    activeProductFilters,
    lowStockProducts,
    isLoading,
    isArchiveBusy,
    error,
    successMessage,
    archiveTarget,
    bulkImportText,
    bulkOperationMessage,
    bulkOperationError,
    isBulkImporting,
    isBulkExporting,
    setError,
    setSuccessMessage,
    setBulkImportText,
    updateFilter,
    updatePage,
    requestArchiveToggle,
    closeArchiveDialog,
    confirmArchiveToggle,
    handleExportProducts,
    handleImportProducts,
    loadProducts,
  };
}
