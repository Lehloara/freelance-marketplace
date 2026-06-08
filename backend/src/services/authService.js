const { db } = require('../config/firebase');

exports.findUserByEmail = async (email) => {
  const snapshot = await db.collection('users').where('email', '==', email).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

exports.createUser = async (userData) => {
  const docRef = await db.collection('users').add(userData);
  return { id: docRef.id, ...userData };
};

exports.findUserById = async (userId) => {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};