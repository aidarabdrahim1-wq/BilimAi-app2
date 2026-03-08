'use client';

import { initializeFirebase } from "@/firebase";

// Ресурс үнемдеу және қателерді болдырмау үшін орталықтандырылған 
// initializeFirebase() функциясын қолданамыз.
const { auth, firestore: db } = initializeFirebase();

export const isConfigValid = true;
export { auth, db };
