const neo4j = require('neo4j-driver');
const { getSession, isConfigured } = require('../config/neo4j');
const { ROLE_CATALOG, SKILL_ALIASES } = require('../data/skillCatalog');

const MAX_LIST_SIZE = 120;

const toNative = (value) => {
  if (value == null) return value;
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(toNative);
  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = toNative(item);
    }
    return output;
  }
  return value;
};

const recordToObject = (record) => {
  const output = {};
  record.keys.forEach((key) => {
    output[key] = toNative(record.get(key));
  });
  return output;
};

const canonicalSkill = (value) => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  const alias = SKILL_ALIASES[cleaned.toLowerCase()];
  return alias || cleaned;
};

const cleanList = (values) => {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const cleaned = canonicalSkill(value);
    if (!cleaned) continue;
    const dedupeKey = cleaned.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    output.push(cleaned);
    if (output.length >= MAX_LIST_SIZE) break;
  }

  return output;
};

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const cleanTextList = (values) => {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    if (!cleaned) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    output.push(cleaned);
    if (output.length >= MAX_LIST_SIZE) break;
  }

  return output;
};

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const readQuery = async (cypher, params = {}) => {
  const session = await getSession();
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map(recordToObject);
  } finally {
    await session.close();
  }
};

const isGraphAvailable = () => isConfigured();

const unavailable = (error) => ({
  synced: false,
  skipped: true,
  reason: error?.code === 'NEO4J_UNAVAILABLE'
    ? 'Neo4j is not available'
    : error?.message || 'Neo4j is not available',
});

/* -------------------------------------------------------------------------- */
/*                                  Writes                                    */
/* -------------------------------------------------------------------------- */

const syncResume = async (resume = {}) => {
  if (!isGraphAvailable()) return unavailable();

  const resumeId = cleanText(String(resume.resumeId || resume._id || ''));
  if (!resumeId) return { synced: false, reason: 'resumeId is required' };

  const skills = cleanList(resume.skills);
  const missingKeywords = cleanList(resume.missingKeywords || resume.missing_keywords);
  const field = cleanText(resume.field);
  const score = toNumberOrNull(resume.score);
  const userId = cleanText(resume.userId);

  let session;
  try {
    session = await getSession();
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (r:Resume { mongoId: $resumeId })
         SET r.score = $score,
             r.field = $field,
             r.updatedAt = datetime()`,
        { resumeId, score, field: field || null }
      );

      await tx.run(
        `MATCH (r:Resume { mongoId: $resumeId })
         OPTIONAL MATCH (r)-[rel:HAS_SKILL|MISSING_SKILL|TARGETS_ROLE]->()
         DELETE rel`,
        { resumeId }
      );

      if (skills.length > 0) {
        await tx.run(
          `MATCH (r:Resume { mongoId: $resumeId })
           UNWIND $skills AS skillName
           MERGE (s:Skill { key: toLower(trim(skillName)) })
             ON CREATE SET s.name = trim(skillName)
           MERGE (r)-[:HAS_SKILL]->(s)`,
          { resumeId, skills }
        );
      }

      if (missingKeywords.length > 0) {
        await tx.run(
          `MATCH (r:Resume { mongoId: $resumeId })
           UNWIND $skills AS skillName
           MERGE (s:Skill { key: toLower(trim(skillName)) })
             ON CREATE SET s.name = trim(skillName)
           MERGE (r)-[:MISSING_SKILL]->(s)`,
          { resumeId, skills: missingKeywords }
        );
      }

      if (field) {
        await tx.run(
          `MATCH (r:Resume { mongoId: $resumeId })
           MERGE (role:JobRole { key: toLower(trim($field)) })
             ON CREATE SET role.name = trim($field)
           MERGE (r)-[:TARGETS_ROLE]->(role)`,
          { resumeId, field }
        );
      }

      if (userId) {
        await tx.run(
          `MATCH (r:Resume { mongoId: $resumeId })
           MERGE (u:User { id: $userId })
           MERGE (u)-[:HAS_RESUME]->(r)`,
          { resumeId, userId }
        );
      }
    });

    return { synced: true, resumeId, skills: skills.length, missingKeywords: missingKeywords.length };
  } catch (error) {
    console.error('Neo4j syncResume error:', error.message);
    return unavailable(error);
  } finally {
    if (session) await session.close();
  }
};

const syncCoverLetter = async (letter = {}) => {
  if (!isGraphAvailable()) return unavailable();

  const coverLetterId = cleanText(String(letter.coverLetterId || letter._id || ''));
  if (!coverLetterId) return { synced: false, reason: 'coverLetterId is required' };

  const resumeId = cleanText(String(letter.resumeId || ''));
  const jobRole = cleanText(letter.jobRole);
  const company = cleanText(letter.company);
  const userId = cleanText(letter.userId);

  let session;
  try {
    session = await getSession();
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (cl:CoverLetter { mongoId: $coverLetterId })
         SET cl.jobRole = $jobRole,
             cl.company = $company,
             cl.createdAt = coalesce(cl.createdAt, datetime())`,
        { coverLetterId, jobRole: jobRole || null, company: company || null }
      );

      if (resumeId) {
        await tx.run(
          `MATCH (cl:CoverLetter { mongoId: $coverLetterId })
           MATCH (r:Resume { mongoId: $resumeId })
           MERGE (cl)-[:GENERATED_FROM]->(r)`,
          { coverLetterId, resumeId }
        );
      }

      if (jobRole) {
        await tx.run(
          `MATCH (cl:CoverLetter { mongoId: $coverLetterId })
           MERGE (role:JobRole { key: toLower(trim($jobRole)) })
             ON CREATE SET role.name = trim($jobRole)
           MERGE (cl)-[:FOR_ROLE]->(role)`,
          { coverLetterId, jobRole }
        );

        if (resumeId) {
          await tx.run(
            `MATCH (r:Resume { mongoId: $resumeId })
             MATCH (role:JobRole { key: toLower(trim($jobRole)) })
             MERGE (r)-[:APPLIED_FOR]->(role)`,
            { resumeId, jobRole }
          );
        }
      }

      if (company) {
        await tx.run(
          `MATCH (cl:CoverLetter { mongoId: $coverLetterId })
           MERGE (c:Company { key: toLower(trim($company)) })
             ON CREATE SET c.name = trim($company)
           MERGE (cl)-[:TO_COMPANY]->(c)`,
          { coverLetterId, company }
        );
      }

      if (userId) {
        await tx.run(
          `MATCH (cl:CoverLetter { mongoId: $coverLetterId })
           MERGE (u:User { id: $userId })
           MERGE (u)-[:HAS_COVER_LETTER]->(cl)`,
          { coverLetterId, userId }
        );
      }
    });

    return { synced: true, coverLetterId };
  } catch (error) {
    console.error('Neo4j syncCoverLetter error:', error.message);
    return unavailable(error);
  } finally {
    if (session) await session.close();
  }
};

