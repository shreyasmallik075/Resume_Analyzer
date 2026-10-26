const mongoose = require('mongoose');

const CoverLetterSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  content: String,
  jobRole: String,
  company: String,
  jobDescription: String,
  graphSynced: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

CoverLetterSchema.index({ userId: 1, timestamp: -1 });
CoverLetterSchema.index({ timestamp: -1 });
CoverLetterSchema.index({ company: 1 });

module.exports = mongoose.model('CoverLetter', CoverLetterSchema);
