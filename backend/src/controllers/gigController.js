const { db } = require('../config/firebase');

exports.createGig = async (req, res) => {
  try {
    const { title, description, category, budgetMin, budgetMax, requiredSkills, images } = req.body;
    if (!title || !description || !category || budgetMin === undefined || budgetMax === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (budgetMin > budgetMax) {
      return res.status(400).json({ success: false, message: 'budgetMin cannot be greater than budgetMax.' });
    }
    const newGig = {
      userId: req.user.id,
      title,
      description,
      category,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      requiredSkills: requiredSkills || [],
      images: images || [],
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection('gigs').add(newGig);
    res.status(201).json({
      success: true,
      message: 'Gig created successfully.',
      gig: { ...newGig, id: docRef.id },
    });
  } catch (err) {
    console.error('CreateGig error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create gig.' });
  }
};

exports.getGigs = async (req, res) => {
  try {
    const { category, minBudget, maxBudget, search } = req.query;
    let query = db.collection('gigs').where('status', '==', 'open');
    if (category) query = query.where('category', '==', category);
    if (minBudget) query = query.where('budgetMin', '>=', Number(minBudget));
    if (maxBudget) query = query.where('budgetMax', '<=', Number(maxBudget));
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let gigs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (search) {
      gigs = gigs.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    res.json({ success: true, count: gigs.length, gigs });
  } catch (err) {
    console.error('GetGigs error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch gigs.' });
  }
};

exports.getGigById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('gigs').doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Gig not found.' });
    res.json({ success: true, gig: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('GetGigById error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch gig.' });
  }
};

exports.updateGig = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('gigs').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Gig not found.' });
    const gig = { id: doc.id, ...doc.data() };
    if (gig.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this gig.' });
    }
    await docRef.update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true, message: 'Gig updated successfully.', gig: { ...gig, ...req.body } });
  } catch (err) {
    console.error('UpdateGig error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update gig.' });
  }
};

exports.deleteGig = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('gigs').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Gig not found.' });
    const gig = { id: doc.id, ...doc.data() };
    if (gig.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this gig.' });
    }
    await docRef.delete();
    res.json({ success: true, message: 'Gig deleted successfully.' });
  } catch (err) {
    console.error('DeleteGig error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete gig.' });
  }
};