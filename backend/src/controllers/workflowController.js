const { db } = require('../config/firebase');

exports.createGig = async (req, res) => {
  try {
    const gigData = { ...req.body, userId: req.user.id, status: 'open', createdAt: new Date().toISOString() };
    const doc = await db.collection('gigs').add(gigData);
    res.status(201).json({ success: true, id: doc.id, message: 'Gig posted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllGigs = async (req, res) => {
  try {
    const snap = await db.collection('gigs').where('status', '==', 'open').get();
    const gigs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, gigs });
  } catch (err) { res.json({ success: true, gigs: [] }); }
};

exports.getClientGigs = async (req, res) => {
  try {
    const snap = await db.collection('gigs').where('userId', '==', req.user.id).get();
    const gigs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, gigs });
  } catch (err) { res.json({ success: true, gigs: [] }); }
};

exports.getSingleGig = async (req, res) => {
  try {
    const doc = await db.collection('gigs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Gig not found' });
    res.json({ success: true, gig: { id: doc.id, ...doc.data() } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getGigProposals = async (req, res) => {
  try {
    const snap = await db.collection('proposals').where('gigId', '==', req.params.id).get();
    const proposals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, proposals });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.hireFreelancer = async (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) return res.status(400).json({ message: 'Missing proposalId' });
    
    const proposalRef = db.collection('proposals').doc(proposalId);
    const proposalSnap = await proposalRef.get();
    if (!proposalSnap.exists) return res.status(404).json({ message: 'Proposal not found' });
    
    const proposal = proposalSnap.data();
    
    const freelancerId = proposal.freelancerId || proposal.userId;
    const gigId = proposal.gigId;
    const bidAmount = proposal.bidAmount;
    const freelancerName = proposal.freelancerName || 'Freelancer';
    
    if (!gigId) return res.status(400).json({ message: 'Proposal missing gigId' });
    if (!freelancerId) return res.status(400).json({ message: 'Proposal missing user ID' });
    
    await proposalRef.update({ 
      status: 'hired', 
      hiredAt: new Date().toISOString(),
      freelancerName: freelancerName
    });
    
    const gigUpdateData = {
      status: 'in_progress',
      freelancerId: freelancerId,
      hiredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (bidAmount !== undefined && bidAmount !== null) {
      gigUpdateData.bidAmount = bidAmount;
    }
    
    await db.collection('gigs').doc(gigId).update(gigUpdateData);
    
    const otherProps = await db.collection('proposals')
      .where('gigId', '==', gigId)
      .where('status', '==', 'pending')
      .get();
    
    for (const doc of otherProps.docs) {
      if (doc.id !== proposalId) {
        await doc.ref.update({ status: 'rejected', rejectedAt: new Date().toISOString() });
      }
    }
    
    res.json({ success: true, message: 'Freelancer hired', gigId, freelancerId });
  } catch (err) {
    console.error('❌ Hire error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.submitProposal = async (req, res) => {
  try {
    
    const { gigId, proposal, bidAmount, timeline } = req.body;
    if (!gigId || !proposal || !bidAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const proposalData = {
      gigId,
      freelancerId: req.user.id,  
      freelancerName: req.user.fullName || 'Freelancer',
      proposal,
      bidAmount: Number(bidAmount),
      timeline: timeline || '7 days',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    
    console.log(' Saving proposal:', proposalData);
    
    const docRef = await db.collection('proposals').add(proposalData);
    console.log('Proposal saved with ID:', docRef.id);
    
    res.status(201).json({ 
      success: true, 
      id: docRef.id,
      message: 'Proposal submitted'
    });
  } catch (err) {
    console.error(' Submit proposal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitWork = async (req, res) => {
  try {
    const { projectId, gigId, description, files, isRevision } = req.body;
    if (!projectId || !gigId) return res.status(400).json({ success: false, message: 'Missing projectId or gigId' });
    const updateData = { workDescription: description || '', workFiles: files || [], workSubmittedAt: new Date().toISOString(), status: 'work_submitted', isRevision: isRevision || false };
    await db.collection('proposals').doc(projectId).update(updateData);
    await db.collection('gigs').doc(gigId).update({ status: 'work_submitted', updatedAt: new Date().toISOString() });
    res.json({ success: true, message: 'Work submitted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to submit work: ' + err.message }); }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const { proposalId, action, feedback } = req.body;
    if (!proposalId || !['approve', 'revision_requested'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid request' });
    const proposalRef = db.collection('proposals').doc(proposalId);
    const proposalSnap = await proposalRef.get();
    if (!proposalSnap.exists) return res.status(404).json({ message: 'Proposal not found' });
    const proposal = proposalSnap.data();
    const { gigId } = proposal;
    const newProposalStatus = action === 'approve' ? 'completed' : 'revision_requested';
    await proposalRef.update({ status: newProposalStatus, clientFeedback: feedback || '', reviewedAt: new Date().toISOString() });
    const newGigStatus = action === 'approve' ? 'completed' : 'in_progress';
    await db.collection('gigs').doc(gigId).update({ status: newGigStatus, paymentReleasedAt: action === 'approve' ? new Date().toISOString() : null, updatedAt: new Date().toISOString() });
    res.json({ success: true, message: action === 'approve' ? 'Payment released. Project completed.' : 'Sent back for revisions.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteGig = async (req, res) => {
  try {
    const { id } = req.params;
    const gigRef = db.collection('gigs').doc(id);
    const gigSnap = await gigRef.get();
    if (!gigSnap.exists) return res.status(404).json({ message: 'Gig not found' });
    if (gigSnap.data().userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    const propsSnap = await db.collection('proposals').where('gigId', '==', id).get();
    const batch = db.batch();
    propsSnap.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(gigRef);
    await batch.commit();
    res.json({ success: true, message: 'Gig deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getFreelancerStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const snapshot = await db.collection('proposals').where('userId', '==', userId).get();
    
    let completed = 0;
    let active = 0;
    
    snapshot.forEach(doc => {
      const status = doc.data().status;
      if (status === 'completed') {
        completed++;
      } else if (['hired', 'work_submitted', 'revision_requested'].includes(status)) {
        active++;
      }
    });
    
    console.log(` Stats for ${userId}: ${completed} completed, ${active} active`);
    
    res.json({
      success: true,
      stats: {
        completedProjects: completed,
        activeProjects: active,
      }
    });
  } catch (err) {
    console.error('GetFreelancerStats error:', err);
    res.json({ success: true, stats: { completedProjects: 0, activeProjects: 0 } });
  }
};

exports.getClientStats = async (req, res) => {
  try {
    const snap = await db.collection('gigs').where('userId', '==', req.user.id).get();
    let counts = { open: 0, in_progress: 0, work_submitted: 0, completed: 0 };
    
    snap.forEach(doc => {
      const status = doc.data().status;
      if (counts[status] !== undefined) counts[status]++;
    });
    
    res.json({ success: true, stats: counts });
  } catch (err) {
    console.error('Stats error:', err);
    res.json({ success: true, stats: { open: 0, in_progress: 0, work_submitted: 0, completed: 0 } });
  }
};

exports.getClientPendingReviews = async (req, res) => {
  try {
    const proposalsSnap = await db.collection('proposals')
      .where('status', '==', 'work_submitted')
      .get();

    const submissions = [];
    for (const doc of proposalsSnap.docs) {
      const proposal = { id: doc.id, ...doc.data() };
      
      if (proposal.gigId) {
        const gigSnap = await db.collection('gigs').doc(proposal.gigId).get();
        if (gigSnap.exists) {
          const gig = gigSnap.data();
          
          if (gig.userId === req.user.id) {
            submissions.push({
              id: proposal.id,
              gigId: proposal.gigId,
              gigTitle: gig.title || 'Untitled Gig',
              freelancerName: proposal.freelancerName || proposal.userId || 'Freelancer',
              freelancerId: proposal.freelancerId || proposal.userId,
              bidAmount: proposal.bidAmount || gig.bidAmount || 0,
              description: proposal.workDescription || proposal.proposal || 'No description provided',
              files: proposal.workFiles || [],
              submittedAt: proposal.workSubmittedAt || new Date().toISOString(),
            });
          }
        }
      }
    }
    
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFreelancerProjects = async (req, res) => {
  try {
    const snap = await db.collection('proposals')
      .where('userId', '==', req.user.id)
      .get();
    
    const projects = [];
    for (const doc of snap.docs) {
      const p = { id: doc.id, ...doc.data() };
      if (p.gigId) {
        const gigSnap = await db.collection('gigs').doc(p.gigId).get();
        if (gigSnap.exists) {
          const gig = gigSnap.data();
          p.gigTitle = gig.title || 'Untitled';
          p.budgetMin = gig.budgetMin || 0;
          p.budgetMax = gig.budgetMax || 0;
          p.gigDeleted = false;
        } else {
          p.gigDeleted = true; p.gigTitle = 'Gig Deleted'; p.budgetMin = 0; p.budgetMax = 0;
        }
      }
      projects.push(p);
    }
    projects.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    res.json({ success: true, projects });
  } catch (err) {
    res.json({ success: true, projects: [] });
  }
};
exports.submitRating = async (req, res) => {
  try {
    const { freelancerId, gigId, score, comment } = req.body;
    if (!freelancerId || !gigId || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Invalid rating data' });
    }
    await db.collection('ratings').add({
      freelancerId, clientId: req.user.id, gigId, score, comment: comment || '', createdAt: new Date().toISOString()
    });
    const ratingsSnap = await db.collection('ratings').where('freelancerId', '==', freelancerId).get();
    const total = ratingsSnap.docs.reduce((sum, doc) => sum + doc.data().score, 0);
    const count = ratingsSnap.docs.length;
    await db.collection('users').doc(freelancerId).update({
      rating: parseFloat((total / count).toFixed(1)),
      ratingCount: count
    });
    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getFreelancerRating = async (req, res) => {
  try {
    const { id } = req.params;
    const snap = await db.collection('ratings').where('freelancerId', '==', id).get();
    if (snap.empty) return res.json({ success: true, rating: 0, count: 0 });
    const total = snap.docs.reduce((sum, doc) => sum + doc.data().score, 0);
    const count = snap.docs.length;
    res.json({ success: true, rating: parseFloat((total / count).toFixed(1)), count });
  } catch (err) { res.json({ success: true, rating: 0, count: 0 }); }
};

exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposalRef = db.collection('proposals').doc(id);
    const proposalSnap = await proposalRef.get();
    
    if (!proposalSnap.exists) return res.status(404).json({ message: 'Proposal not found' });

    const ownerId = proposalSnap.data().userId || proposalSnap.data().freelancerId;
    
    if (ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this proposal' });
    }

    await proposalRef.delete();
    res.json({ success: true, message: 'Project removed from your list' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
module.exports = exports;