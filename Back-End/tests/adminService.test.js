jest.mock('../models/Order');
jest.mock('../services/inventoryService', () => ({
  getLowStockItems: jest.fn(),
}));

const Order = require('../models/Order');
const inventoryService = require('../services/inventoryService');
const {
  applyAdminOrderAction,
  updateAdminOrder,
  fetchAdminOrders,
  fetchAdminOrderDetail,
  buildAdminDashboardFromOrders,
  fetchAdminAnalytics,
  fetchReorderPlan,
} = require('../services/adminService');

const VALID_ORDER_ID = '507f1f77bcf86cd799439011';

function createOrder(overrides = {}) {
  return {
    _id: VALID_ORDER_ID,
    isPaid: false,
    paidAt: undefined,
    fulfillmentStatus: 'processing',
    isDelivered: false,
    deliveredAt: undefined,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('applyAdminOrderAction', () => {
  test('throws 404 when order does not exist', () => {
    expect(() => applyAdminOrderAction(null, 'pack')).toThrow('Order not found');
  });

  test('throws 400 when action is missing', () => {
    expect(() => applyAdminOrderAction(createOrder(), '   ')).toThrow('Action is required');
  });

  test('marks order paid with normalized action input', () => {
    const order = createOrder({ isPaid: false, paidAt: undefined });

    applyAdminOrderAction(order, ' MARK_PAID ');

    expect(order.isPaid).toBe(true);
    expect(order.paidAt).toBeInstanceOf(Date);
  });

  test('blocks fulfillment actions when payment is not confirmed', () => {
    expect(() => applyAdminOrderAction(createOrder({ isPaid: false }), 'pack')).toThrow(
      'Payment must be confirmed before advancing fulfillment.'
    );
  });

  test('packs only processing orders', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });

    applyAdminOrderAction(order, 'pack');

    expect(order.fulfillmentStatus).toBe('packed');
    expect(order.isDelivered).toBe(false);
    expect(order.deliveredAt).toBeUndefined();
  });

  test('rejects shipping orders that are not packed', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });

    expect(() => applyAdminOrderAction(order, 'ship')).toThrow(
      'Cannot ship an order in "processing". Expected "packed".'
    );
  });

  test('delivers only shipped orders', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'shipped' });

    applyAdminOrderAction(order, 'deliver');

    expect(order.fulfillmentStatus).toBe('delivered');
    expect(order.isDelivered).toBe(true);
    expect(order.deliveredAt).toBeInstanceOf(Date);
  });

  test('rejects unsupported actions', () => {
    expect(() => applyAdminOrderAction(createOrder({ isPaid: true }), 'refund')).toThrow(
      'Unsupported admin action: refund'
    );
  });
});

describe('updateAdminOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects invalid order id format with 400', async () => {
    await expect(updateAdminOrder('invalid-id', 'pack')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid order ID format',
    });

    expect(Order.findById).not.toHaveBeenCalled();
  });

  test('returns 404 when order is not found', async () => {
    Order.findById.mockResolvedValue(null);

    await expect(updateAdminOrder(VALID_ORDER_ID, 'pack')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Order not found',
    });

    expect(Order.findById).toHaveBeenCalledWith(VALID_ORDER_ID);
  });

  test('updates and saves a valid order', async () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });
    Order.findById.mockResolvedValue(order);

    const updated = await updateAdminOrder(VALID_ORDER_ID, 'pack');

    expect(Order.findById).toHaveBeenCalledWith(VALID_ORDER_ID);
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(updated.fulfillmentStatus).toBe('packed');
  });
});

describe('fetchAdminOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects unsupported status filters', async () => {
    await expect(fetchAdminOrders({ status: 'returned' })).rejects.toMatchObject({
      statusCode: 400,
      message: 'Unsupported order status: returned',
    });
  });

  test('rejects invalid page values', async () => {
    await expect(fetchAdminOrders({ page: 'abc' })).rejects.toMatchObject({
      statusCode: 400,
      message: 'Page must be a whole number.',
    });
  });

  test('returns paginated order rows with normalized filters', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: VALID_ORDER_ID,
          user: { name: 'Amina Njeri', email: 'amina@example.com' },
          orderItems: [{ qty: 2, name: 'Glow Serum' }],
          shippingAddress: {
            firstName: 'Amina',
            lastName: 'Njeri',
            email: 'amina@example.com',
            city: 'Nairobi',
            country: 'Kenya',
          },
          totalPrice: 125,
          isPaid: true,
          fulfillmentStatus: 'processing',
          createdAt: new Date('2026-04-22T10:00:00.000Z'),
        },
      ]),
    };
    query.select = jest.fn().mockReturnValue(query);
    Order.find.mockReturnValue(query);
    Order.countDocuments.mockResolvedValue(1);

    const result = await fetchAdminOrders({
      status: 'processing',
      payment: 'paid',
      search: 'amina',
      page: '1',
      limit: '10',
      sort: 'total_high',
    });

    expect(Order.find).toHaveBeenCalledWith(
      expect.objectContaining({
        fulfillmentStatus: 'processing',
        isPaid: true,
        $or: expect.any(Array),
      })
    );
    expect(query.sort).toHaveBeenCalledWith({ totalPrice: -1, createdAt: -1 });
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]).toEqual(
      expect.objectContaining({
        id: VALID_ORDER_ID,
        customer: 'Amina Njeri',
        paymentLabel: 'Paid',
        fulfillmentLabel: 'processing',
        itemCount: 2,
      })
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
    expect(result.filters).toEqual({
      status: 'processing',
      payment: 'paid',
      country: '',
      search: 'amina',
      sort: 'total_high',
    });
  });
});

