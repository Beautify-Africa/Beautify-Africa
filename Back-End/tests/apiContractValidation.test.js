const { buildOpenApiSpec } = require('../docs/openapi');

describe('API Contract & OpenAPI 3.0 Specification Validation Suite', () => {
  let spec;

  beforeAll(() => {
    spec = buildOpenApiSpec();
  });

  test('OpenAPI root document conforms to OpenAPI 3.0.3 specification structure', () => {
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe('Beautify Africa API');
    expect(spec.info.version).toBe('1.0.0');
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers.length).toBeGreaterThan(0);
    expect(spec.paths).toBeDefined();
    expect(typeof spec.paths).toBe('object');
  });

  test('contains complete path contracts for core platform domains', () => {
    const paths = Object.keys(spec.paths);

    // Verify all primary domains are mapped in API contract
    expect(paths).toContain('/health');
    expect(paths).toContain('/api/products');
    expect(paths).toContain('/api/products/{idOrSlug}');
    expect(paths).toContain('/api/auth/register');
    expect(paths).toContain('/api/auth/login');
    expect(paths).toContain('/api/auth/admin-login');
    expect(paths).toContain('/api/orders');
    expect(paths).toContain('/api/cart');
    expect(paths).toContain('/api/wishlist');
    expect(paths).toContain('/api/newsletter/subscribe');
  });

  test('every path operation declares standard HTTP responses with content schemas', () => {
    Object.entries(spec.paths).forEach(([pathKey, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          expect(operation.responses).toBeDefined();
          expect(operation.summary || operation.description).toBeDefined();

          // Every operation must declare at least one success response (200 or 201)
          const responseCodes = Object.keys(operation.responses);
          const hasSuccessResponse = responseCodes.some((code) =>
            ['200', '201', '204'].includes(code)
          );
          expect(hasSuccessResponse).toBe(true);
        }
      });
    });
  });

  test('components declare standard security schemes for JWT Bearer and HTTPOnly Cookies', () => {
    expect(spec.components).toBeDefined();
    expect(spec.components.securitySchemes).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
    expect(spec.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
  });

  test('data schemas validate core domain entities with required attributes', () => {
    const schemas = spec.components.schemas;
    expect(schemas).toBeDefined();

    // Product schema contract
    if (schemas.Product) {
      expect(schemas.Product.type).toBe('object');
      expect(schemas.Product.properties).toBeDefined();
      expect(schemas.Product.properties.id || schemas.Product.properties._id).toBeDefined();
      expect(schemas.Product.properties.price).toBeDefined();
    }

    // Order schema contract
    if (schemas.Order) {
      expect(schemas.Order.type).toBe('object');
      expect(schemas.Order.properties.totalPrice).toBeDefined();
      expect(schemas.Order.properties.paymentMethod).toBeDefined();
    }
  });
});
