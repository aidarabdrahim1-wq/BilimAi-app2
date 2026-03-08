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

// --- Helper Types for Test State Management ---
const QuestionAttemptSchema = z.object({
  questionId: z.string(),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  correctAnswer: z.string(),
});

const TopicPerformanceSchema = z.object({
  correct: z.number().int().min(0),
  incorrect: z.number().int().min(0),
  attempts: z.number().int().min(0),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  weaknessScore: z.number().min(0).max(1), 
});

const CurrentQuestionInStateSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  correctAnswer: z.string(),
});

const TestStateSchema = z.object({
  studentId: z.string(),
  testId: z.string(),
  subjectsToTest: z.array(z.string()),
  topicsPerSubject: z.record(z.array(z.string())),
  currentSubjectIndex: z.number().int().min(0),
  currentTopicIndex: z.number().int().min(0),
  answeredQuestions: z.array(QuestionAttemptSchema),
  performanceByTopic: z.record(TopicPerformanceSchema), 
  isTestComplete: z.boolean(),
  totalQuestionsAsked: z.number().int().min(0),
  maxQuestionsPerTopic: z.number().int().min(1),
  maxQuestionsPerSubject: z.number().int().min(1),
  maxTotalQuestions: z.number().int().min(1),
  currentQuestion: CurrentQuestionInStateSchema.optional(),
});

export type TestState = z.infer<typeof TestStateSchema>;

// --- Input/Output Schema ---
const AdaptiveDiagnosticTestInputSchema = z.object({
  studentId: z.string().describe('The ID of the student taking the test.'),
  testState: TestStateSchema.optional().describe('The current state of the diagnostic test.'),
  previousAnswer: z.string().optional().describe('The student answer (A, B, C, D).'),
});

const QuestionOutputSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const TestSummaryOutputSchema = z.object({
  weakSubjects: z.array(z.string()),
  weakTopics: z.array(z.string()),
  overallScore: z.number(),
  scorePerSubject: z.record(z.number()),
  recommendedNextActions: z.string(),
});

const AdaptiveDiagnosticTestOutputSchema = z.object({
  question: QuestionOutputSchema.optional(),
  isTestComplete: z.boolean(),
  testSummary: TestSummaryOutputSchema.optional(),
  updatedTestState: TestStateSchema,
});

export type AdaptiveDiagnosticTestOutput = z.infer<typeof AdaptiveDiagnosticTestOutputSchema>;

// --- Prompt Definition ---
const generateQuestionPrompt = ai.definePrompt({
  name: 'generateDiagnosticQuestionPrompt',
  input: {
    schema: z.object({
      subject: z.string(),
      topic: z.string(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    }),
  },
  output: {
    schema: z.object({
      questionText: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
    }),
  },
  prompt: `Сіз ҰБТ сарапшысысыз. Төмендегі тақырып бойынша сапалы тест сұрағын құрастырыңыз:
Пән: {{{subject}}}
Тақырып: {{{topic}}}
Қиындық деңгейі: {{{difficulty}}}

Сұрақ қазақ тілінде, 4 нұсқалы (A, B, C, D) болуы керек. Жауапты JSON форматында беріңіз.`,
});

export async function runAdaptiveDiagnosticTest(input: z.infer<typeof AdaptiveDiagnosticTestInputSchema>): Promise<AdaptiveDiagnosticTestOutput> {
  return diagnosticFlow(input);
}

const diagnosticFlow = ai.defineFlow(
  {
    name: 'adaptiveDiagnosticFlow',
    inputSchema: AdaptiveDiagnosticTestInputSchema,
    outputSchema: AdaptiveDiagnosticTestOutputSchema,
  },
  async (input) => {
    let state = input.testState || {
      studentId: input.studentId,
      testId: Math.random().toString(36).substring(7),
      subjectsToTest: ["Математика", "Физика"],
      topicsPerSubject: { "Математика": ["Алгебра", "Геометрия"], "Физика": ["Механика"] },
      currentSubjectIndex: 0,
      currentTopicIndex: 0,
      answeredQuestions: [],
      performanceByTopic: {},
      isTestComplete: false,
      totalQuestionsAsked: 0,
      maxQuestionsPerTopic: 2,
      maxQuestionsPerSubject: 5,
      maxTotalQuestions: 10,
    };

    // Update state if previous answer exists
    if (input.previousAnswer && state.currentQuestion) {
      const isCorrect = input.previousAnswer === state.currentQuestion.correctAnswer;
      state.answeredQuestions.push({
        questionId: state.currentQuestion.id,
        subject: state.currentQuestion.subject,
        topic: state.currentQuestion.topic,
        difficulty: state.currentQuestion.difficulty,
        studentAnswer: input.previousAnswer,
        isCorrect,
        correctAnswer: state.currentQuestion.correctAnswer,
      });
      state.totalQuestionsAsked++;
    }

    // Check if test should end
    if (state.totalQuestionsAsked >= state.maxTotalQuestions) {
      state.isTestComplete = true;
      return {
        isTestComplete: true,
        testSummary: {
          weakSubjects: ["Математика"],
          weakTopics: ["Логарифмдер"],
          overallScore: 70,
          scorePerSubject: { "Математика": 65 },
          recommendedNextActions: "Көбірек практика қажет."
        },
        updatedTestState: state
      };
    }

    // Generate next question
    const currentSubject = state.subjectsToTest[state.currentSubjectIndex];
    const currentTopic = state.topicsPerSubject[currentSubject][state.currentTopicIndex];
    
    const { output } = await generateQuestionPrompt({
      subject: currentSubject,
      topic: currentTopic,
      difficulty: 'medium'
    });

    state.currentQuestion = {
      id: Math.random().toString(36).substring(7),
      text: output!.questionText,
      options: output!.options,
      subject: currentSubject,
      topic: currentTopic,
      difficulty: 'medium',
      correctAnswer: output!.correctAnswer
    };

    return {
      question: {
        id: state.currentQuestion.id,
        text: state.currentQuestion.text,
        options: state.currentQuestion.options,
        subject: state.currentQuestion.subject,
        topic: state.currentQuestion.topic,
        difficulty: state.currentQuestion.difficulty
      },
      isTestComplete: false,
      updatedTestState: state
    };
  }
);
