const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    createdAt: userDoc.createdAt,
  };
}

function handleAuthError(res, error) {
  if (error.name === 'ValidationError') {
    const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid user data';

    return res.status(400).json({
      status: 'error',
      message: firstMessage,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: error.message,
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'Email is already registered',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user._id);

    return res.status(201).json({
      status: 'success',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      status: 'success',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function me(req, res) {
  return res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
}

async function updateUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      // Check if email changed and if it already exists in another user
      if (req.body.email && req.body.email.toLowerCase().trim() !== req.user.email) {
        const existingEmail = await User.findOne({ email: req.body.email.toLowerCase().trim() });
        if (existingEmail) {
           return res.status(409).json({ status: 'error', message: 'Email is already taken by another account.' });
        }
        user.email = req.body.email.toLowerCase().trim();
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      return res.status(200).json({
        status: 'success',
        user: sanitizeUser(updatedUser),
      });
    } else {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    return handleAuthError(res, error);
  }
}

module.exports = {
  register,
  login,
  me,
  updateUserProfile,
};
