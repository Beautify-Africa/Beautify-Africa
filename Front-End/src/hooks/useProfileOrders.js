// src/hooks/useProfileOrders.js
import { useUserOrdersQuery } from './queries/useUserOrdersQuery';

export function useProfileOrders(token) {
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: queryError,
    dataUpdatedAt,
    refetch: refreshOrders,
  } = useUserOrdersQuery(token);

  return {
    orders,
    isLoadingOrders,
    ordersError: queryError ? queryError.message || 'Failed to load your orders.' : null,
    lastSyncedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    refreshOrders,
  };
}
