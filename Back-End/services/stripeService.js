// services/stripeService.js
const Stripe = require('stripe');

// We initialize the SDK lazily or just handle missing keys gracefully in Dev
let stripeClient = null;

function getStripe() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
    }
    // Initialize stripe
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Always specific a recent robust API version
    });
  }
  return stripeClient;
}

/**
 * Creates a Stripe PaymentIntent for the given total and stores metadata.
 * @param {Number} amountInCents - Order total in smallest currency unit (cents)
 * @param {Object} metadata - Useful ID payload (e.g. orderId) to be returned in webhooks
 */
async function createPaymentIntent(amountInCents, metadata, currency = 'usd') {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: String(currency || 'usd').toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true, // Enables elements in front-end
    },
  });

  return paymentIntent;
}

/** Retrieve the provider-authoritative state of a PaymentIntent. */
async function retrievePaymentIntent(paymentIntentId) {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

/**
 * Verifies and constructs a valid Stripe webhook event from raw payload and signature.
 */
function constructWebhookEvent(rawBody, signature, secret) {
  const stripe = getStripe();
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured on the server');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  constructWebhookEvent,
};
