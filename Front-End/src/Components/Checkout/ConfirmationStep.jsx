import { CHECKOUT_COPY } from '../../data/checkoutContent';

const { confirmation: C } = CHECKOUT_COPY;

/**
 * Step 3 — Order confirmation with animated checkmark, order summary, and delivery estimate
 */
export default function ConfirmationStep({ orderNumber, cartItems, shipping, onClose }) {
    const total = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + C.deliveryDaysOffset);
    const deliveryStr = delivery.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="text-center">
            {/* Animated checkmark */}
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h3 className="font-serif text-2xl text-stone-900 mb-1">{C.title}</h3>
            <p className="text-stone-500 text-sm mb-6">
                {C.emailNote} <strong className="text-stone-900">{shipping.email}</strong>
            </p>

            {/* Order summary */}
            <div className="bg-stone-50 border border-stone-100 rounded-sm px-6 py-4 mb-6 text-left" aria-label="Order summary">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{C.orderLabel}</span>
                    <span className="font-mono text-sm font-bold text-stone-900">{orderNumber}</span>
                </div>
                {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-stone-700 py-1.5 border-t border-stone-100 first:border-0">
                        <span>{item.name} <span className="text-stone-400">×{item.quantity}</span></span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-3 mt-2 border-t border-stone-200">
                    <span>{C.totalLabel}</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Estimated delivery */}
            <div className="flex items-center justify-center gap-2 text-sm text-stone-600 mb-8">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
                {C.deliveryLabel}: <strong className="text-stone-900">{deliveryStr}</strong>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm"
            >
                {C.continueBtn}
            </button>
        </div>
    );
}
