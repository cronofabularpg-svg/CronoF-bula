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
      discovery_condition: z.string().describe('The condition for discovering this secret point (e.g., a specific item, a successful skill check, a clue from an NPC).'),
    })
  ).describe('A list of secret points, each with a name and a condition for discovery. Must not be revealed to players directly.'),
  connections: z.array(z.string()).describe('A list of connections between points (e.g., "Taverna -> Beco dos Fundos").'),
  entry_exit_points: z.array(z.string()).describe('A list of entry and exit points for the area.'),
  suggested_npcs: z.array(z.string()).describe('A list of NPCs suggested for this area.'),
  suggested_dangers: z.array(z.string()).describe('A list of dangers or hazards suggested for this area.'),
  master_notes: z.string().describe('Additional notes for the master about this map suggestion, including pending approvals.'),
});

export type MapGeneratorOutput = z.infer<typeof MapGeneratorOutputSchema>;

const MAP_GENERATOR_SYSTEM_PROMPT = `Você é o Gerador de Mapas Narrativos do Cronofábula.

Sua função é sugerir mapas por pontos conectados para aprovação do mestre.

Regras:
- Crie pontos claros e úteis.
- Crie conexões entre pontos.
- Separe locais visíveis, ocultos e secretos.
- Defina condições de descoberta para locais secretos.
- Não torne nada canônico sem aprovação.
- Não revele locais secretos em conteúdo destinado a jogadores.
`;

const mapGeneratorPrompt = ai.definePrompt({
  name: 'mapGeneratorPrompt',
  input: { schema: MapGeneratorInputSchema },
  output: { schema: MapGeneratorOutputSchema },
  system: MAP_GENERATOR_SYSTEM_PROMPT,
  prompt: `
  A campanha se chama "{{campaign.name}}", com tom de "{{campaign.tone}}" e sistema "{{campaign.rule_system}}".

  Descrição da área a ser mapeada: "{{area_description}}"

  {{#if existing_map_elements}}
  Elementos já existentes no mapa, para servir de base: "{{existing_map_elements}}"
  {{else}}
  Não há elementos existentes; sugira um mapa novo.
  {{/if}}

  Gere uma sugestão de mapa por pontos, separando locais visíveis, ocultos e secretos, com conexões, entradas/saídas, NPCs e perigos sugeridos.
  `,
});

const mapGeneratorFlow = ai.defineFlow(
  {
    name: 'mapGeneratorFlow',
    inputSchema: MapGeneratorInputSchema,
    outputSchema: MapGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await mapGeneratorPrompt(input);

    if (!output) {
      throw new Error('Failed to generate map suggestion.');
    }

    return output;
  }
);

export async function generateMap(input: MapGeneratorInput): Promise<MapGeneratorOutput> {
  return mapGeneratorFlow(input);
}
