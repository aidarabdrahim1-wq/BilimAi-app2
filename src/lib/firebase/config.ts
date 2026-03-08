'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// User provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4h_rErcBSKWhiI1U3CBpF8vDpWAfMRMY",
  authDomain: "studio-5303827652-38d67.firebaseapp.com",
  projectId: "studio-5303827652-38d67",
  storageBucket: "studio-5303827652-38d67.firebasestorage.app",
  messagingSenderId: "434230863781",
  appId: "1:434230863781:web:17ed6d12afbccb348f2a4c"
};

// Check if config is valid
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app;
let auth: any = null;
let db: any = null;

if (typeof window !== 'undefined' && isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export { auth, db, isConfigValid };
