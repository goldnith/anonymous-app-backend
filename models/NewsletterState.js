const mongoose = require('mongoose');

const newsletterStateSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  lastSentAt: Date,
  nextSendAt: { type: Date, required: true },
  lastAttemptAt: Date,
  lastStatus: { type: String, enum: ['pending', 'sent', 'partial', 'failed'], default: 'pending' },
  lastStats: {
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  lastError: String
}, { timestamps: true });

module.exports = mongoose.model('NewsletterState', newsletterStateSchema);
