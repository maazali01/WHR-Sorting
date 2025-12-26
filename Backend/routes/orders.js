const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Log = require('../models/Log');
const User = require('../models/Users'); // ✅ Ensure User model is imported

// GET history orders (non-pending)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $not: { $regex: '^pending$', $options: 'i' } } })
      .populate('user', 'username email') // ✅ populate user fields
      .sort({ createdAt: -1 })
      .lean();
    
    // ✅ Debug log to see what's returned
    console.log('Sample order with user:', JSON.stringify(orders[0], null, 2));
    
    // ✅ Ensure items array exists for all orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: order.items || [],
      user: order.user || { username: 'Guest', email: '' }
    }));
    
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// GET pending orders - ONLY Pending status
router.get('/pending', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending orders', error: err.message });
  }
});

// DELETE: Remove an order by ID
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🗑️ Attempting to delete order:', orderId);
    
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    
    if (!deletedOrder) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // ✅ Restore inventory quantities when order is deleted
    const Product = require('../models/Products');
    for (const item of deletedOrder.items) {
      await Product.findByIdAndUpdate(
        item._id,
        { $inc: { quantity: item.quantity } }
      );
    }

    console.log('✅ Order deleted and inventory restored:', deletedOrder._id);

    // Log deletion
    try {
      const userId = req.user?.id || null;
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'admin') : 'admin',
        type: 'admin',
        action: 'DELETE_ORDER',
        details: { 
          orderId: deletedOrder._id, 
          total: deletedOrder.total,
          itemsCount: (deletedOrder.items || []).length 
        }
      });
    } catch (logErr) {
      console.error('Failed to write order deletion log:', logErr);
    }

    res.json({ message: 'Order deleted successfully', order: deletedOrder });
  } catch (err) {
    console.error('❌ Error deleting order:', err);
    res.status(500).json({ message: 'Error deleting order', error: err.message });
  }
});

// POST confirm order (keeps compatibility)
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    order.status = 'Confirmed';
    await order.save();

    // Log confirmation if possible
    try {
      const userId = req.user?.id || null;
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'admin') : 'admin',
        type: 'admin',
        action: 'CONFIRM_ORDER',
        details: { orderId: order._id, prevStatus, newStatus: order.status, total: order.total }
      });
    } catch (logErr) {
      console.error('Failed to write confirm order log:', logErr);
    }

    res.status(200).json({ message: 'Order confirmed', order });
  } catch (err) {
    res.status(500).json({ message: 'Error confirming order', error: err.message });
  }
});

// Send order to Webots
router.post("/send-to-webots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    // Forward to webots route
    const axios = require('axios');
    const token = req.headers.authorization;
    
    const response = await axios.post(
      `http://localhost:4000/webots/send-order/${id}`,
      { priority },
      { headers: { Authorization: token } }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Error forwarding to Webots:', err);
    res.status(500).json({ 
      success: false, 
      message: err.response?.data?.message || 'Failed to send order to Webots' 
    });
  }
});

// GET order by ID (detailed) - returns user and items
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Order id required' });

    // Populate user (username, email) and return full order document
    const order = await Order.findById(id)
      .populate('user', 'username email')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure fields exist
    order.items = Array.isArray(order.items) ? order.items : [];
    order.user = order.user || null;

    res.json(order);
  } catch (err) {
    console.error('Error fetching order by id:', err);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
});

module.exports = router;
