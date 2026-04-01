// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  variant: { type: String },
  quantity: { type: Number, required: true, default: 1, min: 1 },
});

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // A user should only have 1 active cart
    },
    cartItems: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
