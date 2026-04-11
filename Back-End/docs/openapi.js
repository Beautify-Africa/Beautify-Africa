function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getServerUrl(req) {
  const configuredUrl = normalizeBaseUrl(process.env.API_BASE_URL);
  if (configuredUrl) return configuredUrl;

  if (req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  return `http://localhost:${process.env.PORT || 5000}`;
}

function buildOpenApiSpec(req) {
  const serverUrl = getServerUrl(req);

  return {
    openapi: '3.0.3',
    info: {
      title: 'Beautify Africa API',
      version: '1.0.0',
      description:
        'REST API for Beautify Africa e-commerce operations including auth, products, orders, cart, wishlist, newsletter, payments, and admin dashboard features.',
    },
    servers: [
      {
        url: serverUrl,
        description: 'Active API server',
      },
    ],
    tags: [
      { name: 'System' },
      { name: 'Auth' },
      { name: 'Products' },
      { name: 'Orders' },
      { name: 'Cart' },
      { name: 'Wishlist' },
      { name: 'Newsletter' },
      { name: 'Stripe' },
      { name: 'Admin' },
    ],
    paths: {
      '/': {
        get: {
          tags: ['System'],
          summary: 'API welcome endpoint',
          responses: {
            '200': {
              description: 'Plain-text API health greeting',
              content: {
                'text/plain': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Read service and database health',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      database: { type: 'string', example: 'connected' },
                    },
                  },
                },
              },
            },
            '503': {
              description: 'Service degraded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'degraded' },
                      database: { type: 'string', example: 'disconnected' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a customer account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthRegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '409': { $ref: '#/components/responses/Conflict' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login a customer account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/admin-login': {
        post: {
          tags: ['Auth'],
          summary: 'Login to admin dashboard',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Admin login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '503': { $ref: '#/components/responses/ServiceUnavailable' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Request accepted (generic response)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset account password with token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password reset completed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Authenticated user profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update authenticated user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '409': { $ref: '#/components/responses/Conflict' },
          },
        },
      },

      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'List products with optional filters and sorting',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'brand', in: 'query', schema: { type: 'string' } },
            { name: 'skinType', in: 'query', schema: { type: 'string' } },
            { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['price-low', 'price-high', 'rating', 'best-selling'],
              },
            },
          ],
          responses: {
            '200': {
              description: 'Product list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      count: { type: 'integer', example: 4 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/products/{idOrSlug}': {
        get: {
          tags: ['Products'],
          summary: 'Get one product by Mongo ID or slug',
          parameters: [
            {
              name: 'idOrSlug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Product found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/products/{id}/reviews': {
        post: {
          tags: ['Products'],
          summary: 'Create a product review',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rating', 'comment'],
                  properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string', minLength: 1, maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Review created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'Review added' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Create an order (guest or authenticated)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateOrderRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Order created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/orders/myorders': {
        get: {
          tags: ['Orders'],
          summary: 'Get current user order history',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User orders',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Order' },
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Get authenticated user cart',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cart items',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
        post: {
          tags: ['Cart'],
          summary: 'Add product to cart',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['product'],
                  properties: {
                    product: { type: 'string' },
                    variant: { type: 'string' },
                    quantity: { type: 'integer', minimum: 1 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cart updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Clear all cart items',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cart cleared',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/cart/sync': {
        post: {
          tags: ['Cart'],
          summary: 'Sync local cart to authenticated cart',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['localItems'],
                  properties: {
                    localItems: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          product: { type: 'string' },
                          id: { type: 'string' },
                          variant: { type: 'string' },
                          quantity: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cart synced',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/cart/{productId}': {
        put: {
          tags: ['Cart'],
          summary: 'Update one cart item quantity',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['quantity'],
                  properties: {
                    quantity: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cart item updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Remove one item from cart',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Cart item removed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CartResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/wishlist': {
        get: {
          tags: ['Wishlist'],
          summary: 'Get wishlist products',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Wishlist fetched',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      count: { type: 'integer' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
        post: {
          tags: ['Wishlist'],
          summary: 'Add product to wishlist',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string' },
                    product: { type: 'string' },
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Wishlist updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      inWishlist: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
        delete: {
          tags: ['Wishlist'],
          summary: 'Clear wishlist',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Wishlist cleared',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { type: 'array', items: {} },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/wishlist/toggle': {
        post: {
          tags: ['Wishlist'],
          summary: 'Toggle product in wishlist',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string' },
                    product: { type: 'string' },
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Wishlist toggled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      action: { type: 'string', enum: ['added', 'removed'] },
                      inWishlist: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/wishlist/sync': {
        post: {
          tags: ['Wishlist'],
          summary: 'Sync local wishlist to authenticated account',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['localItems'],
                  properties: {
                    localItems: {
                      type: 'array',
                      items: {
                        oneOf: [
                          { type: 'string' },
                          {
                            type: 'object',
                            properties: {
                              productId: { type: 'string' },
                              product: { type: 'string' },
                              id: { type: 'string' },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Wishlist synced',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      count: { type: 'integer' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/wishlist/{productId}': {
        delete: {
          tags: ['Wishlist'],
          summary: 'Remove one product from wishlist',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Wishlist item removed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      inWishlist: { type: 'boolean', example: false },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/api/newsletter/subscribe': {
        post: {
          tags: ['Newsletter'],
          summary: 'Subscribe an email to newsletter',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Already subscribed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '201': {
              description: 'New subscription created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/newsletter/unsubscribe/request': {
        post: {
          tags: ['Newsletter'],
          summary: 'Request newsletter unsubscribe confirmation email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Request processed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/newsletter/unsubscribe/confirm': {
        post: {
          tags: ['Newsletter'],
          summary: 'Confirm newsletter unsubscribe with token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Unsubscribe completed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MessageResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      '/api/stripe/create-payment-intent': {
        post: {
          tags: ['Stripe'],
          summary: 'Create Stripe payment intent and draft order',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['orderItems', 'shippingAddress'],
                  properties: {
                    orderItems: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OrderItemRequest' },
                    },
                    shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Stripe client secret ready',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      clientSecret: { type: 'string' },
                      orderId: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/stripe/webhook': {
        post: {
          tags: ['Stripe'],
          summary: 'Stripe webhook receiver',
          description:
            'Consumes Stripe signed webhook payloads. This endpoint expects raw application/json body with Stripe-Signature header.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Webhook processed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      received: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid webhook signature',
              content: {
                'text/plain': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },

      '/api/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin dashboard data',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Dashboard payload',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        additionalProperties: true,
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/admin/orders/{id}': {
        patch: {
          tags: ['Admin'],
          summary: 'Update admin order status via action command',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action'],
                  properties: {
                    action: {
                      type: 'string',
                      enum: ['mark_paid', 'pack', 'ship', 'deliver'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Order updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Unauthorized: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Conflict: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        ServiceUnavailable: {
          description: 'Service temporarily unavailable',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        InternalServerError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
          required: ['status', 'message'],
        },
        MessageResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string' },
          },
          required: ['status', 'message'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
            isAdmin: { type: 'boolean' },
          },
        },
        AuthRegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthSuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
          required: ['status', 'token', 'user'],
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string' },
            price: { type: 'number' },
            originalPrice: { type: 'number', nullable: true },
            rating: { type: 'number' },
            numReviews: { type: 'integer' },
            inStock: { type: 'boolean' },
            image: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            skinType: { type: 'array', items: { type: 'string' } },
            isNewProduct: { type: 'boolean' },
            isBestSeller: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItemRequest: {
          type: 'object',
          properties: {
            product: { type: 'string' },
            productId: { type: 'string' },
            id: { type: 'string' },
            qty: { type: 'integer', minimum: 1 },
            quantity: { type: 'integer', minimum: 1 },
            name: { type: 'string' },
          },
        },
        ShippingAddress: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            city: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string' },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['orderItems', 'shippingAddress', 'paymentMethod'],
          properties: {
            orderItems: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/OrderItemRequest' },
            },
            shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
            paymentMethod: { type: 'string', example: 'Credit Card' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string', nullable: true },
            orderItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  qty: { type: 'integer' },
                  image: { type: 'string' },
                  price: { type: 'number' },
                  product: { type: 'string' },
                },
              },
            },
            shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
            paymentMethod: { type: 'string' },
            itemsPrice: { type: 'number' },
            taxPrice: { type: 'number' },
            shippingPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            isPaid: { type: 'boolean' },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            isDelivered: { type: 'boolean' },
            fulfillmentStatus: {
              type: 'string',
              enum: ['processing', 'packed', 'shipped', 'delivered'],
            },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            product: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            image: { type: 'string' },
            variant: { type: 'string' },
            quantity: { type: 'integer' },
          },
        },
        CartResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
          },
        },
      },
    },
  };
}

module.exports = {
  buildOpenApiSpec,
};
