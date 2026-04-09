import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

// The inner form handles the actual submission hooks
function PaymentFormInner({ onBack, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentError, setPaymentError] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsPlacingOrder(true);
        setPaymentError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setPaymentError(submitError.message);
                setIsPlacingOrder(false);
                return;
            }

            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {},
                redirect: 'if_required',
            });

            if (confirmError) {
                setPaymentError(confirmError.message);
            } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
                onSuccess();
            } else {
                setPaymentError('Unexpected payment status. Please try again.');
            }
        } catch {
            setPaymentError('An unexpected error occurred. Please try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-serif text-xl text-stone-900 mb-5">Secure Payment</h3>

            <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 text-[9px] font-bold border border-stone-200 rounded text-stone-400">Visa</span>
                <span className="px-2 py-1 text-[9px] font-bold border border-stone-200 rounded text-stone-400">Mastercard</span>
                <span className="px-2 py-1 text-[9px] font-bold border border-stone-200 rounded text-stone-400">Amex</span>
                <span className="text-[9px] text-stone-400 self-center ml-1">Test Mode Active</span>
            </div>

            <div className="rounded-sm border border-stone-200 bg-white p-4">
               <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
            </div>
            
            {paymentError && (
                <div className="text-sm font-semibold text-red-600 mt-2 p-2 bg-red-50 border border-red-100 rounded-sm">
                    {paymentError}
                </div>
            )}

            <div className="bg-stone-50 border border-stone-200 p-4 mt-4 rounded-sm text-[10px] text-stone-500 leading-relaxed font-mono">
                <p className="font-bold mb-1">Developer Test Card:</p>
                <p>Card Number: <span className="font-bold text-stone-800">4242 4242 4242 4242</span></p>
                <p>Expiry: <span className="font-bold text-stone-800">Any future date</span></p>
                <p>CVC: <span className="font-bold text-stone-800">Any 3 digit</span></p>
            </div>

            <div className="mt-6 flex gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isPlacingOrder}
                    className="flex-none rounded-sm border border-stone-200 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isPlacingOrder || !stripe || !elements}
                    className="flex-1 rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:opacity-50"
                >
                    {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </button>
            </div>
        </form>
    );
}

export default function PaymentStep({ clientSecret, onBack, onSuccess }) {
    if (!clientSecret) return null;
    return <PaymentFormInner onBack={onBack} onSuccess={onSuccess} />;
}
