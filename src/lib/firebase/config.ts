'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Студент берген нақты Firebase конфигурациясы
const firebaseConfig = {
  apiKey: "AIzaSyD4h_rErcBSKWhiI1U3CBpF8vDpWAfMRMY",
  authDomain: "studio-5303827652-38d67.firebaseapp.com",
  projectId: "studio-5303827652-38d67",
  storageBucket: "studio-5303827652-38d67.firebasestorage.app",
  messagingSenderId: "434230863781",
  appId: "1:434230863781:web:17ed6d12afbccb348f2a4c"
};

// Конфигурацияны тексеру
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;

let app;
let auth: any = null;
let db: any = null;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export { auth, db, isConfigValid };
