const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// POST confirm order
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'Confirmed';
    await order.save();

    // Placeholder: send order to Webots
    // await axios.post('http://localhost:5000/webots/execute', order);

    res.status(200).json({ message: 'Order confirmed', order });
  } catch (err) {
    res.status(500).json({ message: 'Error confirming order', error: err.message });
  }
});

module.exports = router;
