import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, increment, doc, updateDoc } from 'firebase/firestore';
import { TestResult, Mistake } from '@/types/firestore';
import { updateUserRating } from '@/lib/rating';

export const testService = {
  /**
   * Тест нәтижесін сақтау және статистиканы жаңарту
   */
  async createTestResult(data: Omit<TestResult, 'id' | 'completedAt'>) {
    const resultsRef = collection(db, 'test_results');
    const resultDoc = await addDoc(resultsRef, {
      ...data,
      completedAt: serverTimestamp(),
    });

    // Пайдаланушының жалпы статистикасын жаңарту
    const userRef = doc(db, 'users', data.userId);
    await updateDoc(userRef, {
      solvedQuestions: increment(data.totalQuestions),
      correctAnswers: increment(data.correctAnswers),
      currentScore: Math.round((data.correctAnswers / data.totalQuestions) * 140), // ҰБТ балына шаққанда
      updatedAt: serverTimestamp(),
    });

    // Рейтинг қосу логикасы
    // Әр дұрыс жауап үшін +2
    await updateUserRating(data.userId, 'CORRECT_ANSWER');
    
    // Егер 80% жоғары болса бонус
    if (data.percentage >= 80) {
      await updateUserRating(data.userId, 'TEST_EXCELLENT');
    }

    return resultDoc.id;
  },

  /**
   * Қате кеткен сұрақты сақтау
   */
  async saveMistake(data: Omit<Mistake, 'id' | 'createdAt'>) {
    const mistakesRef = collection(db, 'mistakes');
    await addDoc(mistakesRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
};
