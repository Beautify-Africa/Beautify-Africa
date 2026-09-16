import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../../services/productsApi';

export function useShopProducts({
  currentPage,
  requestParams,
  isSavedCollection,
  savedProductCount,
}) {
  const isSavedEmpty = isSavedCollection && savedProductCount === 0;

  const queryParams = {
    ...requestParams,
    page: currentPage,
    limit: 12,
  };

  const {
    data,
    isLoading,
    error: queryError,
    refetch: retryProducts,
  } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: async ({ signal }) => {
      const result = await fetchProducts(queryParams, { signal });
      return {
        products: result.data || [],
        totalCount: result.totalCount || 0,
        totalPages: result.totalPages || 0,
      };
    },
    enabled: !isSavedEmpty,
    placeholderData: (previousData) => previousData,
  });

  if (isSavedEmpty) {
    return {
      products: [],
      isLoading: false,
      error: '',
      totalCount: 0,
      totalPages: 0,
      retryProducts: () => {},
    };
  }

  return {
    products: data?.products || [],
    isLoading: isLoading && !data,
    error: queryError ? queryError.message || 'Unable to load products right now.' : '',
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    retryProducts,
  };
}
