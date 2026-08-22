// controllers/orderController.js
const { Order, OrderItem, OrderShippingAddress } = require('../models/Order');
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

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    const requiredAddressFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zip', 'country'];
    const missingFields = requiredAddressFields.filter((field) => !shippingAddress?.[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ status: 'error', message: `Shipping address is missing: ${missingFields.join(', ')}` });
    }

    if (!paymentMethod) {
      return res.status(400).json({ status: 'error', message: 'Payment method is required' });
    }

    const { verifiedOrderItems, itemsPrice, error: verificationError } = await buildVerifiedOrderItems(
      orderItems,
      req.user?._id
    );

    if (verificationError) {
      return res.status(verificationError.statusCode).json({ status: 'error', message: verificationError.message });
    }

    const { shippingPrice, taxPrice, totalPrice } = calculateOrderTotals(itemsPrice);

    const order = await Order.create({
      userId: req.user ? (req.user.id || req.user._id) : null,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // Create order items
    await OrderItem.bulkCreate(
      verifiedOrderItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
      }))
    );

    // Create shipping address
    await OrderShippingAddress.create({
      orderId: order.id,
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      email: shippingAddress.email,
      address: shippingAddress.address,
      city: shippingAddress.city,
      zip: shippingAddress.zip,
      country: shippingAddress.country,
    });

    // Re-fetch with associations
    const { Order: OrderModel, OrderItem: OrderItemModel, OrderShippingAddress: ShippingModel } = require('../models/Order');
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: OrderShippingAddress, as: 'shippingAddress' },
      ],
    });

    res.status(201).json({ status: 'success', data: createdOrder });
  } catch (error) {
    console.error('addOrderItems error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid order data';
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

    const userId = req.user.id || req.user._id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: OrderShippingAddress, as: 'shippingAddress' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred while fetching your orders.' });
  }
};

module.exports = { addOrderItems, getMyOrders };
