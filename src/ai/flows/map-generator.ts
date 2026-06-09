'use server';
/**
 * @fileOverview A Genkit flow for generating narrative maps with points, connections, and secret locations.
 *
 * - generateMap - A function that handles the map generation process.
 * - MapGeneratorInput - The input type for the generateMap function.
 * - MapGeneratorOutput - The return type for the generateMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MapGeneratorInputSchema = z.object({
  campaign: z.object({
    name: z.string().describe('The name of the campaign.'),
    tone: z.string().describe('The narrative tone of the campaign (e.g., fantasia sombria, épica).'),
    rule_system: z.string().describe('The rule system in use (e.g., dnd_srd).'),
  }),
  area_description: z.string().describe('A detailed description of the area for which the map is to be generated.'),
  existing_map_elements: z.string().optional().describe('Optional: Existing points or connections in the map to build upon.'),
});

export type MapGeneratorInput = z.infer<typeof MapGeneratorInputSchema>;

const MapGeneratorOutputSchema = z.object({
  map_name: z.string().describe('The suggested name for the map.'),
  map_type: z.string().describe('The type of map (e.g., cidade, floresta, masmorra, edifício).'),
  visible_points: z.array(z.string()).describe('A list of clearly visible points of interest on the map.'),
  hidden_points: z.array(z.string()).describe('A list of points that exist but are not immediately obvious and require discovery.'),
  secret_points: z.array(
    z.object({
      name: z.string().describe('The name of the secret point.'),
      discovery_condition: z.string().describe('The condition for discovering this secret point (e.g., 