const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { getMongoStatus } = require('./config/db');
const { connectNeo4j, closeNeo4j, getStatus: getNeo4jStatus } = require('./config/neo4j');
const { ensureCatalog } = require('./services/graphService');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  const mongodb = getMongoStatus();
  const neo4j = getNeo4jStatus();

  res.json({
    success: true,
    message: 'Backend is running [v2.1.0]',
    databases: {
      mongodb,
      neo4j,
    },
    status: mongodb.connected ? (neo4j.connected ? 'healthy' : 'degraded') : 'degraded',
  });
});

app.get('/api', (req, res) => res.json({ message: 'AI Interview Platform API is running! [v2.1.0]' }));

app.use('/api/resume', require('./routes/resume'));
app.use('/api/coverletter', require('./routes/coverLetter'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/graph', require('./routes/graph'));

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err.stack);
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 [VERSION 2.1.0] SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);

  connectDB().catch(err => console.error('Background MongoDB Error:', err.message));

  connectNeo4j()
    .then((driver) => {
      if (!driver) return null;
      return ensureCatalog();
    })
    .then((result) => {
      if (result?.seeded) {
        console.log(`🧠 Skill catalog seeded: ${result.roles} roles / ${result.requirements} requirements`);
      }
    })
    .catch(err => console.error('Background Neo4j Error:', err.message));
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closeNeo4j().catch(() => {});
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
});
