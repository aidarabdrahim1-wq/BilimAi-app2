import { db } from './firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  increment,
  addDoc
} from 'firebase/firestore';

/**
 * Firestore-мен жұмыс істеуге арналған негізгі ортақ функциялар
 */

export const collections = {
  users: () => collection(db, 'users'),
  tests: () => collection(db, 'tests'),
  questions: () => collection(db, 'questions'),
  testResults: () => collection(db, 'test_results'),
  studyPlans: () => collection(db, 'study_plans'),
  diagnostics: () => collection(db, 'diagnostics'),
  mistakes: () => collection(db, 'mistakes'),
  theory: () => collection(db, 'theory_materials'),
  progress: () => collection(db, 'progress'),
  ratingHistory: () => collection(db, 'ratings_history'),
};

export const getDocById = async <T>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};
