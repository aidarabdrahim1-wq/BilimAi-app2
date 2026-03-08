
import { db } from '@/lib/firebase/config';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { DiagnosticResult } from '@/types/firestore';
import { updateUserRating } from '@/lib/rating';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const diagnosticService = {
  /**
   * Диагностика нәтижесін сақтау және профильді жаңарту
   */
  async saveDiagnosticResult(data: Omit<DiagnosticResult, 'id' | 'createdAt'>) {
    if (!db || !data.userId) return;

    // Пайдаланушының әлсіз тақырыптарын және балын жаңарту (studentProfiles)
    const userRef = doc(db, 'studentProfiles', data.userId);
    const updateData = {
      weakTopics: data.weakTopics,
      currentScore: data.score,
      updatedAt: serverTimestamp(),
    };

    updateDoc(userRef, updateData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });

    // Рейтинг қосу
    await updateUserRating(data.userId, 'DIAGNOSTIC_FINISHED');
  }
};
