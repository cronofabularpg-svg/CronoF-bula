
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
    name: z.string(),
    tone: z.string(),
  }),
  sessionTitle: z.string(),
  sessionLog: z.array(z.string()).describe('A chronological log of messages, actions, and rolls from the session.'),
}).describe('Input data for summarizing a game session.');

export type SessionSummaryInput = z.infer<typeof SessionSummaryInputSchema>;

// ----------------------------------------------------------------------------
// Output Schema
// ----------------------------------------------------------------------------

const SessionSummaryOutputSchema = z.object({
  title: z.string().describe('A poetic and narrative title for this chronicle entry.'),
  summary: z.string().describe('A detailed narrative summary of the main events and plot progression.'),
  importantDecisions: z.array(z.string()).describe('Key choices made by players.'),
  npcsEncountered: z.array(z.string()).describe('List of NPCs that interacted with the party.'),
  itemsGained: z.array(z.string()).describe('Items obtained during the session.'),
  masterSecrets: z.string().describe('Information only the master should know about these events.'),
});

export type SessionSummaryOutput = z.infer<typeof SessionSummaryOutputSchema>;

// ----------------------------------------------------------------------------
// Prompt Definition
// ----------------------------------------------------------------------------

const sessionSummaryPrompt = ai.definePrompt({
  name: 'sessionSummaryPrompt',
  input: { schema: SessionSummaryInputSchema },
  output: { schema: SessionSummaryOutputSchema },
  system: `Você é o Cronista Arcano do Cronofábula.
Sua função é transformar os logs brutos de uma sessão de RPG em uma crônica elegante e estruturada.

Regras:
- Use o tom da campanha: {{{campaign.tone}}}.
- Seja imersivo e literário, mas mantenha a clareza sobre o que de fato aconteceu.
- Identifique decisões críticas dos jogadores.
- Liste NPCs e itens mencionados.
- Na seção de segredos do mestre, sugira desdobramentos futuros ou verdades ocultas baseadas no que aconteceu.`,
  prompt: `
Sessão: {{{sessionTitle}}}
Campanha: {{{campaign.name}}}

Log da Sessão:
{{#each sessionLog}}
- {{{this}}}
{{/each}}

Por favor, gere a crônica oficial desta jornada.`
});

// ----------------------------------------------------------------------------
// Flow Definition
// ----------------------------------------------------------------------------

const sessionSummaryFlow = ai.defineFlow(
  {
    name: 'sessionSummaryFlow',
    inputSchema: SessionSummaryInputSchema,
    outputSchema: SessionSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await sessionSummaryPrompt(input);
    return output!;
  }
);

export async function summarizeSession(input: SessionSummaryInput): Promise<SessionSummaryOutput> {
  return sessionSummaryFlow(input);
}
