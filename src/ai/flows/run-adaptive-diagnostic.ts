'use server';
/**
 * @fileOverview Оқушының таңдаған пәндері мен тақырыптарына негізделген бейімделгіш диагностикалық тест.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {UBT_TOPICS} from '@/lib/ubt-data';

// --- Көмекші схемалар ---
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
  correct: z.number().default(0),
  attempts: z.number().default(0),
  weaknessScore: z.number().default(0), // 0-1 (1 - өте әлсіз)
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
  subjectsToTest: z.array(z.string()),
  currentSubjectIndex: z.number().default(0),
  currentTopicIndex: z.number().default(0),
  answeredQuestions: z.array(QuestionAttemptSchema).default([]),
  performanceByTopic: z.record(TopicPerformanceSchema).default({}),
  isTestComplete: z.boolean().default(false),
  totalQuestionsAsked: z.number().default(0),
  maxTotalQuestions: z.number().default(20), // Диагностика үшін оңтайлы сан
  currentQuestion: CurrentQuestionInStateSchema.optional(),
});

export type TestState = z.infer<typeof TestStateSchema>;

const AdaptiveDiagnosticTestInputSchema = z.object({
  studentId: z.string(),
  selectedSubjects: z.array(z.string()).optional(), // Алғашқы рет бастағанда керек
  testState: TestStateSchema.optional(),
  previousAnswer: z.string().optional(),
});

const AdaptiveDiagnosticTestOutputSchema = z.object({
  question: z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.string()),
    subject: z.string(),
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }).optional(),
  isTestComplete: z.boolean(),
  testSummary: z.object({
    weakSubjects: z.array(z.string()),
    weakTopics: z.array(z.string()),
    overallScore: z.number(),
    recommendedNextActions: z.string(),
  }).optional(),
  updatedTestState: TestStateSchema,
});

export type AdaptiveDiagnosticTestOutput = z.infer<typeof AdaptiveDiagnosticTestOutputSchema>;

// --- Промпт анықтамасы ---
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
      options: z.array(z.string()).describe('4 нұсқа (A, B, C, D)'),
      correctAnswer: z.string().describe('Тек әріп (A, B, C немесе D)'),
    }),
  },
  prompt: `Сіз ҰБТ сарапшысысыз. Оқушының білімін диагностикалау үшін келесі тақырып бойынша сапалы сұрақ құрастырыңыз:
Пән: {{{subject}}}
Тақырып (тарау): {{{topic}}}
Қиындық деңгейі: {{{difficulty}}}

Сұрақ қазақ тілінде болуы керек. Нұсқалар нақты және бір-біріне ұқсас болсын. 
Жауапты JSON форматында беріңіз.`,
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
    let state: TestState;

    if (!input.testState) {
      // Инициализация
      state = {
        studentId: input.studentId,
        subjectsToTest: input.selectedSubjects || ["Математика", "Қазақстан тарихы"],
        currentSubjectIndex: 0,
        currentTopicIndex: 0,
        answeredQuestions: [],
        performanceByTopic: {},
        isTestComplete: false,
        totalQuestionsAsked: 0,
        maxTotalQuestions: 20,
      };
    } else {
      state = input.testState;
    }

    // Алдыңғы жауапты өңдеу
    if (input.previousAnswer && state.currentQuestion) {
      const isCorrect = input.previousAnswer === state.currentQuestion.correctAnswer;
      const q = state.currentQuestion;

      state.answeredQuestions.push({
        questionId: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        studentAnswer: input.previousAnswer,
        isCorrect,
        correctAnswer: q.correctAnswer,
      });

      // Статистиканы жаңарту
      const topicKey = `${q.subject}:${q.topic}`;
      const perf = state.performanceByTopic[topicKey] || { correct: 0, attempts: 0, weaknessScore: 0 };
      perf.attempts += 1;
      if (isCorrect) perf.correct += 1;
      perf.weaknessScore = 1 - (perf.correct / perf.attempts);
      state.performanceByTopic[topicKey] = perf;

      state.totalQuestionsAsked++;

      // Келесі тақырыпқа көшу (әр тақырыптан 1-2 сұрақ жеткілікті диагностика үшін)
      state.currentTopicIndex++;
      const currentSubject = state.subjectsToTest[state.currentSubjectIndex];
      const topics = UBT_TOPICS[currentSubject]?.topics || ["Жалпы"];
      
      if (state.currentTopicIndex >= topics.length || state.currentTopicIndex >= 5) { // Бір пәннен макс 5 тақырып
        state.currentTopicIndex = 0;
        state.currentSubjectIndex++;
      }
    }

    // Тесттің аяқталуын тексеру
    if (state.totalQuestionsAsked >= state.maxTotalQuestions || state.currentSubjectIndex >= state.subjectsToTest.length) {
      state.isTestComplete = true;
      
      // Қорытынды жасау
      const weakTopics: string[] = [];
      Object.entries(state.performanceByTopic).forEach(([key, perf]) => {
        if (perf.weaknessScore > 0.5) weakTopics.push(key.split(':')[1]);
      });

      const correctCount = state.answeredQuestions.filter(a => a.isCorrect).length;
      const overallScore = Math.round((correctCount / state.maxTotalQuestions) * 140);

      return {
        isTestComplete: true,
        testSummary: {
          weakSubjects: Array.from(new Set(state.answeredQuestions.filter(a => !a.isCorrect).map(a => a.subject))),
          weakTopics: weakTopics.slice(0, 5),
          overallScore,
          recommendedNextActions: "Әлсіз тақырыптар бойынша теорияны қайталап, практикалық базадан тест тапсыруды ұсынамын."
        },
        updatedTestState: state
      };
    }

    // Келесі сұрақты генерациялау
    const currentSubject = state.subjectsToTest[state.currentSubjectIndex];
    const topics = UBT_TOPICS[currentSubject]?.topics || ["Жалпы"];
    const currentTopic = topics[state.currentTopicIndex] || topics[0];

    // Қиындықты бейімдеу (алдыңғы жауаптарға қарай)
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    const lastThree = state.answeredQuestions.slice(-3);
    if (lastThree.length === 3) {
      const correctCount = lastThree.filter(a => a.isCorrect).length;
      if (correctCount === 3) difficulty = 'hard';
      if (correctCount === 0) difficulty = 'easy';
    }

    try {
      const { output } = await generateQuestionPrompt({
        subject: currentSubject,
        topic: currentTopic,
        difficulty
      });

      state.currentQuestion = {
        id: Math.random().toString(36).substring(7),
        text: output!.questionText,
        options: output!.options,
        subject: currentSubject,
        topic: currentTopic,
        difficulty,
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
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error("AI_GENERATION_FAILED");
    }
  }
);
