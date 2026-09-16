// src/hooks/queries/useProductsQuery.js
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../services/productsApi';

export function useProductsQuery(queryParams = {}, options = {}) {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ['products', queryParams],
    queryFn: async ({ signal }) => {
      const result = await fetchProducts(queryParams, { signal });
      return {
        products: result.data || [],
        totalCount: result.totalCount || 0,
        totalPages: result.totalPages || 0,
        page: result.page || 1,
      };
    },
    enabled,
    placeholderData: (previousData) => previousData, // smooth pagination transitions
    ...queryOptions,
  });
}
