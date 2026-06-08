const { db } = require('../config/firebase');

exports.createGig = async (gigData) => {
  const docRef = await db.collection('gigs').add(gigData);
  return { id: docRef.id, ...gigData };
};

exports.getGigs = async (filters = {}) => {
  let query = db.collection('gigs').where('status', '==', 'open');
  if (filters.category) query = query.where('category', '==', filters.category);
  if (filters.minBudget) query = query.where('budgetMin', '>=', Number(filters.minBudget));
  if (filters.maxBudget) query = query.where('budgetMax', '<=', Number(filters.maxBudget));
  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getGigById = async (id) => {
  const doc = await db.collection('gigs').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

exports.updateGig = async (id, updates) => {
  await db.collection('gigs').doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
  return this.getGigById(id);
};

exports.deleteGig = async (id) => {
  await db.collection('gigs').doc(id).delete();
};