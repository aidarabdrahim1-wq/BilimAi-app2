
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/types/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const userService = {
  /**
   * Жаңа пайдаланушы профилін жасау
   */
  async createUserProfile(user: Partial<UserProfile>) {
    if (!user.uid) throw new Error('UID is required');
    
    const userRef = doc(db, 'studentProfiles', user.uid);
    const profile: any = {
      id: user.uid,
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

    setDoc(userRef, profile)
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: profile
        }));
      });
    
    return profile;
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
    updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: data
      }));
    });
  }
};
