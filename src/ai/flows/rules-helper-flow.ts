'use server';
/**
 * @fileOverview A Genkit flow for providing rules explanations, suggesting skill checks, and defining difficulty classes (CDs).
 *
 * - rulesHelper - A function that handles rule explanations.
 * - RulesHelperInput - The input type for the rulesHelper function.
 * - RulesHelperOutput - The return type for the rulesHelper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema Definition
const RulesHelperInputSchema = z.object({
  query: z.string().describe('The user\'s question about game rules or a specific situation.'),
  campaign: z.object({
    rule_system: z.string().optional().describe('The rule system in use, default "dnd5e_srd".'),
    tone: z.string().optional().describe('The narrative tone of the campaign, e.g., "fantasia sombria".')
  }).optional().describe('General campaign information.'),
  active_character: z.object({
    name: z.string().optional().describe('The name of the active character.'),
    race: z.string().optional().describe('The race of the active character.'),
    class: z.string().optional().describe('The class of the active character.'),
    known_information: z.array(z.string()).optional().describe('Information known by the active character.')
  }).optional().describe('Information about the active character.'),
  scene: z.object({
    location: z.string().optional().describe('The current location of the scene.'),
    title: z.string().optional().describe('The title of the current scene.')
  }).optional().describe('Information about the current scene.')
});

export type RulesHelperInput = z.infer<typeof RulesHelperInputSchema>;

// Output Schema Definition
const RulesHelperOutputSchema = z.string().describe('An explanation of game rules, suggested skill checks, or difficulty classes (CDs).');

export type RulesHelperOutput = z.infer<typeof RulesHelperOutputSchema>;

export async function rulesHelper(input: RulesHelperInput): Promise<RulesHelperOutput> {
  return rulesHelperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rulesHelperPrompt',
  input: {schema: RulesHelperInputSchema},
  output: {schema: RulesHelperOutputSchema},
  system: `Você é o Mestre de Regras especialista em D&D 5ª Edição (SRD) do Cronofábula.
Sua função é explicar regras de forma objetiva e sugerir aplicações baseadas no sistema D20.

Diretrizes:
- Use exclusivamente as regras oficiais da 5ª Edição (D&D 5e).
- Para testes de perícia, sugira sempre o atributo e a perícia (ex: Teste de Destreza (Acrobacia)).
- Para CDs (Classes de Dificuldade), siga o padrão: 10 (Fácil), 15 (Médio), 20 (Difícil), 25 (Muito Difícil).
- Explique brevemente o funcionamento de magias, condições (Caído, Atordoado, etc.) e bônus de proficiência quando solicitado.
- Se houver uma situação ambígua, sugira uma decisão justa baseada no espírito das regras, mas lembre que o Mestre Humano tem a palavra final.
- Seja conciso e direto.`,
  prompt: `
Sistema de Regras: {{#if campaign.rule_system}}{{campaign.rule_system}}{{else}}D&D 5e (SRD){{/if}}

{{#if active_character}}
Personagem: {{active_character.name}} ({{active_character.race}} {{active_character.class}})
{{/if}}

Pergunta/Situação: {{{query}}}

Explique a regra conforme o manual da 5ª edição, sugira um teste de perícia apropriado ou uma CD para a situação descrita.`
});

const rulesHelperFlow = ai.defineFlow(
  {
    name: 'rulesHelperFlow',
    inputSchema: RulesHelperInputSchema,
    outputSchema: RulesHelperOutputSchema
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);