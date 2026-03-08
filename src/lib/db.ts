
import { db } from './firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
} from 'firebase/firestore';

/**
 * Firestore-мен жұмыс істеуге арналған негізгі ортақ функциялар
 */

export const collections = {
  studentProfiles: () => collection(db, 'studentProfiles'),
  subjects: () => collection(db, 'subjects'),
  mistakePatterns: () => collection(db, 'mistakePatterns'),
};

export const getDocById = async <T>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};
