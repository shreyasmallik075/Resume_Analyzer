const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadResume, analyzeText, getResumeHistory } = require('../controllers/resumeController');

router.post('/upload', upload.single('resume'), uploadResume);
router.post('/analyze-text', analyzeText);
router.get('/history', getResumeHistory);

module.exports = router;
