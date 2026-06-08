const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json NOT FOUND');
  const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
  module.exports = { admin: null, db: mockDb, testConnection: async () => false };
  return;
}

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (parseErr) {
  console.error('❌ Failed to parse service account JSON:', parseErr.message);
  const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
  module.exports = { admin: null, db: mockDb, testConnection: async () => false };
  return;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  console.log(' Firebase Admin SDK initialized');
} catch (initErr) {
  console.error(' Firebase Admin SDK init failed:', initErr.message);
  const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
  module.exports = { admin: null, db: mockDb, testConnection: async () => false };
  return;
}

const db = admin.firestore();

exports.testConnection = async () => {
  try {
    await db.collection('_test').doc('ping').get();
    console.log('Firebase Firestore: Connected & Ready');
    return true;
  } catch (err) {
    console.error(' Firestore test failed:', err.message);
    return false;
  }
};

module.exports = { admin, db, testConnection: exports.testConnection };