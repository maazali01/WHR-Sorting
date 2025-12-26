const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Log = require('../models/Log');

// GET /admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    // case-insensitive counts for statuses
    const [pendingCount, confirmedCount, completedCount, failedCount] = await Promise.all([
      Order.countDocuments({ status: { $regex: '^pending$', $options: 'i' } }),
      Order.countDocuments({ status: { $regex: '^confirmed$', $options: 'i' } }),
      Order.countDocuments({ status: { $regex: '^completed$', $options: 'i' } }),
      Order.countDocuments({ status: { $regex: '^failed$', $options: 'i' } }),
    ]);

    // Monthly sales (case-insensitive match for confirmed/completed)
    const monthlyAgg = await Order.aggregate([
      { $match: { status: { $in: [/^confirmed$/i, /^completed$/i] } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlySales = monthlyAgg.map((m) => ({
      year: m._id.year,
      month: m._id.month,
      totalSales: m.totalSales,
      orders: m.orders,
    }));

    // Sorting accuracy & avg time from Logs with action === 'SORT_RESULT'
    const sortResults = await Log.aggregate([
      { $match: { action: 'SORT_RESULT' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successes: { $sum: { $cond: [{ $eq: ['$details.success', true] }, 1, 0] } },
          avgDuration: { $avg: '$details.durationSec' },
        },
      },
    ]);

    const sorting = sortResults[0] || { total: 0, successes: 0, avgDuration: null };
    const sortingAccuracy = sorting.total > 0 ? sorting.successes / sorting.total : null;
    const avgSortingTimeSec = sorting.avgDuration || null;

    // Robot utilization from logs with action === 'ROBOT_STATUS' and meta.activeSeconds / meta.idleSeconds
    const robotAgg = await Log.aggregate([
      { $match: { action: 'ROBOT_STATUS' } },
      {
        $group: {
          _id: null,
          totalActive: { $sum: { $ifNull: ['$meta.activeSeconds', 0] } },
          totalIdle: { $sum: { $ifNull: ['$meta.idleSeconds', 0] } },
        },
      },
    ]);
    const robotStats = robotAgg[0] || { totalActive: 0, totalIdle: 0 };
    const totalTime = (robotStats.totalActive || 0) + (robotStats.totalIdle || 0);
    const robotUtilization = totalTime > 0 ? (robotStats.totalActive / totalTime) : null;

    res.json({
      orders: { pending: pendingCount, confirmed: confirmedCount, completed: completedCount, failed: failedCount },
      monthlySales,
      sorting: { total: sorting.total || 0, successes: sorting.successes || 0, accuracy: sortingAccuracy, avgSortingTimeSec },
      robot: { totalActiveSeconds: robotStats.totalActive, totalIdleSeconds: robotStats.totalIdle, utilization: robotUtilization },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to compute analytics' });
  }
});

module.exports = router;
