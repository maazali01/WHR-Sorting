const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const mongoose = require('mongoose');

// GET /admin/logs
// supports query: userName, type, action, from, to, page, limit, export=csv
router.get('/logs', async (req, res) => {
  try {
    const {
      userName, type, action, from, to, page = 1, limit = 50, export: exportFormat,
    } = req.query;

    const q = {};
    if (userName) q.userName = { $regex: userName, $options: 'i' };
    if (type) q.type = type;
    if (action) q.action = { $regex: action, $options: 'i' };
    if (from || to) q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
    const cursor = Log.find(q).sort({ timestamp: -1 });

    if (exportFormat === 'csv') {
      const logs = await cursor.limit(10000).lean().exec(); // export up to 10k rows
      // simple CSV
      const header = ['timestamp', 'userId', 'userName', 'type', 'action', 'details'];
      const rows = logs.map(l => [
        (l.timestamp || '').toISOString?.() || l.timestamp,
        l.userId ? String(l.userId) : '',
        l.userName || '',
        l.type || '',
        l.action || '',
        JSON.stringify(l.details || {}),
      ]);
      const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
      return res.send(csv);
    }

    const [total, logs] = await Promise.all([
      Log.countDocuments(q),
      cursor.skip(skip).limit(Math.max(1, parseInt(limit))).lean().exec(),
    ]);

    res.json({ total, page: parseInt(page), limit: parseInt(limit), logs });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/logs -> create a log entry
router.post('/logs', async (req, res) => {
  try {
    const { userId = null, userName = 'system', type = 'system', action, details = {}, meta = {} } = req.body;
    if (!action) return res.status(400).json({ message: 'action required' });
    const log = new Log({ userId, userName, type, action, details, meta });
    await log.save();
    res.status(201).json({ message: 'Log created', log });
  } catch (err) {
    console.error('Error creating log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /admin/logs/:id -> delete one
router.delete('/logs/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const doc = await Log.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /admin/logs -> clear all logs (use with caution)
router.delete('/logs', async (_req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'All logs deleted' });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
