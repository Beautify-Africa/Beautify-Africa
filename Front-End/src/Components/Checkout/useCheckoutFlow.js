import { useCallback, useState } from 'react';
import { validateShipping } from '../../data/checkoutUtils';
import { buildInitialShipping, buildOrderPayload } from './checkoutModalUtils';
import { createPaymentIntent } from '../../services/stripeApi';

export function useCheckoutFlow({ cartItems, isAuthenticated, user, token, clearCart }) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [shipping, setShipping] = useState(() => buildInitialShipping(isAuthenticated, user));
  
  const [clientSecret, setClientSecret] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);

  const updateShipping = useCallback((field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleShippingNext = useCallback(async () => {
    const validationErrors = validateShipping(shipping);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsPlacingOrder(true);

    try {
      const orderPayload = buildOrderPayload(cartItems, shipping);
      
      const { clientSecret: secret, orderId } = await createPaymentIntent(
        orderPayload.orderItems, 
        orderPayload.shippingAddress, 
        token
      );
      
      setClientSecret(secret);
      setCheckoutOrder({
        _id: orderId,
        orderItems: cartItems.map((item) => ({
          product: item.productId || item.product || item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image,
        })),
        shippingAddress: { ...shipping },
        totalPrice: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      });
      setStep(2); 
    } catch (err) {
      setErrors({ form: err.message || 'Failed to initialize payment.' });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [cartItems, shipping, token]);

  const handleBackToShipping = useCallback(() => {
    setStep(1);
    setErrors({});
  }, []);

  // Expose explicit state setter for step 3 once payment succeeds
  const completePaymentFlow = useCallback(() => {
    clearCart();
    setStep(3);
  }, [clearCart]);

  const resetFlow = useCallback(() => {
    setStep(1);
    setErrors({});
    setClientSecret(null);
    setCheckoutOrder(null);
    setShipping(buildInitialShipping(isAuthenticated, user));
  }, [isAuthenticated, user]);

  return {
    step,
    errors,
    order: checkoutOrder,
    shipping,
    clientSecret,
    isPlacingOrder,
    updateShipping,
    handleShippingNext,
    handleBackToShipping,
    completePaymentFlow,
    resetFlow,
  };
}
