import { NextResponse } from 'next/server'
import { buildAIContext } from '@/lib/ai/build-ai-context'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { NARRATOR_SYSTEM_PROMPT, buildNarratorPrompt } from '@/lib/ai/prompts'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverEnv } from '@/lib/server/env'

const MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  console.log('[ai/narrator] usuário autenticado:', Boolean(userId))
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { campaignId, sessionId, sceneId, characterId, playerAction, publish } = body ?? {}

  if (!campaignId || !sceneId || !playerAction || typeof playerAction !== 'string') {
    return NextResponse.json(
      { error: 'campaignId, sceneId e playerAction são obrigatórios.' },
      { status: 400 }
    )
  }

  let aiContext
  try {
    aiContext = await buildAIContext({
      campaignId,
      sessionId,
      sceneId,
      activeCharacterId: characterId ?? null,
      mode: 'narrator',
      userId,
    })
  } catch (error: any) {
    console.error('[ai/narrator] campanha/contexto não encontrado:', error.message)
    return NextResponse.json({ error: error.message || 'Falha ao montar contexto.' }, { status: 403 })
  }

  const { snapshotId, isMaster, context } = aiContext

  console.log('[ai/narrator] campanha encontrada:', campaignId, '| ia ativa (ai_can_narrate):', context.settings.aiCanNarrate, '| GROQ_API_KEY presente:', Boolean(serverEnv.groqApiKey))

  if (!context.settings.aiCanNarrate) {
    return NextResponse.json({ error: 'A narração por IA está desativada nesta campanha.' }, { status: 403 })
  }

  const prompt = buildNarratorPrompt(context, playerAction)

  let output: string
  try {
    output = await callGroq(
      [
        { role: 'system', content: NARRATOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { model: MODEL }
    )
  } catch (error: any) {
    console.error('[ai/narrator] erro ao chamar Groq:', error instanceof GroqError ? error.message : 'erro desconhecido')
    await logAiMessage({
      campaignId,
      sessionId,
      sceneId,
      characterId,
      userId,
      taskKey: 'narrator',
      mode: 'narrator',
      model: MODEL,
      inputSummary: playerAction,
      contextSnapshotId: snapshotId,
      status: 'failed',
      errorMessage: error instanceof GroqError ? error.message : 'Erro desconhecido ao chamar a IA.',
    })

    return NextResponse.json({ error: 'O Oráculo não respondeu. Tente novamente.' }, { status: 502 })
  }

  const messageId = await logAiMessage({
    campaignId,
    sessionId,
    sceneId,
    characterId,
    userId,
    taskKey: 'narrator',
    mode: 'narrator',
    model: MODEL,
    inputSummary: playerAction,
    output,
    contextSnapshotId: snapshotId,
    status: 'completed',
  })

  let published = false

  if (isMaster && publish === true && sessionId) {
    const supabase = createAdminClient()
    const { error: insertError } = await supabase.from('scene_messages').insert({
      campaign_id: campaignId,
      session_id: sessionId,
      scene_id: sceneId,
      sender_user_id: userId,
      character_id: null,
      message_type: 'narration',
      visibility: 'scene',
      content: output,
      metadata: { source: 'groq', context_snapshot_id: snapshotId },
    })

    if (!insertError) published = true
  }

  if (!published) {
    const supabase = createAdminClient()
    await supabase.from('ai_generated_suggestions').insert({
      campaign_id: campaignId,
      session_id: sessionId ?? null,
      scene_id: sceneId,
      source_message_id: messageId,
      suggestion_type: 'narration',
      title: 'Sugestão de narração',
      content: output,
      payload: { player_action: playerAction },
      approval_status: 'pending',
    })
  }

  return NextResponse.json({ output, published })
}
