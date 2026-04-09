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
async function createPaymentIntent(amountInCents, metadata) {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd', // Usually standard for testing
    metadata,
    automatic_payment_methods: {
      enabled: true, // Enables elements in front-end
    },
  });

  return paymentIntent;
}

/**
 * Verifies and constructs a valid Stripe webhook event from raw payload and signature.
 */
function constructWebhookEvent(rawBody, signature, secret) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

module.exports = {
  createPaymentIntent,
  constructWebhookEvent,
};