describe('fetchAdminOrderDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects invalid order id format', async () => {
    await expect(fetchAdminOrderDetail('invalid-id')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid order ID format',
    });
  });

  test('returns a mapped admin order detail payload', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ORDER_ID,
        user: {
          name: 'Amina Njeri',
          email: 'amina@example.com',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
        stripePaymentIntentId: 'pi_123',
        orderItems: [
          {
            name: 'Glow Serum',
            qty: 2,
            price: 45,
            image: 'https://cdn.example.com/glow-serum.jpg',
            product: {
              _id: '507f1f77bcf86cd799439099',
              slug: 'glow-serum',
              brand: 'Beautify Africa',
              category: 'Serum',
              image: 'https://cdn.example.com/glow-serum.jpg',
            },
          },
        ],
        shippingAddress: {
          firstName: 'Amina',
          lastName: 'Njeri',
          email: 'shipping@example.com',
          address: '12 River Road',
          city: 'Nairobi',
          zip: '00100',
          country: 'Kenya',
        },
        paymentMethod: 'Credit Card',
        paymentResult: {
          id: 'pay_123',
          status: 'succeeded',
          update_time: '2026-04-22T11:00:00.000Z',
          email_address: 'pay@example.com',
        },
        itemsPrice: 90,
        taxPrice: 13.5,
        shippingPrice: 15,
        totalPrice: 118.5,
        isPaid: true,
        paidAt: new Date('2026-04-22T11:00:00.000Z'),
        fulfillmentStatus: 'packed',
        isDelivered: false,
        deliveredAt: undefined,
        createdAt: new Date('2026-04-22T10:00:00.000Z'),
        updatedAt: new Date('2026-04-22T12:00:00.000Z'),
        adminTimeline: [
          {
            type: 'note',
            note: 'Confirmed stock pull.',
            adminName: 'Admin User',
            adminEmail: 'admin@example.com',
            createdAt: new Date('2026-04-22T12:30:00.000Z'),
          },
        ],
      }),
    };
    query.select = jest.fn().mockReturnValue(query);
    Order.findById.mockReturnValue(query);

    const result = await fetchAdminOrderDetail(VALID_ORDER_ID);

    expect(Order.findById).toHaveBeenCalledWith(VALID_ORDER_ID);
    expect(query.populate).toHaveBeenNthCalledWith(1, 'user', 'name email createdAt');
    expect(query.populate).toHaveBeenNthCalledWith(2, 'orderItems.product', 'name slug brand category image');
    expect(result).toEqual(
      expect.objectContaining({
        id: VALID_ORDER_ID,
        reference: expect.any(String),
        paymentLabel: 'Paid',
        fulfillmentLabel: 'packed',
      })
    );
    expect(result.customer).toEqual(
      expect.objectContaining({
        name: 'Amina Njeri',
        shippingEmail: 'shipping@example.com',
        accountEmail: 'amina@example.com',
        isGuest: false,
      })
    );
    expect(result.totals).toEqual(
      expect.objectContaining({
        items: '$90.00',
        total: '$118.50',
      })
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        name: 'Glow Serum',
        qty: 2,
        lineTotal: '$90.00',
        productSlug: 'glow-serum',
      })
    );
    expect(result.timeline).toHaveLength(1);
  });
});

