// validations/newsletterValidation.js
const { z } = require('zod');

const subscribeSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
});

const unsubscribeRequestSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
});

const unsubscribeConfirmSchema = z.object({
  token: z.string({ message: 'Token is required' }).trim().min(1, 'Token is required'),
});

module.exports = {
  subscribeSchema,
  unsubscribeRequestSchema,
  unsubscribeConfirmSchema,
};
