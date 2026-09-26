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
import { useAuth } from '../../hooks/useAuth';

function WorkspaceLoading() {
  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 px-8 py-16 text-center shadow-xl">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
        Loading product studio...
      </p>
    </section>
  );
}

export default function AdminProductsWorkspace() {
  const auth = useAuth();
  const workspace = useAdminProductsWorkspace();

  const isRestoringSession = workspace.isRestoringSession ?? auth.isRestoringSession;
  const isAuthenticated = workspace.isAuthenticated ?? auth.isAuthenticated;
  const isAdmin =
    workspace.isAdmin ?? Boolean(auth.user?.isAdmin || auth.user?.role === 'admin' || auth.isAdmin);

  const {
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
      <Seo
        title="Admin Products Studio | Beautify Africa"
        description="Private operations workspace for Beautify Africa product management."
        path="/admin/products"
      />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AdminShell
        sectionLabel="Products"
        title="Product Studio"
        description="Shared catalog workspace for inventory checks, product editing, merchandising, and media operations."
        headerContent={
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Catalog Master
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">
              Live SKU editing, variant matrix management, batch exports, and media synchronization.
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
              <AdminFlashNotice
                tone="success"
                message={successMessage}
                onDismiss={() => setSuccessMessage('')}
              />
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

      <VariantManagementModal
        key={variantModals.isAddModalOpen ? 'add-open' : 'add-closed'}
        isOpen={variantModals.isAddModalOpen}
        onClose={closeAddVariantModal}
        onSave={handleAddVariant}
        isSaving={false}
      />
      <VariantManagementModal
        key={selectedVariant?._id ?? 'edit-no-variant'}
        isOpen={variantModals.isEditModalOpen}
        onClose={closeEditVariantModal}
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