const syncInterviewSession = async (interview = {}) => {
  if (!isGraphAvailable()) return unavailable();

  const sessionId = cleanText(String(interview.sessionId || interview._id || ''));
  if (!sessionId) return { synced: false, reason: 'sessionId is required' };

  const resumeId = cleanText(String(interview.resumeId || ''));
  const questions = cleanTextList(interview.questions || []);
  const userId = cleanText(interview.userId);

  let session;
  try {
    session = await getSession();
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (is:InterviewSession { mongoId: $sessionId })
         SET is.createdAt = coalesce(is.createdAt, datetime())`,
        { sessionId }
      );

      if (resumeId) {
        await tx.run(
          `MATCH (is:InterviewSession { mongoId: $sessionId })
           MATCH (r:Resume { mongoId: $resumeId })
           MERGE (r)-[:PRACTICED]->(is)`,
          { sessionId, resumeId }
        );
      }

      if (questions.length > 0) {
        await tx.run(
          `MATCH (is:InterviewSession { mongoId: $sessionId })
           UNWIND $questions AS questionText
           MERGE (q:Question { key: toLower(trim(questionText)) })
             ON CREATE SET q.text = trim(questionText)
           MERGE (is)-[:HAS_QUESTION]->(q)`,
          { sessionId, questions }
        );
      }

      if (userId) {
        await tx.run(
          `MATCH (is:InterviewSession { mongoId: $sessionId })
           MERGE (u:User { id: $userId })
           MERGE (u)-[:PRACTICED]->(is)`,
          { sessionId, userId }
        );
      }
    });

    return { synced: true, sessionId, questions: questions.length };
  } catch (error) {
    console.error('Neo4j syncInterviewSession error:', error.message);
    return unavailable(error);
  } finally {
    if (session) await session.close();
  }
};

const syncAnswerScore = async (answer = {}) => {
  if (!isGraphAvailable()) return unavailable();

  const sessionId = cleanText(String(answer.sessionId || ''));
  const questionText = cleanText(answer.question);
  if (!sessionId || !questionText) {
    return { synced: false, reason: 'sessionId and question are required' };
  }

  const score = toNumberOrNull(answer.totalScore);
  let session;
  try {
    session = await getSession();
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (is:InterviewSession { mongoId: $sessionId })
         MERGE (q:Question { key: toLower(trim($question)) })
           ON CREATE SET q.text = trim($question)
         MERGE (is)-[rel:ANSWERED]->(q)
         SET rel.score = $score,
             rel.updatedAt = datetime()`,
        { sessionId, question: questionText, score }
      );
    });
    return { synced: true, sessionId };
  } catch (error) {
    console.error('Neo4j syncAnswerScore error:', error.message);
    return unavailable(error);
  } finally {
    if (session) await session.close();
  }
};

