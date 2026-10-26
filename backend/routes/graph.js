const express = require('express');
const router = express.Router();
const {
  getResumeInsights,
  getRole,
  getRoles,
  getStats,
  getStatus,
  reindexGraph,
  seedCatalog,
} = require('../controllers/graphController');

router.get('/status', getStatus);
router.get('/stats', getStats);
router.get('/roles', getRoles);
router.get('/roles/:role', getRole);
router.get('/insights/:resumeId', getResumeInsights);
router.post('/seed', seedCatalog);
router.post('/reindex', reindexGraph);

module.exports = router;
