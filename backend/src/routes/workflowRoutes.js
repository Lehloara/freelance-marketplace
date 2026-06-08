const express = require('express');
const router = express.Router();
const wf = require('../controllers/workflowController');
const auth = require('../middleware/auth');

router.get('/gigs', auth, wf.getAllGigs);              
router.get('/gigs/:id', auth, wf.getSingleGig);         
router.get('/gigs/:id/proposals', auth, wf.getGigProposals);
router.post('/proposals', auth, wf.submitProposal);
router.post('/gigs', auth, wf.createGig);               
router.get('/client/gigs', auth, wf.getClientGigs);     
router.delete('/gigs/:id', auth, wf.deleteGig);         
router.post('/proposals/hire', auth, wf.hireFreelancer);
router.post('/proposals/submit-work', auth, wf.submitWork);
router.get('/client/reviews/pending', auth, wf.getClientPendingReviews);
router.post('/submissions/review', auth, wf.reviewSubmission);
router.get('/client/stats', auth, wf.getClientStats);
router.get('/freelancer/stats', auth, wf.getFreelancerStats);
router.get('/freelancer/projects', auth, wf.getFreelancerProjects);
router.post('/ratings', auth, wf.submitRating);
router.get('/ratings/:id', auth, wf.getFreelancerRating);
router.delete('/proposals/:id', auth, wf.deleteProposal);
router.get('/debug/proposals', async (req, res) => {
  try {
    const snap = await db.collection('proposals').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ 
      total: all.length, 
      proposals: all,
      message: all.length === 0 ? 'NO PROPOSALS FOUND IN DATABASE' : 'Proposals exist'
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});
const { db } = require('../config/firebase');

module.exports = router;