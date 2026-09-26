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
const { fetchAdminOrderDetail } = require('../services/adminService');

const VALID_ORDER_ID = 'c111c111-c111-c111-c111-c111c111c111';

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
