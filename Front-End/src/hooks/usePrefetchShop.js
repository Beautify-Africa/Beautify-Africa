import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchProductCatalog, fetchProducts } from '../services/productsApi';

/**
 * Hook providing prefetch triggers on mouse enter / keyboard focus for shop data.
 * Pre-warms both the product catalog taxonomy and the initial page-1 products into React Query cache.
 */
export function usePrefetchShop() {
  const queryClient = useQueryClient();

  const prefetchShopData = useCallback(() => {
    // 1. Prefetch product catalog taxonomy (categories, brands, price ranges)
    queryClient.prefetchQuery({
      queryKey: ['product-catalog'],
      queryFn: async ({ signal }) => {
        const data = await fetchProductCatalog({ signal });
        return data;
      },
      staleTime: 15 * 60 * 1000,
    });

    // 2. Prefetch first page of products (default sort: 'newest')
    const defaultParams = { sort: 'newest', page: 1, limit: 12 };
    queryClient.prefetchQuery({
      queryKey: ['products', defaultParams],
      queryFn: async ({ signal }) => {
        const result = await fetchProducts(defaultParams, { signal });
        return {
          products: result.data || [],
          totalCount: result.totalCount || 0,
          totalPages: result.totalPages || 0,
        };
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    onMouseEnter: prefetchShopData,
    onFocus: prefetchShopData,
  };
}
