import { useState } from 'react';
import { CHECKOUT_COPY } from '../../data/checkoutContent';
import { GUEST_CONVERSION } from '../../data/checkoutGateContent';
import { useAuth } from '../../hooks/useAuth';

const { confirmation: C } = CHECKOUT_COPY;

function GuestConversion({ shipping }) {
  const { register, loading, error, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();

    const name = [shipping.firstName, shipping.lastName].filter(Boolean).join(' ').trim();

    try {
      await register({
        name: name || shipping.email,
        email: shipping.email,
        password,
      });
      clearError();
      setCreated(true);
      setPassword('');
    } catch {
      // AuthContext stores the error for display in the panel.
    }
  };

  if (created) {
    return (
      <div className="mt-8 rounded-sm border border-amber-200 bg-amber-50 p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="mb-1 font-serif text-lg text-stone-900">{GUEST_CONVERSION.successHeading}</h4>
        <p className="text-xs text-stone-500">{GUEST_CONVERSION.successMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-sm border border-stone-200 bg-stone-50 p-6 animate-fade-in">
      <h4 className="mb-1 text-center font-serif text-lg text-stone-900">{GUEST_CONVERSION.heading}</h4>
      <p className="mb-5 text-center text-xs text-stone-500">{GUEST_CONVERSION.description}</p>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="relative">
          <input
            type="password"
            id="guest-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer w-full rounded-sm border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-300 transition-colors focus:border-stone-900 focus:outline-none"
            placeholder={GUEST_CONVERSION.passwordPlaceholder}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-stone-900 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-stone-900"
        >
          {loading ? 'Creating Account...' : GUEST_CONVERSION.submitLabel}
        </button>
      </form>
    </div>
  );
}

export default function ConfirmationStep({ order, isGuest, onClose }) {
  const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const shipping = order?.shippingAddress || {};
  const orderNumber = order?._id || 'Pending';
  const total = Number(order?.totalPrice || 0);

  const delivery = new Date();
  delivery.setDate(delivery.getDate() + C.deliveryDaysOffset);
  const deliveryStr = delivery.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50">
        <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h3 className="mb-1 font-serif text-2xl text-stone-900">{C.title}</h3>
      <p className="mb-6 text-sm text-stone-500">
        {C.emailNote} <strong className="text-stone-900">{shipping.email || 'guest@email.com'}</strong>
      </p>

      <div className="mb-6 rounded-sm border border-stone-100 bg-stone-50 px-6 py-4 text-left" aria-label="Order summary">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{C.orderLabel}</span>
          <span className="font-mono text-sm font-bold text-stone-900">{orderNumber}</span>
        </div>
        {orderItems.map((item) => (
          <div key={item._id || item.product || item.name} className="flex justify-between border-t border-stone-100 py-1.5 text-sm text-stone-700 first:border-0">
            <span>
              {item.name} <span className="text-stone-400">x{item.qty}</span>
            </span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-stone-200 pt-3 text-sm font-bold text-stone-900">
          <span>{C.totalLabel}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-stone-600">
        <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
        </svg>
        {C.deliveryLabel}: <strong className="text-stone-900">{deliveryStr}</strong>
      </div>

      {isGuest && <GuestConversion shipping={shipping} />}

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900"
      >
        {C.continueBtn}
      </button>
    </div>
  );
}
