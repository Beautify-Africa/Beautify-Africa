import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPageLayout from './pages/ShopPageLayout';
import AuthModal from './Components/AuthModal';
import CartDrawer from './Components/CartDrawer';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onOpenAuth={openAuth} />} />
        <Route
          path="/shop"
          element={<ShopPageLayout onOpenAuth={openAuth} onOpenCart={openCart} />}
        />
      </Routes>

      {/* Global modals */}
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </BrowserRouter>
  );
}

export default App;

