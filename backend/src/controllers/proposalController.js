const { db } = require('../config/firebase');

exports.createProposal = async (req, res) => {
  try {
    const proposalData = { 
      ...req.body, 
      userId: req.user.id, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    const docRef = await db.collection('proposals').add(proposalData);
    res.status(201).json({ success: true, id: docRef.id, message: 'Proposal submitted' });
  } catch (err) {
    console.error('CreateProposal error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit proposal' });
  }
};

exports.getProposalsByGig = async (req, res) => {
  try {
    const { id } = req.params; 
    const snapshot = await db.collection('proposals').where('gigId', '==', id).get();
    const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, proposals });
  } catch (err) {
    console.error('GetProposalsByGig error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch proposals' });
  }
};

exports.hireFreelancer = async (req, res) => {
  try {
    const { id } = req.params; 
    await db.collection('proposals').doc(id).update({ status: 'hired' });
    res.json({ success: true, message: 'Freelancer hired successfully' });
  } catch (err) {
    console.error('HireFreelancer error:', err);
    res.status(500).json({ success: false, message: 'Failed to hire freelancer' });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const snapshot = await db.collection('proposals').where('userId', '==', req.user.id).get();
    const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, proposals });
  } catch (err) {
    console.error('GetMyProposals error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch proposals' });
  }
};

exports.submitWork = async (req, res) => {
  try {
    const { projectId, gigId, description, files, isRevision } = req.body;
    
    if (!projectId || !gigId) {
      return res.status(400).json({ success: false, message: 'Missing projectId or gigId' });
    }
    
    const updateData = {
      workDescription: description,
      workFiles: files || [],
      workSubmittedAt: new Date().toISOString(),
      status: 'work_submitted',
    };
    
    await db.collection('proposals').doc(projectId).update(updateData);
    
    await db.collection('gigs').doc(gigId).update({
      status: 'work_submitted',
      updatedAt: new Date().toISOString(),
    });
    
    res.json({ success: true, message: 'Work submitted successfully' });
  } catch (err) {
    console.error('SubmitWork error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit work: ' + err.message });
  }
};