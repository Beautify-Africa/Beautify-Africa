import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import {
  addAdminOrderNote,
  fetchAdminDashboard,
  fetchAdminOrderTimeline,
  updateAdminOrderAction,
} from '../../services/adminApi';
import { DEFAULT_ADMIN_DASHBOARD, normalizeAdminDashboard } from './adminDashboardDefaults';

export function useAdminDashboard(token, enabled) {
  const [dashboard, setDashboard] = useState(DEFAULT_ADMIN_DASHBOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyActionKey, setBusyActionKey] = useState('');
  const [timelineByOrderId, setTimelineByOrderId] = useState({});
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
        const updatedOrder = await updateAdminOrderAction(orderId, action, token);
        await loadDashboard({ showLoader: false });
        return updatedOrder;
      } catch (err) {
        setError(err.message || 'Failed to update order.');
        throw err;
      } finally {
        setBusyActionKey('');
      }
    },
    [loadDashboard, token]
  );

  const runAddOrderNote = useCallback(
    async (orderId, note) => {
      if (!token) return;

      const key = `${orderId}:note`;
      setBusyActionKey(key);
      setError(null);

      try {
        const savedNote = await addAdminOrderNote(orderId, note, token);
        await loadDashboard({ showLoader: false });
        return savedNote;
      } catch (err) {
        setError(err.message || 'Failed to add note.');
        throw err;
      } finally {
        setBusyActionKey('');
      }
    },
    [loadDashboard, token]
  );

  const loadOrderTimeline = useCallback(
    async (orderId) => {
      if (!token || !orderId) return;

      try {
        const timeline = await fetchAdminOrderTimeline(orderId, token);
        setTimelineByOrderId((previous) => ({
          ...previous,
          [orderId]: timeline,
        }));
      } catch (err) {
        setError(err.message || 'Failed to load order timeline.');
      }
    },
    [token]
  );

  return {
    dashboard,
    isLoading,
    error,
    busyActionKey,
    timelineByOrderId,
    reloadDashboard: loadDashboard,
    runOrderAction,
    runAddOrderNote,
    loadOrderTimeline,
  };
}
