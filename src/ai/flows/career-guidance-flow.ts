'use server';
/**
 * @fileOverview Студентке мамандық таңдауға көмектесетін AI профориентолог flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CareerGuidanceInputSchema = z.object({
  fullName: z.string(),
  selectedSubjects: z.array(z.string()),
  targetScore: z.number(),
  currentScore: z.number(),
  interests: z.string().describe('Студенттің қызығушылықтары мен қалаулары.'),
});
export type CareerGuidanceInput = z.infer<typeof CareerGuidanceInputSchema>;

const CareerRecommendationSchema = z.object({
  title: z.string().describe('Мамандық атауы.'),
  description: z.string().describe('Мамандық туралы қысқаша сипаттама.'),
  suitabilityScore: z.number().describe('Сәйкестік пайызы (0-100).'),
  pros: z.array(z.string()).describe('Артықшылықтары.'),
  cons: z.array(z.string()).describe('Қиындықтары.'),
});

const CareerGuidanceOutputSchema = z.object({
  analysis: z.string().describe('Студенттің қазіргі бағыты мен мүмкіндіктеріне жалпы талдау.'),
  recommendations: z.array(CareerRecommendationSchema).describe('Ұсынылатын мамандықтар тізімі.'),
  suggestedUniversities: z.array(z.object({
    name: z.string(),
    location: z.string(),
    reason: z.string().describe('Неге бұл ЖОО ұсынылады?'),
  })).describe('Ұсынылатын жоғары оқу орындары.'),
  actionPlan: z.string().describe('Мақсатқа жету үшін келесі қадамдар.'),
});
export type CareerGuidanceOutput = z.infer<typeof CareerGuidanceOutputSchema>;

export async function getCareerGuidance(input: CareerGuidanceInput): Promise<CareerGuidanceOutput> {
  return careerGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerGuidancePrompt',
  input: { schema: CareerGuidanceInputSchema },
  output: { schema: CareerGuidanceOutputSchema },
  prompt: `Сіз Қазақстандағы ҰБТ және мамандық таңдау бойынша кәсіби AI профориентологсыз.
Студенттің ақпараты:
Аты: {{{fullName}}}
Таңдаған пәндері: {{#each selectedSubjects}}{{{this}}}, {{/each}}
Мақсатты балл: {{{targetScore}}}
Қазіргі балл: {{{currentScore}}}
Қызығушылықтары: {{{interests}}}

Сіздің міндетіңіз:
1. Студенттің пәндері мен қызығушылықтары негізінде оған ең қолайлы 3 мамандықты ұсыну.
2. Қазақстандағы осы бағыт бойынша ең үздік ЖОО-ларды атау (Грант мүмкіндіктерін ескере отырып).
3. Мақсатты баллға жету үшін нақты кеңестер беру.

Жауапты тек қазақ тілінде, достық ниетте және JSON форматында қайтарыңыз.`,
});

const careerGuidanceFlow = ai.defineFlow(
  {
    name: 'careerGuidanceFlow',
    inputSchema: CareerGuidanceInputSchema,
    outputSchema: CareerGuidanceOutputSchema,
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
