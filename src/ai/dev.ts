import { config } from 'dotenv';
config();

import '@/ai/flows/item-describer.ts';
import '@/ai/flows/map-generator.ts';
import '@/ai/flows/combat-narrator-flow.ts';
import '@/ai/flows/rules-helper-flow.ts';
import '@/ai/flows/session-summarizer.ts';
import '@/ai/flows/narrator-npc-dialogue.ts';