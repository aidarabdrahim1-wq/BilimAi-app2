'use client';

import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import React, { createContext, useContext, type ReactNode } from 'react';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

/**
 * Firebase SDK инстанцияларын бүкіл қолданбаға тарататын контекст провайдері.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: FirebaseContextValue & { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Firebase қызметтеріне қол жеткізуге арналған hook.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
