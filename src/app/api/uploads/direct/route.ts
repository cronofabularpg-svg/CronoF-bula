import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthenticatedUserId } from '@/lib/ai/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/server/env'
import { buildR2StorageKey, getR2PublicUrl, uploadObjectToR2 } from '@/lib/server/r2'

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

const VALID_VISIBILITY = ['private', 'party', 'public', 'master_only']

// Combinações usageType -> entityType cujo upload também atualiza a
// entidade-alvo. Qualquer outra combinação registra apenas o media_asset.
const ENTITY_UPDATE_USAGE_TYPES: Record<string, string> = {
  npc_token: 'npc',
  character_avatar: 'character',
  location_image: 'location',
  battlefield_map: 'combat',
  item_image: 'item',
}

/**
 * Upload de imagem direto pelo servidor (multipart/form-data) — fallback para
 * quando o PUT pré-assinado direto-ao-R2 falha no browser (CORS, checksum,
 * etc.). O arquivo é recebido aqui, enviado ao R2 com `uploadObjectToR2` e
 * registrado em `media_assets`, sem expor credenciais R2 ao client.
 */
export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Upload de mídia não está configurado neste ambiente.' }, { status: 503 })
  }

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Corpo da requisição inválido. Use multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  const campaignId = formData.get('campaignId')
  const usageType = formData.get('usageType')
  const visibility = (formData.get('visibility') as string | null) ?? 'party'
  const entityType = formData.get('entityType') as string | null
  const entityId = formData.get('entityId') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo obrigatório: file.' }, { status: 400 })
  }

  if (typeof campaignId !== 'string' || !campaignId || typeof usageType !== 'string' || !usageType) {
    return NextResponse.json({ error: 'Campos obrigatórios: campaignId, usageType.' }, { status: 400 })
  }

  if (!VALID_USAGE_TYPES.includes(usageType)) {
    return NextResponse.json({ error: 'usageType inválido.' }, { status: 400 })
  }

  if (!VALID_VISIBILITY.includes(visibility)) {
    return NextResponse.json({ error: 'visibility inválido.' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
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

  if (!isMaster && !['character_avatar', 'handout'].includes(usageType)) {
    return NextResponse.json({ error: 'Você só pode enviar avatares ou handouts próprios.' }, { status: 403 })
  }

  // Se uma entidade for informada, ela precisa existir nesta campanha e o
  // tipo precisa corresponder ao usageType — nunca atualizamos uma entidade
  // de outra campanha nem combinações inesperadas.
  const expectedEntityType = ENTITY_UPDATE_USAGE_TYPES[usageType]
  let entity: { table: string; id: string } | null = null

  if (entityType && entityId) {
    if (entityType !== expectedEntityType) {
      return NextResponse.json({ error: 'entityType não corresponde ao usageType.' }, { status: 400 })
    }

    if (entityType === 'npc') {
      const { data: npc } = await supabase.from('npcs').select('id, campaign_id').eq('id', entityId).maybeSingle()
      if (!npc || npc.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'NPC não encontrado nesta campanha.' }, { status: 404 })
      }
      entity = { table: 'npcs', id: npc.id }
    } else if (entityType === 'character') {
      const { data: character } = await supabase
        .from('characters')
        .select('id, campaign_id, owner_user_id')
        .eq('id', entityId)
        .maybeSingle()
      if (!character || character.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'Personagem não encontrado nesta campanha.' }, { status: 404 })
      }
      if (!isMaster && character.owner_user_id !== userId) {
        return NextResponse.json({ error: 'Você só pode atualizar o avatar do seu próprio personagem.' }, { status: 403 })
      }
      entity = { table: 'characters', id: character.id }
    } else if (entityType === 'location') {
      const { data: location } = await supabase.from('locations').select('id, campaign_id').eq('id', entityId).maybeSingle()
      if (!location || location.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'Local não encontrado nesta campanha.' }, { status: 404 })
      }
      entity = { table: 'locations', id: location.id }
    } else if (entityType === 'combat') {
      const { data: combat } = await supabase
        .from('combats')
        .select('id, campaign_id, battlefield_config')
        .eq('id', entityId)
        .maybeSingle()
      if (!combat || combat.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'Combate não encontrado nesta campanha.' }, { status: 404 })
      }
      entity = { table: 'combats', id: combat.id }
    } else if (entityType === 'item') {
      const { data: item } = await supabase.from('items').select('id, campaign_id').eq('id', entityId).maybeSingle()
      if (!item || item.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'Item não encontrado nesta campanha.' }, { status: 404 })
      }
      entity = { table: 'items', id: item.id }
    }
  }

  const storageKey = buildR2StorageKey(campaignId, usageType, file.name, randomUUID())

  console.log('[uploads/direct]', {
    campaignId,
    usageType,
    mimeType: file.type,
    sizeBytes: file.size,
    storageKey,
    entityType: entityType ?? null,
  })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadObjectToR2({ key: storageKey, contentType: file.type, body: buffer })
  } catch (error: any) {
    console.error('[uploads/direct] erro ao enviar para o R2:', { storageKey, message: error?.message })
    return NextResponse.json({ error: 'Falha ao enviar arquivo para o R2.' }, { status: 502 })
  }

  const publicUrl = getR2PublicUrl(storageKey)

  const { data: asset, error } = await supabase
    .from('media_assets')
    .insert({
      campaign_id: campaignId,
      owner_user_id: userId,
      bucket: process.env.CLOUDFLARE_R2_BUCKET ?? '',
      storage_key: storageKey,
      public_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      mime_type: file.type,
      size_bytes: file.size,
      usage_type: usageType,
      visibility,
    })
    .select()
    .single()

  if (error) {
    console.error('[uploads/direct] erro ao registrar media_asset:', { storageKey, message: error.message })
    return NextResponse.json({ error: 'Falha ao registrar arquivo enviado.' }, { status: 500 })
  }

  if (entity) {
    if (entity.table === 'npcs') {
      await supabase.from('npcs').update({ image_url: publicUrl }).eq('id', entity.id)
    } else if (entity.table === 'characters') {
      await supabase.from('characters').update({ avatar_url: publicUrl }).eq('id', entity.id)
    } else if (entity.table === 'locations') {
      await supabase.from('locations').update({ image_url: publicUrl }).eq('id', entity.id)
    } else if (entity.table === 'combats') {
      const { data: combat } = await supabase.from('combats').select('battlefield_config').eq('id', entity.id).maybeSingle()
      const battlefieldConfig = { ...(combat?.battlefield_config ?? {}), backgroundImageUrl: publicUrl }
      await supabase.from('combats').update({ battlefield_config: battlefieldConfig }).eq('id', entity.id)
    } else if (entity.table === 'items') {
      await supabase.from('items').update({ image_url: publicUrl }).eq('id', entity.id)
    }
  }

  console.log('[uploads/direct] ok', { storageKey, mediaAssetId: asset.id })

  return NextResponse.json({ ok: true, mediaAsset: asset, publicUrl })
}
