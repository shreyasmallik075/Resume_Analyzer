# Database Demo Commands

Copy-paste commands to prove that **MongoDB** and **Neo4j** are both connected and
working through the backend, the API, and the UI.

All commands are for **Windows PowerShell**.

---

## 0. This PC's setup

MongoDB is installed locally and runs as a Windows service. Neo4j runs in Docker.

| Database | Address | Credentials |
|---|---|---|
| MongoDB 8.2.6 (Windows service) | `mongodb://localhost:27017/ai_interview_ready` | none (local) |
| Neo4j 5 (Docker) | `neo4j://localhost:7687` | `neo4j` / `devpassword` |
| Neo4j Browser | <http://localhost:7474> | `neo4j` / `devpassword` |
| Backend | <http://localhost:5001> | — |
| Frontend | <http://localhost:3000> | — |

`backend/.env` already contains:

```env
MONGODB_URI=mongodb://localhost:27017/ai_interview_ready
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=devpassword
NEO4J_DATABASE=neo4j
```

Check the local MongoDB service:

```powershell
Get-Service MongoDB
(Get-CimInstance Win32_Service -Filter "Name='MongoDB'").PathName
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --version
```

If it is stopped:

```powershell
Start-Service MongoDB                 # normal PowerShell
# or, in an Administrator PowerShell:
Set-Service -Name MongoDB -StartupType Automatic
Start-Service MongoDB
```

---

## 1. Start everything

```powershell
# Neo4j (MongoDB is already running as a Windows service)
docker compose up -d neo4j

# Terminal 1 — backend
cd backend
npm start

# Terminal 2 — frontend
cd frontend
npm run dev
```

The backend terminal should print:

```text
MongoDB Connected: localhost/ai_interview_ready
MongoDB indexes ready for 3 collections
Neo4j Connected: neo4j://localhost:7687 (database: neo4j)
Skill catalog seeded: 14 roles / 232 requirements
```

---

## 2. One command that proves both databases (fastest)

```powershell
cd backend
npm run db:seed-demo
npm run db:verify
```

`db:seed-demo` writes demo documents to MongoDB and mirrors them into Neo4j.
`db:verify` prints counts from both databases and the graph edges of the newest
resume.

Expected result:

```text
MongoDB: ai_interview_ready @ localhost
  coverletters       1 document
  interviewsessions  1 document
  resumes            1 document

Neo4j: neo4j://localhost:7687 (database: neo4j)
  Node counts:
  Skill              131
  JobRole            14
  ...
  Relationship counts:
  REQUIRES_SKILL     232
  HAS_SKILL          11
  MISSING_SKILL      3
  ...
  RESULT: MongoDB + Neo4j are connected and contain data
```

---

## 3. Backend connection proof (HTTP)

```powershell
Invoke-RestMethod http://localhost:5001/api/health | ConvertTo-Json -Depth 6
```

Expected:

```json
"status": "healthy",
"databases": {
  "mongodb": { "connected": true, "database": "ai_interview_ready" },
  "neo4j":   { "connected": true, "uri": "neo4j://localhost:7687" }
}
```

```powershell
# Neo4j driver status
Invoke-RestMethod http://localhost:5001/api/graph/status | ConvertTo-Json -Depth 6

# Neo4j node + relationship counts through the backend
Invoke-RestMethod http://localhost:5001/api/graph/stats | ConvertTo-Json -Depth 6

# Role catalog read from Neo4j
Invoke-RestMethod http://localhost:5001/api/graph/roles | ConvertTo-Json -Depth 6

# One role and its required skills
Invoke-RestMethod "http://localhost:5001/api/graph/roles/Full%20Stack%20Developer" | ConvertTo-Json -Depth 6

# Graph insights for the demo resume
Invoke-RestMethod "http://localhost:5001/api/graph/insights/64b000000000000000000001" | ConvertTo-Json -Depth 6

# Rebuild Neo4j from MongoDB (proves the sync direction)
Invoke-RestMethod -Method Post http://localhost:5001/api/graph/reindex | ConvertTo-Json -Depth 6
```

