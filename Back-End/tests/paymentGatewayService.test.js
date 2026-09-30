// tests/paymentGatewayService.test.js
jest.mock('../config/db', () => ({
  sequelize: {
    transaction: jest.fn((callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })),
  },
}));

jest.mock('../models/Order', () => ({
  Order: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  OrderItem: {},
  OrderShippingAddress: {},
  AdminTimelineEntry: {
    create: jest.fn(),
  },
}));

jest.mock('../models/WebhookEvent', () => ({
  findByPk: jest.fn(),
  findOrCreate: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../services/inventoryService', () => ({
  processPurchase: jest.fn(),
}));

jest.mock('../services/gateways/stripeAdapter', () => ({
  name: 'stripe',
  initializePayment: jest.fn(),
  verifyTransaction: jest.fn(),
  verifyWebhook: jest.fn(),
}));

jest.mock('../services/gateways/paystackAdapter', () => ({
  name: 'paystack',
  initializePayment: jest.fn(),
  verifyTransaction: jest.fn(),
  verifyWebhook: jest.fn(),
}));

jest.mock('../services/gateways/mpesaAdapter', () => ({
  name: 'mpesa',
  initializePayment: jest.fn(),
  verifyTransaction: jest.fn(),
  verifyWebhook: jest.fn(),
}));

const { Order, AdminTimelineEntry } = require('../models/Order');
const WebhookEvent = require('../models/WebhookEvent');
const { processPurchase } = require('../services/inventoryService');
const stripeAdapter = require('../services/gateways/stripeAdapter');
const paystackAdapter = require('../services/gateways/paystackAdapter');
const mpesaAdapter = require('../services/gateways/mpesaAdapter');
const paymentGatewayService = require('../services/paymentGatewayService');

