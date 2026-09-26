// validations/orderValidation.js
const { z } = require('zod');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const orderItemSchema = z
  .object({
    productId: z.string().regex(UUID_REGEX, 'Invalid product ID format').optional(),
    product: z.string().optional(),
    variantId: z.string().regex(UUID_REGEX, 'Invalid variant ID format').nullable().optional(),
    name: z.string().optional(),
    image: z.string().optional(),
    price: z.coerce.number().nonnegative('Item price must be positive').optional(),
    qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
  })
  .passthrough();

const shippingAddressSchema = z
  .object({
    firstName: z
      .string({ required_error: 'Shipping address is missing: firstName' })
      .trim()
      .min(1, 'Shipping address is missing: firstName'),
    lastName: z
      .string({ required_error: 'Shipping address is missing: lastName' })
      .trim()
      .min(1, 'Shipping address is missing: lastName'),
    email: z
      .string({ required_error: 'Shipping address is missing: email' })
      .trim()
      .min(1, 'Shipping address is missing: email'),
    address: z
      .string({ required_error: 'Shipping address is missing: address' })
      .trim()
      .min(1, 'Shipping address is missing: address'),
    city: z
      .string({ required_error: 'Shipping address is missing: city' })
      .trim()
      .min(1, 'Shipping address is missing: city'),
    zip: z
      .string({ required_error: 'Shipping address is missing: zip' })
      .trim()
      .min(1, 'Shipping address is missing: zip'),
    country: z
      .string({ required_error: 'Shipping address is missing: country' })
      .trim()
      .min(1, 'Shipping address is missing: country'),
    phone: z.string().trim().optional(),
  })
  .passthrough();

const createOrderSchema = z
  .object({
    orderItems: z
      .array(orderItemSchema, { required_error: 'No order items' })
      .min(1, 'No order items'),
    shippingAddress: shippingAddressSchema,
    paymentMethod: z
      .string({ required_error: 'Payment method is required' })
      .trim()
      .min(1, 'Payment method is required'),
  })
  .passthrough();

const orderIdParamSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid order ID format'),
});

const cancelOrderSchema = z
  .object({
    reason: z.string().trim().max(500, 'Cancellation reason too long').optional(),
  })
  .passthrough()
  .optional()
  .default({});

const getMyOrdersQuerySchema = z
  .object({
    page: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
    limit: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
  })
  .passthrough();

module.exports = {
  orderItemSchema,
  shippingAddressSchema,
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
  getMyOrdersQuerySchema,
};
