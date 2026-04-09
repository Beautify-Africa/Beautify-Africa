import { startTransition, useCallback, useEffect, useState } from 'react';
import { fetchAdminDashboard, updateAdminOrderAction } from '../../services/adminApi';
import { DEFAULT_ADMIN_DASHBOARD, normalizeAdminDashboard } from './adminDashboardDefaults';

export function useAdminDashboard(token, enabled) {
  const [dashboard, setDashboard] = useState(DEFAULT_ADMIN_DASHBOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyActionKey, setBusyActionKey] = useState('');

  const loadDashboard = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!enabled || !token) return;

      if (showLoader) setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminDashboard(token);
        startTransition(() => {
          setDashboard(normalizeAdminDashboard(data));
        });
      } catch (err) {
        setError(err.message || 'Failed to load admin dashboard.');
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [enabled, token]
  );

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
