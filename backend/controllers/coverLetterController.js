const mongoose = require('mongoose');
const CoverLetter = require('../models/CoverLetter');
const Resume = require('../models/Resume');
const { generateCoverLetter } = require('../utils/openaiHelper');
const { syncCoverLetter } = require('../services/graphService');

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

const createCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobRole, company, jobDescription, apiKey } = req.body;
    const userId = getUserId(req);

    const resumeText = await findResumeText(resumeId);
    const content = await generateCoverLetter(resumeText, jobRole, company, jobDescription, apiKey);

    let coverLetterId = `offline_cl_${Date.now()}`;
    let persisted = false;

    if (mongoose.connection.readyState === 1) {
      try {
        const letter = await CoverLetter.create({
          userId,
          resumeId: mongoose.isValidObjectId(resumeId) ? resumeId : undefined,
          content,
          jobRole,
          company,
          jobDescription,
        });
        coverLetterId = String(letter._id);
        persisted = true;
      } catch (error) {
        console.error('MongoDB cover letter save failed:', error.message);
      }
    } else {
      console.warn('MongoDB not connected. Skipping cover letter save.');
    }

    const graphSync = await syncCoverLetter({
      coverLetterId,
      resumeId,
      jobRole,
      company,
      userId,
    });

    if (persisted && graphSync.synced) {
      await CoverLetter.updateOne({ _id: coverLetterId }, { $set: { graphSynced: true } }).catch(() => {});
    }

    res.json({
      coverLetter: content,
      coverLetterId,
      persistence: { mongo: persisted },
      graph: graphSync,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCoverLetter };
