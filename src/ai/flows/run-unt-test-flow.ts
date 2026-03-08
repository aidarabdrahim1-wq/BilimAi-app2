'use server';
/**
 * @fileOverview ҰБТ форматындағы тест сұрақтарын генерациялауға арналған Genkit flow.
 * Әр пән немесе нақты тақырып бойынша спецификацияға сай сұрақтар дайындайды.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UntQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
  points: z.number().describe('Сұрақтың баллы (1 немесе 2)'),
});

const RunUntTestInputSchema = z.object({
  subject: z.string().describe('Пән атауы'),
  topic: z.string().optional().describe('Нақты тақырып атауы'),
  count: z.number().default(5).describe('Сұрақтар саны'),
});

const RunUntTestOutputSchema = z.object({
  questions: z.array(UntQuestionSchema).optional(),
  error: z.string().optional(),
});

export async function generateUntQuestions(input: z.infer<typeof RunUntTestInputSchema>) {
  return untTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUntQuestionsPrompt',
  input: { schema: RunUntTestInputSchema },
  output: { schema: RunUntTestOutputSchema },
  prompt: `Сіз Ұлттық Тестілеу Орталығының (ҰТО) сарапшысысыз.
Келесі мәліметтер бойынша жоғары сапалы ҰБТ форматындағы тест сұрақтарын құрастырыңыз:
Пән: {{{subject}}}
{{#if topic}}Тақырып: {{{topic}}}{{/if}}
Сұрақтар саны: {{{count}}}

Нұсқаулық:
1. Сұрақтар нақты, логикалық және ҰБТ деңгейінде болуы керек.
2. Әр сұрақта 4 нұсқа (A, B, C, D) болуы тиіс.
3. Егер нақты тақырып берілсе, тек сол тақырыпты қамтыңыз.
4. "points" өрісіне: қарапайым сұрақтарға 1 балл, күрделі немесе көп жауапты (бірақ осы форматта бір жауапты таңдаңыз) сұрақтарға 2 балл беріңіз.
5. Жауапты тек қазақ тілінде JSON форматында қайтарыңыз.`,
});

const untTestFlow = ai.defineFlow(
  {
    name: 'untTestFlow',
    inputSchema: RunUntTestInputSchema,
    outputSchema: RunUntTestOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return { error: 'AI_QUOTA_EXCEEDED' };
      }
      return { error: 'UNKNOWN_ERROR' };
    }
  }
);