describe('Payment Gateway Service Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdapter', () => {
    it('resolves stripe adapter case-insensitively', () => {
      expect(paymentGatewayService.getAdapter('STRIPE')).toBe(stripeAdapter);
      expect(paymentGatewayService.getAdapter('stripe')).toBe(stripeAdapter);
    });

    it('resolves paystack adapter', () => {
      expect(paymentGatewayService.getAdapter('paystack')).toBe(paystackAdapter);
    });

    it('resolves mpesa adapter', () => {
      expect(paymentGatewayService.getAdapter('mpesa')).toBe(mpesaAdapter);
    });

    it('throws error for unsupported gateway', () => {
      expect(() => paymentGatewayService.getAdapter('crypto')).toThrow(
        /Unsupported payment gateway/
      );
    });
  });

  describe('getSupportedGateways', () => {
    it('returns stripe, paystack, and mpesa metadata', () => {
      const gateways = paymentGatewayService.getSupportedGateways();
      const ids = gateways.map((g) => g.id);
      expect(ids).toContain('stripe');
      expect(ids).toContain('paystack');
      expect(ids).toContain('mpesa');
    });
  });

  describe('initializePayment', () => {
    it('delegates to Paystack adapter and saves gateway info to order', async () => {
      const mockOrder = {
        id: 'order-123',
        currency: 'NGN',
        paymentGateway: 'stripe',
        gatewayReference: null,
        save: jest.fn().mockResolvedValue(true),
      };

      paystackAdapter.initializePayment.mockResolvedValue({
        gateway: 'paystack',
        reference: 'pstk_order-123_456',
        authorizationUrl: 'https://paystack.mock/pay',
      });

      const result = await paymentGatewayService.initializePayment({
        gateway: 'paystack',
        order: mockOrder,
        customer: { email: 'buyer@example.com' },
        currency: 'NGN',
      });

      expect(paystackAdapter.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'NGN' })
      );
      expect(mockOrder.paymentGateway).toBe('paystack');
      expect(mockOrder.gatewayReference).toBe('pstk_order-123_456');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(result.authorizationUrl).toBe('https://paystack.mock/pay');
    });

    it('delegates to M-Pesa adapter for STK push', async () => {
      const mockOrder = {
        id: 'order-mpesa-1',
        currency: 'KES',
        save: jest.fn().mockResolvedValue(true),
      };

      mpesaAdapter.initializePayment.mockResolvedValue({
        gateway: 'mpesa',
        reference: 'ws_CO_12345',
        checkoutRequestId: 'ws_CO_12345',
        status: 'pending_pin',
      });

      const result = await paymentGatewayService.initializePayment({
        gateway: 'mpesa',
        order: mockOrder,
        phone: '0712345678',
        currency: 'KES',
      });

      expect(mpesaAdapter.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0712345678', currency: 'KES' })
      );
      expect(result.status).toBe('pending_pin');
      expect(mockOrder.gatewayReference).toBe('ws_CO_12345');
    });
  });

  describe('processPaymentSuccess', () => {
    it('rejects a payment reference that is not bound to the order', async () => {
      const mockOrder = {
        id: 'order-bound',
        isPaid: false,
        paymentGateway: 'paystack',
        gatewayReference: 'pstk_expected',
        totalPrice: 50,
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(
        paymentGatewayService.processPaymentSuccess({
          orderId: 'order-bound',
          gateway: 'paystack',
          reference: 'pstk_other',
          amount: 50,
        })
      ).rejects.toThrow(/reference does not match/i);
      expect(mockOrder.save).not.toHaveBeenCalled();
      expect(processPurchase).not.toHaveBeenCalled();
    });

    it('rejects a provider amount that does not match the order total', async () => {
      const mockOrder = {
        id: 'order-amount',
        isPaid: false,
        paymentGateway: 'stripe',
        gatewayReference: 'pi_expected',
        totalPrice: 50,
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(
        paymentGatewayService.processPaymentSuccess({
          orderId: 'order-amount',
          gateway: 'stripe',
          reference: 'pi_expected',
          amount: 500,
        })
      ).rejects.toThrow(/amount does not match/i);
      expect(mockOrder.save).not.toHaveBeenCalled();
      expect(processPurchase).not.toHaveBeenCalled();
    });

    it('rejects webhook payment metadata for a different order', async () => {
      const mockOrder = {
        id: 'order-metadata',
        isPaid: false,
        paymentGateway: 'stripe',
        gatewayReference: 'pi_metadata',
        totalPrice: 50,
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(
        paymentGatewayService.processPaymentSuccess({
          orderId: 'order-metadata',
          gateway: 'stripe',
          reference: 'pi_metadata',
          amount: 50,
          eventId: 'evt-metadata',
          paymentDetails: { metadata: { orderId: 'different-order' } },
        })
      ).rejects.toThrow(/metadata does not match/i);
      expect(mockOrder.save).not.toHaveBeenCalled();
      expect(processPurchase).not.toHaveBeenCalled();
    });

    it('marks order as paid, deducts inventory, and records timeline audit', async () => {
      const mockOrder = {
        id: 'order-789',
        userId: 'user-001',
        isPaid: false,
        fulfillmentStatus: 'pending_payment',
        orderItems: [
          { productId: 'prod-1', variantId: null, qty: 2 },
          { productId: 'prod-2', variantId: 'var-1', qty: 1 },
        ],
        shippingAddress: { email: 'test@example.com' },
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findByPk.mockResolvedValue(mockOrder);
      WebhookEvent.findByPk.mockResolvedValue(null);

      const result = await paymentGatewayService.processPaymentSuccess({
        orderId: 'order-789',
        gateway: 'paystack',
        reference: 'pstk_ref_999',
        amount: 50,
      });

      expect(result.success).toBe(true);
      expect(mockOrder.isPaid).toBe(true);
      expect(mockOrder.fulfillmentStatus).toBe('processing');
      expect(mockOrder.paymentGateway).toBe('paystack');
      expect(mockOrder.gatewayReference).toBe('pstk_ref_999');
      expect(mockOrder.save).toHaveBeenCalled();

      // Inventory deductions
      expect(processPurchase).toHaveBeenCalledTimes(2);
      expect(processPurchase).toHaveBeenCalledWith(
        'prod-1',
        null,
        2,
        'order-789',
        'user-001',
        expect.anything()
      );
      expect(processPurchase).toHaveBeenCalledWith(
        'prod-2',
        'var-1',
        1,
        'order-789',
        'user-001',
        expect.anything()
      );

      // Timeline entry
      expect(AdminTimelineEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-789',
          action: 'Payment Confirmed',
        }),
        expect.anything()
      );
    });

    it('skips duplicate processing idempotently if order is already paid', async () => {
      const mockPaidOrder = {
        id: 'order-already-paid',
        isPaid: true,
        save: jest.fn(),
      };

      Order.findByPk.mockResolvedValue(mockPaidOrder);

      const result = await paymentGatewayService.processPaymentSuccess({
        orderId: 'order-already-paid',
        gateway: 'stripe',
        reference: 'pi_already_paid',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(mockPaidOrder.save).not.toHaveBeenCalled();
      expect(processPurchase).not.toHaveBeenCalled();
    });
  });
});
