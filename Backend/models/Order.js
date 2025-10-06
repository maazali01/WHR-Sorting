// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Product ID
  name: String,
  category: String,                       // ✅ add category
  price: Number,
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: {
    type: [orderItemSchema],
    required: true
  },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed'],
    default: 'Pending'
  },
  date: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
