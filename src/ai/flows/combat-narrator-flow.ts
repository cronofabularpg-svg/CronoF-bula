'use server';
/**
 * @fileOverview A Genkit flow for narrating combat actions in a dramatic and immersive manner.
 *
 * - combatNarrator - A function that handles the narration of combat events.
 * - CombatNarratorInput - The input type for the combatNarrator function.
 * - CombatNarratorOutput - The return type for the combatNarrator function (a string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CombatNarratorInputSchema = z.object({
  campaign: z.object({
    tone: z.string().describe('The overall narrative tone of the campaign (e.g., "fantasia sombria").'),
  }).describe('Campaign details.'),
  actor: z.string().describe('The name of the character or entity performing the action.'),
  action: z.string().describe('The type of action performed (e.g., "attack", "cast spell", "use ability").'),
  target: z.string().describe('The name of the target of the action.'),
  attack_total: z.number().int().optional().describe('The total attack roll result, if applicable.'),
  target_ac: z.number().int().optional().describe('The target\'s Armor Class (AC), if applicable.'),
  hit: z.boolean().describe('True if the action hit the target, false otherwise.'),
  damage: z.number().int().optional().describe('The amount of damage dealt, if a hit occurred.'),
  target_remaining_hp: z.number().int().optional().describe('The target\'s remaining hit points after the action, if a hit occurred.'),
  weapon: z.string().optional().describe('The weapon used for the attack, if applicable.'),
  spell: z.string().optional().describe('The spell cast, if applicable.'),
  ability: z.string().optional().describe('The ability used, if applicable.'),
  condition_applied: z.string().optional().describe('A condition applied to the target (e.g., "envenenado", "aturdido").'),
  critical_hit: z.boolean().optional().describe('True if the attack was a critical hit.'),
  critical_miss: z.boolean().optional().describe('True if the attack was a critical miss.'),
});
export type CombatNarratorInput = z.infer<typeof CombatNarratorInputSchema>;

const CombatNarratorOutputSchema = z.string().describe('A dramatic narrative description of the combat action.');
export type CombatNarratorOutput = z.infer<typeof CombatNarratorOutputSchema>;

export async function combatNarrator(input: CombatNarratorInput): Promise<CombatNarratorOutput> {
  return combatNarratorFlow(input);
}

const combatNarratorPrompt = ai.definePrompt({
  name: 'combatNarratorPrompt',
  input: {schema: CombatNarratorInputSchema},
  output: {schema: CombatNarratorOutputSchema},
  system: `Você é o Narrador de Combate Especialista em D&D 5e do Cronofábula.

Sua função é narrar de forma imersiva e cinematográfica os resultados mecânicos do sistema D20.

Regras de Narração:
- Use terminologia de D&D 5e (Classe de Armadura, Ataque Crítico, Falha Crítica).
- Se o ataque acertou a CA exata, narre um golpe que passou por pouco pela defesa.
- Se o dano reduziu os PV a 0, narre um golpe de misericórdia ou nocaute definitivo.
- Se for uma falha crítica (1 natural), narre um erro embaraçoso ou uma abertura na defesa.
- Se for um acerto crítico (20 natural), narre um impacto devastador que ignora parte da armadura.
- Use o tom da campanha: {{{campaign.tone}}}.
- Seja breve, enérgico e mantenha o foco na ação imediata.`,
  prompt: `
{{#if hit}}
  {{#if critical_hit}}
    Ataque CRÍTICO! {{{actor}}} desfere um golpe magistral em {{{target}}} {{#if weapon}}com sua {{{weapon}}}{{else if spell}}com a magia {{{spell}}}{{else if ability}}com {{{ability}}}{{/if}}!
    Dano causado: {{{damage}}}. {{{target}}} {{#if (eq target_remaining_hp 0)}} cai sem vida sob o impacto brutal. {{else}} cambaleia, restando apenas {{{target_remaining_hp}}} PV. {{/if}}
  {{else}}
    {{{actor}}} ataca {{{target}}} (Ataque: {{{attack_total}}} vs CA {{{target_ac}}}). O golpe acerta!
    Dano: {{{damage}}}. {{{target}}} é atingido {{#if (eq target_remaining_hp 0)}} e tomba em combate. {{else}} e agora tem {{{target_remaining_hp}}} PV restantes. {{/if}}
  {{/if}}
{{else}}
  {{#if critical_miss}}
    FALHA CRÍTICA! {{{actor}}} comete um erro terrível ao tentar atingir {{{target}}}. 
    A arma ou energia passa longe, deixando {{{actor}}} vulnerável.
  {{else}}
    {{{actor}}} tenta atingir {{{target}}} (Ataque: {{{attack_total}}} vs CA {{{target_ac}}}), mas a defesa resiste!
    O golpe é desviado pela armadura ou {{{target}}} esquiva no último segundo.
  {{/if}}
{{/if}}

{{#if condition_applied}}
O alvo agora está sob o efeito de: {{{condition_applied}}}.
{{/if}}
`,
});

const combatNarratorFlow = ai.defineFlow(
  {
    name: 'combatNarratorFlow',
    inputSchema: CombatNarratorInputSchema,
    outputSchema: CombatNarratorOutputSchema,
  },
  async (input) => {
    const {output} = await combatNarratorPrompt(input);
    return output!;
  }
);