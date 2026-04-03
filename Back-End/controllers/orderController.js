const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest checkout) or Private (User)
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order items' });
    }

    // Zero-Trust Pricing: Retrieve canonical product data from MongoDB
    const verifiedOrderItems = [];
    let itemsPrice = 0;

    for (const item of orderItems) {
      const productId = item.product || item.id;
      const dbProduct = await Product.findById(productId);

      if (!dbProduct) {
        return res.status(404).json({ status: 'error', message: `Product not found: ${item.name}` });
      }

      if (!dbProduct.inStock) {
        return res.status(400).json({ status: 'error', message: `Product is completely out of stock: ${dbProduct.name}` });
      }

      // Calculate strictly based on DB pricing
      const itemTotal = dbProduct.price * item.qty;
      itemsPrice += itemTotal;

      verifiedOrderItems.push({
        name: dbProduct.name,
        qty: item.qty,
        image: dbProduct.image,
        price: dbProduct.price,
        product: dbProduct._id,
      });
    }

    // Backend securely builds final totals decoupled from frontend payload
    const shippingPrice = itemsPrice > 100 ? 0 : 15;
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

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
