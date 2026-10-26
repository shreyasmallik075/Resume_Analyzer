/**
 * Creates a small, realistic demo dataset in MongoDB and mirrors it into Neo4j.
 *
 * Useful for project demos where you want to prove that both databases are in
 * use without waiting for an AI call. The IDs are deterministic, so running
 * this script repeatedly updates the same demo records instead of duplicating
 * them.
 *
 * Usage: npm run db:seed-demo
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const InterviewSession = require('../models/InterviewSession');
const { connectNeo4j, closeNeo4j, getStatus } = require('../config/neo4j');
const {
  getResumeInsights,
  seedSkillCatalog,
  syncAnswerScore,
  syncCoverLetter,
  syncInterviewSession,
  syncResume,
} = require('../services/graphService');

const DEMO_USER = 'demo-user';
const RESUME_ID = new mongoose.Types.ObjectId('64b000000000000000000001');
const COVER_LETTER_ID = new mongoose.Types.ObjectId('64b000000000000000000002');
const SESSION_ID = new mongoose.Types.ObjectId('64b000000000000000000003');

const resumeData = {
  userId: DEMO_USER,
  resumeText:
    'Aarav Sharma — Full Stack Developer. 4 years building React dashboards and Node.js APIs. ' +
    'Led a team of 3, migrated a monolith to Express services, and cut page load time by 40%.',
  parsedData: {
    name: 'Aarav Sharma',
    title: 'Full Stack Developer',
    experienceYears: 4,
  },
  score: 84,
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'MongoDB', 'SQL', 'REST APIs', 'HTML', 'CSS', 'Git',
  ],
  strengths: ['Strong React and Node.js experience', 'Measurable performance improvements', 'Team leadership'],
  weaknesses: ['No containerization experience', 'Limited cloud deployment exposure'],
  missingKeywords: ['Docker', 'AWS', 'GraphQL'],
  field: 'Full Stack Developer',
  suggestions: ['Add Docker projects', 'Mention CI/CD pipelines', 'Quantify more achievements'],
  atsFeedback: 'Good keyword coverage for full stack roles. Add Docker and AWS to pass more ATS filters.',
  grammarFeedback: 'Clear and concise. No major grammar issues.',
  fileName: 'demo-resume.txt',
  mimeType: 'text/plain',
  source: 'text',
  graphSynced: true,
};

const coverLetterData = {
  userId: DEMO_USER,
  resumeId: RESUME_ID,
  content:
    'Dear Hiring Team,\n\nI am excited to apply for the Full Stack Developer role at TechNova. ' +
    'Over the past four years I have shipped React and Node.js products used by thousands of customers...',
  jobRole: 'Full Stack Developer',
  company: 'TechNova',
  jobDescription: 'Build and maintain React + Node.js products. Experience with MongoDB and REST APIs required.',
  graphSynced: true,
};

const sessionData = {
  userId: DEMO_USER,
  resumeId: RESUME_ID,
  questions: [
    'Tell me about a challenging project you delivered.',
    'How do you design a REST API for a new feature?',
    'Explain how you would optimize a slow React page.',
  ],
  answers: [
    {
      question: 'Tell me about a challenging project you delivered.',
      answer:
        'Situation: our dashboard took 8 seconds to load. Task: I owned the performance work. ' +
        'Action: I profiled the bundle, code-split routes, and added caching. Result: load time dropped to 4.8 seconds, a 40% improvement.',
      scores: {
        total: 88, semantic: 86, keywords: 90, star: 92, length: 85,
        redundancy: 80, filler: 90, quantification: 95, actionVerbs: 88,
      },
      feedback: 'Strong STAR structure with a quantified result.',
      idealAnswer: 'Use STAR: describe the slow dashboard, your profiling work, and the measured improvement.',
    },
    {
      question: 'How do you design a REST API for a new feature?',
      answer:
        'I start with the resources and endpoints, define request/response schemas, add validation and auth, ' +
        'then document the API and write integration tests. For example, I built the interview scoring endpoint with Express and MongoDB.',
      scores: {
        total: 81, semantic: 84, keywords: 82, star: 70, length: 80,
        redundancy: 78, filler: 85, quantification: 60, actionVerbs: 84,
      },
      feedback: 'Clear process, but add a concrete outcome or metric.',
      idealAnswer: 'Cover resources, schemas, validation, auth, documentation, and testing.',
    },
  ],
  graphSynced: true,
};

const main = async () => {
  console.log('\n=== Seeding demo data ===\n');

  const mongo = await connectDB();
  if (!mongo) {
    throw new Error('MongoDB is not available. Start it with: docker compose up -d mongodb');
  }

  const resume = await Resume.findByIdAndUpdate(
    RESUME_ID,
    { $set: resumeData },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  const coverLetter = await CoverLetter.findByIdAndUpdate(
    COVER_LETTER_ID,
    { $set: coverLetterData },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  const session = await InterviewSession.findByIdAndUpdate(
    SESSION_ID,
    { $set: sessionData },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  console.log(`MongoDB  : ${mongoose.connection.name}`);
  console.log(`  resume          ${resume._id}`);
  console.log(`  cover letter    ${coverLetter._id}`);
  console.log(`  interview       ${session._id}`);

  const driver = await connectNeo4j();
  if (!driver) {
    console.warn(`\nNeo4j is unavailable (${getStatus().error || 'not configured'}).`);
    console.warn('MongoDB demo data was saved, but the graph was not updated.');
    process.exitCode = 1;
    return;
  }

  await seedSkillCatalog();

  const resumeSync = await syncResume({
    ...resume.toObject(),
    resumeId: String(resume._id),
  });
  const letterSync = await syncCoverLetter({
    ...coverLetter.toObject(),
    coverLetterId: String(coverLetter._id),
    resumeId: String(resume._id),
  });
  const sessionSync = await syncInterviewSession({
    ...session.toObject(),
    sessionId: String(session._id),
    resumeId: String(resume._id),
  });
  const answerSync = await syncAnswerScore({
    sessionId: String(session._id),
    question: sessionData.answers[0].question,
    totalScore: sessionData.answers[0].scores.total,
  });

  console.log(`\nNeo4j    : ${getStatus().uri} (database: ${getStatus().database})`);
  console.log(`  resume sync     ${resumeSync.synced ? 'OK' : 'FAILED'}`);
  console.log(`  cover letter    ${letterSync.synced ? 'OK' : 'FAILED'}`);
  console.log(`  interview       ${sessionSync.synced ? 'OK' : 'FAILED'}`);
  console.log(`  answer score    ${answerSync.synced ? 'OK' : 'FAILED'}`);

  const insights = await getResumeInsights(String(resume._id));
  if (insights) {
    console.log('\nGraph insights for the demo resume:');
    console.log(`  target role     ${insights.primaryTarget?.role || 'n/a'}`);
    console.log(`  role match      ${insights.primaryTarget?.matchPercent ?? 'n/a'}%`);
    console.log(`  skill gaps      ${insights.skillGaps.map((gap) => gap.name).join(', ') || 'none'}`);
    console.log(`  top roles       ${insights.recommendedRoles.slice(0, 3).map((role) => `${role.role} (${role.matchPercent}%)`).join(', ')}`);
  }

  console.log('\nDemo data ready. Open these to show the databases:');
  console.log(`  Health        http://localhost:5001/api/health`);
  console.log(`  Graph stats   http://localhost:5001/api/graph/stats`);
  console.log(`  Insights      http://localhost:5001/api/graph/insights/${resume._id}`);
  console.log(`  Neo4j Browser http://localhost:7474  (neo4j / devpassword)`);
  console.log(`\nRun "npm run db:verify" to print row/node counts from both databases.\n`);
};

main()
  .catch((error) => {
    console.error('\nDemo seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4j().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });
