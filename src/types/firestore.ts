
import { Timestamp } from 'firebase/firestore';

/**
 * Платформадағы барлық деректердің TypeScript интерфейстері
 */

export interface UserProfile {
  id: string; // Corrected from uid to id to match firestore.rules
  fullName: string;
  email: string;
  grade: string;
  currentScore: number;
  targetScore: number;
  rating: number;
  solvedQuestions: number;
  correctAnswers: number;
  completedPlans: number;
  streakDays: number;
  selectedSubjects: string[];
  subjectCombination?: string;
  targetCareer?: string;
  untDate?: string; // YYYY-MM-DD format
  weakTopics: string[];
  lastStudyDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  timeLimit: number; // минутпен
  createdAt: Timestamp;
}

export interface Question {
  id: string;
  testId: string;
  subject: string;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Timestamp;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  completedAt: Timestamp;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  tasks: {
    id: string;
    title: string;
    type: 'theory' | 'test' | 'analysis';
    status: 'pending' | 'completed';
    subject: string;
  }[];
  status: 'active' | 'completed';
  completedCount: number;
  totalCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DiagnosticResult {
  id: string;
  userId: string;
  subject: string;
  weakTopics: string[];
  strongTopics: string[];
  score: number;
  recommendations: string[];
  createdAt: Timestamp;
}

export interface Mistake {
  id: string;
  userId: string;
  questionId: string;
  subject: string;
  topic: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  createdAt: Timestamp;
}

export interface TheoryMaterial {
  id: string;
  subject: string;
  topic: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Timestamp;
}

export interface UserProgress {
  userId: string;
  dailyStudyTime: number; // минутпен
  weeklyStudyTime: number;
  completedTests: number;
  completedTheoryTopics: number;
  accuracy: number;
  updatedAt: Timestamp;
}

export interface RatingHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: Timestamp;
}
