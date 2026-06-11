import { NextResponse } from 'next/server'
import { callGroq, GroqError } from '@/lib/ai/groq'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverEnv } from '@/lib/server/env'

const MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  console.log('[ai/test] usuário autenticado:', Boolean(userId))
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { campaignId } = body ?? {}

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId é obrigatório.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: campaignRow } = await supabase
    .from('campaigns')
    .select('id, ai_enabled')
    .eq('id', campaignId)
    .maybeSingle()

  const { data: membership } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  console.log('[ai/test] campanha encontrada:', Boolean(campaignRow), '| ia ativa (ai_enabled):', Boolean(campaignRow?.ai_enabled), '| GROQ_API_KEY presente:', Boolean(serverEnv.groqApiKey))

  const isMaster = ['owner', 'master', 'assistant_master'].includes(membership?.role || '')
  if (!isMaster) {
    return NextResponse.json({ error: 'Apenas o mestre pode testar a IA da campanha.' }, { status: 403 })
  }

  try {
    const output = await callGroq(
      [
        { role: 'system', content: 'Você é um teste de conexão. Responda apenas com "Conexão estabelecida." e nada mais.' },
        { role: 'user', content: 'Teste de conexão.' },
      ],
      { model: MODEL, maxTokens: 32, timeoutMs: 15_000 }
    )

    return NextResponse.json({ ok: true, output })
  } catch (error: any) {
    const message = error instanceof GroqError ? error.message : 'Falha ao testar a IA.'
    console.error('[ai/test] erro ao chamar Groq:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
