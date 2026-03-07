'use server';
/**
 * @fileOverview A Genkit flow for generating personalized daily and weekly study plans for students.
 *
 * - generateStudyPlan - A function that handles the study plan generation process.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStudyPlanInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  currentScore: z.number().describe('The current score of the student.'),
  targetScore: z.number().describe('The target score the student aims to achieve.'),
  weakSubjects: z.array(z.string()).describe('A list of subjects the student is weak in, e.g., ["Математика", "Физика"].'),
  weakTopics: z.array(z.string()).describe('A list of specific topics the student is weak in, e.g., ["Тригонометрия", "Механика"].'),
  dailyAvailableStudyTimeMinutes: z.number().describe('The total minutes the student can study daily.'),
  studyGoals: z.string().describe('Specific study goals provided by the student, e.g., "Математикадан 90 балл алу".'),
  performanceSummary: z.string().describe('A brief summary of the student\'s recent performance, including common mistakes, e.g., "Соңғы тесттерде Тригонометриядан жиі қате жіберемін".'),
  levelSegmentation: z.string().describe('The current score range segmentation of the student (e.g., "50-70 балл", "70-90 балл", "90-110 балл", "110+").'),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const DailyPlanActivitySchema = z.object({
  activity: z.string().describe('The type and duration of the activity, e.g., "30 min theory", "40 min test", "20 min mistake analysis", "10 min revision".'),
  description: z.string().describe('A brief description of the activity, focusing on the subject and topic, e.g., "Математика: Тригонометрия теориясы", "Физика: Механика бойынша тест".'),
});

const WeeklyPlanDaySchema = z.object({
  day: z.string().describe('The day of the week in Kazakh, e.g., "Дүйсенбі", "Сейсенбі".'),
  activities: z.array(z.string()).describe('A list of activities for the day in Kazakh, e.g., "жаңа тақырып", "бекіту", "тест", "әлсіз тақырып", "аралас тест", "толық пробник", "қателермен жұмыс".'),
});

const GenerateStudyPlanOutputSchema = z.object({
  dailyPlan: z.array(DailyPlanActivitySchema).describe('A detailed daily study plan, broken down into specific activities and descriptions, addressing weak areas and goals.'),
  weeklyPlan: z.array(WeeklyPlanDaySchema).describe('A structured weekly study plan, outlining general activities for each day of the week, e.g., "Дүйсенбі: жаңа тақырып".'),
  motivationMessage: z.string().describe('A calm, supportive, and encouraging motivational message for the student in Kazakh.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: GenerateStudyPlanOutputSchema },
  prompt: `Сіз студентке ҰБТ-ға дайындалуға арналған жеке оқу жоспарын құрастыратын білікті AI кураторсыз.\nСіз студенттің ағымдағы көрсеткіштеріне, әлсіз тұстарына және мақсаттарына негізделген егжей-тегжейлі күнделікті және апталық жоспарды құрастыруыңыз керек. Жоспар қазақ тілінде болуы керек.\n\nСтуденттің ақпараты:\nАты: {{{studentName}}}\nАғымдағы балл: {{{currentScore}}}\nМақсатты балл: {{{targetScore}}}\nӘлсіз пәндер: {{#if weakSubjects}}{{#each weakSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Жоқ{{/if}}\nӘлсіз тақырыптар: {{#if weakTopics}}{{#each weakTopics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Жоқ{{/if}}\nКүнделікті оқуға бөлінген уақыт: {{{dailyAvailableStudyTimeMinutes}}} минут\nОқу мақсаттары: {{{studyGoals}}}\nСоңғы көрсеткіштер қорытындысы: {{{performanceSummary}}}\nДеңгей сегментациясы: {{{levelSegmentation}}}\n\nЖоспарды құрастырғанда келесі ережелерді сақтаңыз:\n1.  Күнделікті жоспарды құрастырғанда, жалпы уақытты ({{{dailyAvailableStudyTimeMinutes}}} минут) теория, тест, қате талдау және қайталау сияқты әрекеттерге бөліңіз. Әр әрекеттің сипаттамасында пән мен тақырыпты көрсетіңіз, әсіресе әлсіз тұстарға басымдық беріңіз.\n2.  Апталық жоспарды "Дүйсенбі: жаңа тақырып", "Сейсенбі: бекіту", "Сәрсенбі: тест", "Бейсенбі: әлсіз тақырып", "Жұма: аралас тест", "Сенбі: толық пробник", "Жексенбі: қателермен жұмыс" үлгісінде құрастырыңыз.\n3.  Мотивациялық хабарлама студентті қолдайтын, жігерлендіретін, бірақ тәртіпті сақтауға шақыратын болуы керек.\n4.  Барлық жауап қазақ тілінде болуы керек.\n\nЕскерту: Жоспарды құру кезінде студенттің қазіргі деңгейін ({{{levelSegmentation}}}) және мақсатты баллын ескеріңіз.\n`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
