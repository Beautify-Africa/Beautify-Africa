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

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    const {
      verifiedOrderItems,
      itemsPrice,
      error: verificationError,
    } = await buildVerifiedOrderItems(orderItems);

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
      isPaid: true,
      paidAt: Date.now(),
    });

    const createdOrder = await order.save();

    res.status(201).json({ status: 'success', data: createdOrder });
  } catch (error) {
    console.error(`Error adding order: ${error}`);
    // Handle invalid incoming Object IDs securely
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID detected. Please clear cart and try again.' });
    }
    res.status(500).json({ status: 'error', message: error.message || 'Server error adding order' });
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
    console.error(`Error fetching orders: ${error}`);
    res.status(500).json({ status: 'error', message: 'Server error fetching orders' });
  }
};

module.exports = { addOrderItems, getMyOrders };
