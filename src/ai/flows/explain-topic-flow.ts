'use server';
/**
 * @fileOverview Тақырыпты AI арқылы түсіндіруге арналған Genkit flow.
 * Пайдаланушының сұранысына сай құрылымдалған: 1. Берілгені, 2. Теория, 5. Жаттау керек жылдар, 6. ҰБТ-да көп келетін тақырыптар.
 *
 * - explainTopic - Тақырып бойынша толық түсініктеме береді.
 * - ExplainTopicInput - Кіріс деректері (пән және тақырып).
 * - ExplainTopicOutput - Шығыс деректері (берілгені, теория, жылдар, ұбт фокусы).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainTopicInputSchema = z.object({
  subject: z.string().describe('Пән атауы (мысалы: Математика).'),
  topic: z.string().describe('Түсіндіру қажет тақырып атауы.'),
});
export type ExplainTopicInput = z.infer<typeof ExplainTopicInputSchema>;

const ExplainTopicOutputSchema = z.object({
  given: z.string().optional().describe('Тақырыптың берілгені немесе қысқаша контексті.'),
  theory: z.string().optional().describe('Тақырыптың егжей-тегжейлі теориялық түсіндірмесі.'),
  yearsToMemorize: z.array(z.string()).optional().describe('Жаттап алу керек маңызды жылдар немесе негізгі даталар/деректер.'),
  frequentUntTopics: z.string().optional().describe('ҰБТ-да осы тақырып бойынша жиі келетін сұрақтардың бағыттары мен маңызды тұстары.'),
  error: z.string().optional().describe('Қателік коды.'),
});
export type ExplainTopicOutput = z.infer<typeof ExplainTopicOutputSchema>;

export async function explainTopic(input: ExplainTopicInput): Promise<ExplainTopicOutput> {
  return explainTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTopicPrompt',
  input: { schema: ExplainTopicInputSchema },
  output: { schema: ExplainTopicOutputSchema },
  prompt: `Сіз ҰБТ-ға дайындайтын кәсіби оқытушысыз. Келесі тақырыпты оқушыға өте қарапайым, қызықты және түсінікті тілде түсіндіріп беріңіз.

Маңызды ескерту: Ешқандай ақылы курстарды сатып алуды ұсынбаңыз. Тек академиялық білім беріңіз.

Пән: {{{subject}}}
Тақырып: {{{topic}}}

Жауапты қазақ тілінде келесі 4 бөлім бойынша JSON форматта қайтарыңыз:
1. Берілгені (given): Тақырыптың мәні мен негізгі контексті.
2. Теория (theory): Оқушыға тақырыптың логикасын, заңдылықтарын егжей-тегжейлі түсіндіріңіз.
3. Жаттап алу керек жылдар (yearsToMemorize): Негізгі даталар немесе жаттауға міндетті фактілер мен формулалар.
4. ҰБТ-да көп келетін тақырыптар (frequentUntTopics): Бұл тақырыптың ішіндегі тестте ең жиі кездесетін сұрақ түрлері.

Тек қазақ тілінде және JSON форматта жауап беріңіз.`,
});

const explainTopicFlow = ai.defineFlow(
  {
    name: 'explainTopicFlow',
    inputSchema: ExplainTopicInputSchema,
    outputSchema: ExplainTopicOutputSchema,
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
