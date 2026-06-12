import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

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

const VALID_VISIBILITY = ['private', 'party', 'public', 'master_only']

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const {
    campaignId,
    storageKey,
    publicUrl,
    fileName,
    mimeType,
    sizeBytes,
    usageType,
    visibility = 'party',
  } = body ?? {}

  if (!campaignId || !storageKey || !usageType) {
    return NextResponse.json({ error: 'Campos obrigatórios: campaignId, storageKey, usageType.' }, { status: 400 })
  }

  if (!VALID_USAGE_TYPES.includes(usageType)) {
    return NextResponse.json({ error: 'usageType inválido.' }, { status: 400 })
  }

  if (!VALID_VISIBILITY.includes(visibility)) {
    return NextResponse.json({ error: 'visibility inválido.' }, { status: 400 })
  }

  // Nunca confiar cegamente no storageKey vindo do frontend: precisa
  // pertencer a esta campanha e a este usageType.
  const expectedPrefix = `campaigns/${campaignId}/${usageType}/`
  if (typeof storageKey !== 'string' || !storageKey.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'storageKey inválido para esta campanha/usageType.' }, { status: 400 })
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
    return NextResponse.json({ error: 'Apenas o mestre pode registrar este tipo de imagem.' }, { status: 403 })
  }

  if (!isMaster && !['character_avatar', 'handout'].includes(usageType)) {
    return NextResponse.json({ error: 'Você só pode registrar avatares ou handouts próprios.' }, { status: 403 })
  }

  const { data: asset, error } = await supabase
    .from('media_assets')
    .insert({
      campaign_id: campaignId,
      owner_user_id: userId,
      bucket: process.env.CLOUDFLARE_R2_BUCKET ?? '',
      storage_key: storageKey,
      public_url: publicUrl ?? null,
      file_name: fileName ?? null,
      file_type: mimeType ?? null,
      mime_type: mimeType ?? null,
      size_bytes: typeof sizeBytes === 'number' ? sizeBytes : null,
      usage_type: usageType,
      visibility,
    })
    .select()
    .single()

  if (error) {
    console.error('[uploads/complete] erro ao registrar media_asset:', error.message)
    return NextResponse.json({ error: 'Falha ao registrar arquivo enviado.' }, { status: 500 })
  }

  return NextResponse.json({ mediaAsset: asset })
}
