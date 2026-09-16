// src/hooks/queries/useUserOrdersQuery.js
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '../../services/ordersApi';

export function useUserOrdersQuery(token, options = {}) {
  return useQuery({
    queryKey: ['orders', 'my-orders', token],
    queryFn: async ({ signal }) => {
      if (!token) return [];
      const orders = await fetchMyOrders(token, { signal });
      return Array.isArray(orders) ? orders : [];
    },
    enabled: Boolean(token),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Poll every 2 minutes for status updates
    ...options,
  });
}
