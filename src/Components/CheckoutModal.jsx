import { useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import StepIndicator from './checkout/StepIndicator';
import ShippingStep from './checkout/ShippingStep';
import PaymentStep from './checkout/PaymentStep';
import ConfirmationStep from './checkout/ConfirmationStep';
import { validateShipping, validatePayment, generateOrderNumber } from './checkout/checkoutUtils';

const INITIAL_SHIPPING = { firstName: '', lastName: '', email: '', address: '', city: '', zip: '', country: '' };
const INITIAL_PAYMENT = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

/**
 * CheckoutModal — orchestrates the 3-step checkout flow
 */
export default function CheckoutModal({ isOpen, onClose, cartItems = [] }) {
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [orderNumber, setOrderNumber] = useState('');
    const [shipping, setShipping] = useState(INITIAL_SHIPPING);
    const [payment, setPayment] = useState(INITIAL_PAYMENT);

    const trapRef = useFocusTrap(isOpen);

    const updateShipping = (field, value) => {
        setShipping((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    };

    const updatePayment = (field, value) => {
        setPayment((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    };

    const handleShippingNext = () => {
        const e = validateShipping(shipping);
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setStep(2);
    };

    const handlePlaceOrder = () => {
        const e = validatePayment(payment);
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setOrderNumber(generateOrderNumber());
        setStep(3);
    };

    const handleClose = () => {
        onClose();
        // Reset for next open
        setTimeout(() => {
            setStep(1);
            setErrors({});
            setShipping(INITIAL_SHIPPING);
            setPayment(INITIAL_PAYMENT);
            setOrderNumber('');
        }, 400);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={step < 3 ? handleClose : undefined}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={trapRef}
                className="relative w-full max-w-lg mx-4 bg-white rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-stone-100">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Checkout</span>
                        {step < 3 && (
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                                aria-label="Close checkout"
                            >
                                <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <StepIndicator step={step} />
                </div>

                {/* Body */}
                <div className="px-8 py-6">
                    {step === 1 && (
                        <>
                            <ShippingStep data={shipping} onChange={updateShipping} errors={errors} />
                            <button
                                onClick={handleShippingNext}
                                className="mt-6 w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm"
                            >
                                Continue to Payment →
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <PaymentStep data={payment} onChange={updatePayment} errors={errors} />
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => { setStep(1); setErrors({}); }}
                                    className="flex-none px-6 py-4 border border-stone-200 text-stone-700 text-[11px] font-bold uppercase tracking-[0.15em] hover:border-stone-900 transition-colors rounded-sm"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    className="flex-1 bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm"
                                >
                                    Place Order
                                </button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <ConfirmationStep
                            orderNumber={orderNumber}
                            cartItems={cartItems}
                            shipping={shipping}
                            onClose={handleClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
