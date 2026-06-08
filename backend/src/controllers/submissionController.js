const { db } = require('../config/firebase');

exports.getPendingSubmissions = async (req, res) => {
  try {
    const gigsSnapshot = await db.collection('gigs')
      .where('userId', '==', req.user.id)
      .where('status', '==', 'work_submitted')
      .get();
    
    const submissions = [];
    for (const gigDoc of gigsSnapshot.docs) {
      const gig = { id: gigDoc.id, ...gigDoc.data() };
      const proposalSnap = await db.collection('proposals')
        .where('gigId', '==', gig.id)
        .where('status', '==', 'hired')
        .limit(1)
        .get();
      
      if (!proposalSnap.empty) {
        const proposal = proposalSnap.docs[0].data();
        submissions.push({
          id: proposalSnap.docs[0].id,
          gigTitle: gig.title,
          freelancerName: proposal.freelancerName || 'Freelancer',
          freelancerId: proposal.freelancerId,
          submittedAt: proposal.workSubmittedAt || new Date().toISOString(),
          description: proposal.workDescription || 'Work delivered',
          bidAmount: proposal.bidAmount,
        });
      }
    }
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const { proposalId, action, feedback } = req.body;
    if (!proposalId) return res.status(400).json({ success: false, message: 'Missing proposalId' });
    if (!['approve', 'request_changes'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });

    const proposalRef = db.collection('proposals').doc(proposalId);
    const proposalSnap = await proposalRef.get();
    if (!proposalSnap.exists) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const proposal = proposalSnap.data();
    const gigId = proposal.gigId;

    const newGigStatus = action === 'approve' ? 'completed' : 'in_progress';
    await db.collection('gigs').doc(gigId).update({ 
      status: newGigStatus,
      reviewedAt: new Date().toISOString(),
      clientFeedback: feedback || ''
    });

    const newProposalStatus = action === 'approve' ? 'completed' : 'revisions_requested';
    await proposalRef.update({
      status: newProposalStatus,
      clientFeedback: feedback || '',
      reviewedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: `Submission ${action === 'approve' ? 'approved' : 'sent back for revisions'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = exports;