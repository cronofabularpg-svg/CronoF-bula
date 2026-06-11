import { createAdminClient } from '@/lib/supabase/admin'

// buildAIContext é o único portão entre o Supabase e a IA (Groq).
//
// Regra central:
// - O sistema controla o estado do mundo.
// - A IA interpreta o mundo, com base apenas no que esta função entrega.
// - O mestre aprova o que vira canônico.
// - O jogador só recebe o que o personagem pode acessar.
//
// Esta função roda exclusivamente no servidor (usa a service role key).

export type AIMode = 'narrator' | 'npc_dialogue' | 'rules_helper' | 'session_summary'

export type BuildAIContextParams = {
  campaignId: string
  sessionId?: string | null
  sceneId?: string | null
  activeCharacterId?: string | null
  /** Necessário apenas no modo npc_dialogue: NPC que a IA vai interpretar. */
  npcId?: string | null
  mode: AIMode
  userId: string
}

export type AIContextCharacter = {
  id: string
  name: string
  race: string | null
  class: string | null
  level: number | null
}

export type AIContextNpc = {
  id: string
  name: string
  role: string | null
  description: string | null
  personality: string | null
  goals: string | null
  knowledge: unknown
  visibility: string
  /** Apenas presente quando o solicitante é mestre. */
  secrets?: string | null
}

export type AIContextLocation = {
  id: string
  name: string
  type: string | null
  description: string | null
  region: string | null
  visibility: string
}

export type AIContextMessage = {
  type: string
  visibility: string
  content: string
  characterName: string | null
  createdAt: string
}

export type AIContextMemory = {
  title: string
  content: string
  memoryType: string
  importance: string
}

export type AIContextChronicle = {
  title: string
  summary: string | null
  publicContent: string | null
  status: string
}

export type AIContextPayload = {
  mode: AIMode
  generatedAt: string
  isMaster: boolean
  campaign: {
    id: string
    name: string
    tone: string | null
    ruleSystem: string | null
  }
  settings: {
    aiCanNarrate: boolean
    aiCanCreateNpc: boolean
    aiCanCreateLocation: boolean
    aiCanRevealSecret: boolean
  }
  session: { id: string; title: string; status: string } | null
  scene: { id: string; title: string; location: string | null; visibility: string } | null
  activeCharacter: (AIContextCharacter & { knownInformation: string[] }) | null
  presentCharacters: AIContextCharacter[]
  presentNpcs: AIContextNpc[]
  locations: AIContextLocation[]
  recentMessages: AIContextMessage[]
  memory: AIContextMemory[]
  chronicles: AIContextChronicle[]
}

export type BuildAIContextResult = {
  snapshotId: string
  isMaster: boolean
  context: AIContextPayload
  /** Apenas no modo npc_dialogue: o NPC validado que a IA vai interpretar. */
  targetNpc: AIContextNpc | null
}

const MASTER_ROLES = ['owner', 'master', 'assistant_master']

function sanitizeNpc(npc: any, isMaster: boolean): AIContextNpc {
  const sanitized: AIContextNpc = {
    id: npc.id,
    name: npc.name,
    role: npc.role,
    description: npc.description,
    personality: npc.personality,
    goals: npc.goals,
    knowledge: npc.knowledge ?? [],
    visibility: npc.visibility,
  }

  if (isMaster) {
    sanitized.secrets = npc.secrets ?? null
  }

  return sanitized
}

