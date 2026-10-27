# ADBMS MINI PROJECT REPORT

## AI Interview Ready: A Polyglot Persistence Career Preparation Platform using MongoDB and Neo4j

**Submitted by:** [Student Name]  
**Roll Number:** [Roll Number]  
**Class / Division:** [Class]  
**Department:** [Department Name]  
**College:** [College Name]  
**Academic Year:** 2025–26  
**Project Guide:** [Guide Name]

---

# Abstract

The project **AI Interview Ready** is a full-stack career-preparation platform that analyses resumes, generates cover letters, creates interview questions, scores candidate answers, and recommends skills using a knowledge graph. The central database problem is that the application handles two very different kinds of data: semi-structured documents such as resumes, cover letters, and interview sessions, and highly connected data such as skills, job roles, companies, and questions. A single relational schema makes both requirements expensive to serve.

The project therefore uses **polyglot persistence**. **MongoDB** is the system of record for documents because its flexible document model matches resume JSON, AI output, and nested answer arrays. **Neo4j** is used as an additive relationship and recommendation layer because skill matching, skill gaps, role requirements, and related-skill discovery are natural graph traversals. The backend is built with **Node.js and Express**, the frontend with **React, Vite, and Tailwind CSS**, and the AI features use the **OpenAI API**. MongoDB is accessed through **Mongoose**, and Neo4j through the official **neo4j-driver** over Bolt.

The system performs full CRUD in both databases, keeps MongoDB as the source of truth, mirrors results into Neo4j with a `graphSynced` flag, and exposes a reindex endpoint for recovery. It also degrades gracefully: if either database is unavailable, the AI endpoints continue to work and the UI reports the database status. The graph is seeded with **14 job roles, 232 role–skill requirements, and 131 unique skills**. The implementation was verified with real PDF resumes, live MongoDB and Neo4j instances, API health checks, database verification scripts, and CRUD demonstrations.

---

# Table of Contents

1. Introduction  
2. Problem Statement  
3. Objectives  
4. Scope of the Project  
5. Existing System and Proposed System  
6. System Architecture  
7. Database Design  
8. Module and Process Working  
9. Flow-Level Design  
10. Implementation  
11. Testing and Results  
12. Advantages, Limitations, and Future Scope  
13. Conclusion  
14. References  
Appendix A – Project Structure  
Appendix B – Database CRUD Commands  
Appendix C – Viva Questions

---

# 1. Introduction

## 1.1 Background

Recruitment preparation is document-heavy and relationship-heavy at the same time. A candidate uploads a resume, receives an ATS-style score, generates a cover letter for a job, practises interview questions, and receives feedback on answers. Each of these activities produces data with a different shape:

- A resume is a large, semi-structured document with nested AI output such as skills, strengths, weaknesses, missing keywords, and suggestions.
- A cover letter is generated text linked to a resume, a job role, and a company.
- An interview session contains a list of questions and a growing array of answer evaluations.
- Skills, roles, companies, and questions are highly interconnected and are best queried by traversal rather than by joins.

A traditional relational database can store this data, but it requires many tables, many joins, and frequent schema changes whenever the AI output changes. A document database solves the flexible-schema problem, while a graph database solves the relationship problem. This project demonstrates how both can be combined in one application without making either database a single point of failure.

## 1.2 Motivation

The motivation for the project is to build a realistic ADBMS mini project rather than a theoretical demonstration. The application must:

1. Store real resume and interview data.
2. Support create, read, update, and delete operations.
3. Use indexes and constraints for integrity and performance.
4. Show a clear reason for choosing each database.
5. Continue working when a database is offline.
6. Provide visible proof that both databases are actually used.

## 1.3 Scope

The current implementation covers resume analysis, cover-letter generation, interview question generation, answer scoring, graph-based skill insights, database health monitoring, reindexing, and database CRUD verification. Authentication, payment, recruiter dashboards, and mobile applications are outside the current scope.

---

# 2. Problem Statement

Traditional career-preparation applications usually store all data in a single relational database. This creates the following problems for an AI-assisted platform:

1. **Rigid schema for AI output.** Resume analysis returns a changing JSON object containing arrays and nested feedback. Adding a new AI field requires a schema migration.
2. **Expensive relationship queries.** Questions such as “Which skills are required for this role, which of them does this candidate have, and what should be learnt next?” require multiple joins in a relational schema.
3. **Poor fit for nested documents.** Interview sessions contain arrays of answers, and each answer contains a score breakdown. Storing this in normalized tables adds complexity without providing much benefit.
4. **No recommendation layer.** A relational database can store skills, but it cannot traverse skill co-occurrence and role requirements as naturally as a graph.
5. **Fragile AI pipeline.** If the database is down, the user should still receive the AI analysis instead of a complete failure.
6. **Weak proof of database usage.** Many projects claim to use a database but do not demonstrate CRUD, indexes, constraints, or live queries.

**Formal problem statement:**  
Design and implement a full-stack career-preparation platform that stores semi-structured resume and interview documents in MongoDB, models skills, roles, companies, and questions as a graph in Neo4j, performs CRUD in both databases, synchronises MongoDB records into Neo4j, and continues to provide AI features even when one or both databases are unavailable.

---

# 3. Objectives

The main object of the project is to demonstrate **polyglot persistence** in a practical application.

## 3.1 Primary Objectives

1. Build a working MERN application with resume analysis, cover-letter generation, interview preparation, and answer scoring.
2. Use **MongoDB** as the document database for resumes, cover letters, and interview sessions.
3. Use **Neo4j** as the graph database for skills, job roles, companies, questions, and relationships.
4. Implement **create, read, update, and delete** operations in both databases.
5. Synchronise MongoDB records into Neo4j and expose a reindex mechanism.
6. Use indexes and uniqueness constraints to improve performance and data integrity.

## 3.2 Secondary Objectives

1. Provide graph-based skill-gap analysis and role recommendations.
2. Seed a skill catalogue with real job-role requirements.
3. Show live database health in the UI.
4. Ensure graceful degradation when MongoDB or Neo4j is offline.
5. Provide scripts for demo seeding, verification, and CRUD proof.
6. Document setup, API endpoints, and database commands for reproducibility.

---

# 4. Scope of the Project

| Area | Included | Not Included |
|---|---|---|
| Resume handling | PDF, DOCX, and plain text analysis | OCR for scanned images |
| AI features | Resume analysis, cover letter, questions, ideal answers, answer scoring | Model fine-tuning |
| Databases | MongoDB document store, Neo4j graph store | Distributed multi-region cluster |
| CRUD | API create/read, shell update/delete, demo scripts | Full UI edit/delete screens |
| Authentication | Anonymous browser user ID | JWT, OAuth, roles |
| Deployment | Local development | Production CI/CD |
| Analytics | Graph stats, role match, skill gaps | Recruiter analytics dashboard |

---

# 5. Existing System and Proposed System

## 5.1 Existing System

A conventional implementation would use one relational database with tables such as `users`, `resumes`, `resume_skills`, `skills`, `roles`, `role_skills`, `cover_letters`, `interview_sessions`, `questions`, and `answers`. This works for simple CRUD but becomes awkward when:

- AI output changes frequently.
- Resume data is stored as a large text blob plus many optional arrays.
- Recommendations require multi-hop relationships.
- The application needs to show skill co-occurrence across candidates.

## 5.2 Proposed System

The proposed system uses two databases with clear responsibilities:

| Database | Responsibility | Why |
|---|---|---|
| MongoDB | System of record for documents | Flexible schema, nested arrays, fast document reads/writes |
| Neo4j | Relationship and recommendation layer | Natural traversal of skills, roles, companies, and questions |

MongoDB remains the source of truth. Neo4j is additive: it can be rebuilt from MongoDB. This prevents the graph database from becoming a single point of failure.

## 5.3 Comparison

| Requirement | Relational Only | MongoDB + Neo4j |
|---|---|---|
| Store changing AI JSON | Schema migration needed | Flexible document |
| Store nested answer arrays | Multiple tables | Embedded array |
| Skill-gap query | Many joins | Graph traversal |
| Related-skill recommendation | Complex self-joins | Co-occurrence traversal |
| Rebuild recommendation layer | Difficult | Reindex from MongoDB |
| Graceful database failure | Usually fails | Degrades to AI-only mode |

---

# 6. System Architecture

The application follows a three-tier architecture.

```text
+-----------------------------------------------------------------------+
|                         PRESENTATION TIER                             |
|  React 19 + Vite + Tailwind CSS                                       |
|  Home | Resume | Cover Letter | Interview | Practice                  |
|  DatabaseStatus | GraphInsights | ScoreDisplay | ATSHighlighter        |
+-----------------------------------+-----------------------------------+
                                    | HTTPS / JSON
                                    v
+-----------------------------------------------------------------------+
|                         APPLICATION TIER                              |
|  Node.js + Express 5 REST API                                         |
|  Routes -> Controllers -> Services                                    |
|  AI helper | Scoring engine | Graph sync | Validation | Error handling |
+------------------+------------------+------------------+--------------+
                   |                  |                  |
          Mongoose |                  | Bolt / Cypher    | HTTPS
                   v                  v                  v
+-------------------------+  +-------------------------+  +-------------+
|      DOCUMENT STORE     |  |       GRAPH STORE       |  |  AI SERVICE |
|  MongoDB 8.x            |  |  Neo4j 5 Community      |  |  OpenAI API |
|  ai_interview_ready     |  |  Skill / JobRole / ...  |  |  gpt-4o-mini|
|  resumes                |  |  HAS_SKILL              |  |  embeddings |
|  coverletters           |  |  REQUIRES_SKILL         |  +-------------+
|  interviewsessions      |  |  TARGETS_ROLE           |
+-------------------------+  +-------------------------+
```

## 6.1 Components

1. **Presentation tier:** React single-page application. It collects resume files, job details, and interview answers, then renders scores, feedback, and graph insights.
2. **Application tier:** Express REST API. It validates requests, calls the AI service, persists documents, synchronises the graph, and returns JSON.
3. **Document store:** MongoDB stores the authoritative records. Mongoose provides schemas, validation, indexes, and model methods.
4. **Graph store:** Neo4j stores relationships. The official driver executes parameterised Cypher inside read/write transactions.
5. **AI service:** OpenAI generates structured resume analysis, cover letters, interview questions, ideal answers, and embeddings.

## 6.2 Design Principles

- **Single source of truth:** MongoDB owns the document data.
- **Additive graph:** Neo4j can be rebuilt with `POST /api/graph/reindex`.
- **Graceful degradation:** AI requests never fail only because a database is offline.
- **Parameterised queries:** All Cypher uses parameters to prevent injection.
- **Bounded work:** Resume text and list sizes are limited; reindex processes at most 500 records per collection.
- **Observable status:** `/api/health` and `/api/graph/status` expose database state.

---

# 7. Database Design

## 7.1 MongoDB Design

**Database:** `ai_interview_ready`  
**Driver:** Mongoose 9  
**Connection:** `mongodb://localhost:27017/ai_interview_ready`

### 7.1.1 Collections

| Collection | Purpose | Key Fields |
|---|---|---|
| `resumes` | Resume analysis records | `userId`, `resumeText`, `score`, `skills`, `missingKeywords`, `field`, `graphSynced`, `timestamp` |
| `coverletters` | Generated cover letters | `userId`, `resumeId`, `content`, `jobRole`, `company`, `graphSynced` |
| `interviewsessions` | Questions and answer evaluations | `userId`, `resumeId`, `questions`, `answers[]`, `graphSynced` |
| `crud_demo` | Isolated CRUD demonstration | Demo document used by `crudDemo.js` |

### 7.1.2 Data Dictionary – Resume Document

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | String | Anonymous browser user ID |
| `resumeText` | String | Extracted resume text |
| `parsedData` | Object | Optional parser output |
| `score` | Number | AI resume score, 0–100 |
| `skills` | [String] | Detected skills |
| `strengths` | [String] | AI strengths |
| `weaknesses` | [String] | AI weaknesses |
| `missingKeywords` | [String] | ATS keywords not found |
| `field` | String | Predicted job role |
| `suggestions` | [String] | Improvement tips |
| `atsFeedback` | String | ATS feedback |
| `grammarFeedback` | String | Grammar and formatting feedback |
| `fileName` | String | Original upload name |
| `mimeType` | String | PDF/DOCX/plain text |
| `source` | String | `upload` or `text` |
| `graphSynced` | Boolean | True when Neo4j sync succeeded |
| `timestamp` | Date | Creation time |

### 7.1.3 Data Dictionary – Interview Session

| Field | Type | Notes |
|---|---|---|
| `userId` | String | Anonymous user ID |
| `resumeId` | ObjectId | Reference to `resumes` |
| `questions` | [String] | Generated interview questions |
| `answers` | Array | Embedded answer evaluations |
| `answers[].question` | String | Question text |
| `answers[].answer` | String | Candidate answer |
| `answers[].scores` | Object | Total and component scores |
| `answers[].feedback` | String | Feedback text |
| `answers[].idealAnswer` | String | AI ideal answer |
| `answers[].timestamp` | Date | Answer time |
| `graphSynced` | Boolean | Neo4j sync status |

### 7.1.4 Indexes

MongoDB indexes are created at startup with `syncIndexes()`.

| Collection | Index | Purpose |
|---|---|---|
| `resumes` | `{ userId: 1, timestamp: -1 }` | User history, newest first |
| `resumes` | `{ timestamp: -1 }` | Latest resumes |
| `resumes` | `{ field: 1 }` | Filter by predicted role |
| `coverletters` | `{ userId: 1, timestamp: -1 }` | User cover-letter history |
| `coverletters` | `{ timestamp: -1 }` | Latest cover letters |
| `coverletters` | `{ company: 1 }` | Company lookup |
| `interviewsessions` | `{ userId: 1, timestamp: -1 }` | User interview history |
| `interviewsessions` | `{ timestamp: -1 }` | Latest sessions |

### 7.1.5 Sample MongoDB Document

```json
{
  "_id": "6adebdad771321d9a51c05a9",
  "userId": "user_9f2c...",
  "score": 85,
  "skills": ["Python", "SQL", "Pandas", "Machine Learning"],
  "missingKeywords": ["Docker", "MLOps"],
  "field": "Software Engineer - Data Science",
  "graphSynced": true,
  "timestamp": "2026-10-20T10:15:00.000Z"
}
```

## 7.2 Neo4j Design

**Database:** `neo4j`  
**URI:** `neo4j://localhost:7687`  
**Browser:** `http://localhost:7474`

### 7.2.1 Node Labels

| Label | Key Property | Purpose |
|---|---|---|
| `User` | `id` | Anonymous browser user |
| `Resume` | `mongoId` | Mirror of MongoDB resume |
| `CoverLetter` | `mongoId` | Mirror of MongoDB cover letter |
| `InterviewSession` | `mongoId` | Mirror of interview session |
| `Skill` | `key` | Canonical skill name |
| `JobRole` | `key` | Job role |
| `Company` | `key` | Company |
| `Question` | `key` | Interview question |

### 7.2.2 Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| `HAS_RESUME` | User → Resume | — | User owns resume |
| `HAS_SKILL` | Resume → Skill | — | Skill present in resume |
| `MISSING_SKILL` | Resume → Skill | — | Skill identified as a gap |
| `TARGETS_ROLE` | Resume → JobRole | — | Predicted target role |
| `REQUIRES_SKILL` | JobRole → Skill | `importance` | Role requirement |
| `APPLIED_FOR` | Resume → JobRole | — | Role targeted through a cover letter |
| `GENERATED_FROM` | CoverLetter → Resume | — | Cover letter source |
| `FOR_ROLE` | CoverLetter → JobRole | — | Target role |
| `TO_COMPANY` | CoverLetter → Company | — | Target company |
| `HAS_COVER_LETTER` | User → CoverLetter | — | User owns cover letter |
| `PRACTICED` | Resume/User → InterviewSession | — | Interview practice |
| `HAS_QUESTION` | InterviewSession → Question | — | Generated question |
| `ANSWERED` | InterviewSession → Question | `score`, `updatedAt` | Answer score for question |

### 7.2.3 Graph Model

```text
                         +-------------+
                         |    User     |
                         +------+------+
                                |
                         HAS_RESUME / HAS_COVER_LETTER / PRACTICED
                                |
        +-----------------------+------------------------+
        |                       |                        |
+-------v--------+      +-------v--------+       +-------v-----------+
|    Resume      |      |  CoverLetter   |       | InterviewSession  |
+---+--------+---+      +---+--------+---+       +---+------------+--+
    |        |              |        |               |            |
HAS_SKILL  TARGETS_ROLE  FOR_ROLE  TO_COMPANY   HAS_QUESTION   PRACTICED
    |        |              |        |               |            |
    v        v              v        v               v            v
+-------+ +--------+   +--------+ +---------+   +----------+  +-------+
| Skill | |JobRole |   |JobRole | | Company |   | Question |  | User  |
+-------+ +---+----+   +--------+ +---------+   +----+-----+  +-------+
              |                                      ^
              | REQUIRES_SKILL                       | ANSWERED {score}
              v                                      |
          +-------+                                  |
          | Skill |                                  |
          +-------+                                  |
                                                     |
              Resume - MISSING_SKILL -> Skill        |
              Resume - PRACTICED -> InterviewSession + 
```

### 7.2.4 Constraints

| Constraint | Label | Property |
|---|---|---|
| `resume_mongo_id` | `Resume` | `mongoId` unique |
| `cover_letter_mongo_id` | `CoverLetter` | `mongoId` unique |
| `interview_session_mongo_id` | `InterviewSession` | `mongoId` unique |
| `skill_key` | `Skill` | `key` unique |
| `role_key` | `JobRole` | `key` unique |
| `company_key` | `Company` | `key` unique |
| `question_key` | `Question` | `key` unique |
| `user_id` | `User` | `id` unique |

These constraints make `MERGE` operations safe and prevent duplicate nodes during repeated synchronisation.

### 7.2.5 Sample Cypher

```cypher
// Resume skills
MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(s:Skill)
RETURN s.name AS skill
ORDER BY skill;

// Skill gaps for the target role
MATCH (r:Resume { mongoId: $resumeId })-[:TARGETS_ROLE]->(role:JobRole)
MATCH (role)-[req:REQUIRES_SKILL]->(skill:Skill)
WHERE NOT (r)-[:HAS_SKILL]->(skill)
RETURN role.name AS role, skill.name AS missingSkill, req.importance AS importance
ORDER BY importance, missingSkill;

// Related skills from other resumes
MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(:Skill)<-[:HAS_SKILL]-(other:Resume)
MATCH (other)-[:HAS_SKILL]->(rec:Skill)
WHERE other.mongoId <> $resumeId AND NOT (r)-[:HAS_SKILL]->(rec)
RETURN rec.name AS relatedSkill, count(DISTINCT other) AS coOccurrences
ORDER BY coOccurrences DESC
LIMIT 8;
```

## 7.3 Polyglot Persistence Rationale

| Data | Store | Reason |
|---|---|---|
| Resume text and AI JSON | MongoDB | Flexible schema, large text, nested arrays |
| Interview answers | MongoDB | Embedded array avoids join-heavy schema |
| Skills and roles | Neo4j | Multi-hop traversal |
| Skill gaps | Neo4j | `TARGETS_ROLE` + `REQUIRES_SKILL` + `NOT HAS_SKILL` |
| Related skills | Neo4j | Co-occurrence across resumes |
| Companies and questions | Neo4j | Shared entities and relationships |

## 7.4 Synchronisation and Consistency

1. The API writes the document to MongoDB first.
2. It calls `syncResume`, `syncCoverLetter`, `syncInterviewSession`, or `syncAnswerScore`.
3. Neo4j uses `MERGE` on the MongoDB ID to make the operation idempotent.
4. On success, the MongoDB document is updated with `graphSynced: true`.
5. If Neo4j is unavailable, the API still returns the AI result with `graph.synced = false`.
6. `POST /api/graph/reindex` rebuilds graph data from MongoDB for up to 500 records per collection.
7. Reindex updates existing nodes but does **not** delete nodes whose MongoDB documents were removed. Permanent deletes must remove the Neo4j node explicitly.

This is **eventual consistency** between the two databases, which is acceptable because Neo4j is a derived recommendation layer, not the source of truth.

## 7.5 Normalisation and Denormalisation Decisions

The project deliberately mixes normalised and denormalised modelling:

| Decision | Approach | Reason |
|---|---|---|
| Interview answers | Embedded array inside `interviewsessions` | Answers are always read with their session; embedding avoids joins and keeps writes atomic per document |
| Resume AI output | Embedded fields and arrays | The AI response is a single logical document and changes frequently |
| Skills | Separate `Skill` nodes in Neo4j | Shared entities must be reused across resumes and roles |
| Role requirements | `REQUIRES_SKILL` edges | Many-to-many relationship with an `importance` property |
| Cross-database reference | `mongoId` property on graph nodes | Acts as a foreign key between MongoDB and Neo4j |
| User identity | Anonymous `userId` string in both stores | Connects documents to the graph without an authentication table |

MongoDB provides single-document atomicity, which is sufficient because each resume, cover letter, or interview session is written as one document. Neo4j writes use explicit read/write transactions, so a resume sync either commits all its edges or fails as a unit. Concurrent syncs are safe because `MERGE` and unique constraints collapse duplicate writes into one node. There is **no distributed transaction** spanning both databases; the `graphSynced` flag and reindex endpoint provide recovery instead.

---

# 8. Module and Process Working

## 8.1 Module Overview

| Module | Input | Process | Output |
|---|---|---|---|
| Resume Analysis | PDF/DOCX/text | Parse, AI analysis, MongoDB save, Neo4j sync | Score, skills, gaps, suggestions |
| Cover Letter | Resume ID, role, company, JD | AI generation, MongoDB save, Neo4j sync | Cover letter text |
| Interview Preparation | Resume ID | AI question generation, MongoDB save, Neo4j sync | 10 questions and session ID |
| Answer Scoring | Question, answer, session ID | Ideal answer, embeddings, NLP scoring, persistence | Score breakdown and feedback |
| Graph Insights | Resume ID | Cypher traversal, role matching, co-occurrence | Skill gaps and recommended roles |
| Health and Reindex | — | Status checks, rebuild graph | Health JSON, sync counts |
| CRUD and Verification | Database commands | Insert, read, update, delete, verify | Proof of dual-database CRUD |

## 8.2 Resume Analysis Module

**Working:**

1. The user uploads a PDF, DOCX, or plain-text resume from the React UI.
2. `multer` receives the file in memory with a 5 MB file-size limit and MIME validation for PDF, DOCX, and plain text; Express also limits JSON bodies to 2 MB.
3. `pdf-parse` extracts PDF text; `mammoth` extracts DOCX text; plain text is read directly.
4. `analyzeResume()` sends the text to OpenAI `gpt-4o-mini` with a JSON response format.
5. The returned JSON contains `score`, `skills`, `strengths`, `weaknesses`, `missingKeywords`, `field`, `suggestions`, `atsFeedback`, and `grammarFeedback`.
6. The API creates a `resumes` document in MongoDB.
7. `syncResume()` creates or updates a `Resume` node in Neo4j, links skills, missing skills, target role, and user.
8. The API returns the analysis, `resumeId`, MongoDB persistence status, and graph sync status.

**Failure handling:** If MongoDB is offline, the analysis is still returned with `persistence.mongo = false`. If Neo4j is offline, the analysis is returned with `graph.synced = false`.

## 8.3 Cover Letter Module

**Working:**

1. The user selects a resume and enters job role, company, and job description.
2. The API fetches `resumeText` from MongoDB when the resume ID is valid.
3. `generateCoverLetter()` prompts OpenAI for a formal three-paragraph letter.
4. The letter is saved in the `coverletters` collection.
5. `syncCoverLetter()` creates a `CoverLetter` node and links it to the resume, role, company, and user.
6. The API returns the letter, ID, and persistence status.

## 8.4 Interview Preparation Module

**Working:**

1. The user requests interview questions for a resume.
2. The API fetches the resume text.
3. `generateQuestions()` asks for 10 questions: five technical, three HR, and two behavioural STAR questions.
4. The questions are stored in `interviewsessions.questions`.
5. `syncInterviewSession()` creates an `InterviewSession` node and links each question with `HAS_QUESTION`.
6. The API returns the questions and session ID.

## 8.5 Answer Scoring Module

**Working:**

1. The user submits a question, answer, resume ID, and session ID.
2. The API generates an ideal answer with OpenAI.
3. It creates embeddings for the candidate answer and the ideal answer using `text-embedding-3-small`.
4. It calculates cosine similarity.
5. It calculates keyword overlap, STAR structure, length, redundancy, filler words, quantification, and action verbs.
6. It combines the components into a score out of 10.
7. It appends the answer and score breakdown to the MongoDB interview session.
8. It creates an `ANSWERED` relationship in Neo4j with the score.
9. It returns the total score, breakdown, feedback, and ideal answer.

**Scoring formula:**

```text
total = 0.45 × semantic
      + 0.15 × keywords
      + 0.25 × STAR
      + 0.10 × length
      + 0.05 × redundancy
      - 0.02 × fillerCount
      + 0.05 × quantificationBonus
      + 0.05 × actionVerbBonus

totalScore = clamp(total × 10, 0, 10)
```

| Component | Meaning |
|---|---|
| Semantic | Cosine similarity between answer and ideal-answer embeddings |
| Keywords | Overlap with ideal-answer tokens |
| STAR | Presence of situation, task, action, result |
| Length | Ideal range 50–200 words |
| Redundancy | Unique-token ratio |
| Filler | Penalty for “um”, “uh”, “like”, “you know” |
| Quantification | Bonus for numbers or metrics |
| Action verbs | Bonus for led, built, managed, created, improved, developed, implemented |

## 8.6 Graph Insights and Recommendation Module

**Working:**

1. The graph catalog is seeded from `ROLE_CATALOG`.
2. The catalog contains **14 roles**, **232 role–skill requirements**, and **131 unique skills**.
3. `getResumeInsights()` reads the resume node, owned skills, declared missing skills, and target roles.
4. It compares the resume's skills with the target role's `REQUIRES_SKILL` relationships.
5. It calculates `matchPercent = matched / required × 100`.
6. It recommends roles by comparing the resume's skills with every catalog role.
7. It finds related skills through co-occurrence: skills that appear in other resumes alongside the candidate's skills.
8. The React `GraphInsights` panel displays target role match, missing skills, recommended roles, and related skills.

**Roles in the catalog:** Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, Data Analyst, Machine Learning Engineer, DevOps Engineer, Cloud Engineer, Mobile Developer, Cybersecurity Analyst, Product Manager, UI/UX Designer, Software Engineer, Business Analyst.

