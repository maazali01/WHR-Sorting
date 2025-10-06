// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Order = require('../models/Order');
const User = require('../models/Users');

// 📊 Dashboard Analytics
router.get('/analytics', async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const activeUsers = await User.countDocuments({ role: 'user' });

    // Total revenue
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const revenue = revenueAgg.length ? revenueAgg[0].totalRevenue : 0;

    // ✅ Revenue trend last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const revTrendAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          value: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // fill in missing days
    const revenueTrend = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date();
      dayDate.setDate(now.getDate() - 6 + i);
      const key = dayDate.toISOString().slice(0, 10);
      const found = revTrendAgg.find(d => d._id === key);
      revenueTrend.push({ day: key, value: found ? found.value : 0 });
    }

    // ✅ Orders by category
    const ordersByCategoryAgg = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          count: { $sum: '$items.quantity' }
        }
      }
    ]);
    const ordersByCategory = {};
    ordersByCategoryAgg.forEach(o => {
      ordersByCategory[o._id || 'Uncategorized'] = o.count;
    });

    // ✅ Products by category
    const productsByCategoryAgg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const productsByCategory = {};
    productsByCategoryAgg.forEach(p => {
      productsByCategory[p._id || 'Uncategorized'] = p.count;
    });

    res.json({
      productsCount,
      ordersCount,
      revenue,
      activeUsers,
      revenueTrend,
      ordersByCategory,
      productsByCategory
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const topProductsAgg = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items._id',
          name: { $first: '$items.name' },
          sold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: limit }
    ]);
    res.json(topProductsAgg);
  } catch (err) {
    console.error('Error fetching top products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
