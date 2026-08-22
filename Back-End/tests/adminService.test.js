jest.mock('../models/Order', () => ({
  Order: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  OrderItem: {},
  OrderShippingAddress: {},
  AdminTimelineEntry: {
    create: jest.fn(),
  },
}));
jest.mock('../models/Product', () => ({
  Product: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  ProductVariant: {},
  ProductReview: {},
}));
jest.mock('../models/User', () => ({}));
jest.mock('../services/inventoryService', () => ({
  getLowStockItems: jest.fn(),
}));

const { Order, AdminTimelineEntry } = require('../models/Order');
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

const VALID_ORDER_ID = 'c111c111-c111-c111-c111-c111c111c111';

function createOrder(overrides = {}) {
  return {
    id: VALID_ORDER_ID,
    _id: VALID_ORDER_ID,
    isPaid: false,
    paidAt: null,
    fulfillmentStatus: 'processing',
    isDelivered: false,
    deliveredAt: null,
    adminTimeline: [],
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
    const order = createOrder({ isPaid: false, paidAt: null });

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
    expect(order.deliveredAt).toBeNull();
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

    expect(Order.findByPk).not.toHaveBeenCalled();
  });

  test('returns 404 when order is not found', async () => {
    Order.findByPk.mockResolvedValue(null);

    await expect(updateAdminOrder(VALID_ORDER_ID, 'pack')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Order not found',
    });

    expect(Order.findByPk).toHaveBeenCalledWith(VALID_ORDER_ID, expect.any(Object));
  });

  test('updates and saves a valid order', async () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });
    Order.findByPk
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, fulfillmentStatus: 'packed' });

    const updated = await updateAdminOrder(VALID_ORDER_ID, 'pack');

    expect(Order.findByPk).toHaveBeenCalledWith(VALID_ORDER_ID, expect.any(Object));
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(AdminTimelineEntry.create).toHaveBeenCalled();
    expect(updated.fulfillmentStatus).toBe('packed');
  });
});

describe('fetchAdminOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns paginated order rows with normalized filters', async () => {
    Order.findAll.mockResolvedValue([
      {
        id: VALID_ORDER_ID,
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
    ]);
    Order.count.mockResolvedValue(1);

    const result = await fetchAdminOrders({
      fulfillment: 'processing',
      payment: 'paid',
      search: 'amina',
      page: '1',
      limit: '10',
      sort: 'total_high',
    });

    expect(Order.findAll).toHaveBeenCalled();
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
    Order.findByPk.mockResolvedValue({
      id: VALID_ORDER_ID,
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
          productId: '507f1f77bcf86cd799439099',
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
      paymentResultId: 'pay_123',
      paymentResultStatus: 'succeeded',
      paymentResultUpdateTime: '2026-04-22T11:00:00.000Z',
      paymentResultEmail: 'pay@example.com',
      itemsPrice: 90,
      taxPrice: 13.5,
      shippingPrice: 15,
      totalPrice: 118.5,
      isPaid: true,
      paidAt: new Date('2026-04-22T11:00:00.000Z'),
      fulfillmentStatus: 'packed',
      isDelivered: false,
      deliveredAt: null,
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
    });

    const result = await fetchAdminOrderDetail(VALID_ORDER_ID);

    expect(Order.findByPk).toHaveBeenCalledWith(VALID_ORDER_ID, expect.any(Object));
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
      })
    );
    expect(result.timeline).toHaveLength(1);
  });
});

describe('buildAdminDashboardFromOrders', () => {
  test('returns an expanded priority queue with filterable fields', () => {
    const orders = Array.from({ length: 10 }, (_, index) => ({
      id: `c744f43c-628e-48a0-975d-852654ecbf${index.toString().padStart(2, '0')}`,
      _id: `c744f43c-628e-48a0-975d-852654ecbf${index.toString().padStart(2, '0')}`,
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

    const dashboard = buildAdminDashboardFromOrders(orders, 2, new Date('2026-04-23T12:00:00.000Z'));

    expect(dashboard.priorityQueue).toBeDefined();
    expect(dashboard.metrics).toEqual(
      expect.objectContaining({
        totalOrders: 10,
        lowStockItemsCount: 2,
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
    Order.findAll.mockResolvedValue([
      {
        id: 'c744f43c-628e-48a0-975d-852654ecbfa1',
        orderItems: [
          { qty: 2, name: 'Glow Serum', price: 45, productId: 'c744f43c-628e-48a0-975d-852654ecbfb1' },
        ],
        totalPrice: 90,
        isPaid: true,
        paidAt: new Date('2026-04-22T11:00:00.000Z'),
        fulfillmentStatus: 'packed',
        createdAt: new Date('2026-04-22T10:00:00.000Z'),
      },
      {
        id: 'c744f43c-628e-48a0-975d-852654ecbfa2',
        orderItems: [
          { qty: 1, name: 'Radiance Mist', price: 30, productId: 'c744f43c-628e-48a0-975d-852654ecbfb2' },
        ],
        totalPrice: 30,
        isPaid: false,
        createdAt: new Date('2026-04-21T10:00:00.000Z'),
      },
    ]);

    const analytics = await fetchAdminAnalytics();

    expect(Order.findAll).toHaveBeenCalled();
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
          productId: 'c744f43c-628e-48a0-975d-852654ecbfb1',
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
    Order.findAll.mockResolvedValue([
      {
        id: 'c744f43c-628e-48a0-975d-852654ecbfa1',
        orderItems: [
          { qty: 6, name: 'Glow Serum', price: 45, productId: 'c744f43c-628e-48a0-975d-852654ecbfb1' },
        ],
        totalPrice: 270,
        isPaid: true,
        paidAt: new Date('2026-04-22T11:00:00.000Z'),
        createdAt: new Date('2026-04-22T10:00:00.000Z'),
      },
    ]);

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