The reindex response should say:

```json
"resumes": { "total": 1, "synced": 1, "failed": 0 }
```

---

## 4. MongoDB proof (local Windows installation)

### 4.1 Connection + counts in one line

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'printjson({ database: db.getName(), collections: db.getCollectionNames(), resumes: db.resumes.countDocuments(), coverLetters: db.coverletters.countDocuments(), sessions: db.interviewsessions.countDocuments(), ping: db.runCommand({ ping: 1 }).ok })'
```

### 4.2 Documents written by the app

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.find().sort({ timestamp: -1 }).limit(3).toArray()'
```

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.coverletters.find().sort({ timestamp: -1 }).limit(3).toArray()'
```

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.interviewsessions.find({}, { questions: 1, "answers.scores.total": 1 }).sort({ timestamp: -1 }).limit(3).toArray()'
```

### 4.3 Aggregation

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.aggregate([{ $group: { _id: "$field", count: { $sum: 1 } } }]).toArray()'
```

### 4.4 Indexes created by Mongoose

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.getIndexes().map(i => i.name)'
```

Expected:

```text
[ '_id_', 'userId_1', 'userId_1_timestamp_-1', 'timestamp_-1', 'field_1' ]
```

### 4.5 Show the database server is alive

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.runCommand({ ping: 1 })'
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval "db.serverStatus().connections"
```

### 4.6 Interactive shell

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready"
```

```js
show collections
db.resumes.countDocuments()
db.resumes.find().pretty()
db.coverletters.find().pretty()
db.interviewsessions.find().pretty()
db.resumes.getIndexes()
db.stats()
exit
```

### 4.7 Watch writes live (keep this terminal open)

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.watch().on("change", printjson)'
```

Now analyze a resume in the UI. A `insert` change event appears immediately.

---

## 5. Neo4j proof

### 5.1 Node and relationship counts

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY count DESC;"
```

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH ()-[r]->() RETURN type(r) AS type, count(*) AS count ORDER BY count DESC;"
```

### 5.2 Server version + constraints

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "CALL dbms.components() YIELD name, versions, edition RETURN name, versions, edition;"
```

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "SHOW CONSTRAINTS YIELD name, labelsOrTypes, properties RETURN name, labelsOrTypes, properties;"
```

### 5.3 Resume → skills

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume)-[:HAS_SKILL]->(s:Skill) RETURN r.mongoId AS resume, collect(s.name) AS skills;"
```

### 5.4 Skill gaps

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume)-[:MISSING_SKILL]->(s:Skill) RETURN r.mongoId AS resume, collect(s.name) AS gaps;"
```

### 5.5 Role requirements (from the seeded catalog)

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (role:JobRole {name: 'Full Stack Developer'})-[req:REQUIRES_SKILL]->(skill:Skill) RETURN skill.name AS skill, req.importance AS importance ORDER BY importance, skill;"
```

### 5.6 Neo4j Browser

Open <http://localhost:7474> and log in with `neo4j` / `devpassword`.

```cypher
// Everything
MATCH (n) RETURN n LIMIT 100;

// Candidate -> resume -> skills
MATCH p=(u:User)-[:HAS_RESUME]->(r:Resume)-[:HAS_SKILL]->(s:Skill)
RETURN p LIMIT 50;

// Skill gaps
MATCH (r:Resume)-[m:MISSING_SKILL]->(s:Skill)
RETURN r.mongoId AS resume, collect(s.name) AS missingSkills, count(*) AS gapCount;

// Role readiness
MATCH (role:JobRole)-[req:REQUIRES_SKILL]->(skill:Skill)
RETURN role.name AS role, count(skill) AS requiredSkills
ORDER BY requiredSkills DESC;

// Cover letter and interview links
MATCH p=(r:Resume)-[:PRACTICED|GENERATED_FROM|APPLIED_FOR]->()
RETURN p LIMIT 50;
```

