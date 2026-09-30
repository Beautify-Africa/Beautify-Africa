// controllers/orderCancellationController.js
const { sequelize } = require('../config/db');
const { Order, OrderItem, OrderShippingAddress, AdminTimelineEntry } = require('../models/Order');
const { processReturn } = require('../services/inventoryService');

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'orderItems' }],
    });

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const isOwner = order.userId === (req.user.id || req.user._id);
    const isAdmin = Boolean(req.user.isAdmin);

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Not authorized to cancel this order' });
    }

    if (['delivered', 'cancelled', 'refunded'].includes(order.fulfillmentStatus)) {
      return res.status(400).json({
        status: 'error',
        message: `Order cannot be cancelled in status: ${order.fulfillmentStatus}`,
      });
    }

    await sequelize.transaction(async (t) => {
      const lockedOrder = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'orderItems' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (lockedOrder.isPaid || lockedOrder.paymentMethod !== 'Stripe') {
        for (const item of lockedOrder.orderItems || []) {
          if (item.productId) {
            await processReturn(
              item.productId,
              item.variantId || null,
              item.qty,
              lockedOrder.id,
              reason,
              req.user?.id || req.user?._id,
              { transaction: t }
            );
          }
        }
      }

      lockedOrder.fulfillmentStatus = 'cancelled';
      await lockedOrder.save({ transaction: t });

      await AdminTimelineEntry.create(
        {
          orderId: lockedOrder.id,
          type: 'action',
          action: 'Order Cancelled',
          note: reason,
          adminName: isAdmin ? req.user.name || 'Admin' : 'Customer',
          adminEmail: req.user.email || '',
        },
        { transaction: t }
      );
    });

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: OrderShippingAddress, as: 'shippingAddress' },
        { model: AdminTimelineEntry, as: 'adminTimeline' },
      ],
    });

    res.status(200).json({ status: 'success', data: updatedOrder });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to cancel order.' });
  }
};

module.exports = { cancelOrder };
