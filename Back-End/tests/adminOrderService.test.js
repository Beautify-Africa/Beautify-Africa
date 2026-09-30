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
const {
  applyAdminOrderAction,
  updateAdminOrder,
  fetchAdminOrders,
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

  test('advances processing order to packed', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });

    applyAdminOrderAction(order, 'pack');

    expect(order.fulfillmentStatus).toBe('packed');
    expect(order.isDelivered).toBe(false);
  });

  test('advances packed order to shipped', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'packed' });

    applyAdminOrderAction(order, 'ship');

    expect(order.fulfillmentStatus).toBe('shipped');
  });

  test('advances shipped order to delivered and marks delivered flag', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'shipped' });

    applyAdminOrderAction(order, 'deliver');

    expect(order.fulfillmentStatus).toBe('delivered');
    expect(order.isDelivered).toBe(true);
    expect(order.deliveredAt).toBeInstanceOf(Date);
  });

  test('rejects packing an unpaid order', () => {
    const order = createOrder({ isPaid: false, fulfillmentStatus: 'processing' });

    expect(() => applyAdminOrderAction(order, 'pack')).toThrow(
      'Payment must be confirmed before advancing fulfillment.'
    );
  });

  test('rejects out-of-order transitions', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });

    expect(() => applyAdminOrderAction(order, 'deliver')).toThrow(
      'Cannot deliver an order in "processing". Expected "shipped".'
    );
  });

  test('rejects unsupported actions', () => {
    const order = createOrder({ isPaid: true, fulfillmentStatus: 'processing' });

    expect(() => applyAdminOrderAction(order, 'archive')).toThrow(
      'Unsupported admin action: archive'
    );
  });
});

describe('updateAdminOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates order and records timeline entry with note', async () => {
    const orderInstance = createOrder({
      isPaid: true,
      fulfillmentStatus: 'processing',
    });

    Order.findByPk
      .mockResolvedValueOnce(orderInstance)
      .mockResolvedValueOnce(orderInstance);
    AdminTimelineEntry.create.mockResolvedValue({});

    const result = await updateAdminOrder(
      VALID_ORDER_ID,
      'pack',
      { name: 'Admin Lead', email: 'lead@example.com' },
      'Packed with sample sachet'
    );

    expect(orderInstance.save).toHaveBeenCalled();
    expect(AdminTimelineEntry.create).toHaveBeenCalledWith({
      orderId: VALID_ORDER_ID,
      type: 'action',
      action: 'pack',
      note: 'Packed with sample sachet',
      adminName: 'Admin Lead',
      adminEmail: 'lead@example.com',
    });
    expect(result).toBe(orderInstance);
  });
});

describe('fetchAdminOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applies normalized filters and returns paginated mapped orders', async () => {
    Order.findAll.mockResolvedValue([
      {
        id: VALID_ORDER_ID,
        _id: VALID_ORDER_ID,
        totalPrice: 120,
        isPaid: true,
        fulfillmentStatus: 'processing',
        createdAt: new Date('2026-04-20T10:00:00.000Z'),
        user: { name: 'Amina Njeri', email: 'amina@example.com' },
        shippingAddress: {
          firstName: 'Amina',
          lastName: 'Njeri',
          city: 'Nairobi',
          country: 'Kenya',
          email: 'amina@example.com',
        },
        orderItems: [{ qty: 2 }],
      },
    ]);
    Order.count.mockResolvedValue(1);

    const result = await fetchAdminOrders({
      page: '1',
      limit: '10',
      payment: 'paid',
      fulfillment: 'processing',
      sort: 'newest',
    });

    expect(Order.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPaid: true,
          fulfillmentStatus: 'processing',
        }),
        limit: 10,
        offset: 0,
      })
    );
    expect(result.orders[0]).toEqual(
      expect.objectContaining({
        id: VALID_ORDER_ID,
        customer: 'Amina Njeri',
        statusTone: 'amber',
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
