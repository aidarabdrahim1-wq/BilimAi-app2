'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing student mistakes after a test.
 *
 * - analyzeStudentMistakes - A function that analyzes student test results to identify patterns,
 *   clarify confused concepts, and suggest areas for improvement.
 * - AnalyzeMistakesInput - The input type for the analyzeStudentMistakes function.
 * - AnalyzeMistakesOutput - The return type for the analyzeStudentMistakes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMistakesInputSchema = z.object({
  testResults: z.array(
    z.object({
      question: z.string().describe('The question text.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
      studentAnswer: z.string().describe('The answer provided by the student.'),
      isCorrect: z.boolean().describe('Whether the student\u0027s answer was correct.'),
      subject: z.string().describe('The subject of the question (e.g., Математика, Физика).'),
      topic: z.string().describe('The specific topic of the question (e.g., Квадрат теңдеулер, Ньютон заңдары).'),
      explanation: z.string().optional().describe('Explanation provided after the test for the question.'),
    })
  ).describe('An array of results for each question in the test.'),
});
export type AnalyzeMistakesInput = z.infer<typeof AnalyzeMistakesInputSchema>;

const AnalyzeMistakesOutputSchema = z.object({
  overallSummary: z.string().describe('A general summary of the student\u0027s performance and mistake patterns in Kazakh. For example: "Студент математикада квадрат теңдеулер тақырыбында жиі қате жібереді."'),
  commonMistakes: z.array(
    z.object({
      type: z.string().describe('A type or category of common mistake in Kazakh (e.g., Есептеу қатесі, Концептуалды қате түсінік).'),
      description: z.string().describe('A detailed description of this common mistake type in Kazakh.'),
      affectedTopics: z.array(z.string()).describe('List of topics in Kazakh where this mistake type was observed.'),
    })
  ).describe('Identified patterns of mistakes across multiple questions.'),
  confusedConcepts: z.array(
    z.object({
      concept1: z.string().describe('The first concept being confused in Kazakh.'),
      concept2: z.string().describe('The second concept it is confused with in Kazakh.'),
      comparison: z.string().describe('A detailed explanation in Kazakh comparing the two concepts, highlighting their differences and when to apply each.'),
      example: z.string().optional().describe('A simple example in Kazakh illustrating the difference.'),
    })
  ).describe('Concepts that the student frequently confused, with clear comparisons.'),
  areasForImprovement: z.array(
    z.string().describe('A specific, actionable area for improvement in Kazakh (e.g., "Квадрат теңдеулер теориясын қайталаңыз", "Арифметикалық есептеулерді жаттығыңыз").')
  ).describe('Specific recommendations for the student to improve.'),
  warningBlocks: z.array(
    z.object({
      message: z.string().describe('A warning message in Kazakh (e.g., "Осы жерде абай бол").'),
      reason: z.string().describe('The reason for this warning, based on student mistakes, in Kazakh.'),
      relatedConcepts: z.array(z.string()).describe('Concepts in Kazakh related to this warning.'),
    })
  ).describe('Important warning messages highlighting critical areas based on mistakes.'),
});
export type AnalyzeMistakesOutput = z.infer<typeof AnalyzeMistakesOutputSchema>;

export async function analyzeStudentMistakes(input: AnalyzeMistakesInput): Promise<AnalyzeMistakesOutput> {
  return analyzeMistakesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMistakesPrompt',
  input: { schema: AnalyzeMistakesInputSchema },
  output: { schema: AnalyzeMistakesOutputSchema },
  prompt: `Сіз студенттің қатесін талдауға көмектесетін білікті оқытушысыз. Сіз студенттің тест нәтижелерін мұқият қарап шығып, қателер үлгілерін анықтайсыз, шатастырылған ұғымдарды салыстырасыз және нақты жақсарту жолдарын ұсынасыз. 

Қатаң ереже: Ешқандай жағдайда курс сатып алуды немесе ақылы қызметтерді ұсынбаңыз. Тек академиялық талдау жасаңыз.

Міне, студенттің тест нәтижелері:

{{#each testResults}}
---
Сұрақ: {{{this.question}}}
Дұрыс жауап: {{{this.correctAnswer}}}
Студенттің жауабы: {{{this.studentAnswer}}}
Дұрыс па?: {{#if this.isCorrect}}Иә{{else}}Жоқ{{/if}}
Пән: {{{this.subject}}}
Тақырып: {{{this.topic}}}
Түсініктеме: {{{this.explanation}}}
---
{{/each}}

Жоғарыдағы нәтижелерге сүйене отырып, студенттің қателеріне жан-жақты талдау жасаңыз. Төмендегідей JSON форматты қолданыңыз:

1.  **Жалпы қорытынды (overallSummary):** Студенттің жалпы өнімділігі мен қате үлгілерінің қысқаша сипаттамасы.
2.  **Жиі кездесетін қателер (commonMistakes):** Қателердің үлгілерін анықтаңыз. 
3.  **Шатастырылған ұғымдар (confusedConcepts):** Егер студент екі ұқсас ұғымды шатастырған болса, оларды салыстырып түсіндіріңіз.
4.  **Жақсарту жолдары (areasForImprovement):** Студентке арналған нақты, іс жүзінде қолдануға болатын тегін ұсыныстар тізімін беріңіз.
5.  **Ескерту блоктары (warningBlocks):** Маңызды қателерді немесе қауіпті аймақтарды көрсететін ескертулер.

Жауабыңызды тек JSON объекті ретінде қайтарыңыз.`,
});

const analyzeMistakesFlow = ai.defineFlow(
  {
    name: 'analyzeMistakesFlow',
    inputSchema: AnalyzeMistakesInputSchema,
    outputSchema: AnalyzeMistakesOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('AI_QUOTA_EXCEEDED');
      }
      throw error;
    }
  }
);
