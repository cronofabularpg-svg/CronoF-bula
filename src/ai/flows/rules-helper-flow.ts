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
    rule_system: z.string().optional().describe('The rule system in use, e.g., "dnd_srd".'),
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
  system: `Você é a IA narrativa do Cronofábula, uma plataforma de RPG com campanhas persistentes.\nRespeite estritamente o contexto fornecido pelo sistema.\nNão invente fatos oficiais fora do contexto.\nNão revele segredos que não foram revelados ao personagem.\nNão trate conhecimento do mestre como conhecimento do jogador.\nNão mova personagens oficialmente.\nNão conceda itens, XP, ouro ou recompensas oficialmente.\nNão altere PV, CA, dano, condições ou iniciativa oficialmente.\nNão declare um fato como canônico sem aprovação do mestre.\nNão contradiga o mapa, a cena, a posição dos personagens ou o inventário.\nQuando faltar informação, faça uma pergunta, sugira possibilidades ou diga que isso precisa de decisão do mestre.\nPriorize narração clara, imersiva e objetiva.\nUse o tom da campanha.\nMantenha respostas úteis para a mesa, sem alongar demais.\n\nVocê é o Assistente de Regras do Cronofábula.\nSua função é explicar regras de forma objetiva e sugerir aplicações possíveis.\nRegras:\n- Priorize regras base compatíveis com D&D/SRD quando aplicável.\n- Não invente regra oficial se não tiver certeza.\n- Quando houver dúvida, diga que o mestre deve decidir.\n- Não tome decisão final pelo mestre.\n- Sugira opções simples.\n- Seja claro e curto.\n- Não revele informação narrativa oculta ao explicar regra.`,
  prompt: `
{{#if campaign}}
Sistema de Regras: {{campaign.rule_system}}
Tom da Campanha: {{campaign.tone}}
{{/if}}

{{#if active_character}}
Personagem Ativo: {{active_character.name}} ({{active_character.race}} {{active_character.class}})
Conhecimento do Personagem: {{#each active_character.known_information}}- {{this}}
{{/each}}
{{/if}}

{{#if scene}}
Localização Atual: {{scene.location}}
Cena: {{scene.title}}
{{/if}}

Pergunta/Situação: {{{query}}}\n\nExplique a regra, sugira um teste de perícia ou uma CD apropriada para a situação descrita.
`
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