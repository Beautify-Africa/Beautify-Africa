import { z } from 'zod';

/**
 * Zod schema for client-side shipping address validation.
 * Synchronized with backend orderValidation schema.
 */
export const shippingAddressSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name is required'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  address: z
    .string({ required_error: 'Street address is required' })
    .trim()
    .min(1, 'Street address is required'),
  city: z.string({ required_error: 'City is required' }).trim().min(1, 'City is required'),
  zip: z
    .string({ required_error: 'Postal / ZIP code is required' })
    .trim()
    .min(1, 'Postal / ZIP code is required'),
  country: z
    .string({ required_error: 'Please select a country' })
    .trim()
    .min(1, 'Please select a country'),
});

/**
 * Validates shipping address against shippingAddressSchema.
 * Returns an object of { [fieldName]: errorMessage } or empty object {} if valid.
 *
 * @param {Record<string, unknown>} shippingData
 * @returns {Record<string, string>}
 */
export function validateShipping(shippingData) {
  const result = shippingAddressSchema.safeParse(shippingData || {});
  if (result.success) {
    return {};
  }
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
