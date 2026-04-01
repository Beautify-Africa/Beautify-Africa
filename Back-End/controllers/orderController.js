// controllers/orderController.js
const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest checkout) or Private (User)
const addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    const order = new Order({
      orderItems: orderItems.map((item) => ({
        ...item,
        product: item.product || item.id, // accommodate frontend data structures
      })),
      user: req.user ? req.user._id : null, // If authenticated, attach user ID
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      // Temporarily mark as paid since frontend mocks payment purely via client inputs
      isPaid: true,
      paidAt: Date.now(),
    });

    const createdOrder = await order.save();

    res.status(201).json({ status: 'success', data: createdOrder });
  } catch (error) {
    console.error(`Error adding order: ${error}`);
    // If it's a CastError, the user probably has old non-MongoDB products in their cart
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({ status: 'error', message: 'Cart contains invalid product IDs. Please clear your cart and add items again.' });
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
