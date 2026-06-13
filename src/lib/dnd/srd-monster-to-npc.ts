// Converte um monstro da Biblioteca SRD (src/lib/dnd/srd-monsters.ts) em um
// payload pronto para inserir na tabela `npcs` como mob/boss/creature do
// Bestiário da Campanha. A biblioteca é apenas um modelo — esta função monta
// o registro que o mestre ainda revisa e confirma antes de salvar.
//
// `ai_control_enabled` é sempre `false` por padrão: a IA Mestre só pode
// controlar este NPC depois que o mestre habilitar manualmente o controle.

import type { SrdMonster } from "./srd-monsters"
import { feetToMeters } from "./srd-rules"

export type SrdImportNpcType = "mob" | "boss" | "creature"
export type SrdImportCombatRole = "enemy" | "ally" | "neutral" | "summon" | "environmental"

export type ConvertSrdMonsterOptions = {
  /** Nome usado na campanha. Se ausente, usa o nome em português do monstro. */
  customName?: string
  npcType?: SrdImportNpcType
  combatRole?: SrdImportCombatRole
  visibility?: string
  /** Permite ajustar PV/CA antes de salvar, sem alterar o modelo da biblioteca. */
  armorClassOverride?: number
  maxHpOverride?: number
  aiControlEnabled?: boolean
}

export type SrdMonsterNpcInput = {
  name: string
  npc_type: SrdImportNpcType
  combat_role: SrdImportCombatRole
  ai_control_enabled: boolean
  challenge_level: string
  armor_class: number
  max_hp: number
  current_hp: number
  movement_meters: number | null
  attacks: SrdMonster["actions"]
  combat_behavior: string
  visibility: string
  metadata: {
    source: "srd"
    srd_monster_id: string
    original_name: string
    challenge_rating: string
    abilities: SrdMonster["abilities"]
    traits: SrdMonster["traits"]
    speed: SrdMonster["speed"]
    senses: SrdMonster["senses"]
    languages: SrdMonster["languages"]
    license: SrdMonster["license"]
  }
}

function primaryWalkSpeedFeet(speed: SrdMonster["speed"]): number | null {
  return speed.walk ?? speed.fly ?? speed.swim ?? speed.climb ?? speed.burrow ?? null
}

export function convertSrdMonsterToNpcInput(
  monster: SrdMonster,
  options: ConvertSrdMonsterOptions = {}
): SrdMonsterNpcInput {
  const armorClass = options.armorClassOverride ?? monster.armorClass
  const maxHp = options.maxHpOverride ?? monster.hitPoints
  const speedFeet = primaryWalkSpeedFeet(monster.speed)

  return {
    name: options.customName?.trim() || monster.portugueseName,
    npc_type: options.npcType ?? "mob",
    combat_role: options.combatRole ?? "enemy",
    ai_control_enabled: options.aiControlEnabled ?? false,
    challenge_level: monster.challengeRating,
    armor_class: armorClass,
    max_hp: maxHp,
    current_hp: maxHp,
    movement_meters: speedFeet !== null ? feetToMeters(speedFeet) : null,
    attacks: monster.actions,
    combat_behavior: monster.behaviorHint,
    visibility: options.visibility ?? "master_only",
    metadata: {
      source: "srd",
      srd_monster_id: monster.id,
      original_name: monster.name,
      challenge_rating: monster.challengeRating,
      abilities: monster.abilities,
      traits: monster.traits,
      speed: monster.speed,
      senses: monster.senses,
      languages: monster.languages,
      license: monster.license,
    },
  }
}
