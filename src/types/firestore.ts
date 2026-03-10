
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
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
  totalStudyTimeMinutes: number;
  todayStudyTimeMinutes: number;
  lastStudyDate?: string;
  lastVisitDate?: string;
  activityHistory: string[];
  lastStudyTimestamp?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