/* -------------------------------------------------------------------------- */
/*                                  Catalog                                   */
/* -------------------------------------------------------------------------- */

const seedSkillCatalog = async () => {
  if (!isGraphAvailable()) return unavailable();

  const rows = ROLE_CATALOG.flatMap((role) => [
    ...role.core.map((skill) => ({ role: role.name, skill, importance: 'core' })),
    ...role.niceToHave.map((skill) => ({ role: role.name, skill, importance: 'nice-to-have' })),
  ]);

  let session;
  try {
    session = await getSession();
    await session.executeWrite(async (tx) => {
      await tx.run(
        `UNWIND $rows AS row
         MERGE (role:JobRole { key: toLower(trim(row.role)) })
           ON CREATE SET role.name = trim(row.role)
         SET role.cataloged = true
         MERGE (skill:Skill { key: toLower(trim(row.skill)) })
           ON CREATE SET skill.name = trim(row.skill)
         MERGE (role)-[rel:REQUIRES_SKILL]->(skill)
         SET rel.importance = row.importance`,
        { rows }
      );
    });

    return { seeded: true, roles: ROLE_CATALOG.length, requirements: rows.length };
  } catch (error) {
    console.error('Neo4j seedSkillCatalog error:', error.message);
    return { seeded: false, error: error.message };
  } finally {
    if (session) await session.close();
  }
};

let catalogSeedPromise = null;

const ensureCatalog = () => {
  if (!catalogSeedPromise) {
    catalogSeedPromise = seedSkillCatalog().then((result) => {
      if (!result.seeded) catalogSeedPromise = null;
      return result;
    });
  }
  return catalogSeedPromise;
};

/* -------------------------------------------------------------------------- */
/*                                   Reads                                    */
/* -------------------------------------------------------------------------- */

const getResumeInsights = async (resumeId) => {
  await ensureCatalog().catch(() => {});

  const profileRows = await readQuery(
    `MATCH (r:Resume { mongoId: $resumeId })
     OPTIONAL MATCH (r)-[:HAS_SKILL]->(owned:Skill)
     WITH r, collect(DISTINCT owned) AS ownedSkills
     OPTIONAL MATCH (r)-[:MISSING_SKILL]->(missing:Skill)
     WITH r, ownedSkills, collect(DISTINCT missing) AS declaredMissing
     OPTIONAL MATCH (r)-[:TARGETS_ROLE]->(target:JobRole)
     RETURN r.mongoId AS resumeId,
            r.score AS score,
            r.field AS field,
            [s IN ownedSkills | s.name] AS skills,
            [s IN declaredMissing | s.name] AS declaredMissing,
            [role IN collect(DISTINCT target) | role.name] AS targetRoles`,
    { resumeId }
  );

  if (profileRows.length === 0) {
    return null;
  }

  const profile = profileRows[0];

  const [roleRows, allRoleRows, relatedRows] = await Promise.all([
    readQuery(
      `MATCH (r:Resume { mongoId: $resumeId })-[:TARGETS_ROLE]->(role:JobRole)
       OPTIONAL MATCH (role)-[req:REQUIRES_SKILL]->(skill:Skill)
       RETURN role.name AS role,
              collect(DISTINCT {
                name: skill.name,
                key: skill.key,
                importance: coalesce(req.importance, 'nice-to-have')
              }) AS required`,
      { resumeId }
    ),
    readQuery(
      `MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(own:Skill)
       WITH r, collect(DISTINCT own.key) AS ownedKeys
       MATCH (role:JobRole)-[:REQUIRES_SKILL]->(skill:Skill)
       WITH role, ownedKeys, collect(DISTINCT skill.key) AS requiredKeys
       RETURN role.name AS role, requiredKeys, ownedKeys`,
      { resumeId }
    ),
    readQuery(
      `MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(:Skill)<-[:HAS_SKILL]-(other:Resume)-[:HAS_SKILL]->(rec:Skill)
       WHERE other.mongoId <> $resumeId AND NOT (r)-[:HAS_SKILL]->(rec)
       RETURN rec.name AS name, count(DISTINCT other) AS coOccurrences
       ORDER BY coOccurrences DESC
       LIMIT 8`,
      { resumeId }
    ),
  ]);

  const ownedKeys = new Set((profile.skills || []).map((skill) => String(skill).toLowerCase()));

  const targetRoles = roleRows.map((row) => {
    const required = (row.required || []).filter((skill) => skill && skill.name);
    const matched = required.filter((skill) => ownedKeys.has(String(skill.key || skill.name).toLowerCase()));
    const missing = required.filter((skill) => !ownedKeys.has(String(skill.key || skill.name).toLowerCase()));

    return {
      role: row.role,
      requiredSkills: required.map((skill) => ({
        name: skill.name,
        importance: skill.importance,
      })),
      matchedSkills: matched.map((skill) => skill.name),
      missingSkills: missing.map((skill) => ({ name: skill.name, importance: skill.importance })),
      matchPercent: required.length > 0 ? Math.round((matched.length / required.length) * 100) : null,
    };
  });

  const recommendedRoles = allRoleRows
    .map((row) => {
      const requiredKeys = row.requiredKeys || [];
      const resumeKeys = new Set((row.ownedKeys || []).map((key) => String(key).toLowerCase()));
      const matched = requiredKeys.filter((key) => resumeKeys.has(String(key).toLowerCase()));
      return {
        role: row.role,
        matchedSkills: matched.length,
        totalRequired: requiredKeys.length,
        matchPercent: requiredKeys.length > 0 ? Math.round((matched.length / requiredKeys.length) * 100) : 0,
      };
    })
    .filter((role) => role.totalRequired > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent || b.matchedSkills - a.matchedSkills)
    .slice(0, 6);

  const primaryTarget = targetRoles[0] || null;
  let skillGaps = primaryTarget
    ? primaryTarget.missingSkills.map((skill) => ({ ...skill, source: 'role' }))
    : [];

  if (skillGaps.length === 0 && (profile.declaredMissing || []).length > 0) {
    skillGaps = profile.declaredMissing.map((name) => ({
      name,
      importance: 'unknown',
      source: 'resume',
    }));
  }

  return {
    resumeId: profile.resumeId,
    profile: {
      score: profile.score,
      field: profile.field,
      skills: profile.skills || [],
    },
    targetRoles,
    primaryTarget,
    skillGaps,
    recommendedRoles,
    relatedSkills: relatedRows,
  };
};

const getStats = async () => {
  const [nodeRows, relationshipRows, topSkillRows] = await Promise.all([
    readQuery(
      `MATCH (n)
       WITH labels(n)[0] AS label, count(*) AS count
       RETURN label, count
       ORDER BY count DESC`
    ),
    readQuery(
      `MATCH ()-[rel]->()
       RETURN type(rel) AS type, count(*) AS count
       ORDER BY count DESC`
    ),
    readQuery(
      `MATCH (s:Skill)<-[:HAS_SKILL]-(r:Resume)
       RETURN s.name AS name, count(DISTINCT r) AS resumes
       ORDER BY resumes DESC, name ASC
       LIMIT 10`
    ),
  ]);

  return {
    nodes: nodeRows,
    relationships: relationshipRows,
    topSkills: topSkillRows,
  };
};

const getRoles = async () => {
  await ensureCatalog().catch(() => {});

  const rows = await readQuery(
    `MATCH (role:JobRole)
     OPTIONAL MATCH (role)-[:REQUIRES_SKILL]->(skill:Skill)
     WITH role, collect(DISTINCT skill.name) AS skills
     RETURN role.name AS name,
            coalesce(role.cataloged, false) AS cataloged,
            [skill IN skills WHERE skill IS NOT NULL] AS skills
     ORDER BY name`
  );

  return rows;
};

const getRoleDetails = async (roleName) => {
  const rows = await readQuery(
    `MATCH (role:JobRole)
     WHERE toLower(role.name) = toLower($roleName) OR role.key = toLower($roleName)
     OPTIONAL MATCH (role)-[req:REQUIRES_SKILL]->(skill:Skill)
     WITH role, collect(DISTINCT {
       name: skill.name,
       importance: coalesce(req.importance, 'nice-to-have')
     }) AS requiredSkills
     RETURN role.name AS name,
            coalesce(role.cataloged, false) AS cataloged,
            [skill IN requiredSkills WHERE skill.name IS NOT NULL] AS requiredSkills`,
    { roleName }
  );

  return rows[0] || null;
};

const getRelatedSkills = async (resumeId) => {
  return readQuery(
    `MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(:Skill)<-[:HAS_SKILL]-(other:Resume)-[:HAS_SKILL]->(rec:Skill)
     WHERE other.mongoId <> $resumeId AND NOT (r)-[:HAS_SKILL]->(rec)
     RETURN rec.name AS name, count(DISTINCT other) AS coOccurrences
     ORDER BY coOccurrences DESC
     LIMIT 8`,
    { resumeId }
  );
};

module.exports = {
  canonicalSkill,
  cleanList,
  cleanTextList,
  ensureCatalog,
  getRelatedSkills,
  getResumeInsights,
  getRoleDetails,
  getRoles,
  getStats,
  isGraphAvailable,
  seedSkillCatalog,
  syncAnswerScore,
  syncCoverLetter,
  syncInterviewSession,
  syncResume,
};
