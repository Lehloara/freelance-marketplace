const { db } = require('../config/firebase');

exports.initiatePayment = async (req, res) => {
  try {
    const { gigId, amount, paymentMethod } = req.body;
    if (!gigId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const gigRef = db.collection('gigs').doc(gigId);
    const gigDoc = await gigRef.get();
    if (!gigDoc.exists) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Simulate escrow hold
    await gigRef.update({
      paymentMethod,
      paymentStatus: 'escrow',
      escrowAmount: Number(amount),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `M${amount} is now held in escrow via ${paymentMethod}.`,
      paymentStatus: 'escrow',
    });
  } catch (err) {
    console.error('InitiatePayment error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

exports.releasePayment = async (req, res) => {
  try {
    const { gigId } = req.body;
    const gigRef = db.collection('gigs').doc(gigId);
    const gigDoc = await gigRef.get();
    if (!gigDoc.exists) return res.status(404).json({ success: false, message: 'Gig not found' });

    const gig = gigDoc.data();
    if (gig.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the client can release payment' });
    }
    if (gig.paymentStatus !== 'escrow') {
      return res.status(400).json({ success: false, message: 'Payment is not currently in escrow' });
    }

    await gigRef.update({
      paymentStatus: 'released',
      status: 'completed',
      releasedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `M${gig.escrowAmount} has been released to the freelancer's ${gig.paymentMethod} wallet.`,
      paymentStatus: 'released',
    });
  } catch (err) {
    console.error('ReleasePayment error:', err);
    res.status(500).json({ success: false, message: 'Payment release failed' });
  }
};