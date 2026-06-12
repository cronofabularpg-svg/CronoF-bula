// Regras básicas do SRD (5.1) usadas apenas como sugestões editáveis no setup
// inicial de personagem e nas validações discretas da Ficha. Não é um motor
// de regras completo: nada aqui bloqueia o jogo, apenas orienta o jogador e o
// mestre quando um valor diverge do esperado para nível/raça/classe.

function normalizeText(value: string | null | undefined): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// ----------------------------------------------------------------------------
// Bônus de proficiência por nível
// ----------------------------------------------------------------------------

export function getProficiencyBonus(level: number): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level) || 1))
  if (lvl <= 4) return 2
  if (lvl <= 8) return 3
  if (lvl <= 12) return 4
  if (lvl <= 16) return 5
  return 6
}

// ----------------------------------------------------------------------------
// Modificador de atributo
// ----------------------------------------------------------------------------

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// ----------------------------------------------------------------------------
// Deslocamento padrão por raça (MVP — apenas as raças mais comuns do SRD)
// ----------------------------------------------------------------------------

const SLOW_RACES = new Set(["dwarf", "anao", "halfling", "pequenino", "gnome", "gnomo"])

export function getDefaultSpeed(race: string | null | undefined): number {
  const r = normalizeText(race)
  if (SLOW_RACES.has(r)) return 25
  return 30
}

// Velocidades "padrão" do SRD para PCs — usadas apenas para alertar quando o
// valor salvo é incomum, nunca para bloquear.
export const STANDARD_SPEEDS = [25, 30, 35]

// Nível em que cada bônus de proficiência passa a valer (inverso de
// getProficiencyBonus). Usado apenas para compor mensagens de alerta.
const PROFICIENCY_START_LEVEL: Record<number, number> = {
  2: 1,
  3: 5,
  4: 9,
  5: 13,
  6: 17,
}

export function getProficiencyStartLevel(bonus: number): number | null {
  return PROFICIENCY_START_LEVEL[bonus] ?? null
}

// ----------------------------------------------------------------------------
// Classe de Armadura sugerida
// ----------------------------------------------------------------------------

export type ArmorProperties = {
  ac?: number
  base_ac?: number
  ac_bonus?: number
  dex_cap?: number
} | null | undefined

export function getSuggestedArmorClass(params: {
  dexMod: number
  armor?: ArmorProperties
  hasShield?: boolean
}): number {
  const { dexMod, armor, hasShield } = params

  let base: number
  const baseAc = armor?.base_ac ?? armor?.ac
  if (typeof baseAc === "number") {
    const cappedDex = typeof armor?.dex_cap === "number" ? Math.min(dexMod, armor.dex_cap) : dexMod
    base = baseAc + cappedDex + (armor?.ac_bonus ?? 0)
  } else {
    // Sem regra de armadura conhecida — não inventamos: usamos a base do SRD
    // (10 + DEX) e deixamos claro na UI que é uma "CA sugerida".
    base = 10 + dexMod
  }

  if (hasShield) base += 2

  return base
}

// ----------------------------------------------------------------------------
// Pontos de Vida sugeridos
// ----------------------------------------------------------------------------

const CLASS_HIT_DICE: Record<string, number> = {
  // Português
  barbaro: 12,
  guerreiro: 10,
  paladino: 10,
  patrulheiro: 10,
  bardo: 8,
  clerigo: 8,
  druida: 8,
  monge: 8,
  ladino: 8,
  bruxo: 8,
  mago: 6,
  feiticeiro: 6,
  // Inglês
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
}

export function getHitDie(className: string | null | undefined): number {
  return CLASS_HIT_DICE[normalizeText(className)] ?? 8
}

export function getSuggestedLevelOneHp(className: string | null | undefined, conMod: number): number {
  const hitDie = getHitDie(className)
  return hitDie + conMod
}

function averageHpPerLevel(hitDie: number): number {
  switch (hitDie) {
    case 12:
      return 7
    case 10:
      return 6
    case 8:
      return 5
    case 6:
      return 4
    default:
      return 5
  }
}

export function getSuggestedHpForLevel(className: string | null | undefined, level: number, conMod: number): number {
  const hitDie = getHitDie(className)
  const lvl = Math.max(1, Math.floor(level) || 1)
  const levelOne = hitDie + conMod
  if (lvl === 1) return Math.max(1, levelOne)

  const perLevel = averageHpPerLevel(hitDie) + conMod
  return Math.max(lvl, levelOne + (lvl - 1) * perLevel)
}

// ----------------------------------------------------------------------------
// Unidades de medida
// ----------------------------------------------------------------------------

// 1 célula de grid = 5 ft = 1,5 m (SRD).
export const GRID_CELL_FT = 5
export const GRID_CELL_M = 1.5

export function feetToMeters(feet: number): number {
  return Math.round((feet / GRID_CELL_FT) * GRID_CELL_M * 10) / 10
}

export function formatSpeed(feet: number | null | undefined): string {
  if (feet === null || feet === undefined) return "—"
  return `${feet} ft (${feetToMeters(feet)} m)`
}
