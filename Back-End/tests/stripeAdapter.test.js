jest.mock('../services/stripeService', () => ({
  createPaymentIntent: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  constructWebhookEvent: jest.fn(),
}));

const { retrievePaymentIntent } = require('../services/stripeService');
const stripeAdapter = require('../services/gateways/stripeAdapter');

describe('Stripe payment verification', () => {
  beforeEach(() => jest.clearAllMocks());

  test('only reports success for a provider-confirmed succeeded PaymentIntent', async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: 'pi_pending',
      status: 'requires_payment_method',
      amount_received: 0,
      currency: 'usd',
      metadata: { orderId: 'order-1' },
    });

    const result = await stripeAdapter.verifyTransaction('pi_pending');

    expect(retrievePaymentIntent).toHaveBeenCalledWith('pi_pending');
    expect(result.success).toBe(false);
    expect(result.status).toBe('requires_payment_method');
  });
});
