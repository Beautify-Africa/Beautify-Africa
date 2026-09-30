// services/paymentGatewayService.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('../models/Order');
const WebhookEvent = require('../models/WebhookEvent');
const {
  checkOrClaimWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
} = require('./webhookDeduplication');
const { processPurchase } = require('./inventoryService');
const logger = require('../utils/logger');

const stripeAdapter = require('./gateways/stripeAdapter');
const paystackAdapter = require('./gateways/paystackAdapter');
const mpesaAdapter = require('./gateways/mpesaAdapter');

const GATEWAY_ADAPTERS = {
  stripe: stripeAdapter,
  paystack: paystackAdapter,
  mpesa: mpesaAdapter,
};

class PaymentGatewayService {
  validatePaymentBinding({ order, gateway, reference, amount, currency, metadata, requireMetadata = false }) {
    const normalizedGateway = String(gateway || '').toLowerCase();
    if (order.paymentGateway && String(order.paymentGateway).toLowerCase() !== normalizedGateway) {
      throw new Error('Payment gateway does not match the order');
    }
    if (order.gatewayReference && String(order.gatewayReference) !== String(reference || '')) {
      throw new Error('Payment reference does not match the order');
    }
    if (currency && order.currency && String(currency).toUpperCase() !== String(order.currency).toUpperCase()) {
      throw new Error('Payment currency does not match the order');
    }
    const providerOrderId = metadata?.orderId || metadata?.order_id;
    if (requireMetadata && String(providerOrderId || '') !== String(order.id)) {
      throw new Error('Payment metadata does not match the order');
    }
    if (amount !== undefined && amount !== null && order.totalPrice !== undefined) {
      const providerAmountMinor = Math.round(Number(amount) * 100);
      const expectedAmountMinor = Math.round(Number(order.totalPrice) * 100);
      const toleranceMinor = Math.max(1, expectedAmountMinor * 0.001);
      if (
        Number.isFinite(providerAmountMinor) &&
        Number.isFinite(expectedAmountMinor) &&
        Math.abs(providerAmountMinor - expectedAmountMinor) > Math.round(toleranceMinor)
      ) {
        throw new Error('Payment amount does not match the order');
      }
    }
  }

  /**
   * Resolve gateway adapter by name
   */
  getAdapter(gatewayName = 'stripe') {
    const key = String(gatewayName || 'stripe')
      .toLowerCase()
      .trim();
    const adapter = GATEWAY_ADAPTERS[key];
    if (!adapter) {
      throw new Error(
        `Unsupported payment gateway: "${gatewayName}". Supported: ${Object.keys(GATEWAY_ADAPTERS).join(', ')}`
      );
    }
    return adapter;
  }

  /**
   * Returns list of supported payment gateways
   */
  getSupportedGateways() {
    return [
      {
        id: 'stripe',
        name: 'Credit / Debit Card (Stripe)',
        currencies: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ZAR', 'GHS'],
        supportedMethods: ['card', 'apple_pay', 'google_pay'],
      },
      {
        id: 'paystack',
        name: 'Paystack Pan-African Payments',
        currencies: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
        supportedMethods: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
      },
      {
        id: 'mpesa',
        name: 'Safaricom M-Pesa STK Push',
        currencies: ['KES'],
        supportedMethods: ['stk_push', 'mobile_money'],
      },
    ];
  }

  /**
   * Unified payment initialization across all gateways
   */
  async initializePayment({ gateway = 'stripe', order, customer, currency, phone, returnUrl }) {
    const adapter = this.getAdapter(gateway);

    const initResult = await adapter.initializePayment({
      order,
      customer,
      currency: currency || order.currency || 'USD',
      phone,
      returnUrl,
    });

    // Store gateway & reference on the order
    if (order && (initResult.reference || initResult.paymentIntentId)) {
      order.paymentGateway = gateway.toLowerCase();
      order.gatewayReference = initResult.reference || initResult.paymentIntentId;
      if (initResult.paymentIntentId) {
        order.stripePaymentIntentId = initResult.paymentIntentId;
      }
      await order.save();
    }

    return initResult;
  }

  /**
   * Verify transaction state from provider and mark order paid if successful
   */
  async verifyPayment({ gateway, reference, orderId }) {
    const adapter = this.getAdapter(gateway);
    const verifyResult = await adapter.verifyTransaction(reference);

    if (verifyResult.success && (orderId || verifyResult.orderId)) {
      const resolvedOrderId = orderId || verifyResult.orderId;
      const order = await Order.findByPk(resolvedOrderId);
      if (!order) throw new Error('Order not found');
      this.validatePaymentBinding({
        order,
        gateway,
        reference,
        amount: verifyResult.amount,
        currency: verifyResult.currency,
        metadata: verifyResult.metadata,
        requireMetadata: ['stripe', 'paystack'].includes(String(gateway).toLowerCase()),
      });
      await this.processPaymentSuccess({
        orderId: resolvedOrderId,
        gateway,
        reference,
        amount: verifyResult.amount,
        paymentDetails: verifyResult,
      });
    }

    return verifyResult;
  }

