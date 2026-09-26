import { useState, useEffect, useRef, useCallback } from 'react';
import { initializePayment, verifyPayment } from '../../../services/paymentApi';

export default function MpesaPaymentForm({ order, token, formatPrice, onBack, onSuccess }) {
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

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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
  );
}
