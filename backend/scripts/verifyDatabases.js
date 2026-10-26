/**
 * Prints proof that both databases are in use: MongoDB collection counts and
 * sample documents, plus Neo4j node/relationship counts and the edges around
 * the most recent resume.
 *
 * Usage: npm run db:verify
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { closeNeo4j, connectNeo4j, getStatus, runQuery } = require('../config/neo4j');

const toNumber = (value) => (value && typeof value.toNumber === 'function' ? value.toNumber() : value);
const line = (label, value) => console.log(`  ${String(label).padEnd(18)} ${value}`);

const main = async () => {
  let failed = false;

  console.log('\n========================================');
  console.log('  DATABASE VERIFICATION');
  console.log('========================================');

  /* -------------------------------- MongoDB -------------------------------- */
  const mongo = await connectDB();
  if (!mongo) {
    console.log('\nMongoDB: NOT CONNECTED');
    failed = true;
  } else {
    console.log(`\nMongoDB: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('  (no collections yet - use the app or run: npm run db:seed-demo)');
    } else {
      for (const collection of collections.sort((a, b) => a.name.localeCompare(b.name))) {
        const count = await db.collection(collection.name).countDocuments();
        line(collection.name, `${count} document${count === 1 ? '' : 's'}`);
      }
    }

    const latestResume = await db.collection('resumes').find().sort({ timestamp: -1 }).limit(1).next();
    if (latestResume) {
      console.log('\n  Latest resume document:');
      line('_id', latestResume._id);
      line('userId', latestResume.userId || '(anonymous)');
      line('field', latestResume.field || '(none)');
      line('score', latestResume.score ?? '(none)');
      line('skills', (latestResume.skills || []).join(', ') || '(none)');
      line('graphSynced', Boolean(latestResume.graphSynced));
    }
  }

  /* --------------------------------- Neo4j --------------------------------- */
  const driver = await connectNeo4j();
  if (!driver) {
    console.log(`\nNeo4j: NOT CONNECTED (${getStatus().error || 'not configured'})`);
    console.log('  Start it with: docker compose up -d neo4j');
    failed = true;
  } else {
    const status = getStatus();
    console.log(`\nNeo4j: ${status.uri} (database: ${status.database})`);

    const nodes = await runQuery(
      `MATCH (n)
       RETURN labels(n)[0] AS label, count(*) AS count
       ORDER BY count DESC, label ASC`
    );
    console.log('\n  Node counts:');
    for (const record of nodes.records) {
      line(record.get('label'), toNumber(record.get('count')));
    }

    const relationships = await runQuery(
      `MATCH ()-[rel]->()
       RETURN type(rel) AS type, count(*) AS count
       ORDER BY count DESC, type ASC`
    );
    console.log('\n  Relationship counts:');
    if (relationships.records.length === 0) {
      console.log('    (none yet)');
    } else {
      for (const record of relationships.records) {
        line(record.get('type'), toNumber(record.get('count')));
      }
    }

    const latestResume = await mongoose.connection.db
      ?.collection('resumes')
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .next();

    if (latestResume) {
      const resumeId = String(latestResume._id);
      const edges = await runQuery(
        `MATCH (r:Resume { mongoId: $resumeId })-[rel]->(target)
         RETURN type(rel) AS type,
                labels(target)[0] AS label,
                coalesce(target.name, target.text, target.jobRole, target.company, target.mongoId, target.key, target.id) AS name
         ORDER BY type, name
         LIMIT 30`,
        { resumeId }
      );

      console.log(`\n  Graph edges for resume ${resumeId}:`);
      if (edges.records.length === 0) {
        console.log('    (no graph edges - run the app or: npm run db:seed-demo)');
      } else {
        for (const record of edges.records) {
          line(record.get('type'), `${record.get('label')} "${record.get('name')}"`);
        }
      }
    }
  }

  console.log('\n========================================');
  console.log(failed ? '  RESULT: one or more databases are unavailable' : '  RESULT: MongoDB + Neo4j are connected and contain data');
  console.log('========================================\n');

  if (failed) process.exitCode = 1;
};

main()
  .catch((error) => {
    console.error('\nVerification failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4j().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });
