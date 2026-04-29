// functions/utils/firebaseAdmin.js
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

let db = null;
let storage = null;

try {
  if (!getApps().length) {
    initializeApp();
  }
  db = getFirestore();
  storage = getStorage();
} catch (error) {
  console.warn("Firebase initialization failed or not configured. Operations requiring Firebase will gracefully fail or be bypassed.", error.message);
}

module.exports = { db, storage };
