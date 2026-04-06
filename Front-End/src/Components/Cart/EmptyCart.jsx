import { CART_CONTENT } from '../../data/cartContent';

export default function EmptyCart({ onClose }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-xl text-stone-500 mb-6">{CART_CONTENT.emptyMessage}</p>
      <button
        onClick={onClose}
        className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-900"
      >
        {CART_CONTENT.continueShopping}
      </button>
    </div>
  );
}
