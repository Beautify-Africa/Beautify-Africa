import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../../../services/productsApi';

export function useShopProducts({ currentPage, requestParams, isSavedCollection, savedProductCount }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const retryProducts = useCallback(() => {
    setReloadNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadProducts() {
      if (isSavedCollection && savedProductCount === 0) {
        setProducts([]);
        setError('');
        setTotalCount(0);
        setTotalPages(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await fetchProducts({
          ...requestParams,
          page: currentPage,
          limit: 12,
        }, { signal: controller.signal });

        if (!cancelled) {
          setProducts(result.data || []);
          setError('');
          setTotalCount(result.totalCount || 0);
          setTotalPages(result.totalPages || 0);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to load products:', error.message);
        if (!cancelled) {
          setError(error.message || 'Unable to load products right now.');
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
  }, [currentPage, requestParams, isSavedCollection, savedProductCount, reloadNonce]);

  return {
    products,
    isLoading,
    error,
    totalCount,
    totalPages,
    retryProducts,
  };
}
