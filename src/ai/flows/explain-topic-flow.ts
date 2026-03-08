'use server';
/**
 * @fileOverview Тақырыпты AI арқылы түсіндіруге арналған Genkit flow.
 *
 * - explainTopic - Тақырып бойынша толық түсініктеме береді.
 * - ExplainTopicInput - Кіріс деректері (пән және тақырып).
 * - ExplainTopicOutput - Шығыс деректері (анықтама, ережелер, мысалдар).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainTopicInputSchema = z.object({
  subject: z.string().describe('Пән атауы (мысалы: Математика).'),
  topic: z.string().describe('Түсіндіру қажет тақырып атауы.'),
});
export type ExplainTopicInput = z.infer<typeof ExplainTopicInputSchema>;

const ExplainTopicOutputSchema = z.object({
  definition: z.string().describe('Тақырыптың қысқаша әрі нұсқа анықтамасы.'),
  explanation: z.string().describe('Тақырыптың егжей-тегжейлі түсіндірмесі.'),
  keyRules: z.array(z.string()).describe('Негізгі ережелер немесе формулалар тізімі.'),
  example: z.string().describe('Тақырыпты түсіндіретін қарапайым мысал.'),
  memoryHack: z.string().describe('Тақырыпты есте сақтауға көмектесетін әдіс немесе лайфхак.'),
  howItAppearsInUNT: z.string().describe('Бұл тақырып ҰБТ-да қалай кездеседі.'),
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

Пән: {{{subject}}}
Тақырып: {{{topic}}}

Жауапты қазақ тілінде келесі құрылымда қайтарыңыз:
1. Анықтама (Definition): Тақырыптың мәнін бір сөйлеммен ашыңыз.
2. Түсіндірме (Explanation): Оқушыға тақырыптың логикасын түсіндіріңіз.
3. Негізгі ережелер/Формулалар (Key Rules): Ең маңызды пункттерді тізіп шығыңыз.
4. Мысал (Example): Күнделікті өмірден немесе есептен нақты мысал келтіріңіз.
5. Есте сақтау әдісі (Memory Hack): Тақырыпты қалай тез жаттауға болатынын айтыңыз.
6. ҰБТ-да кездесуі: Бұл сұрақ тестте қалай келуі мүмкін.

Тек қазақ тілінде және JSON форматта жауап беріңіз.`,
});

const explainTopicFlow = ai.defineFlow(
  {
    name: 'explainTopicFlow',
    inputSchema: ExplainTopicInputSchema,
    outputSchema: ExplainTopicOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
