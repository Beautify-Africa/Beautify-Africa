import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminOrderDetail, fetchAdminOrders } from '../../services/adminApi';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

export const DEFAULT_ORDER_FILTERS = {
  search: '',
  status: 'all',
  payment: 'all',
  country: '',
  sort: 'newest',
  page: 1,
  limit: 10,
};

export const DEFAULT_ORDER_LEDGER = {
  orders: [],
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  },
  filters: DEFAULT_ORDER_FILTERS,
};

export const DEFAULT_ORDER_DETAIL = null;

export function normalizeLedgerResponse(payload = {}) {
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

export function useAdminOrdersWorkspaceState({
  token,
  isAdminEnabled,
  reloadDashboard,
  runOrderAction,
  runAddOrderNote,
  loadOrderTimeline,
  timelineByOrderId,
}) {
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

  const loadOrderLedger = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!isAdminEnabled || !token) return;

      if (showLoader) setIsLedgerLoading(true);
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
        if (showLoader) setIsLedgerLoading(false);
      }
    },
    [isAdminEnabled, orderCountry, orderLimit, orderPage, orderPayment, orderSearch, orderSort, orderStatus, token]
  );

  useEffect(() => {
    loadOrderLedger({ showLoader: true });
  }, [loadOrderLedger]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => () => {
    detailRequestControllerRef.current?.abort();
  }, []);

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
      if (!orderId || !token) return;

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
        if (!controller.signal.aborted) setOrderDetail(data);
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
    if (!selectedOrderId) return;
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
        return false;
      }
    },
    [isDetailOpen, loadOrderDetail, loadOrderLedger, loadOrderTimeline, runOrderAction, selectedOrderId, timelineByOrderId]
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
        return false;
      }
    },
    [isDetailOpen, loadOrderDetail, loadOrderLedger, loadOrderTimeline, runAddOrderNote, selectedOrderId, timelineByOrderId]
  );

  return {
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
  };
}
