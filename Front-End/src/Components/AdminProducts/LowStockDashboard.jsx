import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import useLowStockDashboard from './useLowStockDashboard';
import LowStockItemsPanel from './LowStockItemsPanel';
import LowStockReorderPlanCard from './LowStockReorderPlanCard';

export default function LowStockDashboard() {
  const {
    items,
    pagination,
    threshold,
    isLoading,
    isLoadingReorderPlan,
    isSending,
    isExportingPlan,
    error,
    planError,
    successMessage,
    reorderPlan,
    setError,
    setPlanError,
    setSuccessMessage,
    handleThresholdChange,
    handleNotifyAdmins,
    handleDownloadPlanCsv,
    loadLowStockItems,
    getStockStatus,
  } = useLowStockDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} /> : null}
      {successMessage ? <AdminFlashNotice type="success" message={successMessage} onDismiss={() => setSuccessMessage('')} /> : null}
      {planError ? <AdminFlashNotice type="error" message={planError} onDismiss={() => setPlanError('')} /> : null}

      <LowStockReorderPlanCard
        reorderPlan={reorderPlan}
        isLoadingReorderPlan={isLoadingReorderPlan}
        isExportingPlan={isExportingPlan}
        onDownloadPlanCsv={handleDownloadPlanCsv}
      />

      <LowStockItemsPanel
        items={items}
        pagination={pagination}
        threshold={threshold}
        isLoading={isLoading}
        isSending={isSending}
        onThresholdChange={handleThresholdChange}
        onNotifyAdmins={handleNotifyAdmins}
        onLoadPage={loadLowStockItems}
        getStockStatus={getStockStatus}
      />
    </div>
  );
}