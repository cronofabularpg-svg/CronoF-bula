'use server';
/**
 * @fileOverview A Genkit flow to generate a narrative summary of a game session.
 *
 * - summarizeSession - A function that handles the session summary process.
 * - SessionSummaryInput - The input type for the summarizeSession function.
 * - SessionSummaryOutput - The return type for the summarizeSession function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ----------------------------------------------------------------------------
// Input Schema
// ----------------------------------------------------------------------------

const SessionSummaryInputSchema = z.object({
  campaign: z.object({
    id: z.string().uuid().describe('UUID of the campaign.'),
    name: z.string().describe('Name of the campaign.'),
    tone: z.string().describe('Narrative tone of the campaign (e.g., fantasia sombria, épica).'),
    rule_system: z.string().describe('Rule system used (e.g., dnd_srd).'),
  }).describe('Details of the campaign.'),
  session: z.object({
    id: z.string().uuid().describe('UUID of the session.'),
    title: z.string().describe('Title of the session.'),
    status: z.string().describe('Current status of the session (e.g., active, completed).'),
    start_time: z.string().datetime().describe('Start time of the session in ISO format.'),
    end_time: z.string().datetime().describe('End time of the session in ISO format.'),
  }).describe('Details of the current session.'),
  final_scene_state: z.object({
    scene_id: z.string().uuid().describe('UUID of the final scene.'),
    title: z.string().describe('Title of the final scene.'),
    location: z.string().describe('Descriptive location of the final scene.'),
    present_characters: z.array(z.object({
      name: z.string().describe('Character name.'),
      race: z.string().describe('Character race.'),
      class: z.string().describe('Character class.'),
    })).describe('List of characters present at the end of the session.'),
    present_npcs: z.array(z.object({
      name: z.string().describe('NPC name.'),
      personality: z.string().describe('Brief description of NPC personality.'),
    })).describe('List of NPCs present at the end of the session.'),
    visible_objects: z.array(z.string()).describe('List of prominent visible objects in the final scene.'),
  }).describe('Snapshot of the scene state at the end of the session.'),
  session_log: z.array(z.string()).describe('A chronological log of important events, actions, and dialogues during the session.').nonempty(),
  items_obtained_during_session: z.array(z.string()).describe('List of items obtained or lost during the session.').optional(),
  map_changes_during_session: z.array(z.string()).describe('List of significant changes or discoveries made on the map during the session.').optional(),
  pending_approvals: z.array(z.string()).describe('List of pending approvals for the Game Master related to the session (e.g., XP, rewards).').optional(),
}).describe('Input data for summarizing a game session, including logs and final states.');

export type SessionSummaryInput = z.infer<typeof SessionSummaryInputSchema>;

// ----------------------------------------------------------------------------
// Output Schema
// ----------------------------------------------------------------------------

const SessionSummaryOutputSchema = z.object({
  where_session_ended: z.string().describe('A narrative description of where the session concluded.'),
  what_happened: z.string().describe('A summary of the main events and plot progression during the session.'),
  important_decisions: z.array(z.string()).describe('List of key decisions made by the players or significant narrative choices.'),
  npcs_encountered: z.array(z.string()).describe('List of Non-Player Characters (NPCs) that were introduced or had significant interactions.'),
  information_discovered: z.object({
    public_knowledge: z.array(z.string()).describe('Information discovered that is known by all players.'),
    individual_knowledge: z.array(z.string()).describe('Information discovered that is known only by specific characters.'),
    master_secrets: z.array(z.string()).describe('Secrets of the session relevant to the master, but not revealed to players.'),
  }).describe('Categorized information discovered during the session.'),
  items_obtained: z.array(z.string()).describe('List of important items obtained by characters.'),
  map_changes: z.array(z.string()).describe('Significant changes or discoveries related to the map.'),
  pending_approvals_for_master: z.array(z.string()).describe('Actions or rewards pending Game Master approval.'),
  canonical_chronicle_suggestion: z.string().describe('A brief suggestion for a canonical chronicle entry based on the session.'),
}).describe('Structured narrative summary of a game session.');

export type SessionSummaryOutput = z.infer<typeof SessionSummaryOutputSchema>;

// ----------------------------------------------------------------------------
// Prompt Definition
// ----------------------------------------------------------------------------

const sessionSummaryPrompt = ai.definePrompt({
  name: 'sessionSummaryPrompt',
  input: { schema: SessionSummaryInputSchema },
  output: { schema: SessionSummaryOutputSchema },
  system: `
Você é a IA narrativa do Cronofábula, uma plataforma de RPG com campanhas persistentes.
Você é o Resumidor de Sessão do Cronofábula.

Sua função é resumir a sessão com base nos eventos registrados no \