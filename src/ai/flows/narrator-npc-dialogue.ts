'use server';

/**
 * @fileOverview A Genkit flow for generating narrative scene descriptions and roleplaying NPC dialogues
 * based on contextual game data in the Cronofábula platform.
 *
 * - aiNarratorAndNpcDialogue - The main function to call for AI narrative generation.
 * - AiNarratorAndNpcDialogueInput - The input type for the aiNarratorAndNpcDialogue function.
 * - AiNarratorAndNpcDialogueOutput - The return type for the aiNarratorAndNpcDialogue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Shared Context Schemas ---
const CampaignContextSchema = z.object({
  id: z.string().uuid().describe('Unique ID of the campaign.'),
  name: z.string().describe('Name of the campaign.'),
  tone: z.string().describe('Narrative tone of the campaign (e.g., "fantasia sombria").'),
  rule_system: z.string().describe('Rule system used for the campaign (e.g., "dnd_srd").')
});

const SessionContextSchema = z.object({
  id: z.string().uuid().describe('Unique ID of the session.'),
  title: z.string().describe('Title of the current session.'),
  status: z.string().describe('Status of the session (e.g., "active").')
});

const SceneContextSchema = z.object({
  id: z.string().uuid().describe('Unique ID of the scene.'),
  title: z.string().describe('Title of the current scene.'),
  visibility: z.string().describe('Visibility setting of the scene (e.g., "private", "public").'),
  location: z.string().describe('Descriptive location of the scene (e.g., "Beco atrás da Taverna do Cervo Torto").')
});

const CharacterDetailsSchema = z.object({
  id: z.string().uuid().describe('Unique ID of the character.'),
  name: z.string().describe('Name of the character.'),
  race: z.string().describe('Race of the character.'),
  class: z.string().describe('Class of the character.'),
  known_information: z.array(z.string()).describe('List of key information the character currently knows.')
});

const NPCSharedDetailsSchema = z.object({
  id: z.string().uuid().optional().describe('Unique ID of the NPC (optional).'),
  name: z.string().describe('Name of the NPC.'),
  personality: z.string().describe('Brief description of the NPC\'s personality.'),
  goals: z.string().describe('Brief description of the NPC\'s current goals.'),
  knows: z.array(z.string()).describe('List of key information the NPC possesses.')
});

const SharedContextBaseSchema = z.object({
  campaign: CampaignContextSchema,
  session: SessionContextSchema,
  scene: SceneContextSchema,
  active_character: CharacterDetailsSchema,
  present_characters: z.array(CharacterDetailsSchema.omit({known_information: true})).optional().describe('List of other characters present in the scene.'),
  present_npcs: z.array(NPCSharedDetailsSchema.omit({goals: true, knows: true})).optional().describe('List of NPCs present in the scene (simplified details).'),
  visible_objects: z.array(z.string()).optional().describe('List of objects currently visible in the scene.'),
  current_map_state: z.record(z.any()).optional().describe('Current state of the map (simplified representation).'),
  relevant_memory: z.array(z.string()).optional().describe('List of relevant past campaign memories or events.'),
  instructions: z.array(z.string()).optional().describe('Additional instructions from the system for the AI.')
});

// --- Narrator Mode Schemas ---
const NarratorInputSchema = SharedContextBaseSchema.extend({
  mode: z.literal('narrator').describe('Indicates AI should act as a scene narrator.'),
  player_action: z.string().describe('The action taken by the active character for narration.'),
  visible_objects: z.array(z.string()).describe('List of objects currently visible in the scene (required for narrator).'),
  present_npcs: z.array(NPCSharedDetailsSchema.omit({goals: true, knows: true})).describe('List of NPCs present in the scene (required for narrator).')
});

// --- NPC Dialogue Mode Schemas ---
const NPCDialogueInputSchema = SharedContextBaseSchema.extend({
  mode: z.literal('npc_dialogue').describe('Indicates AI should act as an NPC for dialogue.'),
  npc_to_roleplay: NPCSharedDetailsSchema.extend({
    will_not_reveal_easily: z.array(z.string()).optional().describe('Information the NPC will not reveal easily.'),
    secrets_not_to_reveal_without_trigger: z.array(z.string()).optional().describe('Secrets the NPC holds that should not be revealed without specific triggers.')
  }).describe('Full details of the NPC the AI should roleplay.'),
  player_message: z.string().describe('The message or action directed by the player at the NPC.'),
  visibility_rules: z.object({
    other_players_present: z.boolean().describe('True if other players are present in the conversation.'),
    conversation_private: z.boolean().describe('True if the conversation is considered private.')
  }).optional().describe('Specific visibility rules for the current conversation.')
});

// --- Discriminanted Union for Main Input ---
const AiNarratorAndNpcDialogueInputSchema = z.discriminatedUnion('mode', [
  NarratorInputSchema,
  NPCDialogueInputSchema
]).describe('Input schema for the AI Narrator and NPC Dialogue flow, discriminating by mode.');

export type AiNarratorAndNpcDialogueInput = z.infer<typeof AiNarratorAndNpcDialogueInputSchema>;

// --- Output Schema ---
const AiNarratorAndNpcDialogueOutputSchema = z.string().describe('The narrative description or NPC dialogue generated by the AI.');

export type AiNarratorAndNpcDialogueOutput = z.infer<typeof AiNarratorAndNpcDialogueOutputSchema>;

// --- Universal System Prompt Prefix ---
const UNIVERSAL_SYSTEM_PROMPT_PREFIX = `Você é a IA narrativa do Cronofábula, uma plataforma de RPG com campanhas persistentes.\n\nRespeite estritamente o contexto fornecido pelo sistema.\n\nNão invente fatos oficiais fora do contexto.\nNão revele segredos que não foram revelados ao personagem.\nNão trate conhecimento do mestre como conhecimento do jogador.\nNão mova personagens oficialmente.\nNão conceda itens, XP, ouro ou recompensas oficialmente.\nNão altere PV, CA, dano, condições ou iniciativa oficialmente.\nNão declare um fato como canônico sem aprovação do mestre.\nNão contradiga o mapa, a cena, a posição dos personagens ou o inventário.\n\nQuando faltar informação, faça uma pergunta, sugira possibilidades ou diga que isso precisa de decisão do mestre.\n\nPriorize narração clara, imersiva e objetiva.\nUse o tom da campanha.\nMantenha respostas úteis para a mesa, sem alongar demais.\n`;

// --- Narrator Prompt Definition ---
const NARRATOR_SYSTEM_PROMPT = UNIVERSAL_SYSTEM_PROMPT_PREFIX + `
Você é o Narrador de Cena do Cronofábula.\n\nSua função é descrever o que acontece na cena atual com base apenas no contexto autorizado pelo sistema.\n\nRegras:\n- Narre apenas o que os personagens presentes podem perceber.\n- Não revele informações ocultas.\n- Não entregue diálogos esquecidos ou não anotados.\n- Não trate suposições como fatos.\n- Não mova personagens oficialmente.\n- Não crie novos locais oficiais sem aprovação do mestre.\n- Não crie NPCs oficiais sem aprovação do mestre.\n- Se uma ação exigir teste, peça a rolagem apropriada ou sugira ao mestre uma CD.\n- Responda de forma imersiva, mas objetiva.\n- Termine, quando apropriado, perguntando o que os jogadores fazem.\n\nEstilo:\n- fantasia de mesa;\n- linguagem clara;\n- tom conforme campanha;\n- sem exagerar em textos longos.\n`;

const narratorPrompt = ai.definePrompt({
  name: 'narratorPrompt',
  input: {schema: NarratorInputSchema},
  output: {schema: AiNarratorAndNpcDialogueOutputSchema},
  system: NARRATOR_SYSTEM_PROMPT,
  prompt: `
  A campanha se chama "{{campaign.name}}" e tem um tom de "{{campaign.tone}}".
  A sessão atual é "{{session.title}}".
  A cena é "{{scene.title}}" em "{{scene.location}}".
  Você está narrando para o personagem ativo "{{active_character.name}}" ({{active_character.race}} {{active_character.class}}).
  O personagem sabe: {{#each active_character.known_information}}- {{this}}\n  {{/each}}
  Objetos visíveis na cena: {{#each visible_objects}}- {{this}}\n  {{/each}}
  NPCs presentes: {{#if present_npcs}}{{#each present_npcs}}- {{this.name}}\n  {{/each}}{{else}}Nenhum NPC visível.{{/if}}
  Memória relevante da campanha: {{#if relevant_memory}}{{#each relevant_memory}}- {{this}}\n  {{/each}}{{else}}Nenhuma memória relevante.{{/if}}
  Instruções adicionais: {{#if instructions}}{{#each instructions}}- {{this}}\n  {{/each}}{{else}}Nenhuma instrução adicional.{{/if}}

  Ação do jogador: "{{player_action}}"
  `
});

// --- NPC Dialogue Prompt Definition ---
const NPC_DIALOGUE_SYSTEM_PROMPT = UNIVERSAL_SYSTEM_PROMPT_PREFIX + `
Você interpreta um NPC dentro do Cronofábula.\n\nResponda apenas como o NPC indicado ou descreva brevemente sua reação.\n\nRegras:\n- O NPC só sabe o que está no contexto dele.\n- O NPC pode mentir, omitir, desconfiar, se assustar ou negociar conforme personalidade e objetivos.\n- Não revele segredos que o NPC não contaria naturalmente.\n- Não revele informações que o NPC não sabe.\n- Não entregue conhecimento do mestre.\n- Respeite a cena, a localização e quem está presente.\n- Se a conversa for privada, não fale como se todos ouvissem.\n- Se for necessário teste social, peça ou sugira Persuasão, Enganação, Intimidação, Intuição ou outra perícia adequada.\n- Não decida consequências permanentes sem aprovação do mestre.\n\nFormato:\n- Fala do NPC entre aspas.\n- Uma curta descrição de expressão, tom ou gesto quando útil.\n`;

const npcDialoguePrompt = ai.definePrompt({
  name: 'npcDialoguePrompt',
  input: {schema: NPCDialogueInputSchema},
  output: {schema: AiNarratorAndNpcDialogueOutputSchema},
  system: NPC_DIALOGUE_SYSTEM_PROMPT,
  prompt: `
  A campanha se chama "{{campaign.name}}" e tem um tom de "{{campaign.tone}}".
  A sessão atual é "{{session.title}}".
  A cena é "{{scene.title}}" em "{{scene.location}}".
  Você está interpretando o NPC "{{npc_to_roleplay.name}}".
  Personalidade do NPC: {{npc_to_roleplay.personality}}.
  Objetivos do NPC: {{npc_to_roleplay.goals}}.
  O NPC sabe: {{#each npc_to_roleplay.knows}}- {{this}}\n  {{/each}}
  O NPC não revelaria facilmente: {{#if npc_to_roleplay.will_not_reveal_easily}}{{#each npc_to_roleplay.will_not_reveal_easily}}- {{this}}\n  {{/each}}{{else}} (nenhum) {{/if}}
  Segredos do NPC (não revelar sem gatilho): {{#if npc_to_roleplay.secrets_not_to_reveal_without_trigger}}{{#each npc_to_roleplay.secrets_not_to_reveal_without_trigger}}- {{this}}\n  {{/each}}{{else}} (nenhum) {{/if}}
  
  O personagem ativo "{{active_character.name}}" ({{active_character.race}} {{active_character.class}}) está interagindo com você.
  O personagem sabe: {{#each active_character.known_information}}- {{this}}\n  {{/each}}
  
  {{#if visibility_rules}}
  Regras de visibilidade da conversa:
  - Outros jogadores presentes: {{visibility_rules.other_players_present}}
  - Conversa privada: {{visibility_rules.conversation_private}}
  {{/if}}
  
  Memória relevante da campanha: {{#if relevant_memory}}{{#each relevant_memory}}- {{this}}\n  {{/each}}{{else}}Nenhuma memória relevante.{{/if}}
  Instruções adicionais: {{#if instructions}}{{#each instructions}}- {{this}}\n  {{/each}}{{else}}Nenhuma instrução adicional.{{/if}}

  Mensagem ou ação do jogador: "{{player_message}}"
  `
});

// --- Main Flow Definition ---
const aiNarratorAndNpcDialogueFlow = ai.defineFlow(
  {
    name: 'aiNarratorAndNpcDialogueFlow',
    inputSchema: AiNarratorAndNpcDialogueInputSchema,
    outputSchema: AiNarratorAndNpcDialogueOutputSchema
  },
  async (input) => {
    let output: string | undefined;

    switch (input.mode) {
      case 'narrator':
        const narratorResult = await narratorPrompt(input);
        output = narratorResult.output ?? undefined;
        break;
      case 'npc_dialogue':
        const npcDialogueResult = await npcDialoguePrompt(input);
        output = npcDialogueResult.output ?? undefined;
        break;
      default:
        throw new Error(`Unsupported mode: ${input}`);
    }

    if (!output) {
      throw new Error('Failed to generate narrative or dialogue.');
    }
    return output;
  }
);

// --- Exported Wrapper Function ---
export async function aiNarratorAndNpcDialogue(
  input: AiNarratorAndNpcDialogueInput
): Promise<AiNarratorAndNpcDialogueOutput> {
  return aiNarratorAndNpcDialogueFlow(input);
}
