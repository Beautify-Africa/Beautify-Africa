jest.mock('../models/Order');

const Order = require('../models/Order');
const { applyAdminOrderAction, updateAdminOrder } = require('../services/adminService');

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
