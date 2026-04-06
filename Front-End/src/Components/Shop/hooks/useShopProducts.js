import { useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../../../services/productsApi';
import { buildShopCatalog } from '../utils/buildShopCatalog';

export function useShopProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await fetchProducts();
        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load products:', error.message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const shopCatalog = useMemo(() => buildShopCatalog(products), [products]);

  return {
    products,
    isLoading,
    shopCatalog,
  };
}
