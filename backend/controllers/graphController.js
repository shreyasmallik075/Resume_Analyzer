const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const InterviewSession = require('../models/InterviewSession');
const neo4j = require('../config/neo4j');
const graph = require('../services/graphService');

const graphUnavailable = (res) => res.status(503).json({
  success: false,
  available: false,
  message: 'Neo4j is not available. Start Neo4j and check NEO4J_* environment variables.',
  neo4j: neo4j.getStatus(),
});

const getStatus = async (req, res) => {
  const status = neo4j.getStatus();
  res.json({
    success: true,
    available: status.connected,
    neo4j: status,
  });
};

const getStats = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);

  try {
    const stats = await graph.getStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    res.status(503).json({ success: false, available: false, message: error.message });
  }
};

const getRoles = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);

  try {
    const roles = await graph.getRoles();
    res.json({ success: true, count: roles.length, roles });
  } catch (error) {
    res.status(503).json({ success: false, available: false, message: error.message });
  }
};

const getRole = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);

  try {
    const role = await graph.getRoleDetails(req.params.role);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found in the knowledge graph' });
    res.json({ success: true, role });
  } catch (error) {
    res.status(503).json({ success: false, available: false, message: error.message });
  }
};

const getResumeInsights = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);

  try {
    const insights = await graph.getResumeInsights(req.params.resumeId);
    if (!insights) {
      return res.status(404).json({
        success: false,
        available: true,
        message: 'Resume not found in the knowledge graph. Re-analyze the resume or run POST /api/graph/reindex.',
      });
    }
    res.json({ success: true, ...insights });
  } catch (error) {
    res.status(503).json({ success: false, available: false, message: error.message });
  }
};

const seedCatalog = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);

  const result = await graph.seedSkillCatalog();
  if (!result.seeded) {
    return res.status(503).json({ success: false, ...result });
  }
  res.json({ success: true, ...result });
};

const reindexGraph = async (req, res) => {
  if (!neo4j.isConnected()) return graphUnavailable(res);
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB is not connected. Start MongoDB before reindexing the graph.',
    });
  }

  const [resumes, coverLetters, interviews] = await Promise.all([
    Resume.find().sort({ timestamp: -1 }).limit(500).lean(),
    CoverLetter.find().sort({ timestamp: -1 }).limit(500).lean(),
    InterviewSession.find().sort({ timestamp: -1 }).limit(500).lean(),
  ]);

  const result = {
    resumes: { total: resumes.length, synced: 0, failed: 0 },
    coverLetters: { total: coverLetters.length, synced: 0, failed: 0 },
    interviewSessions: { total: interviews.length, synced: 0, failed: 0 },
  };

  for (const resume of resumes) {
    const sync = await graph.syncResume({
      resumeId: String(resume._id),
      score: resume.score,
      field: resume.field,
      skills: resume.skills,
      missingKeywords: resume.missingKeywords,
      userId: resume.userId,
    });
    sync.synced ? result.resumes.synced++ : result.resumes.failed++;
  }

  for (const letter of coverLetters) {
    const sync = await graph.syncCoverLetter({
      coverLetterId: String(letter._id),
      resumeId: letter.resumeId ? String(letter.resumeId) : null,
      jobRole: letter.jobRole,
      company: letter.company,
      userId: letter.userId,
    });
    sync.synced ? result.coverLetters.synced++ : result.coverLetters.failed++;
  }

  for (const interview of interviews) {
    const sync = await graph.syncInterviewSession({
      sessionId: String(interview._id),
      resumeId: interview.resumeId ? String(interview.resumeId) : null,
      questions: interview.questions,
      userId: interview.userId,
    });
    sync.synced ? result.interviewSessions.synced++ : result.interviewSessions.failed++;
  }

  res.json({ success: true, ...result });
};

module.exports = {
  getResumeInsights,
  getRole,
  getRoles,
  getStats,
  getStatus,
  reindexGraph,
  seedCatalog,
};
