const express = require('express');
const router = express.Router();
const { getPendingSubmissions, reviewSubmission } = require('../controllers/submissionController');
const auth = require('../middleware/auth');

router.get('/pending', auth, getPendingSubmissions);
router.post('/review', auth, reviewSubmission);

module.exports = router;