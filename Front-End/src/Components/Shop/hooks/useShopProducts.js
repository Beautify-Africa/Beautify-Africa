import { useEffect, useState } from 'react';
import { fetchProducts } from '../../../services/productsApi';

export function useShopProducts({ currentPage, requestParams, isSavedCollection, savedProductCount }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadProducts() {
      if (isSavedCollection && savedProductCount === 0) {
        setProducts([]);
        setTotalCount(0);
        setTotalPages(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await fetchProducts({
          ...requestParams,
          page: currentPage,
          limit: 12,
        }, { signal: controller.signal });

        if (!cancelled) {
          setProducts(result.data || []);
          setTotalCount(result.totalCount || 0);
          setTotalPages(result.totalPages || 0);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to load products:', error.message);
        if (!cancelled) {
          setProducts([]);
          setTotalCount(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentPage, requestParams, isSavedCollection, savedProductCount]);

  return {
    products,
    isLoading,
    totalCount,
    totalPages,
  };
}
