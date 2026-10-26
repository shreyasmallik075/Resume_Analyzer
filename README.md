# AI Interview Ready - MERN + Neo4j Full-Stack App

An AI-powered career platform for resume analysis, cover letter generation, and interview practice.

**Repository:** <https://github.com/shreyasmallik075/Resume_Analyzer>

---

## Features

- **Resume Analyzer** — Upload PDF/DOCX/TXT; get ATS score, skills, strengths, weaknesses, missing keywords
- **Cover Letter Generator** — Tailored cover letters using your resume + job description
- **Interview Prep** — Generate personalized interview questions from your resume
- **Answer Scorer** — Practice answers scored on semantic similarity, STAR method, and NLP metrics
- **Career Knowledge Graph** — Neo4j-powered skill gaps, role readiness, and related-skill recommendations

---

## Architecture

The app uses **two complementary databases**:

| Database | Role | What is stored |
|----------|------|----------------|
| **MongoDB** | System of record (documents) | Resumes, analyses, cover letters, interview sessions, answers |
| **Neo4j** | Relationship layer (graph) | Skills, target roles, companies, questions, users and the links between them |

A failed or offline database never breaks the AI features. MongoDB writes and Neo4j syncs are both
best-effort, and the API continues to work.

### Graph model

```text
(User)-[:HAS_RESUME]->(Resume)
(User)-[:PRACTICED]->(InterviewSession)
(User)-[:HAS_COVER_LETTER]->(CoverLetter)

(Resume)-[:HAS_SKILL]->(Skill)
(Resume)-[:MISSING_SKILL]->(Skill)
(Resume)-[:TARGETS_ROLE]->(JobRole)
(Resume)-[:APPLIED_FOR]->(JobRole)
(Resume)-[:PRACTICED]->(InterviewSession)
(Resume)<-[:GENERATED_FROM]-(CoverLetter)
(Resume)-[:HAS_SKILL]->(Skill)<-[:HAS_SKILL]-(Resume)   // skill co-occurrence

(JobRole)-[:REQUIRES_SKILL {importance}]->(Skill)
(CoverLetter)-[:FOR_ROLE]->(JobRole)
(CoverLetter)-[:TO_COMPANY]->(Company)
(InterviewSession)-[:HAS_QUESTION]->(Question)
(InterviewSession)-[:ANSWERED {score}]->(Question)
```

The graph is used to answer questions that are awkward in a document store:

- Which **core skills are missing** for the detected target role?
- Which **roles fit best** based on skills the resume already has?
- Which **skills co-occur** with this profile in other resumes?
- What is the **role-readiness percentage** of a resume?

A seed catalog (`backend/data/skillCatalog.js`) ships 14 roles and their required skills, so insights work
even before other users have uploaded resumes.

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend  | Node.js, Express 5, Mongoose |
| Database | MongoDB (documents) + Neo4j (graph, optional) |
| AI       | OpenAI GPT-4o-mini + text-embedding-3-small |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- An OpenAI API key
- MongoDB (local or Atlas)
- Neo4j 5+ (optional — graph insights degrade gracefully without it)
- Docker (optional, easiest way to run both databases)

### 1. Clone

```bash
git clone https://github.com/shreyasmallik075/Resume_Analyzer.git
cd Resume_Analyzer
```

### 2. Start the databases (Docker)

```bash
# Starts MongoDB on 27017 and Neo4j on 7474 (browser) / 7687 (Bolt)
docker compose up -d mongodb neo4j

# Neo4j Browser: http://localhost:7474
# Login: neo4j / devpassword
```

If you already use MongoDB Atlas, keep your Atlas URI and only start Neo4j:

```bash
docker compose up -d neo4j
```

#### Using the MongoDB installed on this PC instead of Docker

If MongoDB runs as a local Windows service (MongoDB 8.x is installed on this
machine), do not start the `mongodb` container. Point the backend at the local
server instead:

