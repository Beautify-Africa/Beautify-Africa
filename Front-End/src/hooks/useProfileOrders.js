import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMyOrders } from '../services/ordersApi';

const ORDER_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const ORDER_REFRESH_MAX_INTERVAL_MS = 10 * 60 * 1000;

function getBackoffDelay(attempt) {
  const cappedAttempt = Math.max(0, Math.min(attempt, 4));
  const baseDelay = Math.min(ORDER_REFRESH_INTERVAL_MS * (2 ** cappedAttempt), ORDER_REFRESH_MAX_INTERVAL_MS);
  const jitter = Math.floor(baseDelay * 0.15 * Math.random());
  return baseDelay + jitter;
}

export function useProfileOrders(token) {
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(Boolean(token));
  const [ordersError, setOrdersError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const timerRef = useRef(null);
  const requestControllerRef = useRef(null);
  const pollFailureCountRef = useRef(0);
  const isFetchingRef = useRef(false);

  const clearScheduledPoll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!token || isFetchingRef.current) return null;

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      isFetchingRef.current = true;

      if (!silent) setIsLoadingOrders(true);
      setOrdersError(null);

      try {
        const data = await fetchMyOrders(token, { signal: controller.signal });
        setOrders(data);
        setLastSyncedAt(new Date());
        pollFailureCountRef.current = 0;
        return true;
      } catch (err) {
        if (controller.signal.aborted) {
          return null;
        }
        pollFailureCountRef.current += 1;
        setOrdersError(err.message || 'Failed to load your orders.');
        return false;
      } finally {
        if (!controller.signal.aborted && !silent) setIsLoadingOrders(false);
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
        isFetchingRef.current = false;
      }
    },
    [token]
  );

  useEffect(() => {
    const canPollNow = () => {
      const pageVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
      const online = typeof navigator === 'undefined' || navigator.onLine;
      return pageVisible && online;
    };

    const scheduleCycle = (delayMs) => {
      clearScheduledPoll();
      timerRef.current = setTimeout(() => {
        runPollingCycle();
      }, delayMs);
    };

    const runPollingCycle = async () => {
      if (!token) return;

      if (!canPollNow()) {
        scheduleCycle(ORDER_REFRESH_INTERVAL_MS);
        return;
      }

      const wasSuccessful = await loadOrders({ silent: true });
      if (wasSuccessful === true) {
        scheduleCycle(ORDER_REFRESH_INTERVAL_MS);
      } else if (wasSuccessful === false) {
        scheduleCycle(getBackoffDelay(pollFailureCountRef.current));
      }
    };

    if (!token) {
      clearScheduledPoll();
      requestControllerRef.current?.abort();
      setOrders([]);
      setOrdersError(null);
      setIsLoadingOrders(false);
      setLastSyncedAt(null);
      pollFailureCountRef.current = 0;
      return;
    }

    loadOrders({ silent: false });

    const onVisibilityOrOnlineChange = () => {
      if (canPollNow()) {
        scheduleCycle(0);
      }
    };

    scheduleCycle(ORDER_REFRESH_INTERVAL_MS);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityOrOnlineChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onVisibilityOrOnlineChange);
    }

    return () => {
      clearScheduledPoll();
      requestControllerRef.current?.abort();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityOrOnlineChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onVisibilityOrOnlineChange);
      }
    };
  }, [token, loadOrders, clearScheduledPoll]);

  return {
    orders,
    isLoadingOrders,
    ordersError,
    lastSyncedAt,
    refreshOrders: () => loadOrders({ silent: false }),
  };
}
