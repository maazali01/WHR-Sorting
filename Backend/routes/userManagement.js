const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/Users');
const Order = require('../models/Order');

// GET /admin/users -> list users separated into local (site) and google-auth users (passwordless)
router.get('/users', async (_req, res) => {
  try {
    // aggregate users with ordersCount, then facet into local vs google users
    const agg = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
        },
      },
      {
        $addFields: {
          ordersCount: { $size: '$orders' },
        },
      },
      {
        $project: {
          password: 0,
          orders: 0,
          emailVerificationToken: 0, // hide tokens if any
        },
      },
      { $sort: { _id: -1 } },
      {
        $facet: {
          localUsers: [
            { $match: { $or: [{ googleId: { $exists: false } }, { googleId: null }] } },
          ],
          googleUsers: [
            { $match: { googleId: { $exists: true, $ne: null } } },
          ],
        },
      },
    ]);

    const result = agg && agg[0] ? agg[0] : { localUsers: [], googleUsers: [] };
    res.json(result);
  } catch (e) {
    console.error('Failed to fetch users', e);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /admin/users/summary -> quick analytics
router.get('/users/summary', async (_req, res) => {
  try {
    const total = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const blocked = await User.countDocuments({ blocked: true });
    const active = total - blocked;

    // recent signups in last 7 days using ObjectId timestamp
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({
      _id: { $gt: mongoose.Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000)) },
    });

    res.json({ total, active, admins, blocked, recentSignups });
  } catch (e) {
    res.status(500).json({ message: 'Failed to compute summary' });
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
