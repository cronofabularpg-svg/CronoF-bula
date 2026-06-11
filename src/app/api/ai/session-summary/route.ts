import { NextResponse } from 'next/server'
import { buildAIContext } from '@/lib/ai/build-ai-context'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { SESSION_SUMMARY_SYSTEM_PROMPT, buildSessionSummaryPrompt } from '@/lib/ai/prompts'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { data: messageRows, error: messagesError } = await supabase
    .from('scene_messages')
    .select('scene_id, message_type, content, created_at, characters(name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(MAX_LOG_MESSAGES)

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  if (!messageRows || messageRows.length === 0) {
    return NextResponse.json({ error: 'Sessão vazia: não há mensagens para resumir.' }, { status: 400 })
  }

  const sessionLog = messageRows.map(describeMessage)
  const firstSceneId: string | null = messageRows[0]?.scene_id ?? null

  const prompt = buildSessionSummaryPrompt(context, sessionLog)

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
    await logAiMessage({
      campaignId,
      sessionId,
      userId,
      taskKey: 'session_summary',
      mode: 'session_summary',
      model: MODEL,
      inputSummary: `Resumo da sessão (${sessionLog.length} mensagens)`,
      contextSnapshotId: snapshotId,
      status: 'failed',
      errorMessage: error instanceof GroqError ? error.message : 'Erro desconhecido ao chamar a IA.',
    })

    return NextResponse.json({ error: 'O Cronista não respondeu. Tente novamente.' }, { status: 502 })
  }

  const draft = parseSummaryJson(rawOutput)

  const messageId = await logAiMessage({
    campaignId,
    sessionId,
    userId,
    taskKey: 'session_summary',
    mode: 'session_summary',
    model: MODEL,
    inputSummary: `Resumo da sessão (${sessionLog.length} mensagens)`,
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
