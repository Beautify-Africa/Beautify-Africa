import { useState, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { CloseIcon, PlusIcon, MinusIcon } from '../Shared/Icons';
import { CART_CONTENT, MOCK_CART_ITEMS } from '../../data/cartContent';
import CheckoutModal from '../Checkout/CheckoutModal';

/**
 * Individual cart item
 */
function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <article className="flex gap-4">
      <div className="w-20 h-24 bg-stone-200 flex-shrink-0 overflow-hidden rounded-sm">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-serif text-lg text-stone-900 leading-none">
              {item.name}
            </h3>
            <span className="text-sm text-stone-900 font-medium">
              ${item.price.toFixed(2)}
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-1">{item.variant}</p>
        </div>
        <div className="flex justify-between items-end">
          {/* Quantity controls */}
          <div className="flex items-center border border-stone-200">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors"
              aria-label={`Decrease quantity of ${item.name}`}
              disabled={item.quantity <= 1}
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="px-2 text-xs text-stone-900 font-medium min-w-[24px] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-900 underline transition-colors"
            aria-label={`Remove ${item.name} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Empty cart state
 */
function EmptyCart({ onClose }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-xl text-stone-500 mb-6">
        {CART_CONTENT.emptyMessage}
      </p>
      <button
        onClick={onClose}
        className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-900"
      >
        {CART_CONTENT.continueShopping}
      </button>
    </div>
  );
}

/**
 * Cart footer with subtotal and checkout
 */
function CartFooter({ subtotal, onCheckout }) {
  return (
    <div className="p-6 md:p-8 bg-white border-t border-stone-100">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs uppercase tracking-widest text-stone-500">
          {CART_CONTENT.subtotalLabel}
        </span>
        <span className="font-serif text-xl text-stone-900">
          ${subtotal.toFixed(2)}
        </span>
      </div>
      <p className="text-[10px] text-stone-400 mb-6 text-center">
        {CART_CONTENT.shippingNote}
      </p>
      <button
        onClick={onCheckout}
        className="w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500"
        aria-label="Proceed to checkout"
      >
        {CART_CONTENT.checkoutLabel}
      </button>
    </div>
  );
}

/**
 * CartDrawer - Slide-out shopping cart
 */
export default function CartDrawer({ isOpen, onClose }) {
  const [cartItems, setCartItems] = useState(MOCK_CART_ITEMS);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const trapRef = useFocusTrap(isOpen);

  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

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

