import { updateUserRating } from "@/lib/rating";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment } from "firebase/firestore";

/**
 * Тест аяқталған кезде шақырылатын сервис
 */
export async function finishTest(userId: string, results: { 
  totalQuestions: number, 
  correctOnes: number,
  isDiagnostic?: boolean 
}) {
  const scorePercentage = (results.correctOnes / results.totalQuestions) * 100;

  // 1. Әр дұрыс жауап үшін рейтинг қосу
  for (let i = 0; i < results.correctOnes; i++) {
    await updateUserRating(userId, 'CORRECT_ANSWER');
  }

  // 2. Егер 80%-дан жоғары болса, бонус беру
  if (scorePercentage >= 80) {
    await updateUserRating(userId, 'TEST_EXCELLENT');
  }

  // 3. Егер бұл диагностика болса
  if (results.isDiagnostic) {
    await updateUserRating(userId, 'DIAGNOSTIC_FINISHED');
  }

  // 4. Пайдаланушының соңғы балын жаңарту (currentScore)
  // Мысалы, ҰБТ форматында 140-қа шаққандағы балл
  const finalScore = Math.round((results.correctOnes / results.totalQuestions) * 140);
  if (db) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      currentScore: finalScore,
      solvedQuestions: increment(results.totalQuestions)
    });
  }
}
