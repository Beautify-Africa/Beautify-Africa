import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPageLayout = lazy(() => import('./pages/ShopPageLayout'));

// Eagerly load modals (small, used frequently)
import AuthModal from './Components/Auth/AuthModal';
import CartDrawer from './Components/Cart/CartDrawer';

/**
 * Loading fallback for lazy-loaded pages
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        {/* Skip-to-content link — visible only on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-6 focus:py-3 focus:bg-stone-900 focus:text-white focus:text-xs focus:font-bold focus:uppercase focus:tracking-widest focus:rounded-sm focus:shadow-xl"
        >
          Skip to main content
        </a>

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage onOpenAuth={openAuth} />} />
            <Route
              path="/shop"
              element={<ShopPageLayout onOpenAuth={openAuth} onOpenCart={openCart} />}
            />
          </Routes>
        </Suspense>

        {/* Global modals */}
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;

