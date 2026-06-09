'use server';
/**
 * @fileOverview A Genkit flow for generating contextual descriptions of items.
 *
 * - itemDescriber - A function that handles the item description generation process.
 * - ItemDescriberInput - The input type for the itemDescriber function.
 * - ItemDescriberOutput - The return type for the itemDescriber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItemDescriberInputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  itemAppearance: z.string().describe('A description of the item\'s physical appearance.'),
  howObtained: z.string().describe('A narrative of how the character acquired the item.'),
  knownProperties: z.array(z.string()).describe('A list of properties the character is aware of about the item.'),
  campaignTone: z.string().describe('The overall narrative tone of the campaign (e.g., fantasia sombria).'),
  activeCharacter: z.object({
    name: z.string().describe('The name of the active character.'),
    race: z.string().describe('The race of the active character.'),
    class: z.string().describe('The class of the active character.'),
    // Add other relevant character details if necessary for context
  }).describe('Details about the character requesting the description.'),
});

export type ItemDescriberInput = z.infer<typeof ItemDescriberInputSchema>;

const ItemDescriberOutputSchema = z.object({
  knownDescription: z.string().describe('The item\'s appearance and how it was obtained, as perceived by the character.'),
  whatYouKnow: z.string().describe('What the character knows about the item\'s function or properties.'),
  masterSecret: z.string().describe('Information about the item that should only be visible to the master and not revealed to the player. This section should explicitly state that it is for the master and the AI should not fill it with player-facing information.'),
});

export type ItemDescriberOutput = z.infer<typeof ItemDescriberOutputSchema>;

export async function itemDescriber(input: ItemDescriberInput): Promise<ItemDescriberOutput> {
  return itemDescriberFlow(input);
}

const itemDescriberPrompt = ai.definePrompt({
  name: 'itemDescriberPrompt',
  input: {schema: ItemDescriberInputSchema},
  output: {schema: ItemDescriberOutputSchema},
  prompt: `Você é o Descritor de Itens Narrativos do Cronofábula.

Sua função é criar descrições de itens respeitando o conhecimento do personagem e o tom da campanha.

Regras:
- Descreva a aparência do item com base em "itemAppearance".
- Inclua como o item foi obtido com base em "howObtained".
- Informe apenas propriedades conhecidas listadas em "knownProperties".
- NÃO REVELE propriedades ocultas do item.
- NÃO REVELE maldições desconhecidas.
- NÃO INVENTE bônus mecânicos ou segredos sem aprovação do mestre.
- Separe a descrição conhecida do que o mestre sabe, indicando claramente a seção "Segredo do mestre" como um espaço para o mestre preencher, e você NÃO DEVE preenchê-lo com informações que o jogador não deveria saber.
- Use o tom de campanha "{{{campaignTone}}}".
- Adote a perspectiva do personagem "{{{activeCharacter.name}}}", um(a) {{{activeCharacter.race}}} {{{activeCharacter.class}}}.

Contexto do Item:
Nome do Item: {{{itemName}}}
Aparência: {{{itemAppearance}}}
Como Obtido: {{{howObtained}}}
Propriedades Conhecidas: {{#each knownProperties}}- {{{this}}}\n{{/each}}

Formato de Saída:
## Descrição conhecida
{{{knownDescription}}}

## O que você sabe
{{{whatYouKnow}}}

## Segredo do mestre
(Espaço para o mestre preencher. A IA não deve revelar segredos aqui.)`,
});

const itemDescriberFlow = ai.defineFlow(
  {
    name: 'itemDescriberFlow',
    inputSchema: ItemDescriberInputSchema,
    outputSchema: ItemDescriberOutputSchema,
  },
  async (input) => {
    const {output} = await itemDescriberPrompt(input);

    // The AI should format the output correctly, but we need to ensure masterSecret is handled.
    // If the AI accidentally puts something in masterSecret that shouldn't be there, the system will handle it downstream.
    // For this flow, we expect the AI to explicitly state it's for the master.

    return output!;
  }
);
