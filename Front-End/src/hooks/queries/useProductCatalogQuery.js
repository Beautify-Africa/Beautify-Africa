// src/hooks/queries/useProductCatalogQuery.js
import { useQuery } from '@tanstack/react-query';
import { fetchProductCatalog } from '../../services/productsApi';

const DEFAULT_SHOP_CATALOG = {
  categories: [{ id: 'all', label: 'All', subcategories: [] }],
  brands: ['All'],
  skinTypes: ['All'],
  priceRange: {
    min: 0,
    max: 200,
  },
};

export function useProductCatalogQuery(options = {}) {
  return useQuery({
    queryKey: ['product-catalog'],
    queryFn: async ({ signal }) => {
      const data = await fetchProductCatalog({ signal });
      return data || DEFAULT_SHOP_CATALOG;
    },
    staleTime: 15 * 60 * 1000, // Catalog filters are stable for 15 minutes
    initialData: DEFAULT_SHOP_CATALOG,
    ...options,
  });
}
