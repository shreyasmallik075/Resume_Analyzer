require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI || '';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';
const RECONNECT_COOLDOWN_MS = 60_000;

let driver = null;
let connected = false;
let connecting = null;
let lastAttemptAt = 0;
let lastError = null;

const isConfigured = () => Boolean(NEO4J_URI && NEO4J_PASSWORD);

const ensureSchema = async (activeDriver) => {
  const session = activeDriver.session({ database: NEO4J_DATABASE });
  const constraints = [
    'CREATE CONSTRAINT resume_mongo_id IF NOT EXISTS FOR (r:Resume) REQUIRE r.mongoId IS UNIQUE',
    'CREATE CONSTRAINT cover_letter_mongo_id IF NOT EXISTS FOR (c:CoverLetter) REQUIRE c.mongoId IS UNIQUE',
    'CREATE CONSTRAINT interview_session_mongo_id IF NOT EXISTS FOR (s:InterviewSession) REQUIRE s.mongoId IS UNIQUE',
    'CREATE CONSTRAINT skill_key IF NOT EXISTS FOR (s:Skill) REQUIRE s.key IS UNIQUE',
    'CREATE CONSTRAINT role_key IF NOT EXISTS FOR (r:JobRole) REQUIRE r.key IS UNIQUE',
    'CREATE CONSTRAINT company_key IF NOT EXISTS FOR (c:Company) REQUIRE c.key IS UNIQUE',
    'CREATE CONSTRAINT question_key IF NOT EXISTS FOR (q:Question) REQUIRE q.key IS UNIQUE',
    'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
  ];

  try {
    for (const statement of constraints) {
      await session.run(statement);
    }
    console.log('✅ Neo4j schema constraints ready');
  } finally {
    await session.close();
  }
};

/**
 * Connect (or reconnect) to Neo4j. Safe to call repeatedly: failures are
 * swallowed so the rest of the app keeps working without a graph database.
 */
const connectNeo4j = async () => {
  if (!isConfigured()) {
    lastError = 'Neo4j is not configured (NEO4J_URI / NEO4J_PASSWORD missing)';
    return null;
  }
  if (connecting) return connecting;

  lastAttemptAt = Date.now();

  connecting = (async () => {
    let candidate = null;
    try {
      candidate = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
        {
          maxConnectionPoolSize: 10,
          connectionAcquisitionTimeout: 5_000,
          connectionTimeout: 5_000,
        }
      );

      await candidate.verifyConnectivity();
      await ensureSchema(candidate);

      driver = candidate;
      connected = true;
      lastError = null;
      console.log(`🔗 Neo4j Connected: ${NEO4J_URI} (database: ${NEO4J_DATABASE})`);
      return driver;
    } catch (error) {
      connected = false;
      lastError = error.message;
      console.error(`Neo4j Connection Error: ${error.message}`);
      console.log('Server will continue to run. Graph features are disabled until Neo4j is reachable.');
      if (candidate) await candidate.close().catch(() => {});
      driver = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
};

/**
 * Returns true when a usable driver is available. Retries the connection at
 * most once every RECONNECT_COOLDOWN_MS so a down database does not slow every
 * request down.
 */
const ensureConnection = async () => {
  if (connected && driver) return true;
  if (!isConfigured()) return false;
  if (Date.now() - lastAttemptAt < RECONNECT_COOLDOWN_MS) return false;

  const result = await connectNeo4j();
  return Boolean(result);
};

const isConnected = () => connected && Boolean(driver);

const getSession = async () => {
  const ready = await ensureConnection();
  if (!ready || !driver) {
    const error = new Error('Neo4j is not available');
    error.code = 'NEO4J_UNAVAILABLE';
    throw error;
  }
  return driver.session({ database: NEO4J_DATABASE });
};

const runQuery = async (cypher, params = {}, { write = false } = {}) => {
  const session = await getSession();
  try {
    const executor = write ? session.executeWrite.bind(session) : session.executeRead.bind(session);
    return await executor((tx) => tx.run(cypher, params));
  } finally {
    await session.close();
  }
};

const getStatus = () => ({
  configured: isConfigured(),
  connected: isConnected(),
  uri: NEO4J_URI || null,
  database: NEO4J_DATABASE,
  error: lastError,
});

const closeNeo4j = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    connected = false;
    console.log('Neo4j connection closed');
  }
};

module.exports = {
  connectNeo4j,
  closeNeo4j,
  ensureConnection,
  getSession,
  getStatus,
  isConnected,
  isConfigured,
  runQuery,
  NEO4J_DATABASE,
};
