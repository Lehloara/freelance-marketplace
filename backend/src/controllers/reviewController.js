const { db } = require('../config/firebase');

exports.approveAndReview = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { rating, comment, clientId } = req.body;
    
    const gigRef = db.collection('gigs').doc(gigId);
    const gigDoc = await gigRef.get();
    if (!gigDoc.exists) return res.status(404).json({ success: false, message: 'Gig not found' });
    if (gigDoc.data().userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const freelancerId = gigDoc.data().hiredFreelancerId;

    await gigRef.update({ 
      status: 'completed', 
      workApproved: true, 
      paymentStatus: 'released',
      approvedAt: new Date().toISOString() 
    });

    await db.collection('reviews').add({
      gigId, clientId, freelancerId, rating: Number(rating), comment,
      createdAt: new Date().toISOString(),
    });

    const reviewsSnapshot = await db.collection('reviews').where('freelancerId', '==', freelancerId).get();
    const ratings = reviewsSnapshot.docs.map(d => d.data().rating);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;
    await db.collection('users').doc(freelancerId).update({ rating: Number(avgRating) });

    res.json({ success: true, message: 'Work approved, review submitted, and payment released.' });
  } catch (err) {
    console.error('ApproveAndReview error:', err);
    res.status(500).json({ success: false, message: 'Failed to process approval and review' });
  }
};

exports.requestChanges = async (req, res) => {
  try {
    const { gigId } = req.params;
    await db.collection('gigs').doc(gigId).update({ status: 'revision-requested', requestedAt: new Date().toISOString() });
    res.json({ success: true, message: 'Changes requested' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to request changes' });
  }
};

module.exports = exports;