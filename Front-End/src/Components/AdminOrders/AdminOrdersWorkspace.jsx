import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import AdminShell from '../AdminShared/AdminShell';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminOrderDetail, fetchAdminOrders } from '../../services/adminApi';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import AdminOrderDetailDrawer from './AdminOrderDetailDrawer';
import AdminHeroSection from './AdminHeroSection';
import AdminOrdersLedgerPanel from './AdminOrdersLedgerPanel';
import AdminPrimaryPanel from './AdminPrimaryPanel';
import AdminRegionalPanel from './AdminRegionalPanel';
import AdminSidebarPanel from './AdminSidebarPanel';
import AdminStatsGrid from './AdminStatsGrid';
import RestrictedState from './RestrictedState';
import { useAdminDashboard } from './useAdminDashboard';

const DEFAULT_ORDER_FILTERS = {
  search: '',
  status: 'all',
  payment: 'all',
  country: '',
  sort: 'newest',
  page: 1,
  limit: 10,
};

const DEFAULT_ORDER_LEDGER = {
  orders: [],
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  },
  filters: DEFAULT_ORDER_FILTERS,
};

const DEFAULT_ORDER_DETAIL = null;

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

function normalizeLedgerResponse(payload = {}) {
  return {
    orders: Array.isArray(payload.orders) ? payload.orders : [],
    pagination: {
      ...DEFAULT_ORDER_LEDGER.pagination,
      ...(payload.pagination || {}),
    },
    filters: {
      ...DEFAULT_ORDER_FILTERS,
      ...(payload.filters || {}),
    },
  };
}

