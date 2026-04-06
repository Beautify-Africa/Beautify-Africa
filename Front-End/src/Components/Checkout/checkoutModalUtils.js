import { INITIAL_SHIPPING } from '../../data/checkoutUtils';

export function buildInitialShipping(isAuthenticated, user) {
  if (!isAuthenticated || !user) return INITIAL_SHIPPING;

  const nameParts = user.name?.trim().split(/\s+/).filter(Boolean) || [];
  const [firstName = '', ...lastNameParts] = nameParts;

  return {
    ...INITIAL_SHIPPING,
    firstName,
    lastName: lastNameParts.join(' '),
    email: user.email || '',
  };
}

export function buildOrderPayload(cartItems, shippingAddress) {
  return {
    orderItems: cartItems.map((item) => ({
      product: item.id,
      qty: item.quantity,
    })),
    shippingAddress,
    paymentMethod: 'Credit Card',
  };
}
