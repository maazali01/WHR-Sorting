// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Order = require('../models/Order');
const User = require('../models/Users');

// 📊 Dashboard Analytics - Optimized
router.get('/analytics', async (req, res) => {
  try {
    // ✅ Run all queries in parallel for faster response
    const [
      productsCount,
      ordersCount,
      activeUsers,
      revenueAgg,
      revTrendAgg,
      ordersByCategoryAgg,
      productsByCategoryAgg
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: getSevenDaysAgo() } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            count: { $sum: '$items.quantity' }
          }
        }
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const revenue = revenueAgg.length ? revenueAgg[0].totalRevenue : 0;

    // Fill in missing days for revenue trend
    const revenueTrend = fillMissingDays(revTrendAgg);

    // Format categories
    const ordersByCategory = {};
    ordersByCategoryAgg.forEach(o => {
      ordersByCategory[o._id || 'Uncategorized'] = o.count;
    });

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

// ✅ Helper functions
function getSevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return date;
}

function fillMissingDays(revTrendAgg) {
  const revenueTrend = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date();
    dayDate.setDate(now.getDate() - 6 + i);
    const key = dayDate.toISOString().slice(0, 10);
    const found = revTrendAgg.find(d => d._id === key);
    revenueTrend.push({ day: key, value: found ? found.value : 0 });
  }
  
  return revenueTrend;
}

// ✅ Optimize orders query with indexing and limit
router.get('/orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id total status date createdAt') // Only select needed fields
      .lean(); // Use lean() for faster queries
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Optimize top products query
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

// 📊 Enhanced Analytics with Robot Data
router.get('/analytics/detailed', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const failedOrders = await Order.countDocuments({ status: 'failed' });

    // Mock robot data (replace with real data from your robot system)
    const robots = [
      { name: "UR5e-01", model: "UR5e Cobot", status: "Active", battery: 87, tasksToday: 156, uptime: "8.5h" },
      { name: "UR5e-02", model: "UR5e Cobot", status: "Active", battery: 92, tasksToday: 143, uptime: "7.2h" },
      { name: "YouBot-01", model: "KUKA YouBot", status: "Charging", battery: 34, tasksToday: 98, uptime: "5.3h" },
      { name: "YouBot-02", model: "KUKA YouBot", status: "Active", battery: 76, tasksToday: 112, uptime: "6.8h" },
    ];

    // Get last 7 days orders trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    
    const ordersTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%a', date: '$createdAt' } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Mock performance data
    const robotPerformance = robots.map(r => ({
      robot: r.name,
      efficiency: Math.floor(88 + Math.random() * 12)
    }));

    const orderDistribution = [
      { name: "Completed", value: completedOrders, color: "#10b981" },
      { name: "Pending", value: pendingOrders, color: "#f59e0b" },
      { name: "Failed", value: failedOrders, color: "#ef4444" },
    ];

    const batteryLevels = robots.map(r => ({
      robot: r.name,
      battery: r.battery
    }));

    const fleetBatteryAvg = Math.round(
      robots.reduce((sum, r) => sum + r.battery, 0) / robots.length
    );

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      systemUptime: "99.8%",
      avgProcessingTime: "45s",
      processingEfficiency: 94.5,
      successRate: ((completedOrders / totalOrders) * 100).toFixed(1),
      avgCycleTime: 23,
      fleetBatteryAvg,
      robots,
      ordersTrend,
      robotPerformance,
      orderDistribution,
      batteryLevels,
      hourlyActivity: [
        { hour: "00:00", orders: 12 },
        { hour: "04:00", orders: 8 },
        { hour: "08:00", orders: 45 },
        { hour: "12:00", orders: 68 },
        { hour: "16:00", orders: 52 },
        { hour: "20:00", orders: 28 },
      ]
    });
  } catch (err) {
    console.error('Error fetching detailed analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