---

## 6. Cross-database consistency check

The **same resume id** must exist in MongoDB and Neo4j.

```powershell
$id = mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval "print(db.resumes.find().sort({ timestamp: -1 }).limit(1).next()._id.toString())"
"MongoDB resume id: $id"

docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume { mongoId: '$id' }) RETURN r.mongoId AS mongoId, r.score AS score, r.field AS field;"
```

Then show its graph edges:

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume { mongoId: '$id' })-[rel]->(target) RETURN type(rel) AS rel, labels(target)[0] AS node, coalesce(target.name, target.jobRole, target.company, target.mongoId) AS name ORDER BY rel, name;"
```

---

## 7. CRUD operations in both databases

### 7.1 One command (recommended)

The backend includes an isolated CRUD demo. It writes to a `crud_demo` MongoDB
collection and to `(:CrudDemo)-[:HAS_DEMO_SKILL]->(:CrudSkill)` in Neo4j, prints
each operation, and removes the demo records at the end.

```powershell
cd backend
npm run db:crud-demo
```

Expected output:

```text
=== MongoDB CRUD ===
  CREATE   insertOne -> _id=...
  READ     findOne -> name="CRUD Demo Candidate", score=70, skills=[React, Node.js]
  UPDATE   matched=1, modified=1 -> score=95, skills=[React, Node.js, Neo4j]
  DELETE   deleted=1, stillExists=false

=== Neo4j CRUD ===
  CREATE   CREATE -> (...)-[:HAS_DEMO_SKILL]->(Neo4j)
  READ     MATCH -> name="CRUD Demo Candidate", score=70, skill="Neo4j"
  UPDATE   SET d.score=95 -> score=95, updatedAt=...
  DELETE   DETACH DELETE -> remaining=0
```

This is safe to run repeatedly and does not touch `resumes`, `coverletters`, or
`interviewsessions`.

### 7.2 Same demo, but keep the records for visual proof

```powershell
cd backend
npm run db:crud-demo -- --keep
```

#### Show the MongoDB record

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.find().toArray()'
```

#### Show the Neo4j graph

Open <http://localhost:7474>, connect with `neo4j` / `devpassword`, and run:

```cypher
MATCH p=(d:CrudDemo)-[:HAS_DEMO_SKILL]->(s:CrudSkill)
RETURN p;
```

Click the **Graph** tab. Click the `CrudDemo (1)` / `CrudSkill (1)` legend
entries and set **Caption** to `name` to make the labels readable.

Terminal version:

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (d:CrudDemo)-[r:HAS_DEMO_SKILL]->(s:CrudSkill) RETURN d.id AS id, d.name AS candidate, d.score AS score, s.name AS skill;"
```

#### Clean up the kept records

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.deleteMany({})'

docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (n) WHERE n:CrudDemo OR n:CrudSkill DETACH DELETE n;"
```

### 7.3 Manual CRUD in MongoDB (`mongosh`)

Use the `crud_demo` collection so the real app data is untouched.

```powershell
# CREATE
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.insertOne({ demo: true, name: "Manual CRUD", score: 70, skills: ["React"] })'

# READ
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.find({ demo: true }).toArray()'

# UPDATE
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.updateOne({ demo: true }, { $set: { score: 95 }, $push: { skills: "Neo4j" } })'

# READ again
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.find({ demo: true }).toArray()'

# DELETE
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.deleteOne({ demo: true })'

# Proof it is gone
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.crud_demo.countDocuments({ demo: true })'
```

### 7.4 Manual CRUD in Neo4j (`cypher-shell` or Browser)

