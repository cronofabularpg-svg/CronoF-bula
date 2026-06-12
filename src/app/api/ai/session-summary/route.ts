import { NextResponse } from 'next/server'
import { buildAIContext } from '@/lib/ai/build-ai-context'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { SESSION_SUMMARY_SYSTEM_PROMPT, buildSessionSummaryPrompt } from '@/lib/ai/prompts'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildBasicChronicle, hasChronicleSourceData, type ChronicleSourceCombat, type ChronicleSourceDiceRoll, type ChronicleSourceEvent, type ChronicleSourceMessage } from '@/lib/chronicles/build-basic-chronicle'

const MODEL = 'llama-3.3-70b-versatile'
const MAX_LOG_MESSAGES = 200

type SessionSummaryJson = {
  title: string
  summary: string
  importantDecisions: string[]
  npcsEncountered: string[]
  itemsGained: string[]
  masterSecrets: string
}

function describeMessage(row: any): string {
  const author = Array.isArray(row.characters) ? row.characters[0]?.name : row.characters?.name
  switch (row.message_type) {
    case 'narration':
      return `Narrador: ${row.content}`
    case 'dice':
      return `${author || 'Alguém'} rolou dados: ${row.content}`
    case 'action':
      return `${author || 'Alguém'} faz: ${row.content}`
    default:
      return `${author || 'Alguém'} diz: ${row.content}`
  }
}

function describeEvent(row: any): string | null {
  const content = row.content?.trim()
  if (!content) return null
  return `Evento (${row.event_type}): ${content}`
}

function describeDiceRoll(row: any): string | null {
  if (row.total === null || row.total === undefined) return null
  const author = Array.isArray(row.characters) ? row.characters[0]?.name : row.characters?.name
  const formula = row.formula ? ` (${row.formula})` : ''
  const reason = row.reason ? ` — ${row.reason}` : ''
  return `${author || 'Alguém'} rolou${formula}: resultado ${row.total}${reason}.`
}

function describeCombat(row: any): string {
  const participants = (row.combat_participants || []).map((p: any) => p.name).filter(Boolean)
  const participantsLabel = participants.length > 0 ? participants.join(', ') : 'combatentes não identificados'
  return `Combate "${row.title}" foi travado e encerrado após ${row.round_number} rodada(s), envolvendo ${participantsLabel}.`
}

