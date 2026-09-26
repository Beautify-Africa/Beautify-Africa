// services/gateways/stripeAdapter.js
const {
  createPaymentIntent,
  constructWebhookEvent,
  retrievePaymentIntent,
} = require('../stripeService');
const logger = require('../../utils/logger');

/**
 * Stripe Payment Gateway Adapter
 * Handles international credit cards, Apple Pay, Google Pay.
 */
class StripeAdapter {
  constructor() {
    this.name = 'stripe';
  }

  /**
   * Initialize a Stripe payment intent for the given order
   */
  async initializePayment({ order, currency = 'USD' }) {
    // Stripe expects amount in smallest currency unit (cents for USD)
    const amountInCents = Math.round(Number(order.totalPrice) * 100);

    const paymentIntent = await createPaymentIntent(
      amountInCents,
      { orderId: order.id.toString() },
      currency
    );

    return {
      gateway: 'stripe',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: 'requires_payment_method',
      reference: paymentIntent.id,
    };
  }

  /**
   * Verify transaction state from Stripe
   */
  async verifyTransaction(reference) {
    const paymentIntent = await retrievePaymentIntent(reference);
    return {
      success: paymentIntent.status === 'succeeded',
      reference: paymentIntent.id,
      gateway: 'stripe',
      status: paymentIntent.status,
      amount: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency?.toUpperCase(),
      orderId: paymentIntent.metadata?.orderId,
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Parse & verify Stripe webhook signature
   */
  verifyWebhook(payload, signature) {
    try {
      if (!signature) {
        throw new Error('Missing stripe-signature header');
      }
      const event = constructWebhookEvent(payload, signature);
      return {
        eventId: event.id,
        eventType: event.type,
        data: event.data.object,
        isSuccessful: event.type === 'payment_intent.succeeded',
        orderId: event.data.object.metadata?.orderId,
        reference: event.data.object.id,
        amount: event.data.object.amount_received
          ? event.data.object.amount_received / 100
          : undefined,
        currency: event.data.object.currency?.toUpperCase(),
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Stripe webhook verification failed');
      throw err;
    }
  }
}

module.exports = new StripeAdapter();
