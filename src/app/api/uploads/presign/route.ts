import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/server/env'
import { buildR2StorageKey, createPresignedUploadUrl, getR2PublicUrl } from '@/lib/server/r2'

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// usageType que só o mestre/owner da campanha pode enviar nesta fase.
const MASTER_ONLY_USAGE_TYPES = ['battlefield_map', 'location_image', 'npc_token', 'item_image']

const VALID_USAGE_TYPES = [
  'campaign_cover',
  'location_image',
  'battlefield_map',
  'character_avatar',
  'npc_token',
  'item_image',
  'handout',
  'other',
]

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Upload de mídia não está configurado neste ambiente.' }, { status: 503 })
  }

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { campaignId, fileName, mimeType, sizeBytes, usageType, visibility } = body ?? {}

  if (!campaignId || !fileName || !mimeType || !usageType) {
    return NextResponse.json({ error: 'Campos obrigatórios: campaignId, fileName, mimeType, usageType.' }, { status: 400 })
  }

  if (!VALID_USAGE_TYPES.includes(usageType)) {
    return NextResponse.json({ error: 'usageType inválido.' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.' }, { status: 400 })
  }

  if (typeof sizeBytes === 'number' && sizeBytes > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 10 MB.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: membership } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Você não é membro desta campanha.' }, { status: 403 })
  }

  const isMaster = ['owner', 'master', 'assistant_master'].includes(membership.role)

  if (MASTER_ONLY_USAGE_TYPES.includes(usageType) && !isMaster) {
    return NextResponse.json({ error: 'Apenas o mestre pode enviar este tipo de imagem.' }, { status: 403 })
  }

  const storageKey = buildR2StorageKey(campaignId, usageType, fileName, randomUUID())

  // Log seguro: nunca inclui access key, secret key ou a uploadUrl assinada —
  // apenas metadados úteis para diagnosticar falhas de upload em produção.
  console.log('[uploads/presign]', {
    campaignId,
    usageType,
    mimeType,
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : null,
    storageKey,
    r2Configured: isR2Configured(),
  })

  try {
    const uploadUrl = await createPresignedUploadUrl({
      key: storageKey,
      contentType: mimeType,
      expiresInSeconds: 300,
    })

    console.log('[uploads/presign] ok', { storageKey, status: 200 })

    return NextResponse.json({
      uploadUrl,
      storageKey,
      publicUrl: getR2PublicUrl(storageKey),
      headers: {
        'Content-Type': mimeType,
      },
    })
  } catch (error: any) {
    console.error('[uploads/presign] erro ao gerar URL assinada:', { storageKey, message: error?.message })
    return NextResponse.json({ error: 'Falha ao gerar URL de upload.' }, { status: 502 })
  }
}
