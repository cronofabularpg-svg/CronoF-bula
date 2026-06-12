// Limites de tamanho de upload por usageType. Mapas (Mapa Vivo, grid de
// combate) podem ser bem maiores que avatares/tokens/itens, então cada tipo
// de mídia tem seu próprio limite em vez de um único máximo global de 10 MB.

export const MAX_UPLOAD_SIZE_BY_USAGE_TYPE: Record<string, number> = {
  character_avatar: 10 * 1024 * 1024,
  npc_token: 10 * 1024 * 1024,
  item_image: 10 * 1024 * 1024,
  handout: 15 * 1024 * 1024,
  location_image: 25 * 1024 * 1024,
  battlefield_map: 25 * 1024 * 1024,
  campaign_cover: 15 * 1024 * 1024,
  other: 10 * 1024 * 1024,
}

const DEFAULT_MAX_UPLOAD_SIZE = 10 * 1024 * 1024

export function getMaxUploadSizeForUsageType(usageType: string): number {
  return MAX_UPLOAD_SIZE_BY_USAGE_TYPE[usageType] ?? DEFAULT_MAX_UPLOAD_SIZE
}

export function formatUploadLimit(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}
