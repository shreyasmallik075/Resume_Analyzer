const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const { parsePDF, parseDOCX } = require('../utils/pdfParser');
const { analyzeResume } = require('../utils/openaiHelper');
const { syncResume } = require('../services/graphService');

const getUserId = (req) => {
  const raw = req.header('x-user-id') || req.body?.userId || '';
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 100) : null;
};

/**
 * Writes the analysis to MongoDB (when available) and mirrors the result into
 * the Neo4j knowledge graph. A database failure never fails the AI request.
 */
const persistAndSyncResume = async (payload, userId) => {
  let resumeId = `offline_${Date.now()}`;
  let persisted = false;

  if (mongoose.connection.readyState === 1) {
    try {
      const resume = await Resume.create({ ...payload, userId });
      resumeId = String(resume._id);
      persisted = true;
    } catch (error) {
      console.error('MongoDB resume save failed:', error.message);
    }
  } else {
    console.warn('MongoDB not connected. Resume will not be persisted.');
  }

  const graphSync = await syncResume({ resumeId, userId, ...payload });

  if (persisted && graphSync.synced) {
    await Resume.updateOne({ _id: resumeId }, { $set: { graphSynced: true } }).catch(() => {});
  }

  return { resumeId, persisted, graph: graphSync };
};

const uploadResume = async (req, res) => {
  console.log('Upload Request Received');
  console.log('File:', req.file ? req.file.originalname : 'NONE');

  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      text = await parsePDF(req.file.buffer);
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await parseDOCX(req.file.buffer);
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    const apiKey = req.body.apiKey || process.env.OPENAI_API_KEY;
    const analysis = await analyzeResume(text, apiKey);

    const payload = {
      resumeText: text,
      ...analysis,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      source: 'upload',
      timestamp: new Date(),
    };

    const storage = await persistAndSyncResume(payload, getUserId(req));

    res.json({
      resumeId: storage.resumeId,
      resumeText: text,
      ...analysis,
      persistence: { mongo: storage.persisted },
      graph: storage.graph,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const analyzeText = async (req, res) => {
  try {
    const { resumeText, text, apiKey } = req.body;
    const content = resumeText || text;

    if (!content) return res.status(400).json({ message: 'No text provided' });

    const analysis = await analyzeResume(content, apiKey || process.env.OPENAI_API_KEY);

    const payload = {
      resumeText: content,
      ...analysis,
      source: 'text',
      timestamp: new Date(),
    };

    const storage = await persistAndSyncResume(payload, getUserId(req));

    res.json({
      resumeId: storage.resumeId,
      resumeText: content,
      ...analysis,
      persistence: { mongo: storage.persisted },
      graph: storage.graph,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getResumeHistory = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB is not connected. Resume history is unavailable.',
    });
  }

  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  const userId = req.query.userId || req.header('x-user-id');
  const filter = userId ? { userId } : {};

  const resumes = await Resume.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-resumeText -parsedData')
    .lean();

  res.json({ success: true, count: resumes.length, resumes });
};

module.exports = { uploadResume, analyzeText, getResumeHistory };
