import { validateShipping as zodValidateShipping } from '../validations/checkoutValidation';

/**
 * Shared utility functions for the checkout forms
 */

/** Mask card number with spaces every 4 digits */
export const maskCard = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

/** Format MM/YY expiry */
export const maskExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/** Generate a random order number */
export const generateOrderNumber = () =>
  `#BA-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;

/** Validate shipping step fields using Zod */
export const validateShipping = (d) => zodValidateShipping(d);

/** Validate payment step fields */
export const validatePayment = (d) => {
  const e = {};
  if (d.cardNumber.replace(/\s/g, '').length < 13) e.cardNumber = 'Enter a valid card number';
  if (!d.cardName.trim()) e.cardName = 'Required';
  if (!/^\d{2}\/\d{2}$/.test(d.expiry)) e.expiry = 'Format: MM/YY';
  if (d.cvv.length < 3) e.cvv = '3-4 digits required';
  return e;
};

export const INITIAL_SHIPPING = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  country: '',
};
export const INITIAL_PAYMENT = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
