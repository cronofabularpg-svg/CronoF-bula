import { NextResponse } from 'next/server'
import { buildAIContext } from '@/lib/ai/build-ai-context'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const MODEL = 'llama-3.3-70b-versatile'

const SOURCE_LABELS: Record<string, string> = {
  in_person_table: 'Mesa Presencial',
  online_table: 'Mesa Online',
  live_table_ai: 'Mesa Viva IA',
  combat: 'Combate',
  manual: 'Evento Manual',
  imported: 'Importação do Mestre',
  other: 'Outro',
}

function parseDraft(raw: string, fallbackTitle: string, rawNotes: string) {
  try {
    const parsed = JSON.parse(raw)
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : fallbackTitle,
      summary: typeof parsed.summary === 'string' ? parsed.summary : rawNotes,
      public_content: typeof parsed.public_content === 'string' ? parsed.public_content : (typeof parsed.summary === 'string' ? parsed.summary : rawNotes),
      master_notes: typeof parsed.master_notes === 'string' ? parsed.master_notes : '',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.filter((item: unknown) => typeof item === 'string') : [],
      possible_canon_events: Array.isArray(parsed.possible_canon_events)
        ? parsed.possible_canon_events.filter((item: unknown) => typeof item === 'string')
        : [],
    }
  } catch {
    return {
      title: fallbackTitle,
      summary: rawNotes,
      public_content: rawNotes,
      master_notes: '',
      highlights: [],
      possible_canon_events: [],
    }
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const {
    campaignId,
    title,
    sourceType = 'manual',
    rawNotes,
    visibility = 'party',
  } = body ?? {}

  const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Sessão sem título'
  const safeRawNotes = typeof rawNotes === 'string' ? rawNotes.trim() : ''
  const safeSourceType = SOURCE_LABELS[sourceType] ? sourceType : 'manual'
  const safeVisibility = ['public', 'party', 'master_only'].includes(visibility) ? visibility : 'party'

  if (!campaignId || !safeRawNotes) {
    return NextResponse.json({ error: 'campaignId e rawNotes são obrigatórios.' }, { status: 400 })
  }

  let aiContext
  try {
    aiContext = await buildAIContext({
      campaignId,
      mode: 'session_summary',
      userId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao montar contexto.' }, { status: 403 })
  }

  const { snapshotId, isMaster, context } = aiContext
  if (!isMaster) {
    return NextResponse.json({ error: 'Apenas o mestre pode gerar rascunhos de crônica.' }, { status: 403 })
  }

  const systemPrompt = [
    'Você é o Cronista do Cronofábula.',
    'Organize anotações de sessão em um rascunho de crônica para revisão do mestre.',
    'Não declare nada como cânone definitivo.',
    'Não revele segredos em public_content.',
    'Responda apenas JSON válido com: title, summary, public_content, master_notes, highlights, possible_canon_events.',
  ].join('\n')

  const userPrompt = [
    `Campanha: ${context.campaign.name}`,
    `Tom: ${context.campaign.tone || 'não definido'}`,
    `Origem: ${SOURCE_LABELS[safeSourceType]}`,
    `Título informado: ${safeTitle}`,
    'Anotações brutas do mestre:',
    safeRawNotes,
  ].join('\n\n')

  let rawOutput: string | null = null
  let aiFallback = false

  try {
    rawOutput = await callGroq(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: MODEL, jsonResponse: true, maxTokens: 1600 }
    )
  } catch (error: any) {
    aiFallback = true
    await logAiMessage({
      campaignId,
      userId,
      taskKey: 'manual_chronicle',
      mode: 'session_summary',
      model: MODEL,
      inputSummary: safeRawNotes,
      contextSnapshotId: snapshotId,
      status: 'failed',
      errorMessage: error instanceof GroqError ? error.message : 'Falha ao chamar a IA.',
    })
  }

  const draft = parseDraft(rawOutput || safeRawNotes, safeTitle, safeRawNotes)

  const messageId = rawOutput
    ? await logAiMessage({
        campaignId,
        userId,
        taskKey: 'manual_chronicle',
        mode: 'session_summary',
        model: MODEL,
        inputSummary: safeRawNotes,
        output: rawOutput,
        contextSnapshotId: snapshotId,
        status: 'completed',
      })
    : null

  const supabase = createAdminClient()
  const { data: chronicle, error } = await supabase
    .from('chronicles')
    .insert({
      campaign_id: campaignId,
      title: draft.title,
      summary: draft.summary,
      public_content: draft.public_content,
      master_notes: draft.master_notes,
      status: 'draft',
      visibility: safeVisibility,
      source_type: safeSourceType,
      source_label: SOURCE_LABELS[safeSourceType],
      raw_notes: safeRawNotes,
      metadata: {
        manual_registration: true,
        ai_requested: true,
        ai_fallback: aiFallback,
        ai_message_id: messageId,
        highlights: draft.highlights,
        possible_canon_events: draft.possible_canon_events,
      },
      created_by: userId,
    })
    .select('id, campaign_id, session_id, title, summary, public_content, master_notes, status, visibility, source_type, source_label, raw_notes, metadata, created_at, approved_at')
    .single()

  if (error || !chronicle) {
    return NextResponse.json({ error: error?.message || 'Falha ao salvar rascunho.' }, { status: 500 })
  }

  return NextResponse.json({ draft: chronicle, aiFallback })
}
