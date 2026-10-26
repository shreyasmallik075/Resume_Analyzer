const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  questions: [String],
  answers: [{
    question: String,
    answer: String,
    scores: {
      total: Number,
      semantic: Number,
      keywords: Number,
      star: Number,
      length: Number,
      redundancy: Number,
      filler: Number,
      quantification: Number,
      actionVerbs: Number
    },
    feedback: String,
    idealAnswer: String,
    timestamp: { type: Date, default: Date.now }
  }],
  graphSynced: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

InterviewSessionSchema.index({ userId: 1, timestamp: -1 });
InterviewSessionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
