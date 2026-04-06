import { useCallback, useState } from 'react';
import { createOrder } from '../../services/ordersApi';
import {
  validateShipping,
  validatePayment,
  INITIAL_PAYMENT,
} from '../../data/checkoutUtils';
import { buildInitialShipping, buildOrderPayload } from './checkoutModalUtils';

export function useCheckoutFlow({ cartItems, isAuthenticated, user, token, clearCart }) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);

  const getInitialShipping = useCallback(() => {
    return buildInitialShipping(isAuthenticated, user);
  }, [isAuthenticated, user]);

  const [shipping, setShipping] = useState(() => getInitialShipping());
  const [payment, setPayment] = useState(() => ({ ...INITIAL_PAYMENT }));

  const updateShipping = useCallback((field, value) => {
    setShipping((previousShipping) => ({ ...previousShipping, [field]: value }));

    setErrors((previousErrors) => {
      if (!previousErrors[field]) return previousErrors;
      const nextErrors = { ...previousErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const updatePayment = useCallback((field, value) => {
    setPayment((previousPayment) => ({ ...previousPayment, [field]: value }));

    setErrors((previousErrors) => {
      if (!previousErrors[field]) return previousErrors;
      const nextErrors = { ...previousErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const handleShippingNext = useCallback(() => {
    const validationErrors = validateShipping(shipping);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStep(2);
  }, [shipping]);

  const handleBackToShipping = useCallback(() => {
    setStep(1);
    setErrors({});
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    const validationErrors = validatePayment(payment);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsPlacingOrder(true);

    try {
      const orderData = buildOrderPayload(cartItems, shipping);
      const createdOrder = await createOrder(orderData, token);

      clearCart();
      setOrder(createdOrder);
      setStep(3);
    } catch (submitError) {
      setErrors({ form: submitError.message || 'Failed to place order.' });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [cartItems, shipping, payment, token, clearCart]);

  const resetFlow = useCallback(() => {
    setStep(1);
    setErrors({});
    setShipping(getInitialShipping());
    setPayment({ ...INITIAL_PAYMENT });
    setOrder(null);
  }, [getInitialShipping]);

  return {
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
  };
}
