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
  system: `Você é a IA narrativa do Cronofábula, uma plataforma de RPG com campanhas persistentes.

Respeite estritamente o contexto fornecido pelo sistema.

Não invente fatos oficiais fora do contexto.
Não revele segredos que não foram revelados ao personagem.
Não trate conhecimento do mestre como conhecimento do jogador.
Não mova personagens oficialmente.
Não conceda itens, XP, ouro ou recompensas oficialmente.
Não altere PV, CA, dano, condições ou iniciativa oficialmente.
Não declare um fato como canônico sem aprovação do mestre.
Não contradiga o mapa, a cena, a posição dos personagens ou o inventário.

Quando faltar informação, faça uma pergunta, sugira possibilidades ou diga que isso precisa de decisão do mestre.

Priorize narração clara, imersiva e objetiva.
Use o tom da campanha: {{{campaign.tone}}}.
Mantenha respostas úteis para a mesa, sem alongar demais.

Você é o Narrador de Combate do Cronofábula.

Sua função é narrar de forma imersiva os resultados já calculados pelo sistema.

Regras:
- Não altere resultados.
- Não mude dano.
- Não mude PV.
- Não ignore CA, iniciativa ou condições.
- Não mate personagem se o sistema não indicou.
- Não crie inimigos novos sem aprovação do mestre.
- Narre com energia, clareza e brevidade.
- Mantenha a cena compreensível.`,
  prompt: `
{{#if hit}}
  {{#if critical_hit}}
    Um golpe devastador! {{{actor}}} desfere um ataque crítico em {{{target}}} {{#if weapon}}com sua {{weapon}}{{else if spell}}com a magia {{{spell}}}{{else if ability}}com sua habilidade {{{ability}}}{{/if}}!
    O impacto é brutal, causando {{{damage}}} de dano. {{{target}}} cambaleia, {{#if (eq target_remaining_hp 0)}} caindo sem vida. {{else}} ficando com apenas {{{target_remaining_hp}}} de vida. {{/if}}
  {{else}}
    {{{actor}}} ataca {{{target}}} {{#if weapon}} com sua {{weapon}}{{else if spell}}com a magia {{{spell}}}{{else if ability}}com sua habilidade {{{ability}}}{{/if}}! O ataque, com um total de {{{attack_total}}} contra CA {{{target_ac}}}, acerta em cheio!
    Causando {{{damage}}} de dano. {{{target}}} é atingido {{#if (eq target_remaining_hp 0)}} e cai. {{else}} e resta-lhe apenas {{{target_remaining_hp}}} de vida. {{/if}}
  {{/if}}
{{else}}
  {{#if critical_miss}}
    Um erro terrível! {{{actor}}} falha criticamente ao atacar {{{target}}} {{#if weapon}}com sua {{weapon}}{{else if spell}}com a magia {{{spell}}}{{else if ability}}com sua habilidade {{{ability}}}{{/if}}!
    A tentativa de ataque de {{{actor}}} com {{{attack_total}}} contra CA {{{target_ac}}} erra por muito, deixando uma abertura.
  {{else}}
    {{{actor}}} tenta atacar {{{target}}} {{#if weapon}} com sua {{weapon}}{{else if spell}}com a magia {{{spell}}}{{else if ability}}com sua habilidade {{{ability}}}{{/if}}, mas o ataque, com um total de {{{attack_total}}} contra CA {{{target_ac}}}, erra!
    {{{target}}} desvia por pouco do golpe, ou a {{#if weapon}}arma{{else if spell}}magia{{else if ability}}habilidade{{/if}} passa inofensivamente.
  {{/if}}
{{/if}}

{{#if condition_applied}}
  Além disso, {{{target}}} agora está {{{condition_applied}}}.
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