  /**
   * Atomically mark order as paid, deduct inventory, and record audit trail
   */
  async processPaymentSuccess({ orderId, gateway, reference, amount, paymentDetails, eventId }) {
    if (!orderId) {
      logger.warn({ gateway, reference }, 'processPaymentSuccess called without orderId');
      return { success: false, message: 'Missing orderId' };
    }

    // Two-tier deduplication check (Redis + WebhookEvent table) if eventId is provided
    if (eventId) {
      try {
        const dedup = await checkOrClaimWebhookEvent({
          gateway,
          eventId,
          eventType: `${gateway}.payment.success`,
          payload: paymentDetails || {},
        });
        if (dedup.isDuplicate) {
          logger.info({ eventId }, 'Webhook event already processed. Skipping duplicate.');
          return { alreadyProcessed: true, success: true };
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Webhook idempotency lookup warning');
      }
    }

    return sequelize.transaction(async (t) => {
      // Lock Order directly without outer join to prevent Postgres 'FOR UPDATE cannot be applied to nullable side of outer join'
      const order = await Order.findByPk(orderId, {
        transaction: t,
        ...(t?.LOCK?.UPDATE ? { lock: t.LOCK.UPDATE } : {}),
      });

      if (!order) {
        logger.error({ orderId }, 'Order not found during payment confirmation');
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.isPaid) {
        logger.info({ orderId }, 'Order already marked as paid. Skipping re-processing.');
        return { alreadyProcessed: true, order };
      }

      this.validatePaymentBinding({
        order,
        gateway,
        reference,
        amount,
        currency: paymentDetails?.currency,
        metadata: paymentDetails?.metadata,
        requireMetadata: Boolean(eventId),
      });

      if (!order.orderItems && typeof OrderItem?.findAll === 'function') {
        const [orderItems, shippingAddress] = await Promise.all([
          OrderItem.findAll({ where: { orderId }, transaction: t }),
          typeof OrderShippingAddress?.findOne === 'function'
            ? OrderShippingAddress.findOne({ where: { orderId }, transaction: t })
            : null,
        ]);
        order.orderItems = orderItems;
        if (shippingAddress) order.shippingAddress = shippingAddress;
      }

      // Mark order paid
      order.isPaid = true;
      order.paidAt = new Date();
      order.fulfillmentStatus = 'processing';
      order.paymentGateway = gateway || order.paymentGateway;
      order.gatewayReference = reference || order.gatewayReference;
      order.paymentResultId = reference || String(order.id);
      order.paymentResultStatus = 'succeeded';
      order.paymentResultUpdateTime = String(Date.now());
      order.paymentResultEmail = paymentDetails?.email || order.shippingAddress?.email || '';

      await order.save({ transaction: t });

      // Deduct inventory atomically with ledger tracking
      for (const item of order.orderItems || []) {
        if (item.productId) {
          await processPurchase(
            item.productId,
            item.variantId || null,
            item.qty,
            order.id,
            order.userId,
            { transaction: t }
          );
        }
      }

      // Record admin timeline entry
      await AdminTimelineEntry.create(
        {
          orderId: order.id,
          type: 'action',
          action: 'Payment Confirmed',
          note: `Paid via ${gateway.toUpperCase()} (Ref: ${reference || 'N/A'}${amount ? `, Amount: ${amount}` : ''})`,
          adminName: 'Payment System',
          adminEmail: 'system@beautifyafrica.com',
        },
        { transaction: t }
      );

      // Update webhook event status if present
      if (eventId) {
        await markWebhookProcessed({
          gateway,
          eventId,
          transaction: t,
        });
      }

      logger.info(
        { orderId: order.id, gateway, reference },
        'Payment successfully verified and recorded; inventory deducted'
      );

      return { success: true, order };
    });
  }

  /**
   * Process incoming webhook across any supported gateway
   */
  async handleWebhook({ gateway, rawBody, signature, headers }) {
    const adapter = this.getAdapter(gateway);
    const parsedEvent = adapter.verifyWebhook(rawBody, signature, headers);

    // Daraja callbacks do not provide a message signature. Treat them solely as a
    // notification and confirm the payment state through the authenticated Daraja API.
    if (String(gateway).toLowerCase() === 'mpesa' && parsedEvent.isSuccessful) {
      const verifiedPayment = await adapter.verifyTransaction(parsedEvent.reference);
      if (!verifiedPayment?.success) {
        throw new Error('M-Pesa payment could not be confirmed with the provider');
      }
      parsedEvent.amount = verifiedPayment.amount;
      parsedEvent.currency = verifiedPayment.currency || 'KES';
      parsedEvent.data = { ...parsedEvent.data, verifiedByProvider: true };
    }

    if (parsedEvent.isSuccessful && (parsedEvent.orderId || parsedEvent.reference)) {
      let resolvedOrderId = parsedEvent.orderId;

      // If orderId is not in metadata, lookup order by gatewayReference
      if (!resolvedOrderId && parsedEvent.reference) {
        const matched = await Order.findOne({
          where: { gatewayReference: parsedEvent.reference },
          attributes: ['id'],
        });
        if (matched) resolvedOrderId = matched.id;
      }

      if (resolvedOrderId) {
        await this.processPaymentSuccess({
          orderId: resolvedOrderId,
          gateway,
          reference: parsedEvent.reference,
          amount: parsedEvent.amount,
          currency: parsedEvent.currency,
          metadata: parsedEvent.metadata,
          paymentDetails: parsedEvent.data,
          eventId: parsedEvent.eventId,
        });
      }
    }

    return parsedEvent;
  }
}

module.exports = new PaymentGatewayService();
