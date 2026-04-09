// controllers/stripeController.js
const Order = require('../models/Order');
const { createPaymentIntent, constructWebhookEvent } = require('../services/stripeService');
const { buildVerifiedOrderItems, calculateOrderTotals } = require('../services/orderService');

// @desc    Validate cart + Create Order + Create Stripe Payment Intent
// @route   POST /api/stripe/create-payment-intent
// @access  Public (Guest) or Private (User)
const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    // 1. Basic validation
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    const requiredAddressFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country'];
    const missingFields = requiredAddressFields.filter((field) => !shippingAddress?.[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Shipping address is missing: ${missingFields.join(', ')}`,
      });
    }

    // 2. Verify all products and calculate secure server-side prices
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

    // 3. Create the Order in the DB (isPaid defaults to false)
    // We create the order first so we can attach its ID to the Stripe intent
    const order = new Order({
      orderItems: verifiedOrderItems,
      user: req.user ? req.user._id : null,
      shippingAddress,
      paymentMethod: 'Stripe', // fixed to Stripe
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // 4. Create Stripe Payment Intent (convert dollars strictly to whole cents)
    const amountInCents = Math.round(totalPrice * 100);
    const paymentIntent = await createPaymentIntent(amountInCents, {
      orderId: createdOrder._id.toString(),
    });

    // 5. Update Order with the Stripe Intent ID
    createdOrder.stripePaymentIntentId = paymentIntent.id;
    await createdOrder.save();

    // 6. Return the client_secret so the frontend can display the payment UI
    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      orderId: createdOrder._id,
    });
  } catch (error) {
    console.error('createStripePaymentIntent error:', error);
    
    if (error.name === 'CastError' || error.message?.includes('Cast to ObjectId failed')) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID detected.' });
    }
    
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
    // req.body must be the RAW buffer here for signature verification
    event = constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    // Respond strictly with 400 on signature failure
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // We appended orderId to metadata in createStripePaymentIntent
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      try {
        const order = await Order.findById(orderId);
        
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: paymentIntent.created,
            email_address: paymentIntent.receipt_email || '', // sometimes empty
          };

          await order.save();
          console.log(`Payment confirmed via webhook! Order ${orderId} marked as paid.`);
        }
      } catch (err) {
        console.error('Failed to update order status on webhook success:', err);
      }
    }
  }

  // Must quickly return 200 to Stripe to acknowledge receipt so they don't resend
  res.status(200).json({ received: true });
};

module.exports = {
  createStripePaymentIntent,
  handleStripeWebhook,
};
