// middlewares/validate.js
/**
 * Factory for Express validation middleware using Zod schemas.
 * Validates request payload and responds with standardized 400 error if invalid.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] - The request property to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const issues = result.error.issues;
      const firstIssue = issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Validation failed';

      if (req.log) {
        req.log.warn(
          { source, errors: issues, url: req.originalUrl || req.url },
          `Request validation failed on ${source}: ${errorMessage}`
        );
      }

      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: errorMessage,
        errors: issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        })),
      });
    }

    // Merge validated & coerced fields back into req[source]
    if (source === 'body' && typeof req.body === 'object' && req.body !== null) {
      req.body = result.data;
    } else if (source === 'query') {
      try {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        Object.assign(req.query, result.data);
      }
    } else if (source === 'params') {
      try {
        Object.defineProperty(req, 'params', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        Object.assign(req.params, result.data);
      }
    }

    req.validated = req.validated || {};
    req.validated[source] = result.data;

    next();
  };
}

const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
