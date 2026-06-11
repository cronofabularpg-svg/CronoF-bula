import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/server/env'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'

export async function GET() {
  const userId = await getAuthenticatedUserId()
  console.log('[ai/status] usuário autenticado:', Boolean(userId), '| chave Groq presente:', Boolean(serverEnv.groqApiKey))
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  return NextResponse.json({ groqConfigured: Boolean(serverEnv.groqApiKey) })
}
