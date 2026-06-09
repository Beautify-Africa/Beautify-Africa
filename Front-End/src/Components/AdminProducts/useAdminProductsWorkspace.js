import useAdminProductsCatalog from './useAdminProductsCatalog';
import useAdminProductsEditor from './useAdminProductsEditor';

export default function useAdminProductsWorkspace() {
  const catalog = useAdminProductsCatalog();
  const editor = useAdminProductsEditor({
    selectedProduct: catalog.selectedProduct,
    setSelectedProduct: catalog.setSelectedProduct,
    loadProducts: catalog.loadProducts,
    setSuccessMessage: catalog.setSuccessMessage,
  });

  return {
    ...catalog,
    ...editor,
  };
}
