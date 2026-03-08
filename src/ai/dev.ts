import { config } from 'dotenv';
config();

import '@/ai/flows/provide-curator-support.ts';
import '@/ai/flows/analyze-student-mistakes-flow.ts';
import '@/ai/flows/generate-study-plan-flow.ts';
import '@/ai/flows/run-adaptive-diagnostic.ts';
import '@/ai/flows/explain-topic-flow.ts';
