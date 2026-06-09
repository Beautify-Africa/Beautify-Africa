import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminConfirmDialog from '../AdminShared/AdminConfirmDialog';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import AdminShell from '../AdminShared/AdminShell';
import RestrictedState from '../AdminOrders/RestrictedState';
import VariantManagementModal from './VariantManagementModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import useAdminProductsWorkspace from './useAdminProductsWorkspace';
import AdminProductsCatalogPanel from './AdminProductsCatalogPanel';
import AdminProductsEditorPanel from './AdminProductsEditorPanel';

function WorkspaceLoading() {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-16 text-center shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading product studio...</p>
    </section>
  );
}

export default function AdminProductsWorkspace() {
  const {
    isAuthenticated,
    isRestoringSession,
    isAdmin,
    products,
    pagination,
    activeProductFilters,
    lowStockProducts,
    isLoading,
    isSaving,
    isArchiveBusy,
    error,
    successMessage,
    selectedProduct,
    archiveTarget,
    formState,
    variants,
    isLoadingVariants,
    variantModals,
    selectedVariant,
    variantError,
    bulkImportText,
    bulkOperationMessage,
    bulkOperationError,
    isBulkImporting,
    isBulkExporting,
    setError,
    setSuccessMessage,
    setBulkImportText,
    updateFormField,
    updateFilter,
    updatePage,
    startCreate,
    startEdit,
    saveProduct,
    handleExportProducts,
    handleImportProducts,
    requestArchiveToggle,
    closeArchiveDialog,
    confirmArchiveToggle,
    openAddVariantModal,
    closeAddVariantModal,
    openEditVariantModal,
    closeEditVariantModal,
    closeStockAdjustmentModal,
    handleAddVariant,
    handleUpdateVariant,
    handleDeleteVariant,
    handleAdjustStock,
    loadProducts,
    isProductLowStock,
  } = useAdminProductsWorkspace();

  const canGoNext = (pagination.page || activeProductFilters.page) < (pagination.totalPages || 0);

  return (
    <>
      <Seo title="Admin Products Studio | Beautify Africa" description="Private operations workspace for Beautify Africa product management." path="/admin/products" />
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>

      <AdminShell sectionLabel="Products" title="Product Studio" description="Shared catalog workspace for inventory checks, product editing, merchandising, and media operations." headerContent={<div className="rounded-[1.4rem] border border-stone-200 bg-[#fffdf9] px-4 py-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Phase 1 gain</p><p className="mt-2 text-sm leading-relaxed text-stone-600">Product filters now persist between sessions, and archive actions are routed through a safer confirmation step.</p></div>}>
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
              <AdminProductsCatalogPanel
                products={products}
                pagination={pagination}
                activeProductFilters={activeProductFilters}
                isLoading={isLoading}
                lowStockProducts={lowStockProducts}
                onSearchChange={(value) => updateFilter('search', value)}
                onArchiveChange={(value) => updateFilter('archived', value)}
                onLowStockChange={(value) => updateFilter('lowStockOnly', value)}
                onRefresh={loadProducts}
                onPrevPage={() => updatePage((activeProductFilters.page || 1) - 1)}
                onNextPage={() => updatePage((activeProductFilters.page || 1) + 1)}
                canGoNext={canGoNext}
                onEditProduct={startEdit}
                onArchiveProduct={requestArchiveToggle}
              />

              <AdminProductsEditorPanel
                formState={formState}
                selectedProduct={selectedProduct}
                isSaving={isSaving}
                isBulkExporting={isBulkExporting}
                isBulkImporting={isBulkImporting}
                bulkImportText={bulkImportText}
                bulkOperationMessage={bulkOperationMessage}
                bulkOperationError={bulkOperationError}
                variantError={variantError}
                variants={variants}
                isLoadingVariants={isLoadingVariants}
                onChangeField={updateFormField}
                onSubmit={saveProduct}
                onExport={handleExportProducts}
                onImport={handleImportProducts}
                onImportTextChange={setBulkImportText}
                onCreateNew={startCreate}
                onCancelEdit={startCreate}
                onOpenAddVariant={openAddVariantModal}
                onOpenEditVariant={openEditVariantModal}
                onDeleteVariant={handleDeleteVariant}
                onAdjustStock={handleAdjustStock}
                isProductLowStock={isProductLowStock}
              />
            </main>
          </>
        )}
      </AdminShell>

      <AdminConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title={archiveTarget?.isArchived ? 'Restore this product?' : 'Archive this product?'}
        description={archiveTarget?.isArchived ? 'This will return the product to the active catalog so it can appear in admin active views again.' : 'This will move the product out of the active catalog while keeping its data available for admin review.'}
        confirmLabel={archiveTarget?.isArchived ? 'Restore product' : 'Archive product'}
        tone={archiveTarget?.isArchived ? 'stone' : 'amber'}
        isBusy={isArchiveBusy}
        onConfirm={confirmArchiveToggle}
        onCancel={closeArchiveDialog}
      />

      <VariantManagementModal key={variantModals.isAddModalOpen ? 'add-open' : 'add-closed'} isOpen={variantModals.isAddModalOpen} onClose={closeAddVariantModal} onSave={handleAddVariant} isSaving={false} />
      <VariantManagementModal key={selectedVariant?._id ?? 'edit-no-variant'} isOpen={variantModals.isEditModalOpen} onClose={closeEditVariantModal} variant={selectedVariant} onSave={handleUpdateVariant} isSaving={false} />
      <StockAdjustmentModal isOpen={variantModals.isStockModalOpen} onClose={closeStockAdjustmentModal} variant={selectedVariant} onAdjust={handleAdjustStock} isSaving={false} />
    </>
  );
}