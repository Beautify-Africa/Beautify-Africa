// services/gateways/mpesaClient.js

class MpesaClient {
  constructor() {
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
    const expiresIn = Number(data.expires_in) || 3599;
    this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

    return this.cachedToken;
  }

  getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  getPassword(timestamp) {
    return Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`
    ).toString('base64');
  }

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
}

module.exports = MpesaClient;
