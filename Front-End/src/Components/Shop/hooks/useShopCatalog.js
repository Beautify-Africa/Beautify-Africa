import { useProductCatalogQuery } from '../../../hooks/queries/useProductCatalogQuery';

export function useShopCatalog() {
  const { data: shopCatalog, isLoading: isCatalogLoading } = useProductCatalogQuery();

  return {
    shopCatalog,
    isCatalogLoading,
  };
}
