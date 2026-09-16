import { useState, useEffect, useRef, useCallback } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCurrency } from '../../hooks/useCurrency';
import { initializePayment, verifyPayment } from '../../services/paymentApi';

export default function PaymentStep({ order, token, onBack, onSuccess }) {
  const { currency, formatPrice } = useCurrency();

  // Pick intelligent default tab based on active currency
  const [activeTab, setActiveTab] = useState(() => {
    if (currency === 'KES') return 'mpesa';
    if (['NGN', 'GHS', 'ZAR'].includes(currency)) return 'paystack';
    return 'stripe';
  });

  // Stripe Element state
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState(null);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);

  // Paystack state
  const [isPaystackProcessing, setIsPaystackProcessing] = useState(false);
  const [paystackError, setPaystackError] = useState(null);

  // M-Pesa state
  const [phone, setPhone] = useState(order?.shippingAddress?.phone || '');
  const [mpesaStatus, setMpesaStatus] = useState('idle'); // idle | prompt_sent | verifying | success | failed
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [mpesaError, setMpesaError] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const mpesaPollInterval = useRef(null);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (mpesaPollInterval.current) {
        clearInterval(mpesaPollInterval.current);
      }
    };
  }, []);

  // Handle return from Paystack redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (reference && reference.startsWith('pstk_')) {
      setActiveTab('paystack');
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

  // --- Stripe Flow ---
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

  // --- Paystack Flow ---
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

  // --- M-Pesa STK Push Flow ---
  const handleMpesaSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setMpesaError('Please enter a valid phone number (e.g. 0712345678 or +254712345678)');
      return;
    }

    setMpesaError(null);
    setMpesaStatus('prompt_sent');
    setCountdown(60);

    try {
      const initResult = await initializePayment({
        orderId: order?.id || order?._id,
        gateway: 'mpesa',
        phone: phone.trim(),
        currency: 'KES',
        token,
      });

      setMpesaMessage(
        initResult.customerMessage ||
          `PIN prompt sent to ${phone}. Check your phone and enter your M-Pesa PIN.`
      );

      const reference = initResult.reference || initResult.checkoutRequestId;

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll verification endpoint every 3.5 seconds
      mpesaPollInterval.current = setInterval(async () => {
        try {
          const verifyResult = await verifyPayment({
            gateway: 'mpesa',
            reference,
            orderId: order?.id || order?._id,
            token,
          });

          if (verifyResult?.data?.success) {
            clearInterval(mpesaPollInterval.current);
            clearInterval(timer);
            setMpesaStatus('success');
            setTimeout(() => {
              onSuccess();
            }, 1200);
          }
        } catch {
          // Keep polling until countdown expires
        }
      }, 3500);
    } catch (err) {
      setMpesaStatus('failed');
      setMpesaError(err.message || 'Failed to dispatch M-Pesa STK push prompt.');
    }
  };

  const handleCancelMpesa = useCallback(() => {
    if (mpesaPollInterval.current) {
      clearInterval(mpesaPollInterval.current);
    }
    setMpesaStatus('idle');
    setMpesaError(null);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-xl text-stone-900">Payment Method</h3>
        <p className="text-xs text-stone-500 mt-1">
          Select your preferred payment rail. Order total:{' '}
          <strong className="text-stone-900 font-bold">{formatPrice(order?.totalPrice)}</strong>
        </p>
      </div>

      {/* Gateway Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-sm bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('stripe')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
            activeTab === 'stripe'
              ? 'bg-white text-stone-900 shadow-sm font-bold'
              : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <span className="text-xs">💳</span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">Card (Stripe)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paystack')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
            activeTab === 'paystack'
              ? 'bg-white text-stone-900 shadow-sm font-bold'
              : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <span className="text-xs">⚡</span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">Paystack</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mpesa')}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
            activeTab === 'mpesa'
              ? 'bg-white text-stone-900 shadow-sm font-bold'
              : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <span className="text-xs">📱</span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">M-Pesa</span>
        </button>
      </div>

      {/* --- TAB 1: Stripe Elements Form --- */}
      <div className={activeTab === 'stripe' ? 'block' : 'hidden'}>
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
      </div>

      {/* --- TAB 2: Paystack Form --- */}
      {activeTab === 'paystack' && (
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
      )}

      {/* --- TAB 3: M-Pesa STK Push Form --- */}
      {activeTab === 'mpesa' && (
        <div className="space-y-4">
          {mpesaStatus === 'idle' && (
            <form onSubmit={handleMpesaSubmit} className="space-y-4">
              <div className="rounded-sm border border-stone-200 bg-white p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="mpesa-phone"
                      className="text-xs font-bold uppercase tracking-wider text-stone-700"
                    >
                      Safaricom M-Pesa Number
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Instant STK Push
                    </span>
                  </div>
                  <input
                    id="mpesa-phone"
                    type="tel"
                    placeholder="e.g. 0712345678 or +254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-2 w-full rounded-sm border border-stone-300 px-3.5 py-3 text-sm focus:border-stone-900 focus:outline-none"
                  />
                  <p className="mt-1.5 text-[11px] text-stone-500 leading-relaxed">
                    A PIN request will appear automatically on this handset.
                  </p>
                </div>

                <div className="rounded bg-amber-50/50 border border-amber-200/50 p-3 text-center">
                  <span className="text-xs text-stone-500">Total charge in Kenyan Shillings:</span>
                  <div className="font-serif text-2xl font-bold text-amber-900 mt-0.5">
                    {formatPrice(order?.totalPrice)}
                  </div>
                </div>
              </div>

              {mpesaError && (
                <div className="text-xs font-semibold text-red-600 p-2.5 bg-red-50 border border-red-100 rounded-sm">
                  {mpesaError}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-none rounded-sm border border-stone-200 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-sm bg-emerald-800 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-emerald-900 flex items-center justify-center gap-2"
                >
                  Send M-Pesa PIN Prompt
                </button>
              </div>
            </form>
          )}

          {/* M-Pesa STK Push Active Prompt Modal / Card */}
          {mpesaStatus === 'prompt_sent' && (
            <div className="rounded-sm border border-emerald-200 bg-emerald-50/40 p-6 text-center space-y-4 animate-in fade-in">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-2xl animate-bounce">📱</span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">Check Your Phone</h4>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  {mpesaMessage}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-500">
                <svg
                  className="h-4 w-4 animate-spin text-emerald-700"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                <span>Awaiting PIN confirmation... ({countdown}s)</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCancelMpesa}
                  className="text-[11px] uppercase tracking-wider text-stone-500 hover:text-stone-900 underline"
                >
                  Cancel or change number
                </button>
              </div>
            </div>
          )}

          {mpesaStatus === 'success' && (
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900">Payment Confirmed!</h4>
              <p className="text-xs text-stone-600">Completing your order details...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
