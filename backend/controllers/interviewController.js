const mongoose = require('mongoose');
const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const { generateQuestions, generateIdealAnswer } = require('../utils/openaiHelper');
const { calculateScore } = require('../utils/scoringEngine');
const { syncInterviewSession, syncAnswerScore } = require('../services/graphService');

const getUserId = (req) => {
  const raw = req.header('x-user-id') || req.body?.userId || '';
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 100) : null;
};

const findResumeText = async (resumeId) => {
  if (!resumeId || mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(resumeId)) {
    return '';
  }

  const resume = await Resume.findById(resumeId).select('resumeText').lean().catch(() => null);
  return resume?.resumeText || '';
};

const createQuestions = async (req, res) => {
  try {
    const { resumeId, apiKey } = req.body;
    const userId = getUserId(req);

    const resumeText = await findResumeText(resumeId);
    const questions = await generateQuestions(resumeText, apiKey || process.env.OPENAI_API_KEY);

    let sessionId = `offline_session_${Date.now()}`;
    let persisted = false;

    if (mongoose.connection.readyState === 1) {
      try {
        const session = await InterviewSession.create({
          userId,
          resumeId: mongoose.isValidObjectId(resumeId) ? resumeId : undefined,
          questions,
          timestamp: new Date(),
        });
        sessionId = String(session._id);
        persisted = true;
      } catch (error) {
        console.error('MongoDB interview session save failed:', error.message);
      }
    } else {
      console.warn('MongoDB not connected. Skipping interview session save.');
    }

    const graphSync = await syncInterviewSession({
      sessionId,
      resumeId,
      questions,
      userId,
    });

    if (persisted && graphSync.synced) {
      await InterviewSession.updateOne(
        { _id: sessionId },
        { $set: { graphSynced: true } }
      ).catch(() => {});
    }

    res.json({
      questions,
      sessionId,
      persistence: { mongo: persisted },
      graph: graphSync,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const scoreUserAnswer = async (req, res) => {
  try {
    const { question, answer, apiKey, resumeId, sessionId } = req.body;
    const key = apiKey || process.env.OPENAI_API_KEY;
    const userId = getUserId(req);

    const resumeText = await findResumeText(resumeId);
    const idealAnswer = await generateIdealAnswer(question, resumeText, key);
    const scoreData = await calculateScore(question, answer, idealAnswer, key);

    let persisted = false;

    if (
      mongoose.connection.readyState === 1 &&
      sessionId &&
      mongoose.isValidObjectId(sessionId)
    ) {
      try {
        const updated = await InterviewSession.findOneAndUpdate(
          { _id: sessionId, ...(userId ? { userId } : {}) },
          {
            $push: {
              answers: {
                question,
                answer,
                scores: {
                  total: scoreData.totalScore,
                  semantic: scoreData.breakdown.semantic,
                  keywords: scoreData.breakdown.keywords,
                  star: scoreData.breakdown.star,
                  length: scoreData.breakdown.length,
                  redundancy: scoreData.breakdown.redundancy,
                  filler: scoreData.breakdown.filler,
                  quantification: scoreData.breakdown.quantification,
                  actionVerbs: scoreData.breakdown.actionVerbs,
                },
                feedback: 'Scored with semantic similarity, STAR detection, and NLP metrics.',
                idealAnswer,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        ).catch(() => null);

        persisted = Boolean(updated);
      } catch (error) {
        console.error('MongoDB answer save failed:', error.message);
      }
    }

    const graphSync = await syncAnswerScore({
      sessionId,
      question,
      totalScore: scoreData.totalScore,
    });

    res.json({
      ...scoreData,
      feedback: 'Your answer was evaluated using semantic similarity, STAR structure detection, and NLP metrics.',
      idealAnswer,
      sessionId: sessionId || null,
      persistence: { mongo: persisted },
      graph: graphSync,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuestions, scoreUserAnswer };
