'use server';
/**
 * @fileOverview This file implements a Genkit flow for an AI curator chat support system.
 * The AI curator provides calm, supportive, and disciplined encouragement and practical study advice.
 *
 * - provideCuratorSupport - A function that handles the AI curator chat interaction.
 * - CuratorChatInput - The input type for the provideCuratorSupport function.
 * - CuratorChatOutput - The return type for the provideCuratorSupport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CuratorChatInputSchema = z.object({
  studentMessage: z.string().describe('The message from the student to the AI curator.'),
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
  prompt: `Сіз ҰБТ-ға дайындалып жатқан студенттерге қолдау көрсететін, сабырлы, тәртіпті және ынталандыратын жасанды интеллект кураторысыз.
Сіздің мақсатыңыз – студенттің стрессін басқаруға, оқу барысындағы қиындықтарын жеңуге және оқуға деген ынтасын арттыруға көмектесу.
Практикалық кеңестер мен қолдау сөздерін беріңіз.

Төменде студенттің хабарламасы берілген:
Студент хабарламасы: {{{studentMessage}}}

Сіздің жауабыңыз:`,
});

const curatorChatFlow = ai.defineFlow(
  {
    name: 'curatorChatFlow',
    inputSchema: CuratorChatInputSchema,
    outputSchema: CuratorChatOutputSchema,
  },
  async (input) => {
    const { output } = await curatorChatPrompt(input);
    return output!;
  }
);
