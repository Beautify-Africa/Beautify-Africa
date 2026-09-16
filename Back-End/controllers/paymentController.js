// controllers/paymentController.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
const { buildVerifiedOrderItems, calculateOrderTotals } = require('../services/orderService');
const paymentGatewayService = require('../services/paymentGatewayService');
const currencyService = require('../services/currencyService');
const logger = require('../utils/logger');

/**
 * Initialize payment across Stripe, Paystack, or M-Pesa.
 * Can accept either an existing orderId or (orderItems + shippingAddress) to create an order atomically.
 * @route POST /api/payments/initialize
 */
const initializePayment = async (req, res) => {
  try {
    const {
      orderId,
      orderItems,
      shippingAddress,
      gateway = 'stripe',
      currency = 'USD',
      phone,
      returnUrl,
    } = req.body;

    let targetOrder = null;

    if (orderId) {
      targetOrder = await Order.findByPk(orderId, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: OrderShippingAddress, as: 'shippingAddress' },
        ],
      });

      if (!targetOrder) {
        return res.status(404).json({ status: 'error', message: `Order ${orderId} not found` });
      }
    } else {
      // Validate order items and shipping address if creating order on initialize
      if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No order items provided' });
      }

      const requiredAddressFields = [
        'firstName',
        'lastName',
        'email',
        'address',
        'city',
        'zip',
        'country',
      ];
      const missingFields = requiredAddressFields.filter((field) => !shippingAddress?.[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Shipping address is missing: ${missingFields.join(', ')}`,
        });
      }

      const {
        verifiedOrderItems,
        itemsPrice,
        error: verificationError,
      } = await buildVerifiedOrderItems(orderItems, req.user?._id);

      if (verificationError) {
        return res
          .status(verificationError.statusCode)
          .json({ status: 'error', message: verificationError.message });
      }

      const { shippingPrice, taxPrice, totalPrice } = calculateOrderTotals(itemsPrice);

      // Get exchange rate if currency is specified
      const rates = await currencyService.getExchangeRates();
      const currUpper = String(currency || 'USD').toUpperCase();
      const currencyMeta = rates[currUpper] || rates.USD;
      const exchangeRate = currencyMeta.rate || 1.0;

      // Atomically create Order, items, and address
      targetOrder = await sequelize.transaction(async (t) => {
        const newOrder = await Order.create(
          {
            userId: req.user ? req.user.id || req.user._id : null,
            paymentMethod:
              gateway === 'mpesa' ? 'M-Pesa' : gateway === 'paystack' ? 'Paystack' : 'Stripe',
            paymentGateway: gateway.toLowerCase(),
            currency: currUpper,
            exchangeRate,
            fulfillmentStatus: 'pending_payment',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
          },
          { transaction: t }
        );

        await OrderItem.bulkCreate(
          verifiedOrderItems.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId || null,
            sku: item.sku || null,
            variantName: item.variantName || null,
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: item.price,
          })),
          { transaction: t }
        );

        await OrderShippingAddress.create(
          {
            orderId: newOrder.id,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            email: shippingAddress.email,
            address: shippingAddress.address,
            city: shippingAddress.city,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
          },
          { transaction: t }
        );

        return newOrder;
      });
    }

    const customer = {
      email:
        shippingAddress?.email ||
        targetOrder.shippingAddress?.email ||
        req.user?.email ||
        'guest@beautifyafrica.com',
      firstName: shippingAddress?.firstName || targetOrder.shippingAddress?.firstName || '',
      lastName: shippingAddress?.lastName || targetOrder.shippingAddress?.lastName || '',
      phone: phone || shippingAddress?.phone || targetOrder.shippingAddress?.phone,
    };

    const paymentResult = await paymentGatewayService.initializePayment({
      gateway,
      order: targetOrder,
      customer,
      currency: currency || targetOrder.currency || 'USD',
      phone,
      returnUrl,
    });

    res.status(200).json({
      status: 'success',
      orderId: targetOrder.id,
      ...paymentResult,
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to initialize payment');
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment initialization failed. Please try again.',
    });
  }
};

/**
 * Verify payment status (e.g. from Paystack redirect callback or M-Pesa polling)
 * @route GET /api/payments/verify/:gateway/:reference
 */
const verifyPayment = async (req, res) => {
  try {
    const { gateway, reference } = req.params;
    const { orderId } = req.query;

    const result = await paymentGatewayService.verifyPayment({
      gateway,
      reference,
      orderId,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error({ err: error.message }, 'Payment verification failed');
    res.status(500).json({ status: 'error', message: error.message || 'Verification failed' });
  }
};

/**
 * Universal webhook endpoint for payment gateways
 * @route POST /api/payments/webhook/:gateway
 */
const handleWebhook = async (req, res) => {
  const { gateway } = req.params;
  const signature =
    req.headers['x-paystack-signature'] ||
    req.headers['stripe-signature'] ||
    req.headers['x-mpesa-signature'] ||
    '';

  try {
    const parsed = await paymentGatewayService.handleWebhook({
      gateway,
      rawBody: req.body,
      signature,
      headers: req.headers,
    });

    res.status(200).json({ received: true, event: parsed.eventType || 'webhook_received' });
  } catch (error) {
    logger.error({ gateway, err: error.message }, 'Webhook handler error');
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * Get available payment gateways
 * @route GET /api/payments/gateways
 */
const getGateways = async (req, res) => {
  try {
    const gateways = paymentGatewayService.getSupportedGateways();
    res.status(200).json({ status: 'success', data: gateways });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get live exchange rates & currency metadata
 * @route GET /api/currency/rates
 */
const getCurrencyRates = async (req, res) => {
  try {
    const rates = await currencyService.getExchangeRates();
    res.status(200).json({ status: 'success', data: rates });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Convert price endpoint
 * @route GET /api/currency/convert
 */
const convertPrice = async (req, res) => {
  try {
    const { amount, to = 'USD' } = req.query;
    const result = await currencyService.convertPrice(amount, to);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getGateways,
  getCurrencyRates,
  convertPrice,
};
