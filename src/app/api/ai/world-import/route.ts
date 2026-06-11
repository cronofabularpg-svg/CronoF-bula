import { NextResponse } from 'next/server'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { WORLD_IMPORT_SYSTEM_PROMPT, buildWorldImportPrompt } from '@/lib/ai/prompts'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const MODEL = 'llama-3.3-70b-versatile'
const MAX_SOURCE_TEXT_LENGTH = 30_000

type Visibility = 'party' | 'public' | 'master_only'

type WorldImportProposal = {
  world_summary: string
  lore_entries: Array<{ title: string; content: string; visibility: Visibility }>
  locations: Array<{ name: string; type: string; description: string; region: string; visibility: Visibility; image_url: string }>
  npcs: Array<{ name: string; role: string; description: string; personality: string; goals: string; secrets: string; visibility: Visibility; image_url: string }>
  factions: Array<{ name: string; description: string; goals: string; secrets: string; relationship_status: string; visibility: Visibility }>
  items: Array<{ name: string; item_type: string; description: string; rarity: string; visibility: Visibility; image_url: string }>
  quests: Array<{ title: string; description: string; reward_notes: string; visibility: Visibility }>
  threats: Array<{ title: string; content: string; visibility: Visibility }>
  master_secrets: Array<{ title: string; content: string }>
  opening_scene: string
}

function normalizeVisibility(value: unknown): Visibility {
  return value === 'party' || value === 'public' || value === 'master_only' ? value : 'master_only'
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function parseProposal(raw: string): WorldImportProposal {
  const parsed = JSON.parse(raw)

  return {
    world_summary: asString(parsed.world_summary),
    lore_entries: asArray(parsed.lore_entries).map((entry) => ({
      title: asString(entry.title) || 'Nota de lore',
      content: asString(entry.content),
      visibility: normalizeVisibility(entry.visibility),
    })),
    locations: asArray(parsed.locations).map((loc) => ({
      name: asString(loc.name) || 'Local sem nome',
      type: asString(loc.type),
      description: asString(loc.description),
      region: asString(loc.region),
      visibility: normalizeVisibility(loc.visibility),
      image_url: asString(loc.image_url),
    })),
    npcs: asArray(parsed.npcs).map((npc) => ({
      name: asString(npc.name) || 'NPC sem nome',
      role: asString(npc.role),
      description: asString(npc.description),
      personality: asString(npc.personality),
      goals: asString(npc.goals),
      secrets: asString(npc.secrets),
      visibility: normalizeVisibility(npc.visibility),
      image_url: asString(npc.image_url),
    })),
    factions: asArray(parsed.factions).map((faction) => ({
      name: asString(faction.name) || 'Facção sem nome',
      description: asString(faction.description),
      goals: asString(faction.goals),
      secrets: asString(faction.secrets),
      relationship_status: asString(faction.relationship_status),
      visibility: normalizeVisibility(faction.visibility),
    })),
    items: asArray(parsed.items).map((item) => ({
      name: asString(item.name) || 'Item sem nome',
      item_type: asString(item.item_type),
      description: asString(item.description),
      rarity: asString(item.rarity) || 'common',
      visibility: normalizeVisibility(item.visibility),
      image_url: asString(item.image_url),
    })),
    quests: asArray(parsed.quests).map((quest) => ({
      title: asString(quest.title) || 'Missão sem título',
      description: asString(quest.description),
      reward_notes: asString(quest.reward_notes),
      visibility: normalizeVisibility(quest.visibility),
    })),
    threats: asArray(parsed.threats).map((threat) => ({
      title: asString(threat.title) || 'Ameaça sem título',
      content: asString(threat.content),
      visibility: normalizeVisibility(threat.visibility),
    })),
    master_secrets: asArray(parsed.master_secrets).map((secret) => ({
      title: asString(secret.title) || 'Segredo do mestre',
      content: asString(secret.content),
    })),
    opening_scene: asString(parsed.opening_scene),
  }
}

async function assertMasterIfCampaignExists(campaignId: string | null, userId: string) {
  if (!campaignId) return

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('campaign_members')
    .select('role, status')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'active' || !['owner', 'master', 'assistant_master'].includes(data.role)) {
    throw new Error('Apenas o mestre pode importar mundo para esta campanha.')
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const campaignId = typeof body?.campaignId === 'string' && body.campaignId ? body.campaignId : null
  const sourceText = asString(body?.sourceText).trim()
  const worldName = asString(body?.worldName).trim()
  const tone = asString(body?.tone).trim()
  const ruleSystem = asString(body?.ruleSystem).trim()
  const instructions = asString(body?.instructions).trim()

  if (!sourceText) {
    return NextResponse.json({ error: 'Cole um texto de mundo para analisar.' }, { status: 400 })
  }

  if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
    return NextResponse.json({ error: `Texto grande demais. Limite: ${MAX_SOURCE_TEXT_LENGTH} caracteres.` }, { status: 413 })
  }

  try {
    await assertMasterIfCampaignExists(campaignId, userId)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sem permissão para importar este mundo.' }, { status: 403 })
  }

  const prompt = buildWorldImportPrompt({ worldName, tone, ruleSystem, instructions, sourceText })

  let rawOutput: string
  try {
    rawOutput = await callGroq(
      [
        { role: 'system', content: WORLD_IMPORT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { model: MODEL, jsonResponse: true, maxTokens: 4096, timeoutMs: 45_000 }
    )
  } catch (error: any) {
    if (campaignId) {
      await logAiMessage({
        campaignId,
        userId,
        taskKey: 'world_import',
        mode: 'world_import',
        model: MODEL,
        inputSummary: `Importação de mundo (${sourceText.length} caracteres)`,
        status: 'failed',
        errorMessage: error instanceof GroqError ? error.message : 'Erro desconhecido ao chamar a IA.',
      })
    }

    return NextResponse.json({ error: 'O Arquivista não respondeu. Tente novamente.' }, { status: 502 })
  }

  let proposal: WorldImportProposal
  try {
    proposal = parseProposal(rawOutput)
  } catch {
    return NextResponse.json({ error: 'A IA retornou uma estrutura inválida. Tente novamente com instruções mais objetivas.' }, { status: 502 })
  }

  if (campaignId) {
    await logAiMessage({
      campaignId,
      userId,
      taskKey: 'world_import',
      mode: 'world_import',
      model: MODEL,
      inputSummary: `Importação de mundo (${sourceText.length} caracteres)`,
      output: JSON.stringify(proposal),
      status: 'completed',
    })
  }

  return NextResponse.json({ proposal })
}