export default function AdminOrdersWorkspace() {
  const { user, token, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);
  const isAdminEnabled = isAuthenticated && isAdmin;
  const detailRequestControllerRef = useRef(null);
  const [orderFilters, setOrderFilters] = useLocalStorageState(
    'beautify-africa:admin-orders-filters',
    DEFAULT_ORDER_FILTERS
  );
  const [orderLedger, setOrderLedger] = useState(DEFAULT_ORDER_LEDGER);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderDetail, setOrderDetail] = useState(DEFAULT_ORDER_DETAIL);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const activeOrderFilters = {
    ...DEFAULT_ORDER_FILTERS,
    ...(orderFilters || {}),
  };
  const {
    country: orderCountry,
    limit: orderLimit,
    page: orderPage,
    payment: orderPayment,
    search: orderSearch,
    sort: orderSort,
    status: orderStatus,
  } = activeOrderFilters;

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

  const loadOrderLedger = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!isAdminEnabled || !token) {
        return;
      }

      if (showLoader) {
        setIsLedgerLoading(true);
      }
      setLedgerError('');

      try {
        const data = await fetchAdminOrders(
          {
            country: orderCountry,
            limit: orderLimit,
            page: orderPage,
            payment: orderPayment,
            search: orderSearch,
            sort: orderSort,
            status: orderStatus,
          },
          token
        );
        setOrderLedger(normalizeLedgerResponse(data));
      } catch (loadError) {
        setLedgerError(loadError.message || 'Failed to load admin orders.');
      } finally {
        if (showLoader) {
          setIsLedgerLoading(false);
        }
      }
    },
    [
      isAdminEnabled,
      orderCountry,
      orderLimit,
      orderPage,
      orderPayment,
      orderSearch,
      orderSort,
      orderStatus,
      token,
    ]
  );

  useEffect(() => {
    loadOrderLedger({ showLoader: true });
  }, [loadOrderLedger]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(
    () => () => {
      detailRequestControllerRef.current?.abort();
    },
    []
  );

  const handleFilterChange = useCallback(
    (field, value) => {
      setOrderFilters((previous) => ({
        ...DEFAULT_ORDER_FILTERS,
        ...(previous || {}),
        [field]: value,
        page: 1,
      }));
    },
    [setOrderFilters]
  );

  const handlePageChange = useCallback(
    (nextPage) => {
      setOrderFilters((previous) => ({
        ...DEFAULT_ORDER_FILTERS,
        ...(previous || {}),
        page: Math.max(1, nextPage),
      }));
    },
    [setOrderFilters]
  );

  const handleLedgerRefresh = useCallback(async () => {
    await loadOrderLedger({ showLoader: true });
    setSuccessMessage('Order ledger refreshed.');
  }, [loadOrderLedger]);

  const loadOrderDetail = useCallback(
    async (orderId, { showLoader = true, openDrawer = false } = {}) => {
      if (!orderId || !token) {
        return;
      }

      detailRequestControllerRef.current?.abort();
      const controller = new AbortController();
      detailRequestControllerRef.current = controller;

      if (openDrawer) {
        setSelectedOrderId(orderId);
        setIsDetailOpen(true);
      }

      if (showLoader) {
        setIsDetailLoading(true);
        setOrderDetail(DEFAULT_ORDER_DETAIL);
      }
      setDetailError('');

      try {
        const data = await fetchAdminOrderDetail(orderId, token, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setOrderDetail(data);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setDetailError(loadError.message || 'Failed to load order detail.');
        }
      } finally {
        if (detailRequestControllerRef.current === controller) {
          detailRequestControllerRef.current = null;
        }

        if (!controller.signal.aborted && showLoader) {
          setIsDetailLoading(false);
        }
      }
    },
    [token]
  );

  const handleOpenOrderDetail = useCallback(
    (orderId) => {
      void loadOrderDetail(orderId, { showLoader: true, openDrawer: true });
    },
    [loadOrderDetail]
  );

  const handleCloseOrderDetail = useCallback(() => {
    detailRequestControllerRef.current?.abort();
    detailRequestControllerRef.current = null;
    setIsDetailOpen(false);
    setIsDetailLoading(false);
    setSelectedOrderId('');
    setOrderDetail(DEFAULT_ORDER_DETAIL);
    setDetailError('');
  }, []);

  const handleRetryOrderDetail = useCallback(() => {
    if (!selectedOrderId) {
      return;
    }

    void loadOrderDetail(selectedOrderId, { showLoader: true, openDrawer: false });
  }, [loadOrderDetail, selectedOrderId]);

  const handleRefreshWorkspace = useCallback(async () => {
    const requests = [reloadDashboard({ showLoader: true }), loadOrderLedger({ showLoader: true })];

    if (selectedOrderId) {
      requests.push(loadOrderDetail(selectedOrderId, { showLoader: false, openDrawer: false }));
    }

    await Promise.all(requests);
    setSuccessMessage('Admin orders workspace refreshed.');
  }, [loadOrderDetail, loadOrderLedger, reloadDashboard, selectedOrderId]);

  const handleOrderAction = useCallback(
    async (orderId, action) => {
      try {
        await runOrderAction(orderId, action);
        const refreshTasks = [loadOrderLedger({ showLoader: false })];

        if (timelineByOrderId[orderId]) {
          refreshTasks.push(loadOrderTimeline(orderId));
        }

        if (selectedOrderId === orderId && isDetailOpen) {
          refreshTasks.push(loadOrderDetail(orderId, { showLoader: false, openDrawer: false }));
        }

        await Promise.all(refreshTasks);
        setSuccessMessage('Order status updated.');
        return true;
      } catch {
        // Dashboard hook already surfaces the error banner.
        return false;
      }
    },
    [
      isDetailOpen,
      loadOrderDetail,
      loadOrderLedger,
      loadOrderTimeline,
      runOrderAction,
      selectedOrderId,
      timelineByOrderId,
    ]
  );

  const handleAddOrderNote = useCallback(
    async (orderId, note) => {
      try {
        await runAddOrderNote(orderId, note);
        const refreshTasks = [loadOrderLedger({ showLoader: false })];

        if (timelineByOrderId[orderId]) {
          refreshTasks.push(loadOrderTimeline(orderId));
        }

        if (selectedOrderId === orderId && isDetailOpen) {
          refreshTasks.push(loadOrderDetail(orderId, { showLoader: false, openDrawer: false }));
        }

        await Promise.all(refreshTasks);
        setSuccessMessage('Internal note saved.');
        return true;
      } catch {
        // Dashboard hook already surfaces the error banner.
        return false;
      }
    },
    [
      isDetailOpen,
      loadOrderDetail,
      loadOrderLedger,
      loadOrderTimeline,
      runAddOrderNote,
      selectedOrderId,
      timelineByOrderId,
    ]
  );

  return (
    <>
      <Seo
        title="Admin Orders Studio | Beautify Africa"
        description="Private operations workspace for Beautify Africa order management."
        path="/admin/orders"
        imageAlt="Beautify Africa admin orders workspace"
      />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AdminShell
        sectionLabel="Orders"
        title="Orders Studio"
        description="Command view for dispatch, payment clearance, note handoffs, and the wider order ledger."
        headerContent={
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Operations Notice
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">
              Live priority queue active with instant fulfillment drawer review and status transitions.
            </p>
          </div>
        }
      >
        {isRestoringSession ? (
          <WorkspaceLoading label="Restoring admin session..." />
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
              <AdminFlashNotice
                tone="error"
                message={error}
                onDismiss={clearError}
              />
            </div>

            <AdminHeroSection
              heroBadges={dashboard.heroBadges}
              ritualChecklist={dashboard.ritualChecklist}
            />

            {isLoading ? (
              <WorkspaceLoading />
            ) : (
              <>
                <AdminStatsGrid stats={dashboard.stats} />
                <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                  <AdminPrimaryPanel
                    dashboard={dashboard}
                    busyActionKey={busyActionKey}
                    timelineByOrderId={timelineByOrderId}
                    onOrderAction={handleOrderAction}
                    onAddOrderNote={handleAddOrderNote}
                    onLoadOrderTimeline={loadOrderTimeline}
                    onOpenOrderDetail={handleOpenOrderDetail}
                  />
                  <AdminSidebarPanel lanes={dashboard.lanes} watchlist={dashboard.watchlist} />
                </div>
                <AdminRegionalPanel regionalPulse={dashboard.regionalPulse} />
              </>
            )}

            <AdminOrdersLedgerPanel
              filters={activeOrderFilters}
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
      </AdminShell>

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
    </>
  );
}
