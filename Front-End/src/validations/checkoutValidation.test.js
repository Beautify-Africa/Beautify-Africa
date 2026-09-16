import { describe, it, expect } from 'vitest';
import { shippingAddressSchema, validateShipping } from './checkoutValidation';

describe('checkoutValidation', () => {
  const validAddress = {
    firstName: 'Amina',
    lastName: 'Diallo',
    email: 'amina.diallo@example.com',
    address: '124 Savannah Blvd, Suite 4',
    city: 'Nairobi',
    zip: '00100',
    country: 'Kenya',
  };

  describe('shippingAddressSchema', () => {
    it('validates a complete and correct shipping address', () => {
      const result = shippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Amina');
        expect(result.data.city).toBe('Nairobi');
      }
    });

    it('trims leading and trailing whitespace from string fields', () => {
      const untrimmed = {
        ...validAddress,
        firstName: '  Amina  ',
        city: '  Nairobi  ',
      };
      const result = shippingAddressSchema.safeParse(untrimmed);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Amina');
        expect(result.data.city).toBe('Nairobi');
      }
    });

    it('rejects missing or empty required fields', () => {
      const invalid = {
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        zip: '',
        country: '',
      };
      const result = shippingAddressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorFields = result.error.issues.map((issue) => issue.path[0]);
        expect(errorFields).toContain('firstName');
        expect(errorFields).toContain('lastName');
        expect(errorFields).toContain('email');
        expect(errorFields).toContain('address');
        expect(errorFields).toContain('city');
        expect(errorFields).toContain('zip');
        expect(errorFields).toContain('country');
      }
    });

    it('rejects invalid email formats', () => {
      const invalidEmail = { ...validAddress, email: 'not-an-email' };
      const result = shippingAddressSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find((i) => i.path[0] === 'email');
        expect(emailIssue).toBeDefined();
        expect(emailIssue.message).toBe('Please enter a valid email address');
      }
    });
  });

  describe('validateShipping helper', () => {
    it('returns an empty error object when shipping address is valid', () => {
      const errors = validateShipping(validAddress);
      expect(errors).toEqual({});
      expect(Object.keys(errors).length).toBe(0);
    });

    it('returns a keyed dictionary of errors for invalid fields', () => {
      const errors = validateShipping({
        firstName: '',
        lastName: 'Diallo',
        email: 'invalid-email',
        address: '',
        city: 'Nairobi',
        zip: '',
        country: 'Kenya',
      });

      expect(errors.firstName).toBe('First name is required');
      expect(errors.email).toBe('Please enter a valid email address');
      expect(errors.address).toBe('Street address is required');
      expect(errors.zip).toBe('Postal / ZIP code is required');
      expect(errors.lastName).toBeUndefined();
      expect(errors.city).toBeUndefined();
    });

    it('handles null or undefined input gracefully without throwing', () => {
      const nullErrors = validateShipping(null);
      expect(typeof nullErrors).toBe('object');
      expect(nullErrors.firstName).toBeDefined();

      const undefinedErrors = validateShipping(undefined);
      expect(typeof undefinedErrors).toBe('object');
      expect(undefinedErrors.email).toBeDefined();
    });
  });
});
