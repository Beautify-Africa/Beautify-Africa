// validations/productValidation.js
const { z } = require('zod');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const productIdParamSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid product ID'),
});

const variantParamSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid product ID'),
  variantId: z.string().regex(UUID_REGEX, 'Invalid variant ID'),
});

const createReviewSchema = z.object({
  rating: z.coerce
    .number({ required_error: 'Rating must be a number between 1 and 5' })
    .min(1, 'Rating must be a number between 1 and 5')
    .max(5, 'Rating must be a number between 1 and 5'),
  comment: z.string({ required_error: 'Comment is required' }).trim().min(1, 'Comment is required'),
});

const adjustStockSchema = z.object({
  quantity: z.coerce.number().int('Quantity must be an integer'),
  action: z.enum(['set', 'add', 'deduct']).optional().default('set'),
  reason: z.string().trim().max(255, 'Reason too long').optional(),
});

const addVariantSchema = z
  .object({
    name: z.string().trim().min(1, 'Variant name is required'),
    sku: z.string().trim().min(1, 'SKU is required').optional(),
    price: z.coerce.number().nonnegative('Price must be non-negative').optional(),
    stockQuantity: z.coerce
      .number()
      .int()
      .nonnegative('Stock quantity must be non-negative')
      .optional()
      .default(0),
    shadeHex: z.string().optional(),
    size: z.string().optional(),
    inStock: z.boolean().optional(),
  })
  .passthrough();

const productStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'archived', 'out_of_stock'], {
    errorMap: () => ({
      message: 'Invalid product status. Allowed: draft, active, archived, out_of_stock',
    }),
  }),
});

module.exports = {
  productIdParamSchema,
  variantParamSchema,
  createReviewSchema,
  adjustStockSchema,
  addVariantSchema,
  productStatusSchema,
};
