const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  console.log('🔐 Using Firebase credentials from environment variables');
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
} 
else {
  const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(' firebase-service-account.json NOT FOUND');
    console.error(' Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables');
    const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
    module.exports = { admin: null, db: mockDb, testConnection: async () => false };
    return;
  }
  
  try {
    serviceAccount = require(serviceAccountPath);
    console.log(' Using Firebase credentials from local JSON file');
  } catch (parseErr) {
    console.error(' Failed to parse service account JSON:', parseErr.message);
    const mockDb = { collection: () => ({ doc: () => ({ get: async () => ({}) }) }) };
    module.exports = { admin: null, db: mockDb, testConnection: async () => false };
    return;
  }
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  console.log('Firebase Admin SDK initialized');
} catch (initErr) {
  console.error('Firebase Admin SDK init failed:', initErr.message);
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
    console.error('Firestore test failed:', err.message);
    return false;
  }
};

module.exports = { admin, db, testConnection: exports.testConnection };