## 8.7 Health, Reindex, and Graceful Degradation Module

**Health:** `GET /api/health` returns MongoDB and Neo4j state and an overall status of `healthy` or `degraded`.

**Graph status:** `GET /api/graph/status` returns configuration, connection, URI, database, and last error.

**Reindex:** `POST /api/graph/reindex` reads up to 500 resumes, cover letters, and interview sessions from MongoDB and calls the sync functions. It returns counts of synced and failed records.

**Graceful degradation:**

- MongoDB down: AI endpoints still work; document persistence is skipped; history returns `503`.
- Neo4j down: graph endpoints return `503`; AI and MongoDB features continue.
- Both down: AI endpoints still return analysis; no persistence and no graph.
- Neo4j reconnects at most once every 60 seconds to avoid slowing requests.

## 8.8 CRUD and Verification Module

- UI supports **create** and **read** for resumes, cover letters, and interviews.
- Update and delete are demonstrated through `mongosh` and Cypher.
- `npm run db:crud-demo` performs an isolated CRUD cycle in `crud_demo` and `CrudDemo`/`CrudSkill`, then cleans up.
- `npm run db:crud-demo -- --keep` leaves the demo records for inspection.
- `npm run db:verify` prints MongoDB collection counts and Neo4j node/relationship counts.
- `npm run db:seed-demo` creates idempotent demo documents and syncs them to Neo4j.

---

# 9. Flow-Level Design

## 9.1 Level 0 Context Diagram

```text
                 +--------------------------------------+
                 |            CANDIDATE / USER          |
                 +------------------+-------------------+
                                    |
          resume, job details,      |      analysis, letter, questions,
          answers, resume ID        |      scores, graph insights
                                    v
+-------------------+     +---------------------+     +-------------------+
|      ADMIN        |---->|  AI INTERVIEW READY |---->|      ADMIN        |
| verify / reindex  |     |      SYSTEM         |     | health / counts   |
+-------------------+     +----+-----------+----+     +-------------------+
                               |           |
                    documents  |           |  graph sync / Cypher
                               v           v
                     +----------------+  +----------------+
                     | D1 MongoDB     |  | D2 Neo4j       |
                     | ai_interview   |  | knowledge      |
                     | _ready         |  | graph          |
                     +----------------+  +----------------+
                               |
                               | AI prompts / JSON / embeddings
                               v
                     +----------------+
                     |  OpenAI API    |
                     +----------------+
```

## 9.2 Level 1 Data Flow Diagram

```text
 CANDIDATE
    |
    +--> 1.0 Resume Analysis -----> OpenAI API
    |         |                         ^
    |         +--> D1 MongoDB           |
    |         +--> D2 Neo4j             |
    |                                   |
    +--> 2.0 Cover Letter Generation --> OpenAI API
    |         +--> D1 MongoDB
    |         +--> D2 Neo4j
    |
    +--> 3.0 Interview Preparation ---> OpenAI API
    |         +--> D1 MongoDB
    |         +--> D2 Neo4j
    |
    +--> 4.0 Answer Scoring ----------> OpenAI API
    |         +--> D1 MongoDB
    |         +--> D2 Neo4j
    |
    +--> 5.0 Graph Insights <----------> D2 Neo4j
    |
    +--> 6.0 Health / Reindex <-------> D1 MongoDB
                                       D2 Neo4j
```

## 9.3 Resume Analysis Sequence

```text
Candidate     React UI      Express API      OpenAI       MongoDB      Neo4j
    |             |              |              |            |           |
    |-- upload -->|              |              |            |           |
    |             |-- POST ----->|              |            |           |
    |             |              |-- parse ---->|            |           |
    |             |              |-- analyze -->|            |           |
    |             |              |<-- JSON -----|            |           |
    |             |              |-- create ----------------->|           |
    |             |              |<-- resumeId --------------|           |
    |             |              |-- syncResume ------------------------>|
    |             |              |<-- synced ----------------------------|
    |             |<-- result ---|              |            |           |
    |<-- render --|              |              |            |           |
    |             |-- GET insights --------------------------->|           |
    |             |              |-- Cypher ----------------------------->|
    |             |              |<-- gaps / roles ----------------------|
    |             |<-- insights -|              |            |           |
```

## 9.4 Graph Synchronisation Flow

```text
MongoDB write
     |
     v
Check graph configured?
     | yes                         | no
     v                             v
Open Neo4j session            Return {synced:false, skipped:true}
     |
     v
MERGE Resume {mongoId}
     |
     v
Delete old HAS_SKILL / MISSING_SKILL / TARGETS_ROLE edges
     |
     v
MERGE Skill nodes and HAS_SKILL edges
     |
     v
MERGE missing Skill nodes and MISSING_SKILL edges
     |
     v
MERGE JobRole node and TARGETS_ROLE edge
     |
     v
MERGE User node and HAS_RESUME edge
     |
     v
Commit transaction
     |
     v
Set MongoDB graphSynced = true
```

## 9.5 Level 2 DFD – Resume Analysis

```text
PDF / DOCX / text
       |
       v
+-------------------+
| 1.1 Validate file |  MIME type, 5 MB limit
+---------+---------+
          |
          v
+-------------------+     +----------------------+
| 1.2 Extract text  |---->| pdf-parse / mammoth  |
+---------+---------+     +----------------------+
          |
          v
+-------------------+     +----------------------+
| 1.3 AI analysis   |---->| OpenAI gpt-4o-mini   |
+---------+---------+     +----------------------+
          | JSON
          v
+-------------------+     +----------------------+
| 1.4 Save document |---->| D1 MongoDB resumes   |
+---------+---------+     +----------------------+
          |
          v
+-------------------+     +----------------------+
| 1.5 Sync graph    |---->| D2 Neo4j Resume,     |
|                   |     | Skill, JobRole       |
+---------+---------+     +----------------------+
          |
          v
+-------------------+     +----------------------+
| 1.6 Return result |---->| React UI             |
+-------------------+     +----------------------+
```

## 9.6 Answer Scoring Flow

```text
Candidate answer
      |
      v
Generate ideal answer (OpenAI)
      |
      v
Generate embeddings for answer and ideal answer (OpenAI)
      |
      v
Cosine similarity + keyword overlap + STAR + length + redundancy
      |
      v
Filler penalty + quantification bonus + action-verb bonus
      |
      v
Weighted total -> score out of 10
      |
      +--> Append answer to MongoDB interview session
      |
      +--> MERGE ANSWERED relationship in Neo4j with score
      |
      v
Return score breakdown, feedback, ideal answer
```

---

# 10. Implementation

## 10.1 Technology Stack

