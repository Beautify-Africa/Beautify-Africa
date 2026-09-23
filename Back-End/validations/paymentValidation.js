// validations/paymentValidation.js
const { z } = require('zod');

const convertCurrencyQuerySchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  to: z.string().trim().min(3).max(5).toUpperCase().default('USD'),
});

const initializePaymentSchema = z.object({
  gateway: z.string().trim().toLowerCase(),
  orderId: z.string().trim().min(1, 'Order ID is required'),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().trim().min(3).max(5).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(30).optional(),
  returnUrl: z.string().trim().optional(),
  metadata: z.record(z.any()).optional(),
});

const verifyPaymentParamSchema = z.object({
  gateway: z.string().trim().min(2, 'Gateway name is required'),
  reference: z.string().trim().min(1, 'Payment reference is required'),
});

const createStripeIntentSchema = z.object({
  orderId: z.string().trim().min(1, 'Order ID is required'),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().trim().min(3).max(5).optional(),
});

module.exports = {
  convertCurrencyQuerySchema,
  initializePaymentSchema,
  verifyPaymentParamSchema,
  createStripeIntentSchema,
};
