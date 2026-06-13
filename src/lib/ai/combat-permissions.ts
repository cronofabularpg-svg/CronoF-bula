// Regras de permissão da IA Mestre em combate (TAREFA 8).
//
// Esta etapa NÃO implementa automação de combate — apenas os dados e
// helpers que qualquer automação futura deve consultar antes de agir.
//
// Regra oficial:
// A IA Mestre só pode controlar um participante se
//   combat_participants.metadata.ai_control_enabled = true
// ou
//   npcs.ai_control_enabled = true
//
// Qualquer campo ausente é tratado como "false" (a IA não controla por
// padrão; o mestre precisa habilitar explicitamente).
//
// A IA Mestre não pode, nem quando autorizada a controlar um participante:
// - criar um monstro/inimigo "oficial" global diretamente (sem aprovação do mestre);
// - usar um monstro do SRD que não foi importado para o Bestiário da campanha;
// - usar um mob/boss que o mestre não aprovou;
// - alterar PV diretamente, fora de uma função/ação de combate;
// - ignorar a ordem de iniciativa;
// - agir fora do turno do participante que ela controla;
// - revelar segredos do mestre (npcs.secrets, metadata privado etc.).

export type CombatParticipantForAi = {
  metadata?: {
    ai_control_enabled?: boolean | null
    [key: string]: unknown
  } | null
  npc?: {
    ai_control_enabled?: boolean | null
  } | null
}

export type CampaignSettingsForAi = {
  ai_combat_enabled?: boolean | null
  [key: string]: unknown
} | null | undefined

/**
 * Retorna true apenas se o participante de combate foi explicitamente
 * liberado para controle da IA Mestre, via combat_participants.metadata ou
 * via npcs.ai_control_enabled. Ausência do campo = false.
 */
export function canAiControlParticipant(participant: CombatParticipantForAi | null | undefined): boolean {
  if (!participant) return false
  if (participant.metadata?.ai_control_enabled === true) return true
  if (participant.npc?.ai_control_enabled === true) return true
  return false
}

/**
 * Filtra, de uma lista de participantes de combate, apenas aqueles que a IA
 * Mestre está autorizada a controlar.
 */
export function getAiControlledParticipants<T extends CombatParticipantForAi>(participants: T[] | null | undefined): T[] {
  if (!participants) return []
  return participants.filter(canAiControlParticipant)
}

/**
 * Indica se o modo de combate assistido por IA está habilitado para a
 * campanha. Ausência do campo = false (desabilitado por padrão).
 */
export function isAiCombatModeEnabled(campaignSettings: CampaignSettingsForAi): boolean {
  return campaignSettings?.ai_combat_enabled === true
}
