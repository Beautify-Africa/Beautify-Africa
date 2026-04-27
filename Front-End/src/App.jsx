import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppLink from './Components/Shared/AppLink';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPageLayout = lazy(() => import('./pages/ShopPageLayout'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TrackOrdersPage = lazy(() => import('./pages/TrackOrdersPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NewsletterUnsubscribeRequestPage = lazy(() => import('./pages/NewsletterUnsubscribeRequestPage'));
const NewsletterUnsubscribePage = lazy(() => import('./pages/NewsletterUnsubscribePage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminInventoryPage = lazy(() => import('./pages/AdminInventoryPage'));
const AdminCustomersPage = lazy(() => import('./pages/AdminCustomersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));

import CartDrawer from './Components/Cart/CartDrawer';
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
  const [isCartOpen, setIsCartOpen] = useState(false);

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
            <Route path="/" element={<HomePage onOpenCart={openCart} />} />
            <Route path="/shop" element={<ShopPageLayout onOpenCart={openCart} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/track-orders" element={<TrackOrdersPage onOpenCart={openCart} />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/newsletter/unsubscribe-request" element={<NewsletterUnsubscribeRequestPage />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
            <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/inventory" element={<AdminInventoryPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            {/* 404 catch-all */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] px-6 text-center">
                  <h1 className="font-serif text-6xl text-stone-900 mb-4">404</h1>
                  <p className="text-stone-600 mb-8">The page you're looking for doesn't exist.</p>
                  <AppLink
                    href="/"
                    className="px-8 py-3 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-amber-900 transition-colors rounded-sm"
                  >
                    Back to Home
                  </AppLink>
                </div>
              }
            />
          </Routes>
        </Suspense>

        {/* Global modals */}
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;

