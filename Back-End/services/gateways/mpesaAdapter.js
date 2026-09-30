// services/gateways/mpesaAdapter.js
const logger = require('../../utils/logger');
const MpesaClient = require('./mpesaClient');

/**
 * Safaricom M-Pesa (Daraja API) STK Push Gateway Adapter
 * Enables East African shoppers to pay instantly via Mobile Money (SIM Toolkit push).
 */
class MpesaAdapter extends MpesaClient {
  constructor() {
    super();
    this.name = 'mpesa';
  }

  isMockMode() {
    return process.env.NODE_ENV === 'test' && process.env.ALLOW_MOCK_PAYMENTS === 'true';
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

    if (this.isMockMode()) {
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

    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
    }

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
    if (this.isMockMode() && checkoutRequestId.startsWith('mock_ws_CO_')) {
      return {
        success: true,
        reference: checkoutRequestId,
        gateway: 'mpesa',
        status: 'completed',
        receiptNumber: `NL${Date.now().toString().substring(5)}`,
      };
    }

    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
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

      if (data.ResultCode === '0' || data.ResultCode === 0) {
        return {
          success: true,
          reference: checkoutRequestId,
          gateway: 'mpesa',
          status: 'completed',
          resultDesc: data.ResultDesc,
        };
      }

      if (data.ResultCode === '1032') {
        return {
          success: false,
          reference: checkoutRequestId,
          gateway: 'mpesa',
          status: 'cancelled',
          message: 'The M-Pesa PIN prompt was cancelled by the customer.',
        };
      }

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
   * Parse & validate M-Pesa Daraja callback webhook payload
   */
  verifyWebhook(rawPayload) {
    let payload;
    try {
      if (Buffer.isBuffer(rawPayload)) {
        payload = JSON.parse(rawPayload.toString('utf8'));
      } else if (typeof rawPayload === 'string') {
        payload = JSON.parse(rawPayload);
      } else {
        payload = rawPayload || {};
      }
    } catch {
      throw new Error('Invalid M-Pesa callback JSON payload');
    }

    const callback = payload.Body?.stkCallback || payload;
    if (!callback || typeof callback !== 'object') {
      throw new Error('Malformed M-Pesa callback payload structure');
    }

    const resultCode = callback.ResultCode;
    const isSuccess = resultCode === 0;

    let receiptNumber = null;
    let amount = null;

    if (callback.CallbackMetadata?.Item && Array.isArray(callback.CallbackMetadata.Item)) {
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