| Layer | Technology | Version / Role |
|---|---|---|
| Frontend | React | 19.2.5 |
| Build tool | Vite | 8.0.10 |
| Styling | Tailwind CSS | 4.2.4 |
| HTTP client | Axios | 1.15.2 |
| PDF export | jsPDF | 4.2.1 |
| Backend | Node.js + Express | Express 5.2.1 |
| Document DB | MongoDB | 8.2.6 local service |
| ODM | Mongoose | 9.6.1 |
| Graph DB | Neo4j | 5 Community |
| Graph driver | neo4j-driver | 5.28.3 |
| AI | OpenAI API | `gpt-4o-mini`, `text-embedding-3-small` |
| NLP | natural | 8.1.1 |
| File parsing | pdf-parse, mammoth | PDF and DOCX |
| Upload | multer | 2.1.1 |
| Security | helmet, cors | Headers and allowed origins |

## 10.2 Project Structure

```text
Resume_Analyzer/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection, status, index sync
│   │   └── neo4j.js              # Neo4j driver, constraints, reconnect
│   ├── controllers/
│   │   ├── resumeController.js
│   │   ├── coverLetterController.js
│   │   ├── interviewController.js
│   │   └── graphController.js
│   ├── data/
│   │   └── skillCatalog.js       # 14 roles / 232 requirements / 131 skills
│   ├── middleware/
│   │   └── upload.js             # multer memory upload
│   ├── models/
│   │   ├── Resume.js
│   │   ├── CoverLetter.js
│   │   └── InterviewSession.js
│   ├── routes/
│   │   ├── resume.js
│   │   ├── coverLetter.js
│   │   ├── interview.js
│   │   └── graph.js
│   ├── scripts/
│   │   ├── seedGraph.js
│   │   ├── seedDemo.js
│   │   ├── verifyDatabases.js
│   │   └── crudDemo.js
│   ├── services/
│   │   └── graphService.js       # sync + Cypher insights
│   ├── utils/
│   │   ├── openaiHelper.js
│   │   ├── pdfParser.js
│   │   └── scoringEngine.js
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatabaseStatus.jsx
│   │   │   ├── GraphInsights.jsx
│   │   │   ├── ATSHighlighter.jsx
│   │   │   ├── ScoreDisplay.jsx
│   │   │   └── AnswerScorer.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ResumePage.jsx
│   │   │   ├── CoverLetterPage.jsx
│   │   │   ├── InterviewPage.jsx
│   │   │   └── AnswerPage.jsx
│   │   └── services/api.js
│   └── .env.example
├── docker-compose.yml
├── .env.example
├── README.md
└── DEMO_COMMANDS.md
```

## 10.3 Backend Implementation

### 10.3.1 Server Bootstrap

`server.js` loads environment variables, configures Helmet and CORS, parses JSON, mounts routes, exposes `/api/health`, starts the server, connects to MongoDB and Neo4j in the background, seeds the graph catalog, and installs graceful shutdown handlers.

```js
app.get('/api/health', (req, res) => {
  const mongodb = getMongoStatus();
  const neo4j = getNeo4jStatus();
  res.json({
    success: true,
    databases: { mongodb, neo4j },
    status: mongodb.connected
      ? (neo4j.connected ? 'healthy' : 'degraded')
      : 'degraded',
  });
});
```

### 10.3.2 MongoDB Connection

`config/db.js` connects with a 10-second server-selection timeout, a pool size of 10, and `bufferCommands = false` so requests fail fast when MongoDB is down. After connecting, it synchronises all Mongoose indexes.

```js
const conn = await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10_000,
  maxPoolSize: 10,
});
await syncModelIndexes();
```

### 10.3.3 Neo4j Connection and Constraints

`config/neo4j.js` verifies connectivity, creates uniqueness constraints, uses read/write transactions, and retries at most once every 60 seconds. The app continues if Neo4j is unavailable.

```js
const constraints = [
  'CREATE CONSTRAINT resume_mongo_id IF NOT EXISTS FOR (r:Resume) REQUIRE r.mongoId IS UNIQUE',
  'CREATE CONSTRAINT skill_key IF NOT EXISTS FOR (s:Skill) REQUIRE s.key IS UNIQUE',
  'CREATE CONSTRAINT role_key IF NOT EXISTS FOR (r:JobRole) REQUIRE r.key IS UNIQUE',
];
```

### 10.3.4 Resume Controller

The controller parses the uploaded file, calls the AI helper, persists to MongoDB, and syncs to Neo4j. It returns both persistence statuses.

```js
const storage = await persistAndSyncResume(payload, getUserId(req));
res.json({
  resumeId: storage.resumeId,
  ...analysis,
  persistence: { mongo: storage.persisted },
  graph: storage.graph,
});
```

### 10.3.5 Graph Sync

`syncResume()` is idempotent. It uses `MERGE` on `mongoId`, removes old skill/role edges, and recreates the current graph. All Cypher is parameterised.

```cypher
MERGE (r:Resume { mongoId: $resumeId })
SET r.score = $score, r.field = $field, r.updatedAt = datetime();

MATCH (r:Resume { mongoId: $resumeId })
UNWIND $skills AS skillName
MERGE (s:Skill { key: toLower(trim(skillName)) })
  ON CREATE SET s.name = trim(skillName)
MERGE (r)-[:HAS_SKILL]->(s);
```

### 10.3.6 Answer Scoring

`scoringEngine.js` combines semantic similarity and NLP heuristics. The result is rounded to one decimal and returned out of 10.

```js
let totalScore = (
  semantic * 0.45 +
  keywords * 0.15 +
  starScore * 0.25 +
  lengthScore * 0.10 +
  redundancy * 0.05 +
  fillerPenalty +
  quantificationBonus +
  actionVerbsBonus
);
totalScore = Math.max(0, Math.min(10, totalScore * 10));
```

## 10.4 Frontend Implementation

| Page / Component | Responsibility |
|---|---|
| `Home.jsx` | Landing page and `DatabaseStatus` card |
| `ResumePage.jsx` | Upload/analyse resume, show score and `GraphInsights` |
| `CoverLetterPage.jsx` | Generate and download cover letter |
| `InterviewPage.jsx` | Generate questions and navigate to practice |
| `AnswerPage.jsx` | Submit answer and show score breakdown |
| `DatabaseStatus.jsx` | Live MongoDB and Neo4j status |
| `GraphInsights.jsx` | Target role match, gaps, recommended roles, related skills |
| `ATSHighlighter.jsx` | Highlight missing keywords |
| `ScoreDisplay.jsx` | Circular score display |
| `AnswerScorer.jsx` | Answer feedback and component scores |
| `services/api.js` | Axios client, anonymous user ID, error handling |

The frontend creates a stable anonymous user ID in `localStorage` and sends it as `x-user-id`. This connects MongoDB `userId` fields with the Neo4j `User` node without requiring login.

