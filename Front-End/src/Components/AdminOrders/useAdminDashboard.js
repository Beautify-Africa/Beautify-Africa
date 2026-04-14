import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminDashboard, updateAdminOrderAction } from '../../services/adminApi';
import { DEFAULT_ADMIN_DASHBOARD, normalizeAdminDashboard } from './adminDashboardDefaults';

export function useAdminDashboard(token, enabled) {
  const [dashboard, setDashboard] = useState(DEFAULT_ADMIN_DASHBOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyActionKey, setBusyActionKey] = useState('');
  const requestControllerRef = useRef(null);

  const loadDashboard = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!enabled || !token) return;

      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }

      const controller = new AbortController();
      requestControllerRef.current = controller;
      if (showLoader) setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminDashboard(token, { signal: controller.signal });
        startTransition(() => {
          setDashboard(normalizeAdminDashboard(data));
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Failed to load admin dashboard.');
        }
      } finally {
        if (!controller.signal.aborted && showLoader) {
          setIsLoading(false);
        }
      }
    },
    [enabled, token]
  );

  useEffect(() => () => {
    requestControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    loadDashboard({ showLoader: true });
  }, [loadDashboard]);

  const runOrderAction = useCallback(
    async (orderId, action) => {
      if (!token) return;

      const key = `${orderId}:${action}`;
      setBusyActionKey(key);
      setError(null);

      try {
        await updateAdminOrderAction(orderId, action, token);
        await loadDashboard({ showLoader: false });
      } catch (err) {
        setError(err.message || 'Failed to update order.');
      } finally {
        setBusyActionKey('');
      }
    },
    [loadDashboard, token]
  );

  return {
    dashboard,
    isLoading,
    error,
    busyActionKey,
    reloadDashboard: loadDashboard,
    runOrderAction,
  };
}
