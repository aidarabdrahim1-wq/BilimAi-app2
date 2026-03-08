import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp, query, where, getDocs, collection } from 'firebase/firestore';
import { UserProgress } from '@/types/firestore';

export const progressService = {
  /**
   * Пайдаланушының прогресін алу немесе жасау
   */
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    const progressRef = doc(db, 'progress', userId);
    const snap = await getDoc(progressRef);
    
    if (snap.exists()) {
      return snap.data() as UserProgress;
    }
    return null;
  },

  /**
   * Әлсіз тақырыптар тізімін алу
   */
  async getWeakTopics(userId: string): Promise<string[]> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data().weakTopics || [] : [];
  }
};