export async function buildAIContext(params: BuildAIContextParams): Promise<BuildAIContextResult> {
  const { campaignId, sessionId, sceneId, activeCharacterId, npcId, mode, userId } = params

  if (!campaignId || !userId) {
    throw new Error('campaignId e userId são obrigatórios.')
  }

  const supabase = createAdminClient()

  // 1. Validar membership ---------------------------------------------------
  const { data: membership, error: membershipError } = await supabase
    .from('campaign_members')
    .select('role, status')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership || membership.status !== 'active') {
    throw new Error('Você não é membro ativo desta campanha.')
  }

  const isMaster = MASTER_ROLES.includes(membership.role)

  // 2. Campanha ---------------------------------------------------------------
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, tone, system_key, ai_enabled, status')
    .eq('id', campaignId)
    .maybeSingle()

  if (campaignError) throw campaignError
  if (!campaign) throw new Error('Campanha não encontrada.')
  if (!campaign.ai_enabled) throw new Error('A IA está desativada para esta campanha.')

  // 3. Configurações da campanha ----------------------------------------------
  const { data: settingsRow, error: settingsError } = await supabase
    .from('campaign_settings')
    .select('ai_can_narrate, ai_can_create_npc, ai_can_create_location, ai_can_reveal_secret')
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (settingsError) throw settingsError

  const settings = {
    aiCanNarrate: settingsRow?.ai_can_narrate ?? true,
    aiCanCreateNpc: settingsRow?.ai_can_create_npc ?? false,
    aiCanCreateLocation: settingsRow?.ai_can_create_location ?? false,
    aiCanRevealSecret: settingsRow?.ai_can_reveal_secret ?? false,
  }

  // 4. Sessão -------------------------------------------------------------------
  let session: { id: string; title: string; status: string } | null = null
  if (sessionId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, status')
      .eq('id', sessionId)
      .eq('campaign_id', campaignId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Sessão não encontrada nesta campanha.')
    session = data
  }

  // 5. Cena (com validação de acesso para jogadores) -----------------------------
  let scene: { id: string; session_id: string; title: string; location_name: string | null; visibility: string; status: string } | null = null
  if (sceneId) {
    const { data, error } = await supabase
      .from('scenes')
      .select('id, session_id, title, location_name, visibility, status')
      .eq('id', sceneId)
      .eq('campaign_id', campaignId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Cena não encontrada nesta campanha.')
    scene = data

    if (!isMaster) {
      const { data: participant, error: participantError } = await supabase
        .from('scene_participants')
        .select('id, characters!inner(owner_user_id)')
        .eq('scene_id', scene.id)
        .eq('status', 'active')
        .eq('characters.owner_user_id', userId)
        .maybeSingle()

      if (participantError) throw participantError
      if (!participant) throw new Error('Você não participa desta cena.')
    }
  }

  // 6. Participantes da cena (personagens) ----------------------------------------
  let presentCharacters: AIContextCharacter[] = []
  if (scene) {
    const { data, error } = await supabase
      .from('scene_participants')
      .select('characters(id, name, race, class, level)')
      .eq('scene_id', scene.id)
      .eq('status', 'active')

    if (error) throw error
    presentCharacters = (data || [])
      .map((row: any) => row.characters)
      .filter((c: any): c is AIContextCharacter => !!c)
  }

  // 7. Personagem ativo (com validação de posse) ------------------------------------
  let activeCharacter: (AIContextCharacter & { knownInformation: string[] }) | null = null
  if (activeCharacterId) {
    const { data, error } = await supabase
      .from('characters')
      .select('id, name, race, class, level, owner_user_id, campaign_id')
      .eq('id', activeCharacterId)
      .maybeSingle()

    if (error) throw error
    if (!data || data.campaign_id !== campaignId) {
      throw new Error('Personagem inválido para esta campanha.')
    }
    if (!isMaster && data.owner_user_id !== userId) {
      throw new Error('Você só pode agir com o seu próprio personagem.')
    }

    activeCharacter = {
      id: data.id,
      name: data.name,
      race: data.race,
      class: data.class,
      level: data.level,
      knownInformation: [],
    }
  }

  // 8. NPCs presentes na cena ------------------------------------------------------
  let presentNpcs: AIContextNpc[] = []
  if (scene) {
    const { data, error } = await supabase
      .from('npcs')
      .select('id, name, role, description, personality, goals, secrets, knowledge, visibility, status')
      .eq('campaign_id', campaignId)
      .eq('current_scene_id', scene.id)
      .eq('status', 'alive')
      .order('name', { ascending: true })

    if (error) throw error

    presentNpcs = (data || [])
      .filter((npc: any) => isMaster || ['public', 'visible', 'scene'].includes(npc.visibility))
      .map((npc: any) => sanitizeNpc(npc, isMaster))
  }

  // 9. NPC alvo (modo npc_dialogue) -------------------------------------------------
  let targetNpc: AIContextNpc | null = null
  if (mode === 'npc_dialogue') {
    if (!npcId) throw new Error('npcId é obrigatório no modo npc_dialogue.')

    const { data, error } = await supabase
      .from('npcs')
      .select('id, name, role, description, personality, goals, secrets, knowledge, visibility, status, current_scene_id, campaign_id')
      .eq('id', npcId)
      .maybeSingle()

    if (error) throw error
    if (!data || data.campaign_id !== campaignId) throw new Error('NPC não encontrado nesta campanha.')

    const presentInScene = scene ? data.current_scene_id === scene.id : false
    if (!isMaster && !presentInScene) {
      throw new Error('Este NPC não está presente na cena.')
    }

    targetNpc = sanitizeNpc(data, isMaster)
  }

  // 10. Locais visíveis ---------------------------------------------------------------
  const locationVisibilities = isMaster
    ? ['public', 'visible', 'known', 'hidden', 'secret', 'master_only']
    : ['public', 'visible', 'known']

  const { data: locationRows, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, type, description, region, visibility')
    .eq('campaign_id', campaignId)
    .in('visibility', locationVisibilities)
    .order('name', { ascending: true })
    .limit(isMaster ? 15 : 10)

  if (locationsError) throw locationsError
  const locations: AIContextLocation[] = locationRows || []

  // 11. Últimas mensagens da cena ------------------------------------------------------
  let recentMessages: AIContextMessage[] = []
  if (scene) {
    const messageVisibilities = isMaster ? ['public', 'scene', 'master_only'] : ['public', 'scene']

    const { data, error } = await supabase
      .from('scene_messages')
      .select('message_type, visibility, content, created_at, characters(name)')
      .eq('scene_id', scene.id)
      .in('visibility', messageVisibilities)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    recentMessages = (data || [])
      .map((row: any) => ({
        type: row.message_type,
        visibility: row.visibility,
        content: row.content,
        characterName: Array.isArray(row.characters) ? row.characters[0]?.name ?? null : row.characters?.name ?? null,
        createdAt: row.created_at,
      }))
      .reverse()
  }

  // 12. Memória da campanha permitida ---------------------------------------------------
  const memoryVisibilities = isMaster ? ['party', 'public', 'master_only'] : ['party', 'public']

  let memoryQuery = supabase
    .from('campaign_memory')
    .select('title, content, memory_type, importance, visibility, approved_at, created_at')
    .eq('campaign_id', campaignId)
    .in('visibility', memoryVisibilities)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!isMaster) {
    memoryQuery = memoryQuery.not('approved_at', 'is', null)
  }

  const { data: memoryRows, error: memoryError } = await memoryQuery
  if (memoryError) throw memoryError

  const memory: AIContextMemory[] = (memoryRows || []).map((row: any) => ({
    title: row.title,
    content: row.content,
    memoryType: row.memory_type,
    importance: row.importance,
  }))

  // 13. Crônicas / eventos canônicos visíveis ---------------------------------------------
  const chronicleVisibilities = isMaster ? ['party', 'public', 'master_only'] : ['party', 'public']

  let chroniclesQuery = supabase
    .from('chronicles')
    .select('title, summary, public_content, status, visibility, created_at')
    .eq('campaign_id', campaignId)
    .in('visibility', chronicleVisibilities)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!isMaster) {
    chroniclesQuery = chroniclesQuery.eq('status', 'approved')
  }

  const { data: chronicleRows, error: chroniclesError } = await chroniclesQuery
  if (chroniclesError) throw chroniclesError

  const chronicles: AIContextChronicle[] = (chronicleRows || []).map((row: any) => ({
    title: row.title,
    summary: row.summary,
    publicContent: row.public_content,
    status: row.status,
  }))

  // 14. Montar contexto mínimo ------------------------------------------------------------
  const context: AIContextPayload = {
    mode,
    generatedAt: new Date().toISOString(),
    isMaster,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      tone: campaign.tone,
      ruleSystem: campaign.system_key,
    },
    settings,
    session,
    scene: scene
      ? { id: scene.id, title: scene.title, location: scene.location_name, visibility: scene.visibility }
      : null,
    activeCharacter,
    presentCharacters,
    presentNpcs,
    locations,
    recentMessages,
    memory,
    chronicles,
  }

  // 15. Salvar snapshot para auditoria -----------------------------------------------------
  const { data: snapshot, error: snapshotError } = await supabase
    .from('ai_context_snapshots')
    .insert({
      campaign_id: campaignId,
      session_id: session?.id ?? null,
      scene_id: scene?.id ?? null,
      character_id: activeCharacter?.id ?? null,
      user_id: userId,
      mode,
      context,
      visibility_scope: isMaster ? 'master' : 'filtered',
    })
    .select('id')
    .single()

  if (snapshotError) throw snapshotError

  return {
    snapshotId: snapshot.id,
    isMaster,
    context,
    targetNpc,
  }
}
