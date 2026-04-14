import { useEffect, useState } from 'react';
import { fetchProductCatalog } from '../../../services/productsApi';

const DEFAULT_SHOP_CATALOG = {
  categories: [{ id: 'all', label: 'All', subcategories: [] }],
  brands: ['All'],
  skinTypes: ['All'],
  priceRange: {
    min: 0,
    max: 200,
  },
};

export function useShopCatalog() {
  const [shopCatalog, setShopCatalog] = useState(DEFAULT_SHOP_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadCatalog() {
      try {
        const data = await fetchProductCatalog({ signal: controller.signal });
        if (!cancelled) {
          setShopCatalog(data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to load product catalog:', error.message);
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return {
    shopCatalog,
    isCatalogLoading,
  };
}
