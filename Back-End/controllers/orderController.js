const Order = require('../models/Order');
const {
  buildVerifiedOrderItems,
  calculateOrderTotals,
} = require('../services/orderService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest checkout) or Private (User)
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    // Validate order items
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    // Validate shipping address — all required fields must be present
    const requiredAddressFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country'];
    const missingFields = requiredAddressFields.filter((field) => !shippingAddress?.[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Shipping address is missing: ${missingFields.join(', ')}`,
      });
    }

    // Validate payment method
    if (!paymentMethod) {
      return res.status(400).json({ status: 'error', message: 'Payment method is required' });
    }

    // Verify all products exist in DB and are in stock — server-side price is used, not client price
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

    const order = new Order({
      orderItems: verifiedOrderItems,
      user: req.user ? req.user._id : null,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      // isPaid and paidAt are intentionally omitted here.
      // They will be set to true by the Stripe webhook handler
      // (POST /api/stripe/webhook) after payment is confirmed server-side.
    });

    const createdOrder = await order.save();

    res.status(201).json({ status: 'success', data: createdOrder });
  } catch (error) {
    console.error('addOrderItems error:', error);

    if (error.name === 'CastError' || error.message?.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID detected. Please clear your cart and try again.',
      });
    }

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid order data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while placing your order.' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while fetching your orders.' });
  }
};

module.exports = { addOrderItems, getMyOrders };
