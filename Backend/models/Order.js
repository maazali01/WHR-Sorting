// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Product ID
  name: { type: String, default: 'Unknown' },
  category: String,                       // ✅ add category
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  imageUrl: String                       // ✅ add imageUrl field
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: {
    type: [orderItemSchema],
    default: [] // ✅ Set default empty array
  },
  total: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    // ✅ Added 'Processing' to enum
    enum: ['Pending', 'Processing', 'in transit', 'Confirmed', 'Completed', 'Failed'],
    default: 'Pending'
  },
  priority: {
    type: Number,
    enum: [0, 1], // 0 = normal, 1 = fast
    default: 0
  },
  crateNumber: {
    type: Number,
    min: 1,
    max: 3,
    default: null
  },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // associate order with user
}, { timestamps: true });

// ✅ Add indexes for faster queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });

module.exports = mongoose.model('Order', orderSchema);
