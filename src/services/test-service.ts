
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, increment, doc, updateDoc } from 'firebase/firestore';
import { TestResult, Mistake } from '@/types/firestore';
import { updateUserRating } from '@/lib/rating';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const testService = {
  /**
   * Тест нәтижесін сақтау және статистиканы жаңарту
   */
  async createTestResult(data: Omit<TestResult, 'id' | 'completedAt'>) {
    if (!db || !data.userId) return;

    // Пайдаланушының статистикасын жаңарту (studentProfiles бойынша)
    const userRef = doc(db, 'studentProfiles', data.userId);
    const updateData = {
      solvedQuestions: increment(data.totalQuestions),
      correctAnswers: increment(data.correctAnswers),
      currentScore: Math.round((data.correctAnswers / data.totalQuestions) * 140),
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
    await updateUserRating(data.userId, 'CORRECT_ANSWER');
    
    if (data.percentage >= 80) {
      await updateUserRating(data.userId, 'TEST_EXCELLENT');
    }
  },

  /**
   * Қате кеткен сұрақты сақтау (studentProfiles ішіне немесе сәйкес коллекцияға)
   */
  async saveMistake(data: Omit<Mistake, 'id' | 'createdAt'>) {
    if (!db || !data.userId) return;
    
    // MistakePattern немесе арнайы қателер журналы үшін backend.json-ға сай сақтау керек
    // Қазіргі firestore.rules-те арнайы /mistakes жолы жоқ болса, бұл функцияны ережеге сай бейімдеу қажет
  }
};
