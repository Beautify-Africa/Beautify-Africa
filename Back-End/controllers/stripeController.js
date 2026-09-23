// controllers/stripeController.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
const WebhookEvent = require('../models/WebhookEvent');
const { createPaymentIntent, constructWebhookEvent } = require('../services/stripeService');
const { buildVerifiedOrderItems, calculateOrderTotals } = require('../services/orderService');
const { processPurchase } = require('../services/inventoryService');

// @desc    Validate cart + Create Order + Create Stripe Payment Intent
// @route   POST /api/stripe/create-payment-intent
// @access  Public (Guest) or Private (User)
const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
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

    // Atomically create Order, items, and address inside a transaction
    const order = await sequelize.transaction(async (t) => {
      const newOrder = await Order.create(
        {
          userId: req.user ? req.user.id || req.user._id : null,
          paymentMethod: 'Stripe',
          fulfillmentStatus: 'pending_payment',
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
        },
        { transaction: t }
      );

      // Create order items with variant tracking
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
    const paymentIntent = await createPaymentIntent(amountInCents, {
      orderId: order.id.toString(),
    });

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

  // Enforce strict event idempotency
  if (event.id) {
    try {
      const existing = await WebhookEvent.findByPk(event.id);
      if (existing && existing.status === 'processed') {
        console.log(`Stripe webhook event ${event.id} already processed. Skipping duplicate.`);
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      await WebhookEvent.findOrCreate({
        where: { id: event.id },
        defaults: {
          type: event.type,
          status: 'pending',
          payload: event,
        },
      });
    } catch (idempotencyErr) {
      console.warn('Webhook idempotency lookup warning:', idempotencyErr.message);
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        await sequelize.transaction(async (t) => {
          const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'orderItems' }],
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (order && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.fulfillmentStatus = 'processing';
            order.paymentResultId = paymentIntent.id;
            order.paymentResultStatus = paymentIntent.status;
            order.paymentResultUpdateTime = String(paymentIntent.created);
            order.paymentResultEmail = paymentIntent.receipt_email || '';
            await order.save({ transaction: t });

            // Atomically deduct inventory with ledger recording
            for (const item of order.orderItems || []) {
              if (item.productId) {
                await processPurchase(
                  item.productId,
                  item.variantId || null,
                  item.qty,
                  order.id,
                  order.userId,
                  { transaction: t }
                );
              }
            }

            console.log(
              `Payment confirmed via webhook! Order ${orderId} marked as paid and inventory deducted.`
            );
          }

          if (event.id) {
            await WebhookEvent.update(
              { status: 'processed', processedAt: new Date() },
              { where: { id: event.id }, transaction: t }
            );
          }
        });
      } catch (err) {
        console.error('Failed to process payment_intent.succeeded webhook transaction:', err);
        if (event.id) {
          await WebhookEvent.update(
            { status: 'failed', errorMessage: err.message },
            { where: { id: event.id } }
          ).catch(() => {});
        }
        return res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
      }
    }
  }

  res.status(200).json({ received: true });
};

module.exports = { createStripePaymentIntent, handleStripeWebhook };
