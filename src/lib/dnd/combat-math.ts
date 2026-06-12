// Matemática mínima de combate (SRD 5.1) usada na tela de Combate para
// sugerir rolagens de ataque, dano e testes de resistência. Não é um motor
// de regras completo: o mestre confirma toda aplicação de dano/cura/condição.

export type AbilityKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"

export const ABILITY_KEY_LABEL: Record<AbilityKey, string> = {
  strength: "Força",
  dexterity: "Destreza",
  constitution: "Constituição",
  intelligence: "Inteligência",
  wisdom: "Sabedoria",
  charisma: "Carisma",
}

// 1d20 simples.
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export type AttackRollResult = {
  roll: number
  bonus: number
  total: number
  isCriticalHit: boolean
  isCriticalFail: boolean
}

// Rola 1d20 e soma o bônus de ataque já calculado para a ação.
export function calculateAttackTotal(attackBonus: number): AttackRollResult {
  const roll = rollD20()
  return {
    roll,
    bonus: attackBonus,
    total: roll + attackBonus,
    isCriticalHit: roll === 20,
    isCriticalFail: roll === 1,
  }
}

export type DamageRollResult = {
  total: number
  rolls: number[]
  modifier: number
  sides: number
  formula: string
  critical: boolean
}

// Rola uma fórmula simples "NdM" ou "NdM+K"/"NdM-K". Em acerto crítico, o
// NÚMERO DE DADOS é dobrado (regra padrão do SRD), mas o modificador fixo não.
export function rollDamageFormula(formula: string, critical: boolean): DamageRollResult | null {
  const match = formula.trim().match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/i)
  if (!match) return null

  const baseCount = Math.min(Math.max(parseInt(match[1], 10), 1), 100)
  const sides = Math.max(parseInt(match[2], 10), 1)
  const modifier = match[3] ? parseInt(match[3].replace(/\s+/g, ""), 10) : 0
  const count = critical ? baseCount * 2 : baseCount

  const rolls: number[] = []
  let total = 0
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1
    rolls.push(r)
    total += r
  }
  total += modifier

  return { total, rolls, modifier, sides, formula: formula.trim(), critical }
}

// Habilidade de conjuração padrão por classe (MVP — apenas as classes mais
// comuns do SRD). Usada apenas como sugestão quando a ação não informa
// explicitamente sua habilidade.
const SPELLCASTING_ABILITY_BY_CLASS: Record<string, AbilityKey> = {
  paladino: "charisma",
  paladin: "charisma",
  bardo: "charisma",
  bard: "charisma",
  feiticeiro: "charisma",
  sorcerer: "charisma",
  bruxo: "charisma",
  warlock: "charisma",
  clerigo: "wisdom",
  cleric: "wisdom",
  druida: "wisdom",
  druid: "wisdom",
  patrulheiro: "wisdom",
  ranger: "wisdom",
  mago: "intelligence",
  wizard: "intelligence",
}

export function getSpellcastingAbilityForClass(className: string | null | undefined): AbilityKey {
  const key = (className || "").trim().toLowerCase()
  return SPELLCASTING_ABILITY_BY_CLASS[key] ?? "wisdom"
}

// Resultado de "Acertou / Errou / Crítico / Falha crítica" comparando o
// total da rolagem com a CA do alvo.
export type AttackOutcome = "critical_hit" | "critical_fail" | "hit" | "miss" | "unknown"

export function getAttackOutcome(result: AttackRollResult, targetAc: number | null): AttackOutcome {
  if (result.isCriticalHit) return "critical_hit"
  if (result.isCriticalFail) return "critical_fail"
  if (targetAc === null) return "unknown"
  return result.total >= targetAc ? "hit" : "miss"
}

export const ATTACK_OUTCOME_LABEL: Record<AttackOutcome, string> = {
  critical_hit: "Crítico (natural 20)!",
  critical_fail: "Falha crítica (natural 1)",
  hit: "Acertou",
  miss: "Errou",
  unknown: "CA do alvo não definida",
}
