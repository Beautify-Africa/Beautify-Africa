import { useAuth } from '../../hooks/useAuth';
import useAdminProductsCatalog from './useAdminProductsCatalog';
import useAdminProductsEditor from './useAdminProductsEditor';

export default function useAdminProductsWorkspace() {
  const { user, token, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);

  const catalog = useAdminProductsCatalog();
  const editor = useAdminProductsEditor({
    selectedProduct: catalog.selectedProduct,
    setSelectedProduct: catalog.setSelectedProduct,
    loadProducts: catalog.loadProducts,
    setSuccessMessage: catalog.setSuccessMessage,
  });

  return {
    user,
    token,
    isAuthenticated,
    isRestoringSession,
    isAdmin,
    ...catalog,
    ...editor,
  };
}

