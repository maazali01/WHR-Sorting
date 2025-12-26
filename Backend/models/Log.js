const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date() },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'system' },
  type: { type: String, enum: ['admin', 'robot', 'system'], default: 'system' },
  action: { type: String, required: true }, // e.g. "CREATE_PRODUCT", "MODEL_DEPLOY", "SORT_RESULT"
  details: { type: mongoose.Schema.Types.Mixed, default: {} }, // arbitrary details
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // optional metadata
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
