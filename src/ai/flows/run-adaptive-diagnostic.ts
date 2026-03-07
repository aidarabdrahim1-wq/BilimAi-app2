'use server';
/**
 * @fileOverview This file defines a Genkit flow for an adaptive diagnostic test.
 * It dynamically generates questions based on student performance to identify weak subjects and topics.
 *
 * - runAdaptiveDiagnosticTest - A function to start or continue an adaptive diagnostic test.
 * - AdaptiveDiagnosticTestInput - The input type for the runAdaptiveDiagnosticTest function.
 * - AdaptiveDiagnosticTestOutput - The return type for the runAdaptiveDiagnosticTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { genUUID } from 'genkit/extended';

// --- Helper Types for Test State Management --- For internal use within the flow
const QuestionAttemptSchema = z.object({
  questionId: z.string(),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  correctAnswer: z.string(),
});
export type QuestionAttempt = z.infer<typeof QuestionAttemptSchema>;

const TopicPerformanceSchema = z.object({
  correct: z.number().int().min(0),
  incorrect: z.number().int().min(0),
  attempts: z.number().int().min(0),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  weaknessScore: z.number().min(0).max(1), // A calculated score for weakness (correct ratio)
});
export type TopicPerformance = z.infer<typeof TopicPerformanceSchema>;

const CurrentQuestionInStateSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  correctAnswer: z.string(), // Stored in state to check student's answer
});
export type CurrentQuestionInState = z.infer<typeof CurrentQuestionInStateSchema>;

const TestStateSchema = z.object({
  studentId: z.string(),
  testId: z.string(),
  subjectsToTest: z.array(z.string()),
  topicsPerSubject: z.record(z.array(z.string())),
  currentSubjectIndex: z.number().int().min(0),
  currentTopicIndex: z.number().int().min(0),
  answeredQuestions: z.array(QuestionAttemptSchema),
  performanceByTopic: z.record(TopicPerformanceSchema), // key: `${subject}-${topic}`
  isTestComplete: z.boolean(),
  totalQuestionsAsked: z.number().int().min(0),
  maxQuestionsPerTopic: z.number().int().min(1),
  maxQuestionsPerSubject: z.number().int().min(1),
  maxTotalQuestions: z.number().int().min(1),
  currentQuestion: CurrentQuestionInStateSchema.optional(), // The question currently presented to the student
});
export type TestState = z.infer<typeof TestStateSchema>;

// --- Input Schema ---
const AdaptiveDiagnosticTestInputSchema = z.object({
  studentId: z.string().describe('The ID of the student taking the test.'),
  // The full state of the test so far. Null/undefined for the first call.
  testState: TestStateSchema.optional().describe('The current state of the diagnostic test, including history and performance. Null for the initial call.'),
  // The answer to the previous question, if one was asked.
  previousAnswer: z.string().optional().describe('The answer provided by the student to the previous question (e.g., "A", "B", "C", "D").'),
});
export type AdaptiveDiagnosticTestInput = z.infer<typeof AdaptiveDiagnosticTestInputSchema>;

// --- Output Schema ---
const QuestionOutputSchema = z.object({
  id: z.string().describe('Unique ID for the question.'),
  text: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answer options.'),
  subject: z.string().describe('The subject the question belongs to.'),
  topic: z.string().describe('The topic the question belongs to.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
});
export type QuestionOutput = z.infer<typeof QuestionOutputSchema>;

const TestSummaryOutputSchema = z.object({
  weakSubjects: z.array(z.string()).describe('A list of subjects identified as weak.'),
  weakTopics: z.array(z.string()).describe('A list of topics identified as weak.'),
  overallScore: z.number().describe('The overall percentage score in the diagnostic test.'),
  scorePerSubject: z.record(z.number()).describe('Scores per subject.'),
  scorePerTopic: z.record(z.number()).describe('Scores per topic.'),
  recommendedNextActions: z.string().describe('Recommendations for the student based on the diagnostic results.'),
});
export type TestSummaryOutput = z.infer<typeof TestSummaryOutputSchema>;

const AdaptiveDiagnosticTestOutputSchema = z.object({
  question: QuestionOutputSchema.optional().describe('The next question to present to the student.'),
  isTestComplete: z.boolean().describe('True if the diagnostic test has been completed.'),
  testSummary: TestSummaryOutputSchema.optional().describe('Summary of the test results, available when isTestComplete is true.'),
  updatedTestState: TestStateSchema.describe('The updated state of the diagnostic test, to be sent back in the next request.'),
});
export type AdaptiveDiagnosticTestOutput = z.infer<typeof AdaptiveDiagnosticTestOutputSchema>;

// --- Constants for Test Configuration --- These values can be adjusted based on desired test length and depth
const DEFAULT_MAX_QUESTIONS_PER_TOPIC = 2; // Minimum questions to cover per topic
const DEFAULT_MAX_QUESTIONS_PER_SUBJECT = 5; // Minimum questions to cover per subject
const DEFAULT_MAX_TOTAL_QUESTIONS = 15; // Max overall questions for the diagnostic
const WEAKNESS_THRESHOLD_SCORE = 0.6; // If correct ratio drops below this, topic/subject is considered weak
const DIFFICULTY_INCREMENT_THRESHOLD = 2; // Number of consecutive correct answers to consider increasing difficulty
const DIFFICULTY_DECREMENT_THRESHOLD = 1; // Number of consecutive incorrect answers to consider decreasing difficulty

// --- Prompt Definition for Question Generation --- 
const generateQuestionPrompt = ai.definePrompt({
  name: 'generateDiagnosticQuestionPrompt',
  input: {
    schema: z.object({
      subject: z.string().describe('The subject for the question (e.g., Математика).'),
      topic: z.string().describe('The specific topic within the subject (e.g., Алгебра).'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
      language: z.literal('Kazakh').describe('The language for the question and options.'),
    }),
  },
  output: {
    schema: z.object({
      questionText: z.string().describe('The text of the multiple-choice question.'),
      options: z.array(z.string()).describe('An array of 4 possible answer options (A, B, C, D).'),
      correctAnswer: z.string().describe('The correct answer option (e.g., 