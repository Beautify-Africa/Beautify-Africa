// models/Newsletter.js
const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unsubscribeToken: {
      type: String,
      default: null,
      select: false,
    },
    unsubscribeTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Speeds up unsubscribe token confirmation queries.
newsletterSchema.index(
  { unsubscribeToken: 1, unsubscribeTokenExpires: 1 },
  {
    partialFilterExpression: { unsubscribeToken: { $type: 'string' } },
  }
);

module.exports = mongoose.model('Newsletter', newsletterSchema);
