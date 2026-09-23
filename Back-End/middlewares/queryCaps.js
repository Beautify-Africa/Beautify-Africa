// middlewares/queryCaps.js
/**
 * Global Query & Pagination Caps Middleware
 * Protects against resource exhaustion and Denial of Service (DoS)
 * by enforcing strict maximum limits on query pagination parameters.
 */
function queryCaps(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    const updatedQuery = { ...req.query };

    // 1. Cap limit parameter to maximum 100
    if (updatedQuery.limit !== undefined) {
      const parsedLimit = parseInt(updatedQuery.limit, 10);
      if (Number.isFinite(parsedLimit)) {
        updatedQuery.limit = Math.min(Math.max(1, parsedLimit), 100);
      }
    }

    // 2. Cap pageSize parameter to maximum 100
    if (updatedQuery.pageSize !== undefined) {
      const parsedPageSize = parseInt(updatedQuery.pageSize, 10);
      if (Number.isFinite(parsedPageSize)) {
        updatedQuery.pageSize = Math.min(Math.max(1, parsedPageSize), 100);
      }
    }

    // 3. Ensure page is at least 1
    if (updatedQuery.page !== undefined) {
      const parsedPage = parseInt(updatedQuery.page, 10);
      if (Number.isFinite(parsedPage)) {
        updatedQuery.page = Math.max(1, parsedPage);
      }
    }

    // Express defines req.query via prototype getter; override on instance
    Object.defineProperty(req, 'query', {
      value: updatedQuery,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
}

module.exports = queryCaps;
module.exports.queryCaps = queryCaps;