```powershell
# CREATE (node + relationship)
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "CREATE (d:CrudDemo { id: 'manual-1', name: 'Manual CRUD', score: 70 })-[:HAS_DEMO_SKILL]->(s:CrudSkill { id: 'manual-skill-1', name: 'Neo4j' }) RETURN d, s;"

# READ
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (d:CrudDemo { id: 'manual-1' })-[r:HAS_DEMO_SKILL]->(s:CrudSkill) RETURN d.name AS candidate, d.score AS score, s.name AS skill;"

# UPDATE
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (d:CrudDemo { id: 'manual-1' }) SET d.score = 95 RETURN d.name AS candidate, d.score AS score;"

# DELETE
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (d:CrudDemo { id: 'manual-1' }) DETACH DELETE d;"
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (s:CrudSkill { id: 'manual-skill-1' }) DETACH DELETE s;"

# Proof it is gone
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (d:CrudDemo { id: 'manual-1' }) RETURN count(d) AS remaining;"
```

Visual graph of the created nodes — in Neo4j Browser run:

```cypher
MATCH p=(d:CrudDemo { id: 'manual-1' })-[:HAS_DEMO_SKILL]->(s:CrudSkill)
RETURN p;
```

### 7.5 CRUD through the application data

The UI performs **Create** and **Read**. **Update** is done by changing the
MongoDB document and re-indexing the graph. **Delete** is an administrative
operation because the UI intentionally does not expose a delete button.

| Operation | MongoDB | Neo4j |
|---|---|---|
| Create | Analyze a resume in the UI → document inserted into `resumes` | Backend automatically `MERGE`s the matching `(:Resume)` and skill nodes |
| Read | `GET /api/resume/history` or `db.resumes.find()` | `GET /api/graph/insights/:resumeId` or `MATCH (r:Resume)` |
| Update | `db.resumes.updateOne(...)` | `POST /api/graph/reindex` re-syncs the changed document |
| Delete | `db.resumes.deleteOne(...)` | `MATCH (r:Resume { mongoId }) DETACH DELETE r` |

Example update of the demo resume:

```powershell
# 1. Update the MongoDB document
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.updateOne({ _id: ObjectId("64b000000000000000000001") }, { $set: { score: 99 } })'

# 2. Re-sync MongoDB -> Neo4j
Invoke-RestMethod -Method Post http://localhost:5001/api/graph/reindex | ConvertTo-Json -Depth 6

# 3. Both now show score 99
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.findOne({ _id: ObjectId("64b000000000000000000001") }, { score: 1 })'
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume { mongoId: '64b000000000000000000001' }) RETURN r.score AS score;"
```

Example delete:

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.deleteOne({ _id: ObjectId("64b000000000000000000001") })'
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (r:Resume { mongoId: '64b000000000000000000001' }) DETACH DELETE r;"
```

> Re-create the demo resume with `npm run db:seed-demo` if you delete it.

---

## 8. UI proof (frontend → backend → databases)

0. Open <http://localhost:3000>. The **Live Database Status** card on the home
   page shows MongoDB and Neo4j both connected, with the MongoDB database name
   and live Neo4j node/relationship counts. Click **Refresh** to re-check.
1. Open <http://localhost:3000/resume>.
2. Open DevTools (`F12`) → **Network** tab → filter `api`.
3. Upload/paste a resume and click **Analyze Resume**.
4. In Network you should see:
   - `POST /api/resume/analyze-text` or `POST /api/resume/upload`
   - `GET /api/graph/insights/<resumeId>`
   - every request has an `x-user-id` header
5. The **Career Graph Insights** panel appears below the score (roles, gaps, recommendations).
6. Run the MongoDB and Neo4j commands again — both counts increased.

### 8.1 Browser console proof

```js
// Backend + both databases
fetch('http://localhost:5001/api/health').then(r => r.json()).then(console.log);

// Neo4j through the backend
fetch('http://localhost:5001/api/graph/stats').then(r => r.json()).then(console.log);

// The id of the resume saved by the UI
localStorage.getItem('resumeId');

// The MongoDB document returned to the UI
JSON.parse(localStorage.getItem('resumeAnalysis'));

