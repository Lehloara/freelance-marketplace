const { db } = require('../config/firebase');

exports.createApplication = async (appData) => {
  const docRef = await db.collection('applications').add(appData);
  return { id: docRef.id, ...appData };
};

exports.getApplicationsByGig = async (gigId) => {
  const snapshot = await db.collection('applications').where('gigId', '==', gigId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

exports.getApplicationsByUser = async (userId) => {
  const snapshot = await db.collection('applications').where('freelancerId', '==', userId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};