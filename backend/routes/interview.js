const express = require('express');
const router = express.Router();
const { createQuestions, scoreUserAnswer } = require('../controllers/interviewController');

router.post('/generate', createQuestions);
router.post('/score-answer', scoreUserAnswer);

module.exports = router;