import { useFocusTrap } from '../../hooks/useFocusTrap';
import StepIndicator from './StepIndicator';
import ShippingStep from './ShippingStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useCheckoutFlow } from './useCheckoutFlow';

export default function CheckoutModal({ isOpen, onClose, cartItems = [] }) {
  const { user, isAuthenticated, token } = useAuth();
  const { clearCart } = useCart();
  const isGuest = !isAuthenticated;

  const {
    step,
    errors,
    order,
    shipping,
    payment,
    isPlacingOrder,
    updateShipping,
    updatePayment,
    handleShippingNext,
    handleBackToShipping,
    handlePlaceOrder,
    resetFlow,
  } = useCheckoutFlow({
    cartItems,
    isAuthenticated,
    user,
    token,
    clearCart,
  });

  const trapRef = useFocusTrap(isOpen);

  const handleClose = () => {
    onClose();

    window.setTimeout(() => {
      resetFlow();
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
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Checkout</span>
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
              {errors.form && <div className="mt-4 text-center text-sm font-semibold text-red-600">{errors.form}</div>}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleBackToShipping}
                  disabled={isPlacingOrder}
                  className="flex-none rounded-sm border border-stone-200 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="flex-1 rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:opacity-50"
                >
                  {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <ConfirmationStep
              order={order}
              isGuest={isGuest}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
