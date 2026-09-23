// validations/adminValidation.js
const { z } = require('zod');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const adminOrdersQuerySchema = z
  .object({
    page: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
    limit: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
    search: z.string().trim().max(100).optional(),
    status: z.string().trim().optional(),
    payment: z.string().trim().optional(),
    country: z.string().trim().optional(),
    sort: z.string().trim().optional(),
  })
  .passthrough();

const adminCustomersQuerySchema = z
  .object({
    page: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
    limit: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
    search: z.string().trim().max(100).optional(),
    segment: z.string().trim().optional(),
    sort: z.string().trim().optional(),
  })
  .passthrough();

const adminOrderIdParamSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid order ID'),
});

const adminCustomerParamSchema = z.object({
  id: z.string().trim().min(1, 'Customer identifier required'),
});

module.exports = {
  adminOrdersQuerySchema,
  adminCustomersQuerySchema,
  adminOrderIdParamSchema,
  adminCustomerParamSchema,
};
