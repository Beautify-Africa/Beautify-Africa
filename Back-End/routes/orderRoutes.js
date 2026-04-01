// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// Optional protect middleware: Check for valid token and attach user if present, but don't reject guests
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Failing to parse the token just means we continue as guest
  }
  next();
};

router.post('/', optionalProtect, addOrderItems);
router.get('/myorders', protect, getMyOrders);

module.exports = router;
