import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AIMode } from './build-ai-context'

/**
 * Lê o usuário autenticado a partir dos cookies da requisição.
 * Retorna null se não houver sessão — os route handlers devem responder 401.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export type LogAiMessageParams = {
  campaignId: string
  sessionId?: string | null
  sceneId?: string | null
  characterId?: string | null
  userId: string
  taskKey: string
  mode: AIMode
  model?: string | null
  inputSummary?: string | null
  output?: string | null
  contextSnapshotId?: string | null
  status: 'completed' | 'failed'
  errorMessage?: string | null
}

/** Registra uma chamada de IA em ai_messages para auditoria do mestre. */
export async function logAiMessage(params: LogAiMessageParams): Promise<string | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      campaign_id: params.campaignId,
      session_id: params.sessionId ?? null,
      scene_id: params.sceneId ?? null,
      character_id: params.characterId ?? null,
      user_id: params.userId,
      task_key: params.taskKey,
      mode: params.mode,
      provider: 'groq',
      model: params.model ?? null,
      input_summary: params.inputSummary?.slice(0, 1000) ?? null,
      output: params.output ?? null,
      context_snapshot_id: params.contextSnapshotId ?? null,
      status: params.status,
      error_message: params.errorMessage?.slice(0, 1000) ?? null,
    })
    .select('id')
    .single()

  if (error) {
    // Falha ao logar não deve derrubar a resposta da IA para o usuário.
    console.error('Falha ao registrar ai_messages:', error.message)
    return null
  }

  return data?.id ?? null
}
