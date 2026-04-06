import { CART_CONTENT } from '../../data/cartContent';

export default function CartFooter({ subtotal, onCheckout }) {
  return (
    <div className="p-6 md:p-8 bg-white border-t border-stone-100">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs uppercase tracking-widest text-stone-500">
          {CART_CONTENT.subtotalLabel}
        </span>
        <span className="font-serif text-xl text-stone-900">${subtotal.toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-stone-400 mb-6 text-center">{CART_CONTENT.shippingNote}</p>
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
