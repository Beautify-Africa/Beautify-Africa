// services/gateways/mpesaAdapter.js
const logger = require('../../utils/logger');

/**
 * Safaricom M-Pesa (Daraja API) STK Push Gateway Adapter
 * Enables East African shoppers to pay instantly via Mobile Money (SIM Toolkit push).
 */
class MpesaAdapter {
  constructor() {
    this.name = 'mpesa';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.passkey =
      process.env.MPESA_PASSKEY ||
      'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.env = process.env.MPESA_ENV || 'sandbox';
    this.callbackUrl =
      process.env.MPESA_CALLBACK_URL ||
      'https://beautifyafrica.app/api/payments/webhook/mpesa';

    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  getBaseUrl() {
    return this.env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  isConfigured() {
    return Boolean(
      this.consumerKey &&
        this.consumerSecret &&
        !this.consumerKey.includes('your-') &&
        !this.consumerSecret.includes('your-')
    );
  }

  /**
   * Fetch OAuth access token from Safaricom Daraja API
   */
  async getOAuthToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const auth = Buffer.from(
      `${this.consumerKey.trim()}:${this.consumerSecret.trim()}`
    ).toString('base64');

    const response = await fetch(
      `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to obtain M-Pesa OAuth token: ${errText}`);
    }

    const data = await response.json();
    this.cachedToken = data.access_token;
    // Expire 60 seconds before reported lifetime
    const expiresIn = Number(data.expires_in) || 3599;
    this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

    return this.cachedToken;
  }

  /**
   * Generates timestamp formatted as YYYYMMDDHHmmss
   */
  getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  /**
   * Generates base64-encoded Daraja password
   */
  getPassword(timestamp) {
    return Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`
    ).toString('base64');
  }

  /**
   * Normalize Kenyan phone number to 254XXXXXXXXX format
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.substring(1)}`;
    }
    if (digits.length === 9) {
      return `254${digits}`;
    }
    return digits;
  }

  /**
   * Initiate M-Pesa STK Push prompt directly to customer's handset
   */
  async initializePayment({ order, phone, currency = 'KES' }) {
    const formattedPhone = this.normalizePhoneNumber(phone);
    if (!formattedPhone) {
      throw new Error(
        'Please provide a valid M-Pesa phone number (e.g. 0712345678 or +254712345678)'
      );
    }

    const amount = Math.max(1, Math.round(Number(order.totalPrice)));

    // If Daraja credentials are not yet added to .env, run in simulation mode
    if (!this.isConfigured()) {
      const checkoutRequestId = `mock_ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      logger.info(
        { orderId: order.id, phone: formattedPhone, amount, checkoutRequestId },
        'M-Pesa STK Push dispatched in simulation mode (no Daraja credentials in .env)'
      );

      return {
        gateway: 'mpesa',
        reference: checkoutRequestId,
        checkoutRequestId,
        phone: formattedPhone,
        amount,
        currency,
        status: 'pending_pin',
        customerMessage: `An M-Pesa prompt for KSh ${amount.toLocaleString()} has been sent to +${formattedPhone}. Please check your phone and enter your M-Pesa PIN.`,
      };
    }

    // Live Daraja STK Push call
    try {
      const token = await this.getOAuthToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);

      const orderRef = `Order_${String(order.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: orderRef,
        TransactionDesc: `Beautify Africa Order ${String(order.id).slice(0, 8)}`,
      };

      const response = await fetch(
        `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.ResponseCode !== '0') {
        throw new Error(
          data.ResponseDescription ||
            data.errorMessage ||
            'Failed to initiate M-Pesa STK push prompt.'
        );
      }

      logger.info(
        {
          orderId: order.id,
          checkoutRequestId: data.CheckoutRequestID,
          phone: formattedPhone,
        },
        'Real M-Pesa STK Push successfully dispatched to handset'
      );

      return {
        gateway: 'mpesa',
        reference: data.CheckoutRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        phone: formattedPhone,
        amount,
        currency,
        status: 'pending_pin',
        customerMessage:
          data.CustomerMessage ||
          `An M-Pesa prompt for KSh ${amount.toLocaleString()} has been sent to +${formattedPhone}. Please check your phone and enter your PIN.`,
      };
    } catch (err) {
      logger.error({ err: err.message }, 'M-Pesa Daraja STK push error');
      throw err;
    }
  }

  /**
   * Query M-Pesa STK Push transaction status from Daraja
   */
  async verifyTransaction(checkoutRequestId) {
    if (!this.isConfigured() || checkoutRequestId.startsWith('mock_ws_CO_')) {
      return {
        success: true,
        reference: checkoutRequestId,
        gateway: 'mpesa',
        status: 'completed',
        receiptNumber: `NL${Date.now().toString().substring(5)}`,
      };
    }

    try {
      const token = await this.getOAuthToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);

      const response = await fetch(
        `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
          }),
        }
      );

      const data = await response.json();

      // ResultCode 0 indicates payment was successful and PIN was entered
      if (data.ResultCode === '0' || data.ResultCode === 0) {
        return {
          success: true,
          reference: checkoutRequestId,
          gateway: 'mpesa',
          status: 'completed',
          resultDesc: data.ResultDesc,
        };
      }

      // User cancelled PIN prompt on phone
      if (data.ResultCode === '1032') {
        return {
          success: false,
          reference: checkoutRequestId,
          gateway: 'mpesa',
          status: 'cancelled',
          message: 'The M-Pesa PIN prompt was cancelled by the customer.',
        };
      }

      // Prompt timed out without PIN
      if (data.ResultCode === '1037') {
        return {
          success: false,
          reference: checkoutRequestId,
          gateway: 'mpesa',
          status: 'timeout',
          message: 'The M-Pesa PIN prompt timed out. Please try again.',
        };
      }

      return {
        success: false,
        reference: checkoutRequestId,
        gateway: 'mpesa',
        status: 'pending_pin',
        message: data.ResultDesc || 'Waiting for customer PIN entry.',
      };
    } catch (err) {
      logger.warn(
        { err: err.message, checkoutRequestId },
        'M-Pesa STK query poll error'
      );
      return {
        success: false,
        reference: checkoutRequestId,
        gateway: 'mpesa',
        status: 'pending_pin',
      };
    }
  }

  /**
   * Parse M-Pesa Daraja callback webhook payload
   */
  verifyWebhook(payload) {
    const callback = payload.Body?.stkCallback || payload;
    const resultCode = callback.ResultCode;
    const isSuccess = resultCode === 0;

    let receiptNumber = null;
    let amount = null;

    if (callback.CallbackMetadata?.Item) {
      for (const item of callback.CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') receiptNumber = item.Value;
        if (item.Name === 'Amount') amount = item.Value;
      }
    }

    return {
      eventId: callback.CheckoutRequestID || `mpesa_${Date.now()}`,
      eventType: 'mpesa.stk.callback',
      data: callback,
      isSuccessful: isSuccess,
      reference: callback.CheckoutRequestID,
      receiptNumber,
      amount,
      resultDesc: callback.ResultDesc,
    };
  }
}

module.exports = new MpesaAdapter();
