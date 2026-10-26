require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectNeo4j, closeNeo4j, getStatus } = require('../config/neo4j');
const { seedSkillCatalog } = require('../services/graphService');

(async () => {
  const driver = await connectNeo4j();

  if (!driver) {
    console.error('Could not connect to Neo4j:', getStatus().error);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await seedSkillCatalog();
    console.log('Skill catalog seed result:', result);
    process.exitCode = result.seeded ? 0 : 1;
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeNeo4j();
  }
})();
