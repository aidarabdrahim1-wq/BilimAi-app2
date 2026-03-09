'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase-ті іске қосу функциясы.
 * Қателіктерді болдырмау үшін біз берілген firebaseConfig нысанын тікелей қолданамыз.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Біз берген firebaseConfig-ті тікелей қолданамыз, себебі автоматты 
    // инициализация кейде бос немесе бапталмаған жобаға сілтеуі мүмкін.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // Егер іске қосылып қойса, бар бағдарламаны қайтарамыз
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
