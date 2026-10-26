/**
 * Demonstrates full CRUD in both databases using isolated demo records.
 *
 * MongoDB : collection `crud_demo`
 * Neo4j   : `(:CrudDemo)-[:HAS_DEMO_SKILL]->(:CrudSkill)`
 *
 * The records are removed at the end by default, so the script is safe to run
 * repeatedly. Pass --keep to leave the records in place for inspection (the
 * DELETE step is skipped).
 *
 * Usage:
 *   npm run db:crud-demo
 *   npm run db:crud-demo -- --keep
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { closeNeo4j, connectNeo4j, getStatus, runQuery } = require('../config/neo4j');

const KEEP = process.argv.includes('--keep');
const stamp = Date.now();
const mongoDemoId = `mongo-crud-${stamp}`;
const graphId = `neo4j-crud-${stamp}`;
const graphSkillId = `neo4j-skill-${stamp}`;

const toNumber = (value) => (value && typeof value.toNumber === 'function' ? value.toNumber() : value);
const section = (title) => console.log(`\n=== ${title} ===`);
const step = (operation, detail) => console.log(`  ${operation.padEnd(8)} ${detail}`);

const cleanupMongo = async () => {
  if (KEEP || !mongoose.connection.db) return;
  await mongoose.connection.db.collection('crud_demo').deleteMany({ demoId: mongoDemoId });
};

const cleanupGraph = async () => {
  if (KEEP) return;
  try {
    await runQuery('MATCH (d:CrudDemo { id: $id }) DETACH DELETE d', { id: graphId }, { write: true });
    await runQuery('MATCH (s:CrudSkill { id: $id }) DETACH DELETE s', { id: graphSkillId }, { write: true });
  } catch {
    // Neo4j may be unavailable; nothing to clean up.
  }
};

const mongoCrud = async () => {
  const collection = mongoose.connection.db.collection('crud_demo');
  section('MongoDB CRUD');

  const before = await collection.countDocuments({ demoId: mongoDemoId });

  // CREATE
  const insert = await collection.insertOne({
    demoId: mongoDemoId,
    name: 'CRUD Demo Candidate',
    role: 'Full Stack Developer',
    score: 70,
    skills: ['React', 'Node.js'],
    createdAt: new Date(),
  });
  step('CREATE', `insertOne -> _id=${insert.insertedId}`);

  // READ
  const created = await collection.findOne({ _id: insert.insertedId });
  step('READ', `findOne -> name="${created.name}", score=${created.score}, skills=[${created.skills.join(', ')}]`);

  // UPDATE
  const update = await collection.updateOne(
    { _id: insert.insertedId },
    { $set: { score: 95 }, $push: { skills: 'Neo4j' } }
  );
  const updated = await collection.findOne({ _id: insert.insertedId });
  step('UPDATE', `matched=${update.matchedCount}, modified=${update.modifiedCount} -> score=${updated.score}, skills=[${updated.skills.join(', ')}]`);

  // DELETE
  if (KEEP) {
    step('KEEP', 'skipping DELETE because --keep was passed');
  } else {
    const removed = await collection.deleteOne({ _id: insert.insertedId });
    const afterDelete = await collection.findOne({ _id: insert.insertedId });
    step('DELETE', `deleted=${removed.deletedCount}, stillExists=${Boolean(afterDelete)}`);
  }

  const after = await collection.countDocuments({ demoId: mongoDemoId });
  console.log(`\n  Mongo documents for this demo: before=${before}, after=${after}`);
  console.log('  Collection: ai_interview_ready.crud_demo');
};

const countGraphNodes = async () => {
  const demo = await runQuery('MATCH (n:CrudDemo) RETURN count(n) AS count');
  const skills = await runQuery('MATCH (n:CrudSkill) RETURN count(n) AS count');
  return {
    demo: toNumber(demo.records[0].get('count')),
    skills: toNumber(skills.records[0].get('count')),
  };
};

const graphCrud = async () => {
  section('Neo4j CRUD');

  const before = await countGraphNodes();

  // CREATE
  const created = await runQuery(
    `CREATE (d:CrudDemo {
       id: $id,
       name: $name,
       role: $role,
       score: 70,
       createdAt: datetime()
     })
     CREATE (s:CrudSkill { id: $skillId, name: 'Neo4j' })
     CREATE (d)-[r:HAS_DEMO_SKILL]->(s)
     RETURN d.id AS id, d.name AS name, d.score AS score,
            s.name AS skill, type(r) AS relationship`,
    { id: graphId, name: 'CRUD Demo Candidate', role: 'Full Stack Developer', skillId: graphSkillId },
    { write: true }
  );
  const createdRow = created.records[0];
  step('CREATE', `CREATE -> (${createdRow.get('id')})-[:${createdRow.get('relationship')}]->(${createdRow.get('skill')})`);

  // READ
  const read = await runQuery(
    `MATCH (d:CrudDemo { id: $id })-[r:HAS_DEMO_SKILL]->(s:CrudSkill)
     RETURN d.id AS id, d.name AS name, d.score AS score, d.role AS role,
            s.name AS skill, type(r) AS relationship`,
    { id: graphId }
  );
  const readRow = read.records[0];
  step('READ', `MATCH -> name="${readRow.get('name')}", score=${toNumber(readRow.get('score'))}, skill="${readRow.get('skill')}"`);

  // UPDATE
  const updated = await runQuery(
    `MATCH (d:CrudDemo { id: $id })
     SET d.score = 95, d.updatedAt = datetime()
     RETURN d.score AS score, d.updatedAt AS updatedAt`,
    { id: graphId },
    { write: true }
  );
  const updatedRow = updated.records[0];
  step('UPDATE', `SET d.score=95 -> score=${toNumber(updatedRow.get('score'))}, updatedAt=${updatedRow.get('updatedAt')}`);

  // DELETE
  if (KEEP) {
    step('KEEP', 'skipping DELETE because --keep was passed');
  } else {
    await runQuery('MATCH (d:CrudDemo { id: $id }) DETACH DELETE d', { id: graphId }, { write: true });
    await runQuery('MATCH (s:CrudSkill { id: $id }) DETACH DELETE s', { id: graphSkillId }, { write: true });
    const afterDelete = await runQuery('MATCH (d:CrudDemo { id: $id }) RETURN count(d) AS count', { id: graphId });
    step('DELETE', `DETACH DELETE -> remaining=${toNumber(afterDelete.records[0].get('count'))}`);
  }

  const after = await countGraphNodes();
  console.log(`\n  Graph nodes for this demo: before=${before.demo} demo / ${before.skills} skill`);
  console.log(`                              after=${after.demo} demo / ${after.skills} skill`);
};

const main = async () => {
  console.log('\n==========================================');
  console.log('  CRUD DEMO — MongoDB + Neo4j');
  console.log('==========================================');

  const mongo = await connectDB();
  if (!mongo) {
    throw new Error('MongoDB is not available. Start it with: Get-Service MongoDB');
  }

  await mongoCrud();

  const driver = await connectNeo4j();
  if (!driver) {
    console.warn(`\nNeo4j is unavailable (${getStatus().error || 'not configured'}).`);
    console.warn('MongoDB CRUD completed, but Neo4j CRUD was skipped.');
    process.exitCode = 1;
    return;
  }

  await graphCrud();

  console.log('\n==========================================');
  console.log(KEEP ? '  CRUD demo complete. Demo records kept.' : '  CRUD demo complete. Demo records cleaned up.');
  console.log('==========================================\n');
};

main()
  .catch((error) => {
    console.error('\nCRUD demo failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupMongo().catch(() => {});
    await cleanupGraph().catch(() => {});
    await closeNeo4j().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });
