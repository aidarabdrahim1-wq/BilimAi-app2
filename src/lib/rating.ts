'use client';

import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * Рейтингті өсіру ережелері
 */
export const RATING_RULES = {
  CORRECT_ANSWER: 2,
  TEST_EXCELLENT: 15, // 80%+ нәтиже үшін
  PLAN_COMPLETED: 20,
  DIAGNOSTIC_FINISHED: 10,
  STREAK_BONUS: 10, // 3 күн қатарынан оқыса
} as const;

export type RatingReason = keyof typeof RATING_RULES;

/**
 * Пайдаланушының рейтингін жаңарту функциясы
 * @param userId Пайдаланушының ID-і
 * @param reason Рейтингтің қосылу себебі
 */
export function updateUserRating(userId: string, reason: RatingReason) {
  if (!db || !userId) return;

  const userRef = doc(db, "studentProfiles", userId);
  const points = RATING_RULES[reason];

  const updateData: any = {
    rating: increment(points),
    updatedAt: serverTimestamp(),
  };

  // Қосымша статистиканы жаңарту
  if (reason === 'CORRECT_ANSWER') {
    updateData.correctAnswers = increment(1);
    updateData.solvedQuestions = increment(1);
  } else if (reason === 'PLAN_COMPLETED') {
    updateData.completedPlans = increment(1);
  }

  updateDoc(userRef, updateData)
    .catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
}