describe('buildAdminDashboardFromOrders', () => {
  test('returns an expanded priority queue with filterable fields', () => {
    const orders = Array.from({ length: 10 }, (_, index) => ({
      _id: `507f1f77bcf86cd7994390${index.toString().padStart(2, '0')}`,
      user: { name: `Customer ${index}`, email: `customer${index}@example.com` },
      orderItems: [{ qty: index + 1, name: `Item ${index}` }],
      shippingAddress: {
        firstName: `Customer`,
        lastName: `${index}`,
        email: `shipping${index}@example.com`,
        city: index % 2 === 0 ? 'Nairobi' : 'Kampala',
        country: index % 2 === 0 ? 'Kenya' : 'Uganda',
      },
      totalPrice: 100 + index * 10,
      isPaid: index % 3 !== 0,
      fulfillmentStatus: index % 4 === 0 ? 'packed' : index % 4 === 1 ? 'processing' : 'shipped',
      isDelivered: false,
      createdAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`),
      adminTimeline: index % 2 === 0
        ? [
            {
              type: 'note',
              note: `Note ${index}`,
              adminName: 'Admin',
              createdAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}T11:00:00.000Z`),
            },
          ]
        : [],
    }));

    const dashboard = buildAdminDashboardFromOrders(orders, new Date('2026-04-23T12:00:00.000Z'));

    expect(dashboard.priorityOrders).toHaveLength(8);
    expect(dashboard.priorityOrders[0]).toEqual(
      expect.objectContaining({
        email: expect.any(String),
        totalValue: expect.any(Number),
        placedAtRaw: expect.any(Date),
        isPaid: expect.any(Boolean),
        itemCount: expect.any(Number),
        isCrossBorder: expect.any(Boolean),
        hasNote: expect.any(Boolean),
      })
    );
  });
});

describe('fetchAdminAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inventoryService.getLowStockItems.mockResolvedValue({ totalCount: 4 });
  });

  test('returns revenue, velocity, and forecast summaries', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd7994390a1',
          orderItems: [
            { qty: 2, name: 'Glow Serum', price: 45, product: '507f1f77bcf86cd7994390b1' },
          ],
          totalPrice: 90,
          isPaid: true,
          paidAt: new Date('2026-04-22T11:00:00.000Z'),
          fulfillmentStatus: 'packed',
          createdAt: new Date('2026-04-22T10:00:00.000Z'),
        },
        {
          _id: '507f1f77bcf86cd7994390a2',
          orderItems: [
            { qty: 1, name: 'Radiance Mist', price: 30, product: '507f1f77bcf86cd7994390b2' },
          ],
          totalPrice: 30,
          isPaid: false,
          createdAt: new Date('2026-04-21T10:00:00.000Z'),
        },
      ]),
    };
    query.select = jest.fn().mockReturnValue(query);
    Order.find.mockReturnValue(query);

    const analytics = await fetchAdminAnalytics();

    expect(Order.find).toHaveBeenCalledWith({});
    expect(inventoryService.getLowStockItems).toHaveBeenCalledWith(10, { limit: 1 });
    expect(analytics.summary).toEqual(
      expect.objectContaining({
        totalOrders: 2,
        paidOrders: 1,
        unpaidOrders: 1,
        grossRevenue: '$90.00',
        averageOrderValue: '$90.00',
        lowStockCount: 4,
      })
    );
    expect(analytics.velocity.salesSeries).toHaveLength(14);
    expect(analytics.topProducts[0]).toEqual(
      expect.objectContaining({
        name: 'Glow Serum',
        quantity: 2,
        revenueLabel: '$90.00',
      })
    );
    expect(analytics.forecast).toEqual(
      expect.objectContaining({
        next7dRevenue: expect.any(String),
        inventoryPressure: expect.any(Number),
      })
    );
  });
});

describe('fetchReorderPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inventoryService.getLowStockItems.mockResolvedValue({
      totalCount: 1,
      items: [
        {
          productId: '507f1f77bcf86cd7994390b1',
          productName: 'Glow Serum',
          sku: 'GS-001',
          type: 'main',
          stock: 3,
          threshold: 10,
        },
      ],
    });
  });

  test('returns reorder recommendations and csv output', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd7994390a1',
          orderItems: [
            { qty: 6, name: 'Glow Serum', price: 45, product: '507f1f77bcf86cd7994390b1' },
          ],
          totalPrice: 270,
          isPaid: true,
          paidAt: new Date('2026-04-22T11:00:00.000Z'),
          createdAt: new Date('2026-04-22T10:00:00.000Z'),
        },
      ]),
    };
    query.select = jest.fn().mockReturnValue(query);
    Order.find.mockReturnValue(query);

    const reorderPlan = await fetchReorderPlan({ threshold: 10, leadTimeDays: 14, windowDays: 30 });

    expect(inventoryService.getLowStockItems).toHaveBeenCalledWith(10, {
      limit: 500,
      includeArchived: false,
    });
    expect(reorderPlan.summary).toEqual(
      expect.objectContaining({
        recommendationCount: 1,
        highPriorityCount: 1,
        leadTimeDays: 14,
      })
    );
    expect(reorderPlan.recommendations[0]).toEqual(
      expect.objectContaining({
        productName: 'Glow Serum',
        recommendedOrderQty: expect.any(Number),
        urgency: expect.any(String),
      })
    );
    expect(reorderPlan.csv).toContain('productName,sku,type');
    expect(reorderPlan.filename).toMatch(/beautify-africa-reorder-plan/);
  });
});
