const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/:gigId/approve-and-review', auth, reviewController.approveAndReview);
router.post('/:gigId/request-changes', auth, reviewController.requestChanges);

module.exports = router;