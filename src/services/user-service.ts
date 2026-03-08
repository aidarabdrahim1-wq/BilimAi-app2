
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/types/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const userService = {
  /**
   * Жаңа пайдаланушы профилін жасау
   */
  async createUserProfile(user: Partial<UserProfile> & { uid: string }) {
    if (!user.uid) throw new Error('UID is required');
    
    const userRef = doc(db, 'studentProfiles', user.uid);
    const profile: any = {
      id: user.uid, // Ensuring it's 'id' to match security rules
      fullName: user.fullName || '',
      email: user.email || '',
      grade: user.grade || '',
      currentScore: 0,
      targetScore: user.targetScore || 120,
      rating: 0,
      solvedQuestions: 0,
      correctAnswers: 0,
      completedPlans: 0,
      streakDays: 0,
      selectedSubjects: user.selectedSubjects || [],
      weakTopics: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, profile);
      return profile;
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: profile
      }));
      throw error;
    }
  },

  /**
   * Пайдаланушы профилін алу
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'studentProfiles', userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },

  /**
   * Профильді жаңарту
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'studentProfiles', userId);
    try {
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: data
      }));
      throw error;
    }
  }
};
