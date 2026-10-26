const express = require('express');
const router = express.Router();
const { createCoverLetter } = require('../controllers/coverLetterController');

router.post('/generate', createCoverLetter);

module.exports = router;