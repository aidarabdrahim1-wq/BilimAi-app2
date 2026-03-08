'use server';
/**
 * @fileOverview This file implements a Genkit flow for an AI curator chat support system.
 * It uses the student's profile context to provide personalized UNT preparation advice.
 *
 * - provideCuratorSupport - A function that handles the AI curator chat interaction.
 * - CuratorChatInput - The input type for the provideCuratorSupport function.
 * - CuratorChatOutput - The return type for the provideCuratorSupport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CuratorChatInputSchema = z.object({
  studentMessage: z.string().describe('The message from the student to the AI curator.'),
  studentProfile: z.object({
    fullName: z.string(),
    grade: z.string(),
    targetScore: z.number(),
    currentScore: z.number(),
    selectedSubjects: z.array(z.string()),
    weakTopics: z.array(z.string()),
  }).optional().describe('The student profile context.'),
});
export type CuratorChatInput = z.infer<typeof CuratorChatInputSchema>;

const CuratorChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI curator\'s supportive and encouraging response.'),
});
export type CuratorChatOutput = z.infer<typeof CuratorChatOutputSchema>;

export async function provideCuratorSupport(input: CuratorChatInput): Promise<CuratorChatOutput> {
  return curatorChatFlow(input);
}

const curatorChatPrompt = ai.definePrompt({
  name: 'curatorChatPrompt',
  input: { schema: CuratorChatInputSchema },
  output: { schema: CuratorChatOutputSchema },
  prompt: `Сіз ҰБТ-ға (Ұлттық бірыңғай тестілеу) дайындалып жатқан студенттерге қолдау көрсететін, сабырлы, тәртіпті және ынталандыратын жасанды интеллект кураторысыз.

{{#if studentProfile}}
Студент туралы ақпарат:
Аты: {{{studentProfile.fullName}}}
Сыныбы: {{{studentProfile.grade}}}
Мақсатты балл: {{{studentProfile.targetScore}}}
Ағымдағы балл: {{{studentProfile.currentScore}}}
Таңдаған пәндері: {{#each studentProfile.selectedSubjects}}{{{this}}}, {{/each}}
Әлсіз тақырыптары: {{#each studentProfile.weakTopics}}{{{this}}}, {{/each}}
{{/if}}

Сіздің мақсатыңыз:
- Студенттің стрессін басқаруға көмектесу.
- Оқу барысындағы қиындықтарын жеңуге бағыт беру.
- Теория түсіндіру, тест сұрақтарын құрастыру, қателерді талдау немесе жоспар құру.
- Жауаптарыңыз қысқа, құрылымдалған және нақты болсын.
- Тек қазақ тілінде жауап беріңіз.

Төменде студенттің хабарламасы берілген:
Студент: {{{studentMessage}}}

Сіздің кураторлық жауабыңыз:`,
});

const curatorChatFlow = ai.defineFlow(
  {
    name: 'curatorChatFlow',
    inputSchema: CuratorChatInputSchema,
    outputSchema: CuratorChatOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await curatorChatPrompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('AI_QUOTA_EXCEEDED');
      }
      throw error;
    }
  }
);
