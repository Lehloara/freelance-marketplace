const { db } = require('../config/firebase');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    res.json({ success: true, profile: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('GetProfile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(id).update(req.body);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

module.exports = exports;