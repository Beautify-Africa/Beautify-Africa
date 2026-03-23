import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import StepIndicator from './StepIndicator';
import AuthGateStep from '../Auth/AuthGateStep';
import ShippingStep from './ShippingStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';
import {
  validateShipping,
  validatePayment,
  generateOrderNumber,
  INITIAL_SHIPPING,
  INITIAL_PAYMENT,
} from '../../data/checkoutUtils';

export default function CheckoutModal({ isOpen, onClose, cartItems = [] }) {
  const [step, setStep] = useState(0);
  const [isGuest, setIsGuest] = useState(true);
  const [errors, setErrors] = useState({});
  const [orderNumber, setOrderNumber] = useState('');
  const [shipping, setShipping] = useState(INITIAL_SHIPPING);
  const [payment, setPayment] = useState(INITIAL_PAYMENT);

  const trapRef = useFocusTrap(isOpen);

  const updateShipping = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const updatePayment = (field, value) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const handleAuthContinue = ({ isGuest: guest, user }) => {
    setIsGuest(guest);
    if (user) {
      const nameParts = user.name?.trim().split(/\s+/).filter(Boolean) || [];
      const [firstName = '', ...lastNameParts] = nameParts;

      setShipping((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastNameParts.join(' '),
        email: prev.email || user.email || '',
      }));
    }
    setStep(1);
  };

  const handleShippingNext = () => {
    const validationErrors = validateShipping(shipping);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handlePlaceOrder = () => {
    const validationErrors = validatePayment(payment);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setOrderNumber(generateOrderNumber());
    setStep(3);
  };

  const handleClose = () => {
    onClose();

    window.setTimeout(() => {
      setStep(0);
      setIsGuest(true);
      setErrors({});
      setShipping(INITIAL_SHIPPING);
      setPayment(INITIAL_PAYMENT);
      setOrderNumber('');
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Checkout">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step < 3 ? handleClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={trapRef}
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-stone-100 bg-white px-8 pt-8 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
              {step === 0 ? 'Welcome' : 'Checkout'}
            </span>
            {step < 3 && (
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
                aria-label="Close checkout"
              >
                <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {step >= 1 && <StepIndicator step={step} />}
        </div>

        <div className="px-8 py-6">
          {step === 0 && <AuthGateStep onContinue={handleAuthContinue} />}

          {step === 1 && (
            <>
              <ShippingStep data={shipping} onChange={updateShipping} errors={errors} />
              <button
                onClick={handleShippingNext}
                className="mt-6 w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900"
              >
                Continue to Payment
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <PaymentStep data={payment} onChange={updatePayment} errors={errors} />
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setErrors({});
                  }}
                  className="flex-none rounded-sm border border-stone-200 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900"
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
              isGuest={isGuest}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