```env
MONGODB_URI=mongodb://localhost:27017/ai_interview_ready
```

```powershell
Get-Service MongoDB      # should say Running
mongosh "mongodb://localhost:27017/ai_interview_ready" --eval "db.runCommand({ ping: 1 })"
```

The two databases then run as:

| Database | Where | Address |
|---|---|---|
| MongoDB | Windows service | `mongodb://localhost:27017` |
| Neo4j | Docker container | `neo4j://localhost:7687` |

### 3. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set OPENAI_API_KEY, MONGODB_URI and NEO4J_* values
npm install
npm start
# Backend runs on http://localhost:5001
```

Seed the graph catalog (also runs automatically on startup when Neo4j is reachable):

```bash
npm run seed:graph
```

### 4. Frontend setup

```bash
cd ../frontend
cp .env.example .env
# Edit .env — set VITE_OPENAI_API_KEY (same key as backend)
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 5. Open in browser

Navigate to **http://localhost:3000** and check **http://localhost:5001/api/health** for database status.

---

## Prove the databases are in use (demo)

See **[DEMO_COMMANDS.md](DEMO_COMMANDS.md)** for the full copy-paste command
sheet (MongoDB, Neo4j, API and UI proof).

You can show both databases working without waiting for an AI call.

```bash
cd backend

# 1. Insert a demo resume, cover letter and interview session into MongoDB,
#    then mirror them into Neo4j (deterministic IDs, safe to re-run).
npm run db:seed-demo

# 2. Print document counts from MongoDB and node/relationship counts from Neo4j.
npm run db:verify
```

`db:verify` prints something like:

```text
MongoDB: ai_interview_ready @ localhost
  coverletters       1 document
  interviewsessions  1 document
  resumes            1 document

Neo4j: neo4j://localhost:7687 (database: neo4j)
  Node counts:
  Skill              131
  JobRole            14
  Resume             1
  ...
  Relationship counts:
  REQUIRES_SKILL     232
  HAS_SKILL          11
  MISSING_SKILL      3
  ...
  RESULT: MongoDB + Neo4j are connected and contain data
```

### Show CRUD in both databases

The isolated CRUD demo runs **Create, Read, Update and Delete** against MongoDB
and Neo4j, prints every step, and cleans up after itself:

```bash
cd backend
npm run db:crud-demo
```

Keep the demo records so you can inspect them in `mongosh` and Neo4j Browser:

```bash
npm run db:crud-demo -- --keep
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.find().toArray()'
```

```cypher
// Neo4j Browser: http://localhost:7474
MATCH p=(d:CrudDemo)-[:HAS_DEMO_SKILL]->(s:CrudSkill)
RETURN p;
```

Clean up the kept records:

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.deleteMany({})'
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (n) WHERE n:CrudDemo OR n:CrudSkill DETACH DELETE n;"
```

In the application itself, **Create** happens when a resume is analyzed
(MongoDB insert + Neo4j `MERGE`), **Read** is the history/insights API, and
**Update** is a MongoDB change followed by `POST /api/graph/reindex`. Delete is
an administrative database operation because the UI does not expose a delete
button. Full manual commands are in
**[DEMO_COMMANDS.md](DEMO_COMMANDS.md#7-crud-operations-in-both-databases)**.

### Show MongoDB

```bash
mongosh
use ai_interview_ready
show collections
db.resumes.find().pretty()
db.interviewsessions.find({}, { questions: 1, answers: 1 }).pretty()
```

Or open MongoDB Compass and connect to `mongodb://localhost:27017`, then open the
`ai_interview_ready` database. The `resumes`, `coverletters` and `interviewsessions`
collections are written by the API on every analysis/generation.

### Show Neo4j

Open **http://localhost:7474**, log in with `neo4j` / `devpassword`, and run:

