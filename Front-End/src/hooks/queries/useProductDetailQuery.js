// src/hooks/queries/useProductDetailQuery.js
import { useQuery } from '@tanstack/react-query';
import { fetchProductByIdOrSlug } from '../../services/productsApi';

export function useProductDetailQuery(idOrSlug, options = {}) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: async ({ signal }) => {
      if (!idOrSlug) return null;
      return fetchProductByIdOrSlug(idOrSlug, { signal });
    },
    enabled: Boolean(idOrSlug),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
