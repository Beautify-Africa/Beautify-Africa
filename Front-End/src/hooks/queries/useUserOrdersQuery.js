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
    staleTime: 5 * 1000, // 5 seconds freshness
    refetchInterval: 10 * 1000, // Responsive 10-second polling for live status tracking
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  });
}
