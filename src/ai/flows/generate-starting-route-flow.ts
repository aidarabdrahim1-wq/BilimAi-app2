'use server';
/**
 * @fileOverview Оқушының жағдайына байланысты жеке старттық маршрут құрастыратын AI flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StartingRouteInputSchema = z.object({
  prepExperience: z.string(),
  lastScore: z.string(),
  hardestSubject: z.string(),
  mainDifficulty: z.string(),
  dailyTime: z.string(),
  timeLeft: z.string(),
  preferredFormat: z.string(),
  goal: z.string(),
});
export type StartingRouteInput = z.infer<typeof StartingRouteInputSchema>;

const StartingRouteOutputSchema = z.object({
  segment: z.string().describe('Оқушының сегменті (мысалы: "Нөлден бастаушы", "Жүйесіз дайындалушы" т.б.)'),
  analysis: z.string().describe('Оқушының жағдайына қысқаша талдау.'),
  routeSteps: z.array(z.string()).describe('Нақты старттық қадамдар тізімі.'),
  focusSubjects: z.array(z.string()).describe('Ең бірінші кезекте ретке келтіру керек пәндер.'),
  weeklyPlan: z.string().describe('Алғашқы аптаға арналған стратегиялық кеңес.'),
  formatAdvice: z.string().describe('Оған ең тиімді оқу форматы туралы ұсыныс.'),
});
export type StartingRouteOutput = z.infer<typeof StartingRouteOutputSchema>;

export async function generateStartingRoute(input: StartingRouteInput): Promise<StartingRouteOutput> {
  return startingRouteFlow(input);
}

const startingRouteFlow = ai.defineFlow(
  {
    name: 'startingRouteFlow',
    inputSchema: StartingRouteInputSchema,
    outputSchema: StartingRouteOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'startingRoutePrompt',
      input: { schema: StartingRouteInputSchema },
      output: { schema: StartingRouteOutputSchema },
      prompt: `Сіз ҰБТ-ға дайындалу бойынша кәсіби AI профориентолог және кураторсыз.
Студенттің жауаптарына сүйене отырып, оған нақты старттық маршрут (бастау стратегиясын) құрып беріңіз.

Студенттің жағдайы:
1. Бұрынғы дайындығы: {{{prepExperience}}}
2. Соңғы нәтижесі: {{{lastScore}}}
3. Ең қиын пәні: {{{hardestSubject}}}
4. Негізгі қиындығы: {{{mainDifficulty}}}
5. Күнделікті уақыты: {{{dailyTime}}}
6. Қалған уақыт: {{{timeLeft}}}
7. Ыңғайлы формат: {{{preferredFormat}}}
8. Мақсаты: {{{goal}}}

Сіздің міндетіңіз:
1. Оқушыны нақты сегментке бөлу (Нөлден бастаушы / Жүйесіз / Орташа деңгей / Жоғары балл көздеуші).
2. Оған "сенің деңгейің осындай" деп қана қоймай, "оқуды неден бастау керек?" деген сұраққа жауап беретін нақты маршрут сызу.
3. Кеңестеріңіз іс-әрекетке бағытталған (actionable) болсын.

Жауапты тек қазақ тілінде, достық ниетте және JSON форматында қайтарыңыз.`,
    });

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
