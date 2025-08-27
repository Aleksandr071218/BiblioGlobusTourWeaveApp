import { config } from 'dotenv';
config();

import '@/ai/flows/enrich-hotel-info.ts';
import '@/ai/flows/tour-package-recommendation.ts';
import '@/ai/flows/summarize-hotel-reviews.ts';