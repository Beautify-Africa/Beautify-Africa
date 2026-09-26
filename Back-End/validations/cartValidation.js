// validations/cartValidation.js
const { z } = require('zod');

const addToCartSchema = z
  .object({
    productId: z.string().trim().min(1).optional(),
    product: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
    variant: z.any().optional(),
  })
  .refine((data) => Boolean(data.productId || data.product), {
    message: 'Either productId or product is required',
    path: ['productId'],
  });

const syncCartSchema = z.object({
  items: z
    .array(
      z
        .object({
          productId: z.string().trim().min(1).optional(),
          product: z.string().trim().min(1).optional(),
          quantity: z.coerce.number().int().min(1).max(99).default(1),
          variant: z.any().optional(),
        })
        .refine((data) => Boolean(data.productId || data.product), {
          message: 'Item requires either productId or product',
        })
    )
    .max(100, 'Maximum 100 items can be synced at once'),
});

const updateCartQtySchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Quantity must be at least 0').max(99, 'Quantity cannot exceed 99'),
});

const cartItemParamSchema = z.object({
  productId: z.string().trim().min(1, 'Valid product ID is required'),
});

module.exports = {
  addToCartSchema,
  syncCartSchema,
  updateCartQtySchema,
  cartItemParamSchema,
};