// Anonymous user id sent to both databases
localStorage.getItem('userId');
```

### 8.2 Show the UI record in MongoDB

After analyzing:

```powershell
mongosh "mongodb://localhost:27017/ai_interview_ready" --quiet --eval 'db.resumes.find({}, { score: 1, field: 1, skills: 1, timestamp: 1 }).sort({ timestamp: -1 }).limit(3).toArray()'
```

### 8.3 Show the same record in Neo4j

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (r:Resume) RETURN r.mongoId AS id, r.score AS score, r.field AS field ORDER BY r.updatedAt DESC LIMIT 5;"
```

### 8.4 Show the user node created from the UI

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (u:User)-[:HAS_RESUME]->(r:Resume) RETURN u.id AS userId, r.mongoId AS resume ORDER BY r.updatedAt DESC LIMIT 5;"
```

---

## 9. Live Neo4j count loop (optional)

Keep this running in a separate terminal while using the UI:

```powershell
while ($true) {
  docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword --format plain "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY count DESC;"
  Start-Sleep -Seconds 5
}
```

Press `Ctrl+C` to stop.

---

## 10. Prove Neo4j is rebuilt from MongoDB (optional)

Delete only the demo resume from Neo4j:

```powershell
docker exec ai-interview-neo4j cypher-shell -u neo4j -p devpassword "MATCH (r:Resume { mongoId: '64b000000000000000000001' }) DETACH DELETE r;"
```

Show that the graph lost it:

```powershell
Invoke-RestMethod http://localhost:5001/api/graph/stats | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod "http://localhost:5001/api/graph/insights/64b000000000000000000001"
} catch {
  "Graph insights HTTP status: $($_.Exception.Response.StatusCode.value__)"
}
```

Rebuild from MongoDB:

```powershell
Invoke-RestMethod -Method Post http://localhost:5001/api/graph/reindex | ConvertTo-Json -Depth 5
```

Show that it is back:

```powershell
Invoke-RestMethod http://localhost:5001/api/graph/stats | ConvertTo-Json -Depth 5
Invoke-RestMethod "http://localhost:5001/api/graph/insights/64b000000000000000000001" | ConvertTo-Json -Depth 5
```

---

## 11. Prove graceful degradation (optional)

```powershell
# Stop the graph database
docker compose stop neo4j

# Backend stays alive, status becomes "degraded"
Invoke-RestMethod http://localhost:5001/api/health | ConvertTo-Json -Depth 6

# Graph endpoints return 503 instead of crashing
try {
  Invoke-RestMethod http://localhost:5001/api/graph/stats
} catch {
  "Graph stats HTTP status: $($_.Exception.Response.StatusCode.value__)"
}

# The UI still works and the Graph Insights panel shows an availability message.
```

Start Neo4j again:

```powershell
docker compose start neo4j
```

The backend retries the connection automatically (up to once per minute). To
reconnect immediately, restart the backend with `Ctrl+C` and `npm start`.

---

## 12. Short spoken explanation for the evaluator

> "MongoDB is the system of record. Every resume analysis, cover letter and
> interview session is saved as a document. Neo4j is the relationship layer.
> The same resume id is stored as a `(:Resume { mongoId })` node, linked to
> `(:Skill)`, `(:JobRole)`, `(:Company)` and `(:InterviewSession)` nodes. The UI
> gets role matches and skill gaps from the graph, and `npm run db:verify`
> prints both databases side by side."

Files to point at:

| Layer | File |
|---|---|
| MongoDB connection | `backend/config/db.js` |
| Mongo schemas | `backend/models/Resume.js`, `CoverLetter.js`, `InterviewSession.js` |
| Neo4j connection | `backend/config/neo4j.js` |
| Graph sync + queries | `backend/services/graphService.js` |
| API routes | `backend/routes/*.js` |
| Graph UI | `frontend/src/components/GraphInsights.jsx` |
| Proof scripts | `backend/scripts/seedDemo.js`, `verifyDatabases.js`, `crudDemo.js` |
