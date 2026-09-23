// validations/wishlistValidation.js
const { z } = require('zod');

const wishlistActionSchema = z
  .object({
    productId: z.string().trim().min(1).optional(),
    product: z.string().trim().min(1).optional(),
    id: z.string().trim().min(1).optional(),
    _id: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.productId || data.product || data.id || data._id), {
    message: 'Product ID is required',
  })
  .passthrough();

const syncWishlistSchema = z
  .object({
    localItems: z
      .any()
      .refine((val) => val === undefined || Array.isArray(val), {
        message: 'Expected an array of items to sync',
      })
      .optional(),
    productIds: z.array(z.any()).optional(),
    items: z.array(z.any()).optional(),
  })
  .passthrough();

const wishlistParamSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID parameter is required'),
});

module.exports = {
  wishlistActionSchema,
  syncWishlistSchema,
  wishlistParamSchema,
};