```cypher
// Whole graph
MATCH (n) RETURN n LIMIT 100;

// A resume's skills and target role
MATCH p=(u:User)-[:HAS_RESUME]->(r:Resume)-[:HAS_SKILL]->(s:Skill)
RETURN p LIMIT 50;

// Skill gaps and role requirements
MATCH (r:Resume)-[m:MISSING_SKILL]->(s:Skill)
RETURN r.mongoId AS resume, collect(s.name) AS missingSkills;
```

### Show the HTTP proof

```text
http://localhost:5001/api/health
http://localhost:5001/api/graph/stats
http://localhost:5001/api/graph/roles/Full%20Stack%20Developer
http://localhost:5001/api/graph/insights/64b000000000000000000001
```

### Show it through the UI

0. Open <http://localhost:3000> — the **Live Database Status** card shows MongoDB
   and Neo4j connected, plus the current graph node/relationship counts.
1. Start both apps and open **http://localhost:3000/resume**.
2. Upload or paste a resume and click **Analyze Resume**.
3. The analysis is saved to MongoDB and synced to Neo4j.
4. The **Career Graph Insights** panel appears below the score with matched roles,
   skill gaps and recommended roles — that data comes from Neo4j.
5. Run `npm run db:verify` again to see the new document and graph nodes.

> To preview the graph panel with the seeded demo data without an AI call, open the
> browser console on the resume page and run:
>
> ```js
> localStorage.setItem('resumeId', '64b000000000000000000001');
> localStorage.setItem('resumeAnalysis', JSON.stringify({
>   resumeId: '64b000000000000000000001',
>   score: 84,
>   field: 'Full Stack Developer',
>   strengths: ['Strong React and Node.js experience'],
>   weaknesses: ['No containerization experience'],
>   suggestions: ['Add Docker projects'],
>   missingKeywords: ['Docker', 'AWS', 'GraphQL']
> }));
> location.reload();
> ```
>
> Clear it afterwards with `localStorage.removeItem('resumeAnalysis')`.

---

## Environment Variables

A combined reference template is available at [`.env.example`](.env.example).
Create the real per-app files from the dedicated templates:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Then add your OpenAI key to both files. Do not commit the real `.env` files.

### backend/.env

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000,http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai_interview_ready
# MongoDB Atlas example:
# MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ai_interview_ready

# Neo4j (optional)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=devpassword
NEO4J_DATABASE=neo4j
# Neo4j Aura example:
# NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io

OPENAI_API_KEY=sk-your-key-here
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_OPENAI_API_KEY=sk-your-key-here
```

> **Security:** `.env` files are ignored by Git. Only the committed
> `backend/.env.example` and `frontend/.env.example` templates should be used.
> If an API key was ever exposed, rotate it in the OpenAI dashboard.

---

## API Endpoints

### Documents (MongoDB)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Analyze an uploaded PDF/DOCX/TXT and persist it |
| POST | `/api/resume/analyze-text` | Analyze pasted resume text and persist it |
| GET | `/api/resume/history` | Recent analyses for the current `x-user-id` |
| POST | `/api/coverletter/generate` | Generate and persist a cover letter |
| POST | `/api/interview/generate` | Generate questions and create an interview session |
| POST | `/api/interview/score-answer` | Score an answer and append it to the session |

### Graph (Neo4j)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/graph/status` | Neo4j configuration/connection status |
| GET | `/api/graph/stats` | Node, relationship, and top-skill counts |
| GET | `/api/graph/roles` | Cataloged roles and required skills |
| GET | `/api/graph/roles/:role` | One role and its skill requirements |
| GET | `/api/graph/insights/:resumeId` | Skill gaps, target-role fit, recommended roles, related skills |
| POST | `/api/graph/seed` | Seed/refresh the role + skill catalog |
| POST | `/api/graph/reindex` | Rebuild the graph from MongoDB documents |

The frontend creates an anonymous `userId` in `localStorage` and sends it as the `x-user-id` header.
It is stored on MongoDB documents and as a `(:User)` node in Neo4j.

