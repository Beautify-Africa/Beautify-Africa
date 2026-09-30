import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import AdminShell from '../AdminShared/AdminShell';
import { useAuth } from '../../hooks/useAuth';
import AdminOrderDetailDrawer from './AdminOrderDetailDrawer';
import AdminHeroSection from './AdminHeroSection';
import AdminOrdersLedgerPanel from './AdminOrdersLedgerPanel';
import AdminPrimaryPanel from './AdminPrimaryPanel';
import AdminRegionalPanel from './AdminRegionalPanel';
import AdminSidebarPanel from './AdminSidebarPanel';
import AdminStatsGrid from './AdminStatsGrid';
import RestrictedState from './RestrictedState';
import { useAdminDashboard } from './useAdminDashboard';
import { useAdminOrdersWorkspaceState } from './useAdminOrdersWorkspaceState';

function WorkspaceLoading({ label = 'Loading dashboard...' }) {
  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 px-8 py-16 text-center shadow-xl backdrop-blur-md">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
    </section>
  );
}

export default function AdminOrdersWorkspace() {
  const { user, token, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);
  const isAdminEnabled = isAuthenticated && isAdmin;

  const {
    dashboard,
    isLoading,
    error,
    clearError,
    busyActionKey,
    timelineByOrderId,
    reloadDashboard,
    runOrderAction,
    runAddOrderNote,
    loadOrderTimeline,
  } = useAdminDashboard(token, isAdminEnabled);

  const {
    orderFilters,
    orderLedger,
    isLedgerLoading,
    ledgerError,
    successMessage,
    selectedOrderId,
    orderDetail,
    isDetailOpen,
    isDetailLoading,
    detailError,
    handleFilterChange,
    handlePageChange,
    handleLedgerRefresh,
    handleOpenOrderDetail,
    handleCloseOrderDetail,
    handleRetryOrderDetail,
    handleRefreshWorkspace,
    handleOrderAction,
    handleAddOrderNote,
  } = useAdminOrdersWorkspaceState({
    token,
    isAdminEnabled,
    reloadDashboard,
    runOrderAction,
    runAddOrderNote,
    loadOrderTimeline,
    timelineByOrderId,
  });

  const activeError = error || ledgerError;

  if (isRestoringSession) {
    return (
      <AdminShell
        sectionLabel="Executive Operations"
        title="Orders"
        description="Live fulfillment, inventory allocation, and customer order management."
      >
        <WorkspaceLoading label="Restoring admin session..." />
      </AdminShell>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <AdminShell
        sectionLabel="Executive Operations"
        title="Orders"
        description="Access restricted"
      >
        <RestrictedState isAuthenticated={isAuthenticated} />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      sectionLabel="Executive Operations"
      title="Orders"
      description="Live fulfillment, inventory allocation, and customer order management."
    >
      <Seo
        title="Admin Orders Workspace | Beautify Africa"
        description="Internal order operations ledger and live dispatch monitoring."
        path="/admin/orders"
      />
      <Helmet>
        <title>Admin Orders Workspace | Beautify Africa</title>
      </Helmet>

      <div className="space-y-8">
        <AdminHeroSection
          heroBadges={dashboard.heroBadges}
          ritualChecklist={dashboard.ritualChecklist}
        />

        {successMessage ? (
          <AdminFlashNotice tone="success" message={successMessage} />
        ) : null}

        {activeError ? (
          <AdminFlashNotice
            tone="error"
            message={activeError}
            onDismiss={clearError}
          />
        ) : null}

        {isLoading ? (
          <WorkspaceLoading />
        ) : (
          <>
            <AdminStatsGrid stats={dashboard.stats} />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="space-y-8 xl:col-span-8">
                <AdminPrimaryPanel
                  dashboard={dashboard}
                  busyActionKey={busyActionKey}
                  timelineByOrderId={timelineByOrderId}
                  onOrderAction={handleOrderAction}
                  onAddOrderNote={handleAddOrderNote}
                  onLoadOrderTimeline={loadOrderTimeline}
                  onOpenOrderDetail={handleOpenOrderDetail}
                />

                <AdminOrdersLedgerPanel
                  filters={orderFilters}
                  orders={orderLedger.orders}
                  pagination={orderLedger.pagination}
                  isLoading={isLedgerLoading}
                  error={ledgerError}
                  busyActionKey={busyActionKey}
                  onFilterChange={handleFilterChange}
                  onPageChange={handlePageChange}
                  onRefresh={handleLedgerRefresh}
                  onOrderAction={handleOrderAction}
                  onOpenOrderDetail={handleOpenOrderDetail}
                />
              </div>

              <div className="space-y-8 xl:col-span-4">
                <AdminRegionalPanel regionalPulse={dashboard.regionalPulse} />
                <AdminSidebarPanel
                  lanes={dashboard.lanes}
                  watchlist={dashboard.watchlist}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRefreshWorkspace}
                className="rounded-xl border border-zinc-700/80 bg-zinc-800/70 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Refresh Full Workspace
              </button>
            </div>
          </>
        )}
      </div>

      <AdminOrderDetailDrawer
        key={selectedOrderId || 'admin-order-detail-drawer'}
        isOpen={isDetailOpen}
        orderDetail={orderDetail}
        isLoading={isDetailLoading}
        error={detailError}
        busyActionKey={busyActionKey}
        onClose={handleCloseOrderDetail}
        onRetry={handleRetryOrderDetail}
        onOrderAction={handleOrderAction}
        onAddOrderNote={handleAddOrderNote}
      />
    </AdminShell>
  );
}
