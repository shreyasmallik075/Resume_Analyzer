const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  resumeText: String,
  parsedData: Object,
  score: Number,
  skills: [String],
  strengths: [String],
  weaknesses: [String],
  missingKeywords: [String],
  field: String,
  suggestions: [String],
  atsFeedback: String,
  grammarFeedback: String,
  fileName: String,
  mimeType: String,
  source: { type: String, enum: ['upload', 'text'], default: 'upload' },
  graphSynced: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

ResumeSchema.index({ userId: 1, timestamp: -1 });
ResumeSchema.index({ timestamp: -1 });
ResumeSchema.index({ field: 1 });

module.exports = mongoose.model('Resume', ResumeSchema);