## 10.5 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend and database health |
| POST | `/api/resume/upload` | Upload and analyse PDF/DOCX |
| POST | `/api/resume/analyze-text` | Analyse pasted/plain text |
| GET | `/api/resume/history` | Recent resume analyses |
| POST | `/api/coverletter/generate` | Generate cover letter |
| POST | `/api/interview/generate` | Generate interview questions |
| POST | `/api/interview/score-answer` | Score an answer |
| GET | `/api/graph/status` | Neo4j status |
| GET | `/api/graph/stats` | Node, relationship, and top-skill counts |
| GET | `/api/graph/roles` | List catalog roles |
| GET | `/api/graph/roles/:role` | Role details and required skills |
| GET | `/api/graph/insights/:resumeId` | Skill gaps and recommendations |
| POST | `/api/graph/seed` | Seed role/skill catalog |
| POST | `/api/graph/reindex` | Rebuild graph from MongoDB |

## 10.6 Environment Setup

**Backend `.env`:**

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000,http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/ai_interview_ready
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_local_password
NEO4J_DATABASE=neo4j
OPENAI_API_KEY=sk-your-key-here
```

**Frontend `.env`:**

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_OPENAI_API_KEY=sk-your-key-here
```

Real `.env` files are ignored by Git. Only `.env.example` templates are committed.

## 10.7 Running the Project

```powershell
# 1. Start MongoDB (local service) and Neo4j (Docker)
docker compose up -d neo4j

# 2. Backend
cd backend
npm install
Copy-Item .env.example .env
npm start

# 3. Frontend
cd ..\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## 10.8 Database CRUD Demonstration

### MongoDB Create

```javascript
db.resumes.insertOne({
  userId: "user_demo",
  score: 82,
  skills: ["JavaScript", "React", "MongoDB"],
  field: "Full Stack Developer",
  graphSynced: false,
  timestamp: new Date()
});
```

### MongoDB Read

```javascript
db.resumes.find({ field: "Full Stack Developer" }).sort({ timestamp: -1 }).limit(5);
```

### MongoDB Update

```javascript
db.resumes.updateOne(
  { _id: ObjectId("PASTE_RESUME_ID") },
  { $set: { score: 88, graphSynced: false } }
);
```

### MongoDB Delete

```javascript
db.resumes.deleteOne({ _id: ObjectId("PASTE_RESUME_ID") });
```

### Neo4j Create / Merge

```cypher
MERGE (r:Resume { mongoId: $resumeId })
SET r.score = 82, r.field = "Full Stack Developer"
MERGE (s:Skill { key: "react" })
  ON CREATE SET s.name = "React"
MERGE (r)-[:HAS_SKILL]->(s);
```

### Neo4j Read

```cypher
MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(s:Skill)
RETURN r.mongoId AS resume, collect(s.name) AS skills;
```

### Neo4j Update

```cypher
MATCH (r:Resume { mongoId: $resumeId })-[rel:HAS_SKILL]->(s:Skill { key: "react" })
SET r.score = 88
RETURN r, rel, s;
```

### Neo4j Delete

```cypher
MATCH (r:Resume { mongoId: $resumeId })
DETACH DELETE r;
```

## 10.9 Security and Reliability Measures

| Measure | Implementation |
|---|---|
| HTTP headers | Helmet middleware |
| Cross-origin access | CORS whitelist from `CLIENT_URL` |
| Secret management | `.env` files ignored; only `.env.example` committed |
| Cypher injection | Parameterised Cypher queries |
| File upload safety | MIME filter and 5 MB limit |
| Error disclosure | Stack trace only when `NODE_ENV=development` |
| Database failure | AI endpoints continue; status flags returned |
| Neo4j reconnect | At most one attempt per 60 seconds |
| Unbounded input | List size capped at 120; reindex capped at 500 per collection |
| Graceful shutdown | SIGINT/SIGTERM close Neo4j and MongoDB connections |

---

# 11. Testing and Results

## 11.1 Test Cases

| No. | Test | Expected Result | Status |
|---|---|---|---|
| 1 | Backend health | `success: true`, MongoDB and Neo4j status | Pass |
| 2 | Upload real PDF resume | Score, skills, suggestions returned | Pass |
| 3 | MongoDB persistence | Resume document created | Pass |
| 4 | Neo4j sync | Resume, Skill, JobRole nodes and edges created | Pass |
| 5 | Graph insights | Match %, missing skills, recommended roles | Pass |
| 6 | Cover letter generation | Letter saved and linked to resume | Pass |
| 7 | Interview questions | 10 questions saved in session | Pass |
| 8 | Answer scoring | Score breakdown and feedback returned | Pass |
| 9 | MongoDB offline | AI still returns analysis, persistence false | Pass |
| 10 | Neo4j offline | AI and MongoDB still work, graph unavailable | Pass |
| 11 | Reindex | Existing documents re-synced to Neo4j | Pass |
| 12 | CRUD demo | Create, read, update, delete in both DBs | Pass |
| 13 | Frontend lint/build | No blocking errors | Pass |

## 11.2 Database Verification

`npm run db:verify` prints:

- MongoDB database name and host.
- Collection counts.
- Latest resume ID, field, score, skills, and `graphSynced`.
- Neo4j URI and database.
- Node counts by label.
- Relationship counts by type.
- Graph edges for the latest resume.

Expected output pattern:

```text
MongoDB: ai_interview_ready @ 127.0.0.1
  resumes              2 documents
  coverletters         1 document
  interviewsessions    1 document

Neo4j: neo4j://localhost:7687 (database: neo4j)
  Node counts:
  Skill                131
  JobRole              14
  Resume               2
  User                 1
  Relationship counts:
  REQUIRES_SKILL       232
  HAS_SKILL            ...
  TARGETS_ROLE         2
