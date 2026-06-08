const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const auth = require('../middleware/auth');

router.get('/gigs/:id/proposals', auth, proposalController.getProposalsByGig);
router.post('/', auth, proposalController.createProposal);
router.post('/:id/hire', auth, proposalController.hireFreelancer);
router.get('/my-proposals', auth, proposalController.getMyProposals);
router.post('/submit-work', auth, require('../controllers/proposalController').submitWork);

module.exports = router;