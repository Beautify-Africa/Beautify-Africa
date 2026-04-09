import { useCallback, useEffect, useState } from 'react';
import { fetchMyOrders } from '../services/ordersApi';

export function useProfileOrders(token) {
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(Boolean(token));
  const [ordersError, setOrdersError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return;

      if (!silent) setIsLoadingOrders(true);
      setOrdersError(null);

      try {
        const data = await fetchMyOrders(token);
        setOrders(data);
        setLastSyncedAt(new Date());
      } catch (err) {
        setOrdersError(err.message || 'Failed to load your orders.');
      } finally {
        if (!silent) setIsLoadingOrders(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setOrdersError(null);
      setIsLoadingOrders(false);
      setLastSyncedAt(null);
      return;
    }

    loadOrders({ silent: false });
    const timer = setInterval(() => loadOrders({ silent: true }), 30000);

    return () => clearInterval(timer);
  }, [token, loadOrders]);

  return {
    orders,
    isLoadingOrders,
    ordersError,
    lastSyncedAt,
    refreshOrders: () => loadOrders({ silent: false }),
  };
}
