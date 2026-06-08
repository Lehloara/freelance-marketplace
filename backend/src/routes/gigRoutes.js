const express = require('express');
const router = express.Router();
const gigController = require('../controllers/gigController');
const auth = require('../middleware/auth');

router.get('/', gigController.getGigs);
router.get('/:id', gigController.getGigById);
router.post('/', auth, gigController.createGig);
router.put('/:id', auth, gigController.updateGig);
router.delete('/:id', auth, gigController.deleteGig);
router.get('/:id/proposals', auth, require('../controllers/proposalController').getProposalsByGig);

module.exports = router;