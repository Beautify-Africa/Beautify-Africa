import { useState, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCart } from '../../hooks/useCart';
import { CloseIcon } from '../Shared/Icons';
import { CART_CONTENT } from '../../data/cartContent';
import CheckoutModal from '../Checkout/CheckoutModal';
import CartItem from './CartItem';
import EmptyCart from './EmptyCart';
import CartFooter from './CartFooter';

/**
 * CartDrawer - Slide-out shopping cart
 */
export default function CartDrawer({ isOpen, onClose }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { cartItems, subtotal, updateQuantity, removeItem } = useCart();

  const trapRef = useFocusTrap(isOpen);

  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    onClose();
    setTimeout(() => setIsCheckoutOpen(true), 350);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[150] bg-stone-900/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={trapRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#faf9f6] z-[160] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-6 md:p-8 border-b border-stone-200">
            <h2 className="font-serif text-2xl text-stone-900">
              {CART_CONTENT.heading}
            </h2>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-900 transition-colors"
              aria-label="Close cart"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Cart Items */}
          {cartItems.length > 0 ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              <CartFooter subtotal={subtotal} onCheckout={handleCheckout} />
            </>
          ) : (
            <EmptyCart onClose={onClose} />
          )}
        </div>
      </aside>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
      />
    </>
  );
}