function parseSummaryJson(raw: string): SessionSummaryJson {
  try {
    const parsed = JSON.parse(raw)
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Crônica sem título',
      summary: typeof parsed.summary === 'string' ? parsed.summary : raw,
      importantDecisions: Array.isArray(parsed.importantDecisions) ? parsed.importantDecisions.filter((x: unknown) => typeof x === 'string') : [],
      npcsEncountered: Array.isArray(parsed.npcsEncountered) ? parsed.npcsEncountered.filter((x: unknown) => typeof x === 'string') : [],
      itemsGained: Array.isArray(parsed.itemsGained) ? parsed.itemsGained.filter((x: unknown) => typeof x === 'string') : [],
      masterSecrets: typeof parsed.masterSecrets === 'string' ? parsed.masterSecrets : '',
    }
  } catch {
    return {
      title: 'Crônica sem título',
      summary: raw,
      importantDecisions: [],
      npcsEncountered: [],
      itemsGained: [],
      masterSecrets: '',
    }
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { campaignId, sessionId } = body ?? {}

  if (!campaignId || !sessionId) {
    return NextResponse.json({ error: 'campaignId e sessionId são obrigatórios.' }, { status: 400 })
  }

  let aiContext
  try {
    aiContext = await buildAIContext({
      campaignId,
      sessionId,
      mode: 'session_summary',
      userId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao montar contexto.' }, { status: 403 })
  }

  const { snapshotId, isMaster, context } = aiContext

  if (!isMaster) {
    return NextResponse.json({ error: 'Apenas o mestre pode gerar o resumo da sessão.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const [
    { data: messageRows, error: messagesError },
    { data: eventRows, error: eventsError },
    { data: diceRows, error: diceRowsError },
    { data: combatRows, error: combatRowsError },
  ] = await Promise.all([
    supabase
      .from('scene_messages')
      .select('scene_id, message_type, content, created_at, characters(name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(MAX_LOG_MESSAGES),
    supabase
      .from('scene_events')
      .select('scene_id, event_type, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }),
    supabase
      .from('dice_rolls')
      .select('scene_id, formula, total, reason, created_at, characters(name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }),
    supabase
      .from('combats')
      .select('scene_id, title, round_number, combat_participants(name)')
      .eq('session_id', sessionId)
      .eq('status', 'ended'),
  ])

  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 })
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 })
  if (diceRowsError) return NextResponse.json({ error: diceRowsError.message }, { status: 500 })
  if (combatRowsError) return NextResponse.json({ error: combatRowsError.message }, { status: 500 })

  const messages = messageRows || []
  const events = eventRows || []
  const diceRolls = diceRows || []
  const combats = combatRows || []

  if (!hasChronicleSourceData({
    messages: messages as unknown as ChronicleSourceMessage[],
    events: events as unknown as ChronicleSourceEvent[],
    diceRolls: diceRolls as unknown as ChronicleSourceDiceRoll[],
    combats: combats.map((c) => ({ ...c, combat_participants: c.combat_participants ?? [] })) as unknown as ChronicleSourceCombat[],
  })) {
    return NextResponse.json({ error: 'Sessão vazia: não há registros para resumir.' }, { status: 400 })
  }

  const sessionLog = [
    ...messages.map(describeMessage),
    ...events.map(describeEvent).filter((line): line is string => Boolean(line)),
    ...combats.map(describeCombat),
    ...diceRolls.map(describeDiceRoll).filter((line): line is string => Boolean(line)),
  ]
  const firstSceneId: string | null = messages[0]?.scene_id ?? events[0]?.scene_id ?? combats[0]?.scene_id ?? diceRolls[0]?.scene_id ?? null

  const prompt = buildSessionSummaryPrompt(context, sessionLog)

  // Caso o Cronista (IA) falhe, geramos uma crônica básica concatenando os
  // registros da sessão. O rascunho continua aguardando aprovação do mestre.
  async function buildFallbackDraft(errorMessage: string) {
    await logAiMessage({
      campaignId,
      sessionId,
      userId: userId as string,
      taskKey: 'session_summary',
      mode: 'session_summary',
      model: MODEL,
      inputSummary: `Resumo da sessão (${sessionLog.length} registros)`,
      contextSnapshotId: snapshotId,
      status: 'failed',
      errorMessage,
    })

    const basic = buildBasicChronicle({
      sessionTitle: context.session?.title || 'Sessão sem título',
      campaignName: context.campaign.name,
      messages: messages as unknown as ChronicleSourceMessage[],
      events: events as unknown as ChronicleSourceEvent[],
      diceRolls: diceRolls as unknown as ChronicleSourceDiceRoll[],
      combats: combats.map((c) => ({ ...c, combat_participants: c.combat_participants ?? [] })) as unknown as ChronicleSourceCombat[],
    })

    const { data: chronicle, error: chronicleError } = await supabase
      .from('chronicles')
      .insert({
        campaign_id: campaignId,
        session_id: sessionId,
        title: basic.title,
        summary: basic.summary,
        public_content: basic.public_content,
        master_notes: `${basic.master_notes} (O Cronista IA não respondeu; este é um rascunho básico.)`,
        status: 'draft',
        visibility: basic.visibility,
        source_type: 'live_table_ai',
        source_label: 'Mesa Viva IA',
        raw_notes: sessionLog.join('\n\n'),
        metadata: {
          generated_from: 'session_summary',
          ai_fallback: true,
        },
        created_by: userId,
      })
      .select('id')
      .single()

    if (chronicleError || !chronicle) {
      return NextResponse.json({ error: chronicleError?.message || 'Falha ao criar rascunho da crônica.' }, { status: 500 })
    }

    return NextResponse.json({
      draft: {
        id: chronicle.id,
        sessionId,
        sceneId: basic.sceneId,
        title: basic.title,
        summary: basic.summary,
        public_content: basic.public_content,
        master_notes: basic.master_notes,
        npcsEncountered: basic.npcsEncountered,
        highlights: basic.highlights,
        itemsGained: basic.itemsGained,
        visibility: basic.visibility,
        status: 'draft',
      },
      aiFallback: true,
    })
  }

  let rawOutput: string
  try {
    rawOutput = await callGroq(
      [
        { role: 'system', content: SESSION_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { model: MODEL, jsonResponse: true, maxTokens: 2048 }
    )
  } catch (error: any) {
    return buildFallbackDraft(error instanceof GroqError ? error.message : 'Erro desconhecido ao chamar a IA.')
  }

  const draft = parseSummaryJson(rawOutput)

  const messageId = await logAiMessage({
    campaignId,
    sessionId,
    userId,
    taskKey: 'session_summary',
    mode: 'session_summary',
    model: MODEL,
    inputSummary: `Resumo da sessão (${sessionLog.length} registros)`,
    output: rawOutput,
    contextSnapshotId: snapshotId,
    status: 'completed',
  })

  // Cria a crônica como rascunho — o mestre revisa e publica manualmente.
  const { data: chronicle, error: chronicleError } = await supabase
    .from('chronicles')
    .insert({
      campaign_id: campaignId,
      session_id: sessionId,
      title: draft.title,
      summary: draft.summary,
      public_content: draft.summary,
      master_notes: draft.masterSecrets,
      status: 'draft',
      visibility: 'party',
      source_type: 'live_table_ai',
      source_label: 'Mesa Viva IA',
      raw_notes: sessionLog.join('\n\n'),
      metadata: {
        generated_from: 'session_summary',
        ai_message_id: messageId,
        highlights: draft.importantDecisions,
        npcs_encountered: draft.npcsEncountered,
        items_gained: draft.itemsGained,
      },
      created_by: userId,
    })
    .select('id')
    .single()

  if (chronicleError || !chronicle) {
    return NextResponse.json({ error: chronicleError?.message || 'Falha ao criar rascunho da crônica.' }, { status: 500 })
  }

  await supabase.from('ai_generated_suggestions').insert({
    campaign_id: campaignId,
    session_id: sessionId,
    scene_id: firstSceneId,
    source_message_id: messageId,
    suggestion_type: 'session_summary',
    title: draft.title,
    content: draft.summary,
    payload: draft,
    approval_status: 'pending',
  })

  return NextResponse.json({
    draft: {
      id: chronicle.id,
      sessionId,
      sceneId: firstSceneId,
      title: draft.title,
      summary: draft.summary,
      public_content: draft.summary,
      master_notes: draft.masterSecrets,
      npcsEncountered: draft.npcsEncountered,
      highlights: draft.importantDecisions,
      itemsGained: draft.itemsGained,
      visibility: 'party',
      status: 'draft',
    },
  })
}
