// controllers/orderController.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('../models/Order');
const { buildVerifiedOrderItems, calculateOrderTotals } = require('../services/orderService');
const { processPurchase } = require('../services/inventoryService');
const { cancelOrder } = require('./orderCancellationController');
const { invalidateCartCache } = require('./cartController');
const { bumpProductCacheVersion } = require('./productController.cache');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest checkout) or Private (User)
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

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

    if (!paymentMethod) {
      return res.status(400).json({ status: 'error', message: 'Payment method is required' });
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

    // Atomically create order, items, and shipping address inside a transaction
    const createdOrder = await sequelize.transaction(async (t) => {
      const order = await Order.create(
        {
          userId: req.user ? req.user.id || req.user._id : null,
          paymentMethod,
          fulfillmentStatus: paymentMethod === 'Stripe' ? 'pending_payment' : 'processing',
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
          orderId: order.id,
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
          orderId: order.id,
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

      // For immediate non-Stripe payments (e.g. Cash on Delivery), deduct stock immediately
      if (paymentMethod !== 'Stripe') {
        for (const item of verifiedOrderItems) {
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
      }

      // Re-fetch with associations inside transaction
      return Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: OrderShippingAddress, as: 'shippingAddress' },
        ],
        transaction: t,
      });
    });

    // Invalidate user cart in Redis and bump product catalog version
    const authUserId = req.user ? req.user.id || req.user._id : null;
    if (authUserId) {
      invalidateCartCache(authUserId).catch(() => {});
    }
    bumpProductCacheVersion().catch(() => {});

    res.status(201).json({ status: 'success', data: createdOrder });
  } catch (error) {
    console.error('addOrderItems error:', error);

    if (error.name === 'SequelizeValidationError') {
      const firstMessage = error.errors?.[0]?.message || 'Invalid order data';
      return res.status(400).json({ status: 'error', message: firstMessage });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'An unexpected error occurred while placing your order.',
    });
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: OrderShippingAddress, as: 'shippingAddress' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;

    res.status(200).json({
      status: 'success',
      count: orders.length,
      totalCount: count,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
      data: orders,
    });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching your orders.',
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or administrator)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: OrderShippingAddress, as: 'shippingAddress' },
        { model: AdminTimelineEntry, as: 'adminTimeline' },
      ],
    });

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const isOwner = order.userId === (req.user.id || req.user._id);
    const isAdmin = Boolean(req.user.isAdmin);
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Not authorized to view this order' });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('getOrderById error:', error);
    res
      .status(500)
      .json({ status: 'error', message: 'An unexpected error occurred while fetching the order.' });
  }
};

module.exports = { addOrderItems, getMyOrders, getOrderById, cancelOrder };
