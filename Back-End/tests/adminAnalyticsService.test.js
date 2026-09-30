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

const { Order } = require('../models/Order');
const inventoryService = require('../services/inventoryService');
const {
  buildAdminDashboardFromOrders,
  fetchAdminAnalytics,
  fetchReorderPlan,
} = require('../services/adminService');

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
      adminTimeline:
        index % 2 === 0
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

    const dashboard = buildAdminDashboardFromOrders(
      orders,
      2,
      new Date('2026-04-23T12:00:00.000Z')
    );

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
          {
            qty: 2,
            name: 'Glow Serum',
            price: 45,
            productId: 'c744f43c-628e-48a0-975d-852654ecbfb1',
          },
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
          {
            qty: 1,
            name: 'Radiance Mist',
            price: 30,
            productId: 'c744f43c-628e-48a0-975d-852654ecbfb2',
          },
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
          {
            qty: 6,
            name: 'Glow Serum',
            price: 45,
            productId: 'c744f43c-628e-48a0-975d-852654ecbfb1',
          },
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
