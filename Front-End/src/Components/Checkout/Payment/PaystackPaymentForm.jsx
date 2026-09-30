import { useState, useEffect } from 'react';
import { initializePayment, verifyPayment } from '../../../services/paymentApi';

export default function PaystackPaymentForm({ order, currency, token, formatPrice, onBack, onSuccess }) {
  const [isPaystackProcessing, setIsPaystackProcessing] = useState(false);
  const [paystackError, setPaystackError] = useState(null);

  // Handle return from Paystack redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (reference && reference.startsWith('pstk_')) {
      setIsPaystackProcessing(true);
      verifyPayment({
        gateway: 'paystack',
        reference,
        orderId: order?.id || order?._id,
        token,
      })
        .then((res) => {
          if (res?.data?.success || res?.status === 'success') {
            onSuccess();
          } else {
            setPaystackError('Paystack payment was not completed.');
          }
        })
        .catch((err) => {
          setPaystackError(err.message || 'Payment verification failed.');
        })
        .finally(() => {
          setIsPaystackProcessing(false);
        });
    }
  }, [order?.id, order?._id, token, onSuccess]);

  const handlePaystackSubmit = async () => {
    setIsPaystackProcessing(true);
    setPaystackError(null);

    try {
      const result = await initializePayment({
        orderId: order?.id || order?._id,
        gateway: 'paystack',
        currency: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'].includes(currency) ? currency : 'KES',
        token,
        returnUrl: window.location.href,
      });

      if (result.authorizationUrl && result.authorizationUrl.startsWith('http')) {
        window.location.href = result.authorizationUrl;
        return;
      }

      onSuccess();
    } catch (err) {
      setPaystackError(err.message || 'Paystack payment initialization failed.');
    } finally {
      setIsPaystackProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-stone-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <p className="font-serif text-base text-stone-900">Paystack Checkout</p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              African debit cards, instant bank transfers, and USSD.
            </p>
          </div>
          <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
            Verified Gateway
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2 py-0.5 text-[9px] font-semibold bg-stone-100 rounded text-stone-600">
            Debit Card (Verve, Visa, MC)
          </span>
          <span className="px-2 py-0.5 text-[9px] font-semibold bg-stone-100 rounded text-stone-600">
            Bank Transfer
          </span>
          <span className="px-2 py-0.5 text-[9px] font-semibold bg-stone-100 rounded text-stone-600">
            USSD (*737#, *919#)
          </span>
          <span className="px-2 py-0.5 text-[9px] font-semibold bg-stone-100 rounded text-stone-600">
            Apple Pay
          </span>
        </div>

        <div className="rounded bg-stone-50 p-3 text-center">
          <span className="text-xs text-stone-500">Total charge:</span>
          <div className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
            {formatPrice(order?.totalPrice)}
          </div>
        </div>
      </div>

      {paystackError && (
        <div className="text-xs font-semibold text-red-600 p-2.5 bg-red-50 border border-red-100 rounded-sm">
          {paystackError}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPaystackProcessing}
          className="flex-none rounded-sm border border-stone-200 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePaystackSubmit}
          disabled={isPaystackProcessing}
          className="flex-1 rounded-sm bg-stone-900 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPaystackProcessing ? (
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
              Connecting to Paystack...
            </>
          ) : (
            `Pay with Paystack`
          )}
        </button>
      </div>
    </div>
  );
}
