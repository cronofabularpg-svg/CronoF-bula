import { NextResponse } from 'next/server'
import { buildAIContext } from '@/lib/ai/build-ai-context'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { NPC_DIALOGUE_SYSTEM_PROMPT, buildNpcDialoguePrompt } from '@/lib/ai/prompts'
import { getAuthenticatedUserId, logAiMessage } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { campaignId, sessionId, sceneId, npcId, characterId, message, publish } = body ?? {}

  if (!campaignId || !sceneId || !npcId || !message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'campaignId, sceneId, npcId e message são obrigatórios.' },
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
      npcId,
      mode: 'npc_dialogue',
      userId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao montar contexto.' }, { status: 403 })
  }

  const { snapshotId, isMaster, context, targetNpc } = aiContext

  if (!targetNpc) {
    return NextResponse.json({ error: 'NPC não encontrado.' }, { status: 404 })
  }

  const prompt = buildNpcDialoguePrompt(context, targetNpc, message)

  let output: string
  try {
    output = await callGroq(
      [
        { role: 'system', content: NPC_DIALOGUE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { model: MODEL }
    )
  } catch (error: any) {
    await logAiMessage({
      campaignId,
      sessionId,
      sceneId,
      characterId,
      userId,
      taskKey: 'npc_dialogue',
      mode: 'npc_dialogue',
      model: MODEL,
      inputSummary: `[${targetNpc.name}] ${message}`,
      contextSnapshotId: snapshotId,
      status: 'failed',
      errorMessage: error instanceof GroqError ? error.message : 'Erro desconhecido ao chamar a IA.',
    })

    return NextResponse.json({ error: 'O NPC não respondeu. Tente novamente.' }, { status: 502 })
  }

  const messageId = await logAiMessage({
    campaignId,
    sessionId,
    sceneId,
    characterId,
    userId,
    taskKey: 'npc_dialogue',
    mode: 'npc_dialogue',
    model: MODEL,
    inputSummary: `[${targetNpc.name}] ${message}`,
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
      message_type: 'speech',
      visibility: 'scene',
      content: output,
      metadata: { source: 'groq', npc_id: npcId, npc_name: targetNpc.name, context_snapshot_id: snapshotId },
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
      suggestion_type: 'npc_dialogue',
      title: `Fala sugerida para ${targetNpc.name}`,
      content: output,
      payload: { npc_id: npcId, npc_name: targetNpc.name, player_message: message },
      approval_status: 'pending',
    })
  }

  return NextResponse.json({ output, published, npcName: targetNpc.name })
}