### Example: graph insights response

```json
{
  "success": true,
  "resumeId": "665f...",
  "profile": { "score": 82, "field": "Full Stack Developer", "skills": ["React", "Node.js"] },
  "primaryTarget": {
    "role": "Full Stack Developer",
    "matchPercent": 64,
    "matchedSkills": ["React", "Node.js"],
    "missingSkills": [{ "name": "MongoDB", "importance": "core" }]
  },
  "recommendedRoles": [
    { "role": "Frontend Developer", "matchPercent": 71, "matchedSkills": 10, "totalRequired": 14 }
  ],
  "relatedSkills": [{ "name": "Docker", "coOccurrences": 3 }]
}
```

---

## Project Structure

```text
Resume_Analyzer/
├── .env.example              # Combined environment reference (no secrets)
├── docker-compose.yml        # MongoDB + Neo4j for local development
├── backend/
│   ├── config/
│   │   ├── db.js             # MongoDB connection + status
│   │   └── neo4j.js          # Neo4j driver, constraints, reconnect logic
│   ├── controllers/          # Route handlers (resume, cover letter, interview, graph)
│   ├── data/
│   │   └── skillCatalog.js   # Role → required skills seed catalog
│   ├── middleware/           # Multer file upload
│   ├── models/               # Mongoose schemas (MongoDB)
│   ├── routes/               # Express routes
│   ├── scripts/
│   │   ├── seedGraph.js      # CLI graph catalog seeder
│   │   ├── seedDemo.js       # Demo documents + graph data
│   │   ├── crudDemo.js       # CRUD proof for MongoDB + Neo4j
│   │   └── verifyDatabases.js# Prints MongoDB + Neo4j proof/counts
│   ├── services/
│   │   └── graphService.js   # Neo4j sync + graph queries
│   ├── utils/                # PDF parser, OpenAI helper, scoring engine
│   └── server.js             # Entry point (port 5001)
│
└── frontend/
    └── src/
        ├── components/       # Navbar, ScoreDisplay, ATSHighlighter, GraphInsights, DatabaseStatus, ...
        ├── pages/            # Home, ResumePage, CoverLetterPage, InterviewPage, AnswerPage
        ├── services/         # Axios API client (+ anonymous user id, graph calls)
        └── utils/            # PDF report generator
```

---

## Running Without Databases

- **Without Neo4j:** all AI features and MongoDB persistence work; the graph panel shows a clear
  "graph insights unavailable" message. Set `NEO4J_URI`/`NEO4J_PASSWORD` empty to disable it quietly.
- **Without MongoDB:** AI features still work and resumes are given an `offline_<timestamp>` id, but
  history, session answers, and reindexing are unavailable.

---

## Reliability and Correctness Fixes

1. **Port mismatch** — Frontend API client pointed to port 5000; backend runs on 5001. Fixed.
2. **PDF parser crash** — `pdf-parse` v2 exports a class (`PDFParse`), not a function. Fixed import.
3. **Props naming mismatch** — Backend returns `missingKeywords`/`atsFeedback`/`grammarFeedback` (camelCase); `ScoreDisplay` expected snake_case. Fixed normalisation in component.
4. **ATSHighlighter wrong prop** — `ResumePage` passed `result.missing_keywords`; backend sends `result.missingKeywords`. Fixed.
5. **DB crash in `analyzeText`** — No MongoDB offline guard; would throw if DB was not connected. Fixed.
6. **DB crash in `interviewController`** — Same issue for question generation and answer scoring. Fixed.
7. **Resume text not returned** — `uploadResume` never sent `resumeText` back to frontend so ATS highlighter was always blank. Fixed.
8. **Invalid resume ids crashed graph/DB lookups** — `findById('offline_...')` threw a CastError. All lookups now check `mongoose.isValidObjectId`.
9. **Interview answers were never persisted** — Scoring results are now appended to the interview session, and the frontend passes the session id through.
