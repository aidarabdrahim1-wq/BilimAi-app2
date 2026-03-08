
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Проверка валидности конфигурации
const isConfigValid = !!firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "undefined" && 
                     firebaseConfig.apiKey.length > 10;

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
} else {
  // В режиме разработки, если конфиг не задан, мы не инициализируем Firebase, 
  // чтобы приложение не падало с ошибкой auth/invalid-api-key
  console.warn("Firebase configuration is missing. Please check your .env file.");
}

export { auth, db, isConfigValid };