```

## 11.3 Observed Results

- The graph catalog contains **14 roles**, **232 role–skill requirements**, and **131 unique skills**.
- Resume analysis produced a score and skill list for real PDF resumes.
- Graph insights returned target-role match percentages, missing skills, recommended roles, and related skills.
- Interview answer scoring returned component scores for semantic similarity, keywords, STAR, length, redundancy, filler, quantification, and action verbs.
- The UI displayed live database status and graph insights without blocking the main AI flow.
- Full CRUD was demonstrated in both databases.

## 11.4 Sample Graph Query Results

**Skill gaps for a target role:**

```cypher
MATCH (r:Resume { mongoId: $resumeId })-[:TARGETS_ROLE]->(role:JobRole)
MATCH (role)-[req:REQUIRES_SKILL]->(skill:Skill)
WHERE NOT (r)-[:HAS_SKILL]->(skill)
RETURN role.name AS role, skill.name AS missingSkill, req.importance AS importance
ORDER BY importance, missingSkill;
```

The result is a list such as `Docker`, `MLOps`, and `Kubernetes`, depending on the resume and target role.

**Related skills:**

```cypher
MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(:Skill)<-[:HAS_SKILL]-(other:Resume)
MATCH (other)-[:HAS_SKILL]->(rec:Skill)
WHERE other.mongoId <> $resumeId AND NOT (r)-[:HAS_SKILL]->(rec)
RETURN rec.name AS relatedSkill, count(DISTINCT other) AS coOccurrences
ORDER BY coOccurrences DESC
LIMIT 8;
```

This provides recommendations that would require a much more complex relational self-join.

---

# 12. Advantages, Limitations, and Future Scope

## 12.1 Advantages

1. **Correct database for each data shape.** Documents go to MongoDB; relationships go to Neo4j.
2. **Flexible AI output.** New AI fields do not require a migration.
3. **Fast relationship queries.** Skill gaps and recommendations use graph traversal.
4. **Fault tolerance.** The AI pipeline works even when a database is offline.
5. **Idempotent sync.** `MERGE` and unique constraints prevent duplicates.
6. **Observable system.** Health and graph-status endpoints expose database state.
7. **Reproducible demonstration.** Seed, verify, and CRUD scripts make the project easy to evaluate.
8. **Real CRUD proof.** Both databases are exercised with create, read, update, and delete.

## 12.2 Limitations

1. No authentication or authorisation; the app uses an anonymous browser ID.
2. The UI supports create/read but not full update/delete screens.
3. MongoDB and Neo4j are not updated in a single distributed transaction; consistency is eventual.
4. Reindex does not delete stale Neo4j nodes.
5. The local setup uses single-node databases, not a production cluster.
6. OpenAI calls require network access and an API key.
7. Graph recommendations depend on the size and quality of resume data.

## 12.3 Future Scope

1. Add JWT authentication and user profiles.
2. Add UI screens for update and delete.
3. Use an outbox pattern or background queue for reliable graph synchronisation.
4. Add transactional consistency checks and automatic stale-node cleanup.
5. Add recruiter dashboards and job-posting matching.
6. Add caching for graph insights.
7. Add unit, integration, and end-to-end tests.
8. Deploy MongoDB Atlas and Neo4j Aura with monitoring.
9. Add PDF report export for analysis and interview results.
10. Add multilingual resume support.

---

# 13. Conclusion

The project demonstrates that **polyglot persistence is not just a theoretical concept**. MongoDB and Neo4j solve different but complementary problems in the same application. MongoDB provides a flexible, indexed document store for resumes, cover letters, and interview sessions. Neo4j provides a natural model for skills, roles, companies, questions, and recommendations. The Express API coordinates both databases while keeping MongoDB as the source of truth. The frontend makes the dual-database behaviour visible through status cards and graph insights.

The implementation covers full CRUD, indexes, uniqueness constraints, parameterised Cypher, idempotent synchronisation, reindexing, graceful degradation, AI integration, and verification scripts. It satisfies the requirements of an ADBMS mini project because it shows not only how data is stored, but also why each database was chosen, how data is modelled, how integrity is maintained, and how the system behaves when a database is unavailable.

---

# 14. References

1. MongoDB Documentation — https://www.mongodb.com/docs/
2. MongoDB Manual: Indexes — https://www.mongodb.com/docs/manual/indexes/
3. Mongoose Documentation — https://mongoosejs.com/docs/
4. Neo4j Documentation — https://neo4j.com/docs/
5. Neo4j Cypher Manual — https://neo4j.com/docs/cypher-manual/
6. Neo4j Driver for JavaScript — https://neo4j.com/docs/javascript-manual/
7. Express.js Documentation — https://expressjs.com/
8. React Documentation — https://react.dev/
9. Vite Documentation — https://vite.dev/
10. Tailwind CSS Documentation — https://tailwindcss.com/docs
11. OpenAI API Documentation — https://platform.openai.com/docs
12. `natural` NLP Library — https://www.npmjs.com/package/natural
13. `pdf-parse` — https://www.npmjs.com/package/pdf-parse
14. `mammoth` — https://www.npmjs.com/package/mammoth
15. Project repository — https://github.com/shreyasmallik075/Resume_Analyzer

---

# Appendix A – Project Structure

```text
backend/
  config/        MongoDB and Neo4j connections
  controllers/   Request handling and persistence
  data/          Skill catalog
  middleware/    File upload
  models/        Mongoose schemas
  routes/        REST endpoints
  scripts/       Seed, verify, CRUD demo
  services/      Graph synchronisation and insights
  utils/         OpenAI, PDF parsing, scoring

frontend/
  src/components/  UI components
  src/pages/       Application pages
  src/services/    API client
  src/utils/       Report generation
```

# Appendix B – Database CRUD Commands

## B.1 MongoDB

```javascript
use ai_interview_ready

// Create
db.resumes.insertOne({
  userId: "user_demo",
  score: 80,
  skills: ["React", "Node.js", "MongoDB"],
  field: "Full Stack Developer",
  graphSynced: false,
  timestamp: new Date()
});

// Read
db.resumes.find().sort({ timestamp: -1 }).limit(5);

// Update
db.resumes.updateOne(
  { _id: ObjectId("PASTE_RESUME_ID") },
  { $set: { score: 90 } }
);

// Delete
db.resumes.deleteOne({ _id: ObjectId("PASTE_RESUME_ID") });
```

## B.2 Neo4j

```cypher
// Create / merge
MERGE (r:Resume { mongoId: $resumeId })
SET r.score = 80, r.field = "Full Stack Developer"
MERGE (s:Skill { key: "react" })
  ON CREATE SET s.name = "React"
MERGE (r)-[:HAS_SKILL]->(s);

// Read
MATCH (r:Resume { mongoId: $resumeId })-[:HAS_SKILL]->(s:Skill)
RETURN r.mongoId, collect(s.name);

// Update
MATCH (r:Resume { mongoId: $resumeId })
SET r.score = 90
RETURN r;

// Delete
MATCH (r:Resume { mongoId: $resumeId })
DETACH DELETE r;
```

## B.3 Project Scripts

```powershell
cd backend
npm run seed:graph
npm run db:seed-demo
npm run db:verify
npm run db:crud-demo
npm run db:crud-demo -- --keep
```

# Appendix C – Viva Questions

1. Why did you use two databases instead of one?
2. What data is stored in MongoDB and what is stored in Neo4j?
3. Why is MongoDB the source of truth?
4. How do you keep the two databases consistent?
5. What happens if Neo4j is down?
6. What happens if MongoDB is down?
7. Why are `MERGE` and unique constraints important?
8. What indexes are used in MongoDB and why?
9. How does the skill-gap query work?
10. How does the answer scoring formula work?
11. What is the difference between `HAS_SKILL` and `MISSING_SKILL`?
12. How would you delete a resume from both databases?
13. What are the limitations of the current synchronisation?
14. How would you scale this system?
15. How is security handled in the project?

---

**End of Report**
