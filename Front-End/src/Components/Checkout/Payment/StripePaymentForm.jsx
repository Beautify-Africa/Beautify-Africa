import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ order, formatPrice, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState(null);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);

  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsStripeProcessing(true);
    setStripeError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setStripeError(submitError.message);
        setIsStripeProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      });

      if (confirmError) {
        setStripeError(confirmError.message);
      } else if (
        paymentIntent &&
        (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')
      ) {
        onSuccess();
      } else {
        setStripeError('Unexpected payment status. Please try again.');
      }
    } catch {
      setStripeError('An unexpected error occurred. Please try again.');
    } finally {
      setIsStripeProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripeSubmit} className="space-y-4">
      <div className="flex gap-2 mb-2">
        <span className="px-2 py-0.5 text-[9px] font-bold border border-stone-200 rounded text-stone-500">
          Visa
        </span>
        <span className="px-2 py-0.5 text-[9px] font-bold border border-stone-200 rounded text-stone-500">
          Mastercard
        </span>
        <span className="px-2 py-0.5 text-[9px] font-bold border border-stone-200 rounded text-stone-500">
          Amex
        </span>
        <span className="px-2 py-0.5 text-[9px] font-bold border border-stone-200 rounded text-stone-500">
          Apple Pay
        </span>
        <span className="text-[9px] text-stone-400 self-center ml-1 font-mono">
          Test Mode Active
        </span>
      </div>

      <div className="rounded-sm border border-stone-200 bg-white p-4">
        <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      </div>

      {stripeError && (
        <div className="text-xs font-semibold text-red-600 p-2.5 bg-red-50 border border-red-100 rounded-sm">
          {stripeError}
        </div>
      )}

      <div className="bg-stone-50 border border-stone-200 p-3 rounded-sm text-[10px] text-stone-500 leading-relaxed font-mono">
        <p className="font-bold text-stone-700">Developer Test Card:</p>
        <p>4242 4242 4242 4242 &bull; Any future MM/YY &bull; CVC: Any 3 digits</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isStripeProcessing}
          className="flex-none rounded-sm border border-stone-200 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isStripeProcessing || !stripe || !elements}
          className="flex-1 rounded-sm bg-stone-900 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isStripeProcessing ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(order?.totalPrice)}`
          )}
        </button>
      </div>
    </form>
  );
}
