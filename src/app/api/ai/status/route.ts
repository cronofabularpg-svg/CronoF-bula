import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/server/env'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'

export async function GET() {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  return NextResponse.json({ groqConfigured: Boolean(serverEnv.groqApiKey) })
}
