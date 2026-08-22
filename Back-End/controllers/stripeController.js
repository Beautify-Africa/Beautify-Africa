// controllers/stripeController.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
const { createPaymentIntent, constructWebhookEvent } = require('../services/stripeService');
const { buildVerifiedOrderItems, calculateOrderTotals } = require('../services/orderService');

// @desc    Validate cart + Create Order + Create Stripe Payment Intent
// @route   POST /api/stripe/create-payment-intent
// @access  Public (Guest) or Private (User)
const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    const requiredAddressFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country'];
    const missingFields = requiredAddressFields.filter((field) => !shippingAddress?.[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ status: 'error', message: `Shipping address is missing: ${missingFields.join(', ')}` });
    }

    const { verifiedOrderItems, itemsPrice, error: verificationError } = await buildVerifiedOrderItems(
      orderItems,
      req.user?._id
    );

    if (verificationError) {
      return res.status(verificationError.statusCode).json({ status: 'error', message: verificationError.message });
    }

    const { shippingPrice, taxPrice, totalPrice } = calculateOrderTotals(itemsPrice);

    // Atomically create Order, items, and address inside a transaction
    const order = await sequelize.transaction(async (t) => {
      const newOrder = await Order.create(
        {
          userId: req.user ? (req.user.id || req.user._id) : null,
          paymentMethod: 'Stripe',
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
        },
        { transaction: t }
      );

      // Create order items
      await OrderItem.bulkCreate(
        verifiedOrderItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
        })),
        { transaction: t }
      );

      // Create shipping address
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

    // Create Stripe Payment Intent
    const amountInCents = Math.round(totalPrice * 100);
    const paymentIntent = await createPaymentIntent(amountInCents, { orderId: order.id.toString() });

    // Update Order with Stripe Intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    console.error('createStripePaymentIntent error:', error);
    res.status(500).json({ status: 'error', message: 'Payment setup failed. Please try again.' });
  }
};

// @desc    Listen for Webhooks from Stripe (e.g. payment_intent.succeeded)
// @route   POST /api/stripe/webhook
// @access  Public (Signed by Stripe Secret)
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      try {
        const order = await Order.findByPk(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResultId = paymentIntent.id;
          order.paymentResultStatus = paymentIntent.status;
          order.paymentResultUpdateTime = String(paymentIntent.created);
          order.paymentResultEmail = paymentIntent.receipt_email || '';
          await order.save();
          console.log(`Payment confirmed via webhook! Order ${orderId} marked as paid.`);
        }
      } catch (err) {
        console.error('Failed to update order status on webhook success:', err);
      }
    }
  }

  res.status(200).json({ received: true });
};

module.exports = { createStripePaymentIntent, handleStripeWebhook };
