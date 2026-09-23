// services/gateways/paystackAdapter.js
const crypto = require('crypto');
const logger = require('../../utils/logger');
const currencyService = require('../currencyService');

/**
 * Paystack Payment Gateway Adapter
 * Handles West African & Pan-African transactions (KES, NGN, GHS, ZAR, USD)
 * via Cards, USSD, Bank Transfer, and M-Pesa.
 */
class PaystackAdapter {
  constructor() {
    this.name = 'paystack';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.baseUrl = 'https://api.paystack.co';
  }

  isConfigured() {
    return Boolean(this.secretKey && !this.secretKey.includes('your-'));
  }

  /**
   * Initialize transaction on Paystack
   */
  async initializePayment({ order, customer, currency = 'KES', returnUrl }) {
    const reference = `pstk_${order.id.toString().substring(0, 8)}_${Date.now()}`;
    let chargeCurrency = (currency || 'KES').toUpperCase();
    let amountInSubunits = Math.round(Number(order.totalPrice) * 100);

    if (!this.isConfigured()) {
      logger.info(
        { orderId: order.id, currency: chargeCurrency, reference },
        'Paystack initialized in development/mock mode'
      );
      return {
        gateway: 'paystack',
        reference,
        authorizationUrl: returnUrl
          ? `${returnUrl}?reference=${reference}&status=success`
          : `http://localhost:5000/api/payments/verify/paystack/${reference}`,
        accessCode: `mock_code_${reference}`,
        status: 'pending',
      };
    }

    try {
      let response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customer.email,
          amount: amountInSubunits,
          currency: chargeCurrency,
          reference,
          callback_url: returnUrl,
          metadata: {
            orderId: order.id.toString(),
            customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          },
        }),
      });

      let data = await response.json();

      // If merchant account doesn't support the requested currency (e.g. non-domestic), retry with merchant's primary domestic currency (KES)
      if (
        !data.status &&
        data.message?.toLowerCase().includes('currency not supported') &&
        chargeCurrency !== 'KES'
      ) {
        const amountUSD =
          order.totalPriceUSD ||
          (await currencyService.convertToUSD(order.totalPrice, chargeCurrency));
        const converted = await currencyService.convertPrice(amountUSD, 'KES');
        chargeCurrency = 'KES';
        amountInSubunits = Math.round(converted.amount * 100);

        response = await fetch(`${this.baseUrl}/transaction/initialize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customer.email,
            amount: amountInSubunits,
            currency: 'KES',
            reference,
            callback_url: returnUrl,
            metadata: {
              orderId: order.id.toString(),
              customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            },
          }),
        });
        data = await response.json();
      }

      if (!data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
      }

      return {
        gateway: 'paystack',
        reference: data.data.reference,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        status: 'pending',
        currency: chargeCurrency,
        amount: amountInSubunits / 100,
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Paystack initialization error');
      throw err;
    }
  }

  /**
   * Verify transaction status with Paystack
   */
  async verifyTransaction(reference) {
    if (!this.isConfigured() || reference.startsWith('mock_')) {
      return {
        success: true,
        reference,
        gateway: 'paystack',
        status: 'success',
        amount: null,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();
      if (!data.status) {
        return { success: false, message: data.message };
      }

      const isSuccess = data.data.status === 'success';
      return {
        success: isSuccess,
        reference,
        gateway: 'paystack',
        status: data.data.status,
        amount: data.data.amount / 100,
        orderId: data.data.metadata?.orderId,
      };
    } catch (err) {
      logger.error({ err: err.message, reference }, 'Paystack verification error');
      return { success: false, message: err.message };
    }
  }

  /**
   * Verify and parse Paystack webhook signature (HMAC-SHA512)
   * Enforces constant-time equality check (timingSafeEqual) to eliminate timing attacks.
   */
  verifyWebhook(rawBody, signature) {
    const payloadBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

    if (this.isConfigured()) {
      const signatureStr = String(signature || '').trim();
      if (!signatureStr) {
        throw new Error('Missing Paystack webhook signature');
      }

      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(payloadBuffer)
        .digest('hex');

      const hashBuf = Buffer.from(hash, 'utf8');
      const sigBuf = Buffer.from(signatureStr, 'utf8');

      if (hashBuf.length !== sigBuf.length || !crypto.timingSafeEqual(hashBuf, sigBuf)) {
        throw new Error('Invalid Paystack webhook signature');
      }
    }

    let payload;
    try {
      payload = Buffer.isBuffer(rawBody)
        ? JSON.parse(rawBody.toString('utf8'))
        : typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : rawBody;
    } catch {
      throw new Error('Invalid webhook JSON payload');
    }

    return {
      eventId: payload.data?.id?.toString() || payload.data?.reference,
      eventType: payload.event,
      data: payload.data,
      isSuccessful: payload.event === 'charge.success',
      orderId: payload.data?.metadata?.orderId,
      reference: payload.data?.reference,
    };
  }
}

module.exports = new PaystackAdapter();
