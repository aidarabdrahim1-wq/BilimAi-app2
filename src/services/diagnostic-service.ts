import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { DiagnosticResult } from '@/types/firestore';
import { updateUserRating } from '@/lib/rating';

export const diagnosticService = {
  /**
   * Диагностика нәтижесін сақтау
   */
  async saveDiagnosticResult(data: Omit<DiagnosticResult, 'id' | 'createdAt'>) {
    const diagRef = collection(db, 'diagnostics');
    const diagDoc = await addDoc(diagRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    // Пайдаланушының әлсіз тақырыптарын жаңарту
    const userRef = doc(db, 'users', data.userId);
    await updateDoc(userRef, {
      weakTopics: data.weakTopics,
      currentScore: data.score,
      updatedAt: serverTimestamp(),
    });

    // Рейтинг
    await updateUserRating(data.userId, 'DIAGNOSTIC_FINISHED');

    return diagDoc.id;
  }
};
