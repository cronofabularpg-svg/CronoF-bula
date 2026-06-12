"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"
import { getAbilityModifier, getProficiencyBonus, formatSpeed } from "@/lib/dnd/srd-rules"
import {
  rollD20,
  calculateAttackTotal,
  rollDamageFormula,
  getSpellcastingAbilityForClass,
  getAttackOutcome,
  ATTACK_OUTCOME_LABEL,
  ABILITY_KEY_LABEL,
  type AbilityKey,
} from "@/lib/dnd/combat-math"
import {
  Swords,
  Skull,
  Heart,
  ShieldPlus,
  ChevronsRight,
  Flag,
  Plus,
  Trash2,
  Sparkles,
  Crown,
  Target,
  Shield,
  Wand2,
  MapPin,
  Map as MapIcon,
  Activity,
  X,
  Info,
  Grid3x3,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Crosshair,
  RotateCcw,
  Image as ImageIcon,
  UserPlus,
  Backpack,
  Footprints,
  BookOpen,
  Dices,
} from "lucide-react"

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

type Condition = {
  key: string
  label: string
  source?: string
  duration?: string
  save?: string
  notes?: string
}

type DeathSaves = { successes: number; failures: number }
type Concentration = { active: boolean; spell: string }

type ParticipantMetadata = {
  death_saves?: DeathSaves
  concentration?: Concentration
  surprise?: boolean
}

type CombatMetadata = {
  battlefield_image_url?: string
}

type BattlefieldConfig = {
  width?: number
  height?: number
  cellUnit?: string
  cellMeters?: number
  physicalCellCm?: number
  backgroundImageUrl?: string | null
  backgroundFit?: "contain" | "cover"
  gridOpacity?: number
  showGrid?: boolean
}

type Combat = {
  id: string
  campaign_id: string
  session_id: string | null
  scene_id: string | null
  title: string
  status: string
  round_number: number
  current_turn_index: number
  metadata: CombatMetadata | null
  battlefield_mode: "zones" | "grid"
  battlefield_config: BattlefieldConfig | null
}

type Participant = {
  id: string
  character_id: string | null
  npc_id: string | null
  name: string
  participant_type: string
  initiative: number | null
  armor_class: number | null
  current_hp: number | null
  max_hp: number | null
  turn_order: number | null
  status: string
  conditions: Condition[] | null
  metadata: ParticipantMetadata | null
  current_zone_id: string | null
  grid_x: number | null
  grid_y: number | null
  token_size: number
}

type CombatZone = {
  id: string
  name: string
  description: string | null
  zone_type: string
  cover_level: string
  difficult_terrain: boolean
  position_x: number
  position_y: number
  sort_order: number
}

type CombatZoneLink = {
  id: string
  from_zone_id: string
  to_zone_id: string
  distance_label: string
  movement_cost: number
}

type SceneEvent = {
  id: string
  event_type: string
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type CampaignCharacter = {
  id: string
  name: string
  current_hp: number | null
  max_hp: number | null
  armor_class: number | null
}

type CampaignNpc = {
  id: string
  name: string
}

type ManualEnemy = {
  localId: string
  name: string
  current_hp: string
  max_hp: string
  armor_class: string
  initiative: string
}

type SelectedCombatant = {
  selected: boolean
  initiative: string
  // TAREFA 4: preenchimento manual quando a ficha do personagem está incompleta.
  overrideCurrentHp?: string
  overrideMaxHp?: string
  overrideArmorClass?: string
}

// ----------------------------------------------------------------------------
// Tipos: ações reais da ficha (ataques, magias/habilidades, itens)
// ----------------------------------------------------------------------------

type AbilityScores = {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

type AttackData = {
  name: string
  attack_bonus?: number
  ability?: AbilityKey
  damage?: string
  damage_type?: string
  range?: string
  notes?: string
}

type SpellData = {
  name: string
  type?: string
  range?: string
  save_ability?: AbilityKey
  concentration?: boolean
  damage?: string
  damage_type?: string
  ability?: AbilityKey
  notes?: string
}

type CharacterSheet = {
  id: string
  name: string
  avatar_url: string | null
  level: number | null
  class: string | null
  current_hp: number | null
  max_hp: number | null
  armor_class: number | null
  speed: number | null
  proficiency_bonus: number | null
  stats: AbilityScores | null
  saving_throws: Record<string, number> | null
  skills: Record<string, number> | null
  initiative_bonus: number | null
  attacks: AttackData[]
  spells: SpellData[]
}

type EquippedItemRow = {
  id: string
  name: string
  item_type: string | null
  properties: Record<string, unknown> | null
  quantity: number
  equipped: boolean
}

type NpcSheet = {
  id: string
  name: string
  image_url: string | null
  role: string | null
  status: string | null
}

// Ação resolvida a partir de um ataque, magia ou item — pronta para rolagem.
type ResolvedAction = {
  key: string
  name: string
  source: "attack" | "spell" | "item"
  attackBonus: number | null
  damageFormula?: string | null
  damageType?: string | null
  range?: string | null
  saveAbility?: AbilityKey | null
  saveDC?: number | null
  concentration?: boolean
  notes?: string | null
  itemId?: string
}

// ----------------------------------------------------------------------------
// Constantes
// ----------------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  defeated: "Derrotado",
  dead: "Morto",
  fled: "Fugiu",
  inactive: "Inativo",
}

// TAREFA 10: badge de tipo de participante no card (Personagem/NPC/Aliado/Inimigo).
const PARTICIPANT_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  character: { label: "Personagem", className: "border-primary/30 text-primary" },
  npc: { label: "NPC", className: "border-muted-foreground/30 text-muted-foreground" },
  ally: { label: "Aliado", className: "border-emerald-400/30 text-emerald-300" },
  enemy: { label: "Inimigo", className: "border-destructive/30 text-destructive" },
}

// Condições oficiais de D&D 5e (5.1 SRD) usadas no select do modal de gerenciamento.
const DND_CONDITIONS: { key: string; label: string }[] = [
  { key: "blinded", label: "Cego" },
  { key: "charmed", label: "Enfeitiçado" },
  { key: "deafened", label: "Surdo" },
  { key: "frightened", label: "Amedrontado" },
  { key: "grappled", label: "Agarrado" },
  { key: "incapacitated", label: "Incapacitado" },
  { key: "invisible", label: "Invisível" },
  { key: "paralyzed", label: "Paralisado" },
  { key: "petrified", label: "Petrificado" },
  { key: "poisoned", label: "Envenenado" },
  { key: "prone", label: "Caído" },
  { key: "restrained", label: "Contido" },
  { key: "stunned", label: "Atordoado" },
  { key: "unconscious", label: "Inconsciente" },
  { key: "exhausted", label: "Exausto" },
]

// Ações de turno oficiais (econômicas) que podem ser declaradas sem aplicar efeito automático.
const TURN_ACTIONS: string[] = [
  "Ataque",
  "Magia",
  "Ação Bônus",
  "Movimento",
  "Reação",
  "Esquivar",
  "Desengajar",
  "Disparada",
  "Ajudar",
  "Esconder",
  "Preparar Ação",
  "Usar Objeto",
]

// Grid Tático D&D: 1 célula = 5 ft / 1,5 m (1 quadrado físico = 2,5 cm).
const DEFAULT_GRID_WIDTH = 24
const DEFAULT_GRID_HEIGHT = 18

const TOKEN_SIZES: { value: number; label: string }[] = [
  { value: 1, label: "1x1 — Pequeno/Médio" },
  { value: 2, label: "2x2 — Grande" },
  { value: 3, label: "3x3 — Enorme" },
  { value: 4, label: "4x4 — Colossal" },
]

type ZoneTemplateDef = { name: string; x: number; y: number; description?: string }
type LinkTemplateDef = [number, number, "near" | "medium" | "far"]
type BattlefieldTemplate = {
  key: string
  label: string
  zones: ZoneTemplateDef[]
  links: LinkTemplateDef[]
}

// Modelos rápidos de campo de batalha (zonas narrativas + conexões em estrela).
const BATTLEFIELD_TEMPLATES: BattlefieldTemplate[] = [
  {
    key: "sala_pequena",
    label: "Sala pequena",
    zones: [
      { name: "Entrada", x: 18, y: 50 },
      { name: "Centro da Sala", x: 50, y: 50 },
      { name: "Fundo da Sala", x: 82, y: 50 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
    ],
  },
  {
    key: "estrada",
    label: "Estrada",
    zones: [
      { name: "Trecho Norte", x: 50, y: 15 },
      { name: "Cruzamento", x: 50, y: 50 },
      { name: "Trecho Sul", x: 50, y: 85 },
      { name: "Acostamento", x: 82, y: 50 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
    ],
  },
  {
    key: "floresta",
    label: "Floresta",
    zones: [
      { name: "Trilha", x: 50, y: 18 },
      { name: "Clareira", x: 50, y: 50 },
      { name: "Mata Densa", x: 18, y: 50 },
      { name: "Riacho", x: 82, y: 50 },
      { name: "Árvore Caída", x: 50, y: 82 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
      [1, 4, "near"],
    ],
  },
  {
    key: "doca_galpao",
    label: "Doca / Galpão",
    zones: [
      { name: "Entrada da Doca", x: 15, y: 50 },
      { name: "Centro do Galpão", x: 50, y: 50 },
      { name: "Atrás das Caixas", x: 50, y: 18 },
      { name: "Passarela Superior", x: 80, y: 22 },
      { name: "Barco Atracado", x: 85, y: 75 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
      [1, 4, "near"],
    ],
  },
  {
    key: "ruina",
    label: "Ruína",
    zones: [
      { name: "Portal Desmoronado", x: 18, y: 50 },
      { name: "Pátio Central", x: 50, y: 50 },
      { name: "Torre Caída", x: 82, y: 25 },
      { name: "Cripta Aberta", x: 82, y: 75 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
    ],
  },
  {
    key: "campo_aberto",
    label: "Campo aberto",
    zones: [
      { name: "Linha de Frente", x: 50, y: 25 },
      { name: "Centro do Campo", x: 50, y: 50 },
      { name: "Flanco Esquerdo", x: 18, y: 50 },
      { name: "Flanco Direito", x: 82, y: 50 },
      { name: "Retaguarda", x: 50, y: 78 },
    ],
    links: [
      [1, 0, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
      [1, 4, "near"],
    ],
  },
  {
    key: "dungeon",
    label: "Dungeon",
    zones: [
      { name: "Corredor de Entrada", x: 15, y: 50 },
      { name: "Sala dos Pilares", x: 48, y: 50 },
      { name: "Câmara do Altar", x: 80, y: 25 },
      { name: "Passagem Secreta", x: 80, y: 78 },
    ],
    links: [
      [0, 1, "near"],
      [1, 2, "near"],
      [1, 3, "near"],
    ],
  },
]

const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  combat_started: { label: "Combate iniciado", icon: Swords, color: "text-primary" },
  turn_advanced: { label: "Turno avançado", icon: ChevronsRight, color: "text-muted-foreground" },
  damage_applied: { label: "Dano aplicado", icon: Skull, color: "text-destructive" },
  healing_applied: { label: "Cura aplicada", icon: Heart, color: "text-primary" },
  participant_defeated: { label: "Derrotado", icon: Skull, color: "text-destructive" },
  combat_ended: { label: "Combate encerrado", icon: Flag, color: "text-muted-foreground" },
  condition_applied: { label: "Condição aplicada", icon: ShieldPlus, color: "text-accent" },
  condition_removed: { label: "Condição removida", icon: X, color: "text-accent" },
  combat_action_declared: { label: "Ação declarada", icon: Sparkles, color: "text-primary" },
  attack_roll: { label: "Rolagem de ataque", icon: Target, color: "text-destructive" },
  saving_throw: { label: "Teste de resistência", icon: Shield, color: "text-accent" },
  death_save_updated: { label: "Teste contra a morte", icon: Activity, color: "text-destructive" },
  concentration_started: { label: "Concentração iniciada", icon: Wand2, color: "text-primary" },
  concentration_ended: { label: "Concentração perdida", icon: Wand2, color: "text-muted-foreground" },
  participant_moved: { label: "Movimento no campo", icon: MapPin, color: "text-accent" },
  battlefield_configured: { label: "Campo de batalha configurado", icon: Grid3x3, color: "text-muted-foreground" },
  participant_added: { label: "Participante adicionado", icon: UserPlus, color: "text-primary" },
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Distância narrativa entre duas zonas via BFS no grafo de conexões.
function zoneDistanceLabel(
  fromZoneId: string | null | undefined,
  toZoneId: string | null | undefined,
  links: CombatZoneLink[]
): string | null {
  if (!fromZoneId || !toZoneId) return null
  if (fromZoneId === toZoneId) return "Corpo a corpo"

  const adjacency: Record<string, string[]> = {}
  for (const link of links) {
    ;(adjacency[link.from_zone_id] ||= []).push(link.to_zone_id)
    ;(adjacency[link.to_zone_id] ||= []).push(link.from_zone_id)
  }

  const visited = new Set<string>([fromZoneId])
  let frontier = [fromZoneId]
  let hops = 0

  while (frontier.length > 0 && hops < 5) {
    hops++
    const next: string[] = []
    for (const zoneId of frontier) {
      for (const neighbor of adjacency[zoneId] || []) {
        if (neighbor === toZoneId) {
          if (hops === 1) return "Perto"
          if (hops === 2) return "Médio alcance"
          return "Distante"
        }
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          next.push(neighbor)
        }
      }
    }
    frontier = next
  }

  return "Distante"
}

function findConditionLabel(key: string): string {
  return DND_CONDITIONS.find((c) => c.key === key)?.label || key
}

// ----------------------------------------------------------------------------
// Resolução de ações reais da ficha (TAREFA 2-6)
// ----------------------------------------------------------------------------

function getAbilityScore(sheet: CharacterSheet | null | undefined, ability: AbilityKey): number {
  return sheet?.stats?.[ability] ?? 10
}

function getAbilityMod(sheet: CharacterSheet | null | undefined, ability: AbilityKey): number {
  return getAbilityModifier(getAbilityScore(sheet, ability))
}

function getProficiency(sheet: CharacterSheet | null | undefined): number {
  return sheet?.proficiency_bonus ?? getProficiencyBonus(sheet?.level ?? 1)
}

// Detecta se uma arma equipada é "finesse" ou de longo alcance (propriedade
// opcional do item); nesse caso o ataque usa DEX em vez de STR.
function getWeaponAbility(item: EquippedItemRow): AbilityKey {
  const props = item.properties || {}
  if (props.finesse || props.ranged) return "dexterity"
  const text = `${item.item_type ?? ""} ${item.name}`.toLowerCase()
  if (/ranged|distância|distancia|arco|besta|bow|crossbow/.test(text)) return "dexterity"
  return "strength"
}

function isWeaponItem(item: EquippedItemRow): boolean {
  const type = (item.item_type ?? "").toLowerCase()
  return type === "weapon" || type === "arma" || !!item.properties?.damage
}

function isUsableItem(item: EquippedItemRow): boolean {
  const type = (item.item_type ?? "").toLowerCase()
  return ["consumable", "potion", "poção", "pocao", "scroll", "food"].includes(type) || !!item.properties?.heal
}

// Ataques: combina character_stats.attacks (ficha) com armas equipadas do inventário.
function buildResolvedAttacks(sheet: CharacterSheet | null | undefined, items: EquippedItemRow[]): ResolvedAction[] {
  const actions: ResolvedAction[] = []
  const prof = getProficiency(sheet)

  for (const [idx, atk] of (sheet?.attacks ?? []).entries()) {
    const ability = atk.ability ?? "strength"
    const bonus = atk.attack_bonus ?? (getAbilityMod(sheet, ability) + prof)
    actions.push({
      key: `attack-${idx}-${atk.name}`,
      name: atk.name,
      source: "attack",
      attackBonus: bonus,
      damageFormula: atk.damage ?? null,
      damageType: atk.damage_type ?? null,
      range: atk.range ?? null,
      notes: atk.notes ?? null,
    })
  }

  for (const item of items) {
    if (!item.equipped || !isWeaponItem(item)) continue
    const ability = getWeaponAbility(item)
    const bonus = getAbilityMod(sheet, ability) + prof
    const props = item.properties || {}
    actions.push({
      key: `weapon-${item.id}`,
      name: item.name,
      source: "attack",
      attackBonus: bonus,
      damageFormula: (props.damage as string | undefined) ?? null,
      damageType: (props.damage_type as string | undefined) ?? null,
      range: (props.range as string | undefined) ?? null,
      notes: `Arma equipada · ${ABILITY_KEY_LABEL[ability]}`,
    })
  }

  return actions
}

// Magias/Habilidades: lê character_stats.spells. Sem dados fictícios — se a
// ficha estiver vazia, a aba mostra um estado vazio.
function buildResolvedSpells(sheet: CharacterSheet | null | undefined): ResolvedAction[] {
  const actions: ResolvedAction[] = []
  const prof = getProficiency(sheet)
  const defaultAbility = getSpellcastingAbilityForClass(sheet?.class)

  for (const [idx, spell] of (sheet?.spells ?? []).entries()) {
    const ability = spell.ability ?? defaultAbility
    const mod = getAbilityMod(sheet, ability)
    const hasSave = !!spell.save_ability
    const hasDamage = !!spell.damage

    actions.push({
      key: `spell-${idx}-${spell.name}`,
      name: spell.name,
      source: "spell",
      attackBonus: !hasSave && hasDamage ? mod + prof : null,
      damageFormula: spell.damage ?? null,
      damageType: spell.damage_type ?? null,
      range: spell.range ?? null,
      saveAbility: spell.save_ability ?? null,
      saveDC: hasSave ? 8 + prof + mod : null,
      concentration: !!spell.concentration,
      notes: spell.type ?? null,
    })
  }

  return actions
}

// Itens: consumíveis/usáveis do inventário equipado (poções, pergaminhos etc.).
function buildResolvedItems(items: EquippedItemRow[]): ResolvedAction[] {
  return items
    .filter((item) => isUsableItem(item) && item.quantity > 0)
    .map((item) => {
      const props = item.properties || {}
      const healFormula = props.heal as string | undefined
      const damageFormula = props.damage as string | undefined
      return {
        key: `item-${item.id}`,
        name: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`,
        source: "item" as const,
        attackBonus: null,
        damageFormula: healFormula ?? damageFormula ?? null,
        damageType: healFormula ? "cura" : (props.damage_type as string | undefined) ?? null,
        range: (props.range as string | undefined) ?? null,
        notes: item.item_type ?? null,
        itemId: item.id,
      }
    })
}

// ----------------------------------------------------------------------------
// Página
// ----------------------------------------------------------------------------

export default function Combate() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [isMaster, setIsMaster] = React.useState(false)
  const [myCharacter, setMyCharacter] = React.useState<{ id: string; name: string } | null>(null)
  const [activeSession, setActiveSession] = React.useState<{ id: string } | null>(null)
  const [activeScene, setActiveScene] = React.useState<{ id: string } | null>(null)

  const [combat, setCombat] = React.useState<Combat | null>(null)
  const [participants, setParticipants] = React.useState<Participant[]>([])
  const [zones, setZones] = React.useState<CombatZone[]>([])
  const [zoneLinks, setZoneLinks] = React.useState<CombatZoneLink[]>([])
  const [sceneEvents, setSceneEvents] = React.useState<SceneEvent[]>([])

  const [campaignCharacters, setCampaignCharacters] = React.useState<CampaignCharacter[]>([])
  const [campaignNpcs, setCampaignNpcs] = React.useState<CampaignNpc[]>([])

  // Estado do modal "Iniciar Combate"
  const [startOpen, setStartOpen] = React.useState(false)
  const [combatTitle, setCombatTitle] = React.useState("")
  const [selectedCharacters, setSelectedCharacters] = React.useState<Record<string, SelectedCombatant>>({})
  const [selectedNpcs, setSelectedNpcs] = React.useState<Record<string, SelectedCombatant>>({})
  const [manualEnemies, setManualEnemies] = React.useState<ManualEnemy[]>([])
  const [startSubmitting, setStartSubmitting] = React.useState(false)

  // Estado do modal de gerenciamento do participante (mestre)
  const [manageParticipant, setManageParticipant] = React.useState<Participant | null>(null)
  const [damageAmount, setDamageAmount] = React.useState("")
  const [damageType, setDamageType] = React.useState("")
  const [healAmount, setHealAmount] = React.useState("")
  const [conditionKey, setConditionKey] = React.useState("")
  const [conditionSource, setConditionSource] = React.useState("")
  const [conditionDuration, setConditionDuration] = React.useState("")
  const [conditionSave, setConditionSave] = React.useState("")
  const [conditionNotes, setConditionNotes] = React.useState("")
  const [deathSuccesses, setDeathSuccesses] = React.useState("0")
  const [deathFailures, setDeathFailures] = React.useState("0")
  const [concentrationActive, setConcentrationActive] = React.useState(false)
  const [concentrationSpell, setConcentrationSpell] = React.useState("")
  const [moveZoneId, setMoveZoneId] = React.useState("")
  const [tokenSize, setTokenSize] = React.useState("1")
  const [gridMoveX, setGridMoveX] = React.useState("")
  const [gridMoveY, setGridMoveY] = React.useState("")
  const [actionSubmitting, setActionSubmitting] = React.useState(false)

  const [turnSubmitting, setTurnSubmitting] = React.useState(false)
  const [endSubmitting, setEndSubmitting] = React.useState(false)

  // Ação do turno (declaração narrativa, sem aplicar efeito automático)
  const [actingParticipantId, setActingParticipantId] = React.useState("")
  const [turnActionType, setTurnActionType] = React.useState<string>(TURN_ACTIONS[0])
  const [turnActionNote, setTurnActionNote] = React.useState("")
  const [turnActionSubmitting, setTurnActionSubmitting] = React.useState(false)

  // Campo de batalha: criação rápida por modelo (zonas) ou configuração de grid
  const [battlefieldOpen, setBattlefieldOpen] = React.useState(false)
  const [battlefieldTemplate, setBattlefieldTemplate] = React.useState(BATTLEFIELD_TEMPLATES[0].key)
  const [battlefieldSubmitting, setBattlefieldSubmitting] = React.useState(false)

  // Grid Tático D&D
  const [gridSetupOpen, setGridSetupOpen] = React.useState(false)
  const [gridWidthInput, setGridWidthInput] = React.useState(String(DEFAULT_GRID_WIDTH))
  const [gridHeightInput, setGridHeightInput] = React.useState(String(DEFAULT_GRID_HEIGHT))
  const [gridFitInput, setGridFitInput] = React.useState<"contain" | "cover">("contain")
  const [gridOpacityInput, setGridOpacityInput] = React.useState("50")
  const [gridShowGridInput, setGridShowGridInput] = React.useState(true)
  const [gridSetupSubmitting, setGridSetupSubmitting] = React.useState(false)
  const [selectedGridTokenId, setSelectedGridTokenId] = React.useState<string | null>(null)
  const [measureTokenA, setMeasureTokenA] = React.useState("")
  const [measureTokenB, setMeasureTokenB] = React.useState("")
  const [participantAvatars, setParticipantAvatars] = React.useState<Record<string, string | null>>({})

  // TAREFA 1: dados completos da ficha (personagens) e dos NPCs envolvidos no combate.
  const [characterSheets, setCharacterSheets] = React.useState<Record<string, CharacterSheet>>({})
  const [characterItems, setCharacterItems] = React.useState<Record<string, EquippedItemRow[]>>({})
  const [npcSheets, setNpcSheets] = React.useState<Record<string, NpcSheet>>({})

  // TAREFA 2-6: ação do turno com abas (Ataques, Magias, Itens, Movimento, Manual).
  const [actionTab, setActionTab] = React.useState("ataques")
  const [actionTargetId, setActionTargetId] = React.useState("")
  const [selectedAction, setSelectedAction] = React.useState<ResolvedAction | null>(null)
  const [actionRoll, setActionRoll] = React.useState<{ roll: number; total: number; outcome: string } | null>(null)
  const [actionDamageRoll, setActionDamageRoll] = React.useState<{ total: number; critical: boolean } | null>(null)
  const [actionRollSubmitting, setActionRollSubmitting] = React.useState(false)
  const [actionDamageSubmitting, setActionDamageSubmitting] = React.useState(false)

  // TAREFA 6: teste de resistência solicitado a um alvo (a partir de uma magia/habilidade).
  const [saveRequestResult, setSaveRequestResult] = React.useState<{ roll: number; total: number; dc: number; success: boolean } | null>(null)
  const [saveRequestSubmitting, setSaveRequestSubmitting] = React.useState(false)

  // TAREFA 8-9: modal "Adicionar ao Combate" (apenas mestre).
  const [addParticipantOpen, setAddParticipantOpen] = React.useState(false)
  const [addInitiativeByCharacter, setAddInitiativeByCharacter] = React.useState<Record<string, string>>({})
  const [addingCharacterId, setAddingCharacterId] = React.useState<string | null>(null)
  const [addNpcTypeById, setAddNpcTypeById] = React.useState<Record<string, string>>({})
  const [addInitiativeByNpc, setAddInitiativeByNpc] = React.useState<Record<string, string>>({})
  const [addingNpcId, setAddingNpcId] = React.useState<string | null>(null)
  const [surpriseName, setSurpriseName] = React.useState("")
  const [surpriseCurrentHp, setSurpriseCurrentHp] = React.useState("")
  const [surpriseMaxHp, setSurpriseMaxHp] = React.useState("")
  const [surpriseArmorClass, setSurpriseArmorClass] = React.useState("")
  const [surpriseInitiative, setSurpriseInitiative] = React.useState("")
  const [surpriseSubmitting, setSurpriseSubmitting] = React.useState(false)

  // Visualização do grid: zoom e centralização são apenas locais (não persistidos).
  const DEFAULT_GRID_CELL_SIZE = 48
  const [gridCellSize, setGridCellSize] = React.useState(DEFAULT_GRID_CELL_SIZE)
  const gridScrollRef = React.useRef<HTMLDivElement>(null)

  function handleGridZoomIn() {
    setGridCellSize((prev) => Math.min(80, prev + 8))
  }

  function handleGridZoomOut() {
    setGridCellSize((prev) => Math.max(32, prev - 8))
  }

  function handleGridResetView() {
    setGridCellSize(DEFAULT_GRID_CELL_SIZE)
    const el = gridScrollRef.current
    if (el) {
      el.scrollLeft = 0
      el.scrollTop = 0
    }
  }

  function handleGridCenterView() {
    const el = gridScrollRef.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
  }

  const loadCombat = React.useCallback(async () => {
    if (!campaignId) return
    const supabase = createClient()

    const { data: combatData } = await supabase
      .from('combats')
      .select('id, campaign_id, session_id, scene_id, title, status, round_number, current_turn_index, metadata, battlefield_mode, battlefield_config')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setCombat((combatData as Combat | null) ?? null)

    if (combatData) {
      const { data: participantsData } = await supabase
        .from('combat_participants')
        .select('id, character_id, npc_id, name, participant_type, initiative, armor_class, current_hp, max_hp, turn_order, status, conditions, metadata, current_zone_id, grid_x, grid_y, token_size')
        .eq('combat_id', combatData.id)
        .order('turn_order', { ascending: true })

      const participantsList = (participantsData as Participant[]) || []
      setParticipants(participantsList)

      const characterIds = participantsList.filter(p => p.character_id).map(p => p.character_id as string)
      const npcIds = participantsList.filter(p => p.npc_id).map(p => p.npc_id as string)
      const avatarMap: Record<string, string | null> = {}

      const sheetMap: Record<string, CharacterSheet> = {}
      const itemsMap: Record<string, EquippedItemRow[]> = {}
      const npcMap: Record<string, NpcSheet> = {}

      if (characterIds.length > 0) {
        const { data: charsFull } = await supabase
          .from('characters')
          .select('id, name, avatar_url, level, class, current_hp, max_hp, armor_class, speed, proficiency_bonus')
          .in('id', characterIds)

        const { data: statsFull } = await supabase
          .from('character_stats')
          .select('character_id, strength, dexterity, constitution, intelligence, wisdom, charisma, saving_throws, skills, attacks, spells, initiative_bonus')
          .in('character_id', characterIds)

        const statsById: Record<string, Record<string, unknown>> = {}
        for (const s of (statsFull as Record<string, unknown>[]) || []) {
          statsById[s.character_id as string] = s
        }

        for (const c of (charsFull as Record<string, unknown>[]) || []) {
          const id = c.id as string
          const s = statsById[id]
          for (const p of participantsList.filter(p => p.character_id === id)) {
            avatarMap[p.id] = (c.avatar_url as string | null) ?? null
          }
          sheetMap[id] = {
            id,
            name: c.name as string,
            avatar_url: (c.avatar_url as string | null) ?? null,
            level: (c.level as number | null) ?? null,
            class: (c.class as string | null) ?? null,
            current_hp: (c.current_hp as number | null) ?? null,
            max_hp: (c.max_hp as number | null) ?? null,
            armor_class: (c.armor_class as number | null) ?? null,
            speed: (c.speed as number | null) ?? null,
            proficiency_bonus: (c.proficiency_bonus as number | null) ?? null,
            stats: s ? {
              strength: (s.strength as number) ?? 10,
              dexterity: (s.dexterity as number) ?? 10,
              constitution: (s.constitution as number) ?? 10,
              intelligence: (s.intelligence as number) ?? 10,
              wisdom: (s.wisdom as number) ?? 10,
              charisma: (s.charisma as number) ?? 10,
            } : null,
            saving_throws: (s?.saving_throws as Record<string, number> | null) ?? null,
            skills: (s?.skills as Record<string, number> | null) ?? null,
            initiative_bonus: (s?.initiative_bonus as number | null) ?? null,
            attacks: Array.isArray(s?.attacks) ? s.attacks as AttackData[] : [],
            spells: Array.isArray(s?.spells) ? s.spells as SpellData[] : [],
          }
        }

        const { data: itemsFull } = await supabase
          .from('character_items')
          .select('id, character_id, quantity, equipped, item_id, items(id, name, item_type, properties)')
          .in('character_id', characterIds)

        for (const row of (itemsFull as Record<string, unknown>[]) || []) {
          const item = Array.isArray(row.items) ? row.items[0] : row.items
          if (!item) continue
          const charId = row.character_id as string
          ;(itemsMap[charId] ||= []).push({
            id: (item as Record<string, unknown>).id as string,
            name: (item as Record<string, unknown>).name as string,
            item_type: ((item as Record<string, unknown>).item_type as string | null) ?? null,
            properties: ((item as Record<string, unknown>).properties as Record<string, unknown> | null) ?? null,
            quantity: (row.quantity as number) ?? 1,
            equipped: !!row.equipped,
          })
        }
      }

      if (npcIds.length > 0) {
        const { data: npcsFull } = await supabase
          .from('npcs')
          .select('id, name, image_url, role, status')
          .in('id', npcIds)
        for (const n of (npcsFull as Record<string, unknown>[]) || []) {
          const id = n.id as string
          npcMap[id] = {
            id,
            name: n.name as string,
            image_url: (n.image_url as string | null) ?? null,
            role: (n.role as string | null) ?? null,
            status: (n.status as string | null) ?? null,
          }
          for (const p of participantsList.filter(p => p.npc_id === id)) {
            avatarMap[p.id] = (n.image_url as string | null) ?? null
          }
        }
      }

      setParticipantAvatars(avatarMap)
      setCharacterSheets(sheetMap)
      setCharacterItems(itemsMap)
      setNpcSheets(npcMap)

      const { data: zonesData } = await supabase
        .from('combat_zones')
        .select('id, name, description, zone_type, cover_level, difficult_terrain, position_x, position_y, sort_order')
        .eq('combat_id', combatData.id)
        .order('sort_order', { ascending: true })

      setZones((zonesData as CombatZone[]) || [])

      const { data: linksData } = await supabase
        .from('combat_zone_links')
        .select('id, from_zone_id, to_zone_id, distance_label, movement_cost')
        .eq('combat_id', combatData.id)

      setZoneLinks((linksData as CombatZoneLink[]) || [])

      if (combatData.scene_id) {
        const { data: eventsData } = await supabase
          .from('scene_events')
          .select('id, event_type, content, metadata, created_at')
          .eq('scene_id', combatData.scene_id)
          .order('created_at', { ascending: false })
          .limit(20)

        setSceneEvents((eventsData as SceneEvent[]) || [])
      } else {
        setSceneEvents([])
      }
    } else {
      setParticipants([])
      setParticipantAvatars({})
      setCharacterSheets({})
      setCharacterItems({})
      setNpcSheets({})
      setZones([])
      setZoneLinks([])
      setSceneEvents([])
    }
  }, [campaignId])

  React.useEffect(() => {
    if (!user || !campaignId) return
    let active = true
    const supabase = createClient()

    const load = async () => {
      setLoading(true)

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, owner_id')
        .eq('id', campaignId)
        .maybeSingle()

      const { data: membershipData } = await supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.uid)
        .eq('status', 'active')
        .maybeSingle()

      if (!active) return

      const masterRoles = ['owner', 'master', 'assistant_master']
      setIsMaster(
        campaignData?.owner_id === user.uid ||
        masterRoles.includes(membershipData?.role || '')
      )

      const { data: charactersData } = await supabase
        .from('characters')
        .select('id, name, current_hp, max_hp, armor_class, owner_user_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (!active) return

      setCampaignCharacters((charactersData as (CampaignCharacter & { owner_user_id: string })[] || []).map(c => ({
        id: c.id,
        name: c.name,
        current_hp: c.current_hp,
        max_hp: c.max_hp,
        armor_class: c.armor_class,
      })))

      const mine = (charactersData || []).find((c: { owner_user_id: string }) => c.owner_user_id === user.uid)
      setMyCharacter(mine ? { id: mine.id, name: mine.name } : null)

      const { data: npcsData } = await supabase
        .from('npcs')
        .select('id, name')
        .eq('campaign_id', campaignId)
        .order('name', { ascending: true })

      if (!active) return
      setCampaignNpcs((npcsData as CampaignNpc[]) || [])

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!active) return
      setActiveSession(sessionData || null)

      if (sessionData) {
        const { data: sceneData } = await supabase
          .from('scenes')
          .select('id')
          .eq('session_id', sessionData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!active) return
        setActiveScene(sceneData || null)
      }

      await loadCombat()
      if (active) setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [user, campaignId, loadCombat])

  // Realtime: recarrega o combate quando combate, participantes, zonas, conexões ou eventos mudarem.
  React.useEffect(() => {
    if (!campaignId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`combate-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combats', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadCombat()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_participants', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadCombat()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_zones', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadCombat()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_zone_links', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadCombat()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_events', filter: `campaign_id=eq.${campaignId}` }, () => {
        loadCombat()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, loadCombat])

  // Mantém o modal de gerenciamento sincronizado com o estado mais recente do participante.
  React.useEffect(() => {
    if (!manageParticipant) return
    const updated = participants.find(p => p.id === manageParticipant.id)
    if (updated) setManageParticipant(updated)
  }, [participants, manageParticipant])

  const currentTurnParticipant = React.useMemo(() => {
    if (!combat || participants.length === 0) return null
    return participants[combat.current_turn_index] || null
  }, [combat, participants])

  const isMyTurn = !!(currentTurnParticipant && myCharacter && currentTurnParticipant.character_id === myCharacter.id)

  const myParticipant = React.useMemo(() => {
    if (!myCharacter) return null
    return participants.find(p => p.character_id === myCharacter.id) || null
  }, [participants, myCharacter])

  // Define automaticamente o participante "atuante" para o mestre (padrão: turno atual).
  React.useEffect(() => {
    if (!isMaster) return
    if (participants.length === 0) {
      setActingParticipantId("")
      return
    }
    if (!participants.find(p => p.id === actingParticipantId)) {
      setActingParticipantId(currentTurnParticipant?.id || participants[0].id)
    }
  }, [isMaster, participants, currentTurnParticipant, actingParticipantId])

  const actingParticipant = React.useMemo(() => {
    if (isMaster) return participants.find(p => p.id === actingParticipantId) || null
    return myParticipant
  }, [isMaster, actingParticipantId, participants, myParticipant])

  // TAREFA 2-6: ao trocar "Atuando como", limpa a ação/rolagem selecionada.
  React.useEffect(() => {
    setSelectedAction(null)
    setActionRoll(null)
    setActionDamageRoll(null)
    setSaveRequestResult(null)
    setActionTargetId("")
  }, [actingParticipant?.id])

  const currentTurnZoneId = currentTurnParticipant?.current_zone_id ?? null

  function resetStartForm() {
    setCombatTitle("")
    setSelectedCharacters({})
    setSelectedNpcs({})
    setManualEnemies([])
  }

  function addManualEnemy() {
    setManualEnemies(prev => [
      ...prev,
      { localId: crypto.randomUUID(), name: "", current_hp: "", max_hp: "", armor_class: "", initiative: "" },
    ])
  }

  function updateManualEnemy(localId: string, field: keyof ManualEnemy, value: string) {
    setManualEnemies(prev => prev.map(e => e.localId === localId ? { ...e, [field]: value } : e))
  }

  function removeManualEnemy(localId: string) {
    setManualEnemies(prev => prev.filter(e => e.localId !== localId))
  }

  async function handleStartCombat() {
    if (!combatTitle.trim()) {
      toast({ variant: "destructive", title: "Informe um título", description: "O combate precisa de um nome." })
      return
    }

    const participantsPayload: Record<string, unknown>[] = []

    for (const [characterId, sel] of Object.entries(selectedCharacters)) {
      if (!sel.selected) continue
      participantsPayload.push({
        character_id: characterId,
        participant_type: 'character',
        initiative: sel.initiative ? parseInt(sel.initiative, 10) : null,
        // TAREFA 4: usados apenas se a ficha do personagem não tiver PV/CA definidos.
        current_hp: sel.overrideCurrentHp ? parseInt(sel.overrideCurrentHp, 10) : null,
        max_hp: sel.overrideMaxHp ? parseInt(sel.overrideMaxHp, 10) : null,
        armor_class: sel.overrideArmorClass ? parseInt(sel.overrideArmorClass, 10) : null,
      })
    }

    for (const [npcId, sel] of Object.entries(selectedNpcs)) {
      if (!sel.selected) continue
      participantsPayload.push({
        npc_id: npcId,
        participant_type: 'npc',
        initiative: sel.initiative ? parseInt(sel.initiative, 10) : null,
      })
    }

    for (const enemy of manualEnemies) {
      if (!enemy.name.trim()) continue
      participantsPayload.push({
        name: enemy.name.trim(),
        participant_type: 'enemy',
        current_hp: enemy.current_hp ? parseInt(enemy.current_hp, 10) : null,
        max_hp: enemy.max_hp ? parseInt(enemy.max_hp, 10) : null,
        armor_class: enemy.armor_class ? parseInt(enemy.armor_class, 10) : null,
        initiative: enemy.initiative ? parseInt(enemy.initiative, 10) : null,
      })
    }

    if (participantsPayload.length === 0) {
      toast({ variant: "destructive", title: "Sem participantes", description: "Selecione ao menos um personagem, NPC ou inimigo." })
      return
    }

    setStartSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('start_combat', {
      target_campaign_id: campaignId,
      target_session_id: activeSession?.id ?? null,
      target_scene_id: activeScene?.id ?? null,
      combat_title: combatTitle.trim(),
      participants: participantsPayload,
    })
    setStartSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao iniciar combate", description: error.message })
      return
    }

    toast({ title: "Combate iniciado", description: `"${combatTitle.trim()}" começou.` })
    setStartOpen(false)
    resetStartForm()
    await loadCombat()
  }

  async function handleAdvanceTurn() {
    if (!combat) return
    setTurnSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('advance_combat_turn', { target_combat_id: combat.id })
    setTurnSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao avançar turno", description: error.message })
      return
    }
    await loadCombat()
  }

  // TAREFA 10: mestre força o turno atual para um participante específico
  // (ex.: após adicionar um inimigo surpresa ou reorganizar a iniciativa).
  async function handleSetCurrentTurn(participantId: string) {
    if (!combat) return
    setTurnSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('set_combat_current_turn', {
      target_combat_id: combat.id,
      target_participant_id: participantId,
    })
    setTurnSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao definir turno atual", description: error.message })
      return
    }
    await loadCombat()
  }

  async function handleEndCombat() {
    if (!combat) return
    setEndSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('end_combat', { target_combat_id: combat.id })
    setEndSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao encerrar combate", description: error.message })
      return
    }
    toast({ title: "Combate encerrado" })
    await loadCombat()
  }

  function openManage(participant: Participant) {
    setManageParticipant(participant)
    setDamageAmount("")
    setDamageType("")
    setHealAmount("")
    setConditionKey("")
    setConditionSource("")
    setConditionDuration("")
    setConditionSave("")
    setConditionNotes("")
    const deathSaves = participant.metadata?.death_saves
    setDeathSuccesses(String(deathSaves?.successes ?? 0))
    setDeathFailures(String(deathSaves?.failures ?? 0))
    const concentration = participant.metadata?.concentration
    setConcentrationActive(!!concentration?.active)
    setConcentrationSpell(concentration?.spell ?? "")
    setMoveZoneId(participant.current_zone_id ?? "")
    setTokenSize(String(participant.token_size ?? 1))
    setGridMoveX(participant.grid_x !== null ? String(participant.grid_x) : "")
    setGridMoveY(participant.grid_y !== null ? String(participant.grid_y) : "")
  }

  async function handleApplyDamage() {
    if (!manageParticipant) return
    const amount = parseInt(damageAmount, 10)
    if (isNaN(amount) || amount < 0) {
      toast({ variant: "destructive", title: "Valor inválido", description: "Informe um número de dano válido." })
      return
    }

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('apply_combat_damage', {
      target_participant_id: manageParticipant.id,
      amount,
      damage_type: damageType.trim() || null,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao aplicar dano", description: error.message })
      return
    }
    setDamageAmount("")
    setDamageType("")
    await loadCombat()
  }

  async function handleApplyHealing() {
    if (!manageParticipant) return
    const amount = parseInt(healAmount, 10)
    if (isNaN(amount) || amount < 0) {
      toast({ variant: "destructive", title: "Valor inválido", description: "Informe um número de cura válido." })
      return
    }

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('apply_combat_healing', {
      target_participant_id: manageParticipant.id,
      amount,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao aplicar cura", description: error.message })
      return
    }
    setHealAmount("")
    await loadCombat()
  }

  async function handleApplyCondition() {
    if (!manageParticipant || !conditionKey) return

    const condition: Condition = { key: conditionKey, label: findConditionLabel(conditionKey) }
    if (conditionSource.trim()) condition.source = conditionSource.trim()
    if (conditionDuration.trim()) condition.duration = conditionDuration.trim()
    if (conditionSave.trim()) condition.save = conditionSave.trim()
    if (conditionNotes.trim()) condition.notes = conditionNotes.trim()

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('apply_combat_condition', {
      target_participant_id: manageParticipant.id,
      condition,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao aplicar condição", description: error.message })
      return
    }
    setConditionKey("")
    setConditionSource("")
    setConditionDuration("")
    setConditionSave("")
    setConditionNotes("")
    await loadCombat()
  }

  async function handleRemoveCondition(key: string) {
    if (!manageParticipant) return

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('remove_combat_condition', {
      target_participant_id: manageParticipant.id,
      condition_key: key,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao remover condição", description: error.message })
      return
    }
    await loadCombat()
  }

  async function handleUpdateDeathSaves() {
    if (!manageParticipant) return

    const successes = Math.max(0, Math.min(3, parseInt(deathSuccesses, 10) || 0))
    const failures = Math.max(0, Math.min(3, parseInt(deathFailures, 10) || 0))

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('update_combat_death_saves', {
      target_participant_id: manageParticipant.id,
      successes,
      failures,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar testes contra a morte", description: error.message })
      return
    }
    await loadCombat()
  }

  async function handleSetConcentration() {
    if (!manageParticipant) return

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('set_combat_concentration', {
      target_participant_id: manageParticipant.id,
      active: concentrationActive,
      spell: concentrationActive ? (concentrationSpell.trim() || null) : null,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar concentração", description: error.message })
      return
    }
    await loadCombat()
  }

  async function handleMoveParticipant() {
    if (!manageParticipant) return

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('move_combat_participant', {
      target_participant_id: manageParticipant.id,
      target_zone_id: moveZoneId || null,
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao mover participante", description: error.message })
      return
    }
    await loadCombat()
  }

  // Mestre define o modo do campo de batalha (zonas ou grid) e sua configuração.
  async function handleSetBattlefieldMode(mode: "zones" | "grid", config: BattlefieldConfig = {}) {
    if (!combat) return
    const supabase = createClient()
    const { error } = await supabase.rpc('set_combat_battlefield', {
      target_combat_id: combat.id,
      mode,
      config,
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao configurar campo de batalha", description: error.message })
      return
    }
    await loadCombat()
  }

  // Mestre alterna o campo de batalha para o modo Zonas Narrativas, preservando
  // a configuração de grid (caso queira voltar depois). Se ainda não houver
  // zonas criadas, abre o modal de criação de zonas.
  async function handleUseZones() {
    if (!combat) return
    await handleSetBattlefieldMode('zones', combat.battlefield_config ?? {})
    if (zones.length === 0) {
      setBattlefieldOpen(true)
    }
  }

  // Abre o modal de configuração de grid pré-preenchido com a config atual
  // (usado tanto para configurar quanto para "Ajustar grid" de um combate já configurado).
  function openGridSetup() {
    const cfg = combat?.battlefield_config
    setGridWidthInput(String(cfg?.width ?? DEFAULT_GRID_WIDTH))
    setGridHeightInput(String(cfg?.height ?? DEFAULT_GRID_HEIGHT))
    setGridFitInput(cfg?.backgroundFit ?? 'contain')
    setGridOpacityInput(String(Math.round((cfg?.gridOpacity ?? 0.5) * 100)))
    setGridShowGridInput(cfg?.showGrid ?? true)
    setGridSetupOpen(true)
  }

  async function handleSetupGrid() {
    const width = Math.max(1, Math.min(60, parseInt(gridWidthInput, 10) || DEFAULT_GRID_WIDTH))
    const height = Math.max(1, Math.min(60, parseInt(gridHeightInput, 10) || DEFAULT_GRID_HEIGHT))
    const opacityPercent = Math.max(0, Math.min(100, parseInt(gridOpacityInput, 10) || 50))

    setGridSetupSubmitting(true)
    await handleSetBattlefieldMode('grid', {
      width,
      height,
      cellUnit: '5ft',
      cellMeters: 1.5,
      physicalCellCm: 2.5,
      backgroundImageUrl: combat?.battlefield_config?.backgroundImageUrl ?? null,
      backgroundFit: gridFitInput,
      gridOpacity: opacityPercent / 100,
      showGrid: gridShowGridInput,
    })
    setGridSetupSubmitting(false)
    setGridSetupOpen(false)
  }

  // Mestre move um token para uma célula do grid (clique no mapa ou input numérico).
  async function handleMoveParticipantGrid(participantId: string, x: number, y: number) {
    const supabase = createClient()
    const { error } = await supabase.rpc('move_combat_participant_grid', {
      target_participant_id: participantId,
      target_x: x,
      target_y: y,
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao mover token", description: error.message })
      return false
    }

    const moved = participants.find(p => p.id === participantId)
    toast({ title: "Token movido", description: `${moved?.name ?? 'Token'} movido para ${x}/${y}.` })
    if (selectedGridTokenId === participantId) {
      setSelectedGridTokenId(null)
    }
    await loadCombat()
    return true
  }

  async function handleMoveParticipantGridFromModal() {
    if (!manageParticipant) return
    const x = parseInt(gridMoveX, 10)
    const y = parseInt(gridMoveY, 10)
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      toast({ variant: "destructive", title: "Posição inválida", description: "Informe coordenadas X e Y válidas (a partir de 0)." })
      return
    }

    setActionSubmitting(true)
    await handleMoveParticipantGrid(manageParticipant.id, x, y)
    setActionSubmitting(false)
  }

  // Tamanho do token (1x1 a 4x4) — apenas mestre, sem evento de cena.
  async function handleSetTokenSize() {
    if (!manageParticipant) return

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('combat_participants')
      .update({ token_size: parseInt(tokenSize, 10) || 1 })
      .eq('id', manageParticipant.id)
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar tamanho do token", description: error.message })
      return
    }
    await loadCombat()
  }

  // Salva a imagem de fundo do grid em battlefield_config (fase futura: recorte/calibração).
  async function handleBattlefieldImageUploaded(mediaAsset: MediaAsset) {
    if (!combat) return
    await handleSetBattlefieldMode('grid', {
      width: combat.battlefield_config?.width ?? DEFAULT_GRID_WIDTH,
      height: combat.battlefield_config?.height ?? DEFAULT_GRID_HEIGHT,
      cellUnit: combat.battlefield_config?.cellUnit ?? '5ft',
      cellMeters: combat.battlefield_config?.cellMeters ?? 1.5,
      physicalCellCm: combat.battlefield_config?.physicalCellCm ?? 2.5,
      backgroundImageUrl: mediaAsset.public_url,
      backgroundFit: combat.battlefield_config?.backgroundFit ?? 'contain',
      gridOpacity: combat.battlefield_config?.gridOpacity ?? 0.5,
      showGrid: combat.battlefield_config?.showGrid ?? true,
    })
  }

  // Ação do turno: apenas declara/registra; não aplica nenhum efeito automaticamente.
  async function handleRegisterTurnAction() {
    if (!combat || !actingParticipant || !user) return

    setTurnActionSubmitting(true)
    const supabase = createClient()

    const content = `${actingParticipant.name} declarou ação: ${turnActionType}` +
      (turnActionNote.trim() ? ` — ${turnActionNote.trim()}` : '.')

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'combat_action_declared',
      content,
      event_metadata: {
        action: turnActionType,
        note: turnActionNote.trim() || null,
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
      },
    })
    setTurnActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar ação", description: error.message })
      return
    }

    toast({ title: "Ação registrada", description: content })
    setTurnActionNote("")
    await loadCombat()
  }

  // TAREFA 2-6: seleciona uma ação resolvida (ataque/magia/item) e limpa rolagens anteriores.
  function handleSelectAction(action: ResolvedAction) {
    setSelectedAction(action)
    setActionRoll(null)
    setActionDamageRoll(null)
    setSaveRequestResult(null)
  }

  // TAREFA 4: rola 1d20 + bônus de ataque da ação selecionada contra a CA do alvo.
  // Apenas registra a rolagem (dice_rolls + scene_event); não aplica dano.
  async function handleRollAction() {
    if (!combat || !actingParticipant || !user || !selectedAction || selectedAction.attackBonus === null) return

    setActionRollSubmitting(true)
    const supabase = createClient()

    const result = calculateAttackTotal(selectedAction.attackBonus)
    const target = participants.find(p => p.id === actionTargetId) || null
    const outcome = getAttackOutcome(result, target?.armor_class ?? null)
    const bonus = selectedAction.attackBonus
    const formula = `1d20${bonus >= 0 ? '+' : ''}${bonus}`

    const { error: rollError } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: combat.session_id ?? activeSession?.id ?? null,
      scene_id: combat.scene_id ?? activeScene?.id ?? null,
      character_id: actingParticipant.character_id,
      user_id: user.uid,
      roll_type: 'attack',
      formula,
      raw_result: result.roll,
      modifier: bonus,
      total: result.total,
      reason: target ? `${selectedAction.name} contra ${target.name}` : selectedAction.name,
      visibility: 'scene',
    })

    if (rollError) {
      setActionRollSubmitting(false)
      toast({ variant: "destructive", title: "Erro ao registrar rolagem", description: rollError.message })
      return
    }

    let content = `${actingParticipant.name} atacou com ${selectedAction.name}`
    if (target) content += ` contra ${target.name}`
    content += `: ${result.total}`
    if (target?.armor_class !== null && target?.armor_class !== undefined) {
      content += ` vs CA ${target.armor_class}`
    }
    content += ` — ${ATTACK_OUTCOME_LABEL[outcome]}.`

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'attack_roll',
      content,
      event_metadata: {
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
        target_participant_id: target?.id ?? null,
        action: selectedAction.name,
        roll: result.roll,
        bonus,
        total: result.total,
        target_ac: target?.armor_class ?? null,
        outcome,
      },
    })
    setActionRollSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar evento", description: error.message })
      return
    }

    setActionRoll({ roll: result.roll, total: result.total, outcome })
    setActionDamageRoll(null)
    toast({ title: "Ataque rolado", description: content })
    await loadCombat()
  }

  // TAREFA 5: rola o dano sugerido para a ação selecionada (dobra dados em crítico).
  function handleRollDamage() {
    if (!selectedAction?.damageFormula) return
    const critical = actionRoll?.outcome === 'critical_hit'
    const result = rollDamageFormula(selectedAction.damageFormula, critical)
    if (!result) {
      toast({
        variant: "destructive",
        title: "Fórmula de dano inválida",
        description: `Use o formato NdM ou NdM+K (ex.: 1d8+2). Recebido: "${selectedAction.damageFormula}".`,
      })
      return
    }
    setActionDamageRoll({ total: result.total, critical })
  }

  // TAREFA 5: mestre confirma e aplica o dano/cura sugerido ao alvo selecionado.
  async function handleApplyActionEffect() {
    if (!isMaster || !combat || !selectedAction || !actionDamageRoll || !actionTargetId) return

    const target = participants.find(p => p.id === actionTargetId)
    if (!target) return

    setActionDamageSubmitting(true)
    const supabase = createClient()
    const isHealing = selectedAction.damageType === 'cura'

    const { error } = isHealing
      ? await supabase.rpc('apply_combat_healing', {
          target_participant_id: target.id,
          amount: actionDamageRoll.total,
        })
      : await supabase.rpc('apply_combat_damage', {
          target_participant_id: target.id,
          amount: actionDamageRoll.total,
          damage_type: selectedAction.damageType ?? null,
        })

    setActionDamageSubmitting(false)

    if (error) {
      toast({
        variant: "destructive",
        title: isHealing ? "Erro ao aplicar cura" : "Erro ao aplicar dano",
        description: error.message,
      })
      return
    }

    toast({
      title: isHealing ? "Cura aplicada" : "Dano aplicado",
      description: `${target.name} ${isHealing ? 'recuperou' : 'recebeu'} ${actionDamageRoll.total}` +
        (selectedAction.damageType && selectedAction.damageType !== 'cura' ? ` (${selectedAction.damageType})` : '') + '.',
    })
    setActionDamageRoll(null)
    setActionRoll(null)
    setSelectedAction(null)
    await loadCombat()
  }

  // TAREFA 6: rola o teste de resistência do alvo (d20 + bônus da ficha) contra a CD da magia/habilidade.
  async function handleRequestSavingThrow() {
    if (!combat || !actingParticipant || !user || !selectedAction?.saveAbility || selectedAction.saveDC === null || selectedAction.saveDC === undefined || !actionTargetId) return

    const target = participants.find(p => p.id === actionTargetId)
    if (!target) return

    setSaveRequestSubmitting(true)
    const supabase = createClient()

    const ability = selectedAction.saveAbility
    const targetSheet = target.character_id ? characterSheets[target.character_id] : null
    const savingThrowBonus = targetSheet?.saving_throws?.[ability]
    const bonus = typeof savingThrowBonus === 'number' ? savingThrowBonus : getAbilityMod(targetSheet, ability)

    const roll = rollD20()
    const total = roll + bonus
    const dc = selectedAction.saveDC
    const success = total >= dc
    const formula = `1d20${bonus >= 0 ? '+' : ''}${bonus}`

    const { error: rollError } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: combat.session_id ?? activeSession?.id ?? null,
      scene_id: combat.scene_id ?? activeScene?.id ?? null,
      character_id: target.character_id,
      user_id: user.uid,
      roll_type: 'saving_throw',
      formula,
      raw_result: roll,
      modifier: bonus,
      total,
      reason: `Teste de ${ABILITY_KEY_LABEL[ability]} contra ${selectedAction.name} (CD ${dc})`,
      visibility: 'scene',
    })

    if (rollError) {
      setSaveRequestSubmitting(false)
      toast({ variant: "destructive", title: "Erro ao registrar rolagem", description: rollError.message })
      return
    }

    const content = `${target.name} ${success ? 'passou' : 'falhou'} no teste de ${ABILITY_KEY_LABEL[ability]} contra ${selectedAction.name} (CD ${dc}): ${total}.`

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'saving_throw',
      content,
      event_metadata: {
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
        target_participant_id: target.id,
        ability,
        dc,
        roll,
        bonus,
        total,
        outcome: success ? 'success' : 'failure',
        source_action: selectedAction.name,
      },
    })
    setSaveRequestSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar evento", description: error.message })
      return
    }

    setSaveRequestResult({ roll, total, dc, success })
    toast({ title: "Teste de resistência registrado", description: content })
    await loadCombat()
  }

  // Aba Itens: registra a intenção de uso (mestre aplica dano/cura manualmente, se houver).
  async function handleUseItem(action: ResolvedAction) {
    if (!combat || !actingParticipant || !user) return

    setActionRollSubmitting(true)
    const supabase = createClient()
    const content = `${actingParticipant.name} usou ${action.name}.`

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'combat_action_declared',
      content,
      event_metadata: {
        action: action.name,
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
        item_id: action.itemId ?? null,
      },
    })
    setActionRollSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar uso do item", description: error.message })
      return
    }

    toast({ title: "Item usado", description: content })
    await loadCombat()
  }

  // TAREFA 8-9: mestre adiciona um personagem da campanha ao combate em
  // andamento. Iniciativa manual (opcional) ou rolada automaticamente pela RPC.
  async function handleAddCharacterParticipant(characterId: string) {
    if (!combat) return

    setAddingCharacterId(characterId)
    const supabase = createClient()

    const rawInitiative = addInitiativeByCharacter[characterId]?.trim()
    const initiative = rawInitiative ? parseInt(rawInitiative, 10) : null

    const { error } = await supabase.rpc('add_combat_character_participant', {
      p_combat_id: combat.id,
      p_character_id: characterId,
      p_initiative: initiative !== null && !isNaN(initiative) ? initiative : null,
    })

    setAddingCharacterId(null)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar personagem", description: error.message })
      return
    }

    toast({ title: "Personagem adicionado ao combate" })
    setAddInitiativeByCharacter(prev => ({ ...prev, [characterId]: "" }))
    await loadCombat()
  }

  // TAREFA 8-9: mestre adiciona um NPC da campanha como NPC/aliado/inimigo.
  // PV/CA podem ser preenchidos depois via "Gerenciar".
  async function handleAddNpcParticipant(npcId: string) {
    if (!combat) return

    setAddingNpcId(npcId)
    const supabase = createClient()

    const rawInitiative = addInitiativeByNpc[npcId]?.trim()
    const initiative = rawInitiative ? parseInt(rawInitiative, 10) : null
    const participantType = addNpcTypeById[npcId] || 'npc'

    const { error } = await supabase.rpc('add_combat_npc_participant', {
      p_combat_id: combat.id,
      p_npc_id: npcId,
      p_participant_type: participantType,
      p_initiative: initiative !== null && !isNaN(initiative) ? initiative : null,
    })

    setAddingNpcId(null)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar NPC", description: error.message })
      return
    }

    toast({ title: "NPC adicionado ao combate" })
    setAddInitiativeByNpc(prev => ({ ...prev, [npcId]: "" }))
    await loadCombat()
  }

  // TAREFA 8-9: mestre cria um inimigo surpresa direto no combate (sem NPC prévio).
  async function handleAddSurpriseEnemy() {
    if (!combat) return

    const name = surpriseName.trim()
    if (!name) {
      toast({ variant: "destructive", title: "Informe o nome do inimigo surpresa" })
      return
    }

    const currentHp = parseInt(surpriseCurrentHp, 10)
    const maxHp = parseInt(surpriseMaxHp, 10)
    const armorClass = parseInt(surpriseArmorClass, 10)
    const initiative = parseInt(surpriseInitiative, 10)

    if (isNaN(currentHp) || isNaN(maxHp) || isNaN(armorClass) || isNaN(initiative)) {
      toast({ variant: "destructive", title: "Preencha PV atual, PV máximo, CA e iniciativa" })
      return
    }

    setSurpriseSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.rpc('add_combat_surprise_enemy', {
      p_combat_id: combat.id,
      p_name: name,
      p_current_hp: currentHp,
      p_max_hp: maxHp,
      p_armor_class: armorClass,
      p_initiative: initiative,
    })

    setSurpriseSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar inimigo surpresa", description: error.message })
      return
    }

    toast({ title: "Inimigo surpresa adicionado ao combate" })
    setSurpriseName("")
    setSurpriseCurrentHp("")
    setSurpriseMaxHp("")
    setSurpriseArmorClass("")
    setSurpriseInitiative("")
    await loadCombat()
  }

  // Cria zonas + conexões a partir de um modelo pré-definido (master-only via RPCs).
  async function handleCreateBattlefield() {
    if (!combat) return
    const template = BATTLEFIELD_TEMPLATES.find(t => t.key === battlefieldTemplate)
    if (!template) return

    setBattlefieldSubmitting(true)
    const supabase = createClient()
    const zoneIds: string[] = []

    for (const zoneDef of template.zones) {
      const { data, error } = await supabase.rpc('create_combat_zone', {
        target_combat_id: combat.id,
        zone_name: zoneDef.name,
        zone_description: zoneDef.description ?? null,
        pos_x: zoneDef.x,
        pos_y: zoneDef.y,
      })

      if (error || !data) {
        setBattlefieldSubmitting(false)
        toast({ variant: "destructive", title: "Erro ao criar zona", description: error?.message })
        return
      }
      zoneIds.push((data as CombatZone).id)
    }

    for (const [fromIdx, toIdx, distanceLabel] of template.links) {
      await supabase.rpc('link_combat_zones', {
        target_combat_id: combat.id,
        from_zone: zoneIds[fromIdx],
        to_zone: zoneIds[toIdx],
        distance_label: distanceLabel,
        movement_cost: 1,
      })
    }

    setBattlefieldSubmitting(false)
    toast({ title: "Campo de batalha criado", description: template.label })
    setBattlefieldOpen(false)
    await loadCombat()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050711]">
        <p className="text-muted-foreground font-heading italic">Carregando combate...</p>
      </div>
    )
  }

  // ---- Painel: Campo de Batalha -------------------------------------------
  const battlefieldConfig = combat?.battlefield_config || null
  const isGridMode = combat?.battlefield_mode === 'grid' && !!battlefieldConfig?.width && !!battlefieldConfig?.height
  const isZonesConfigured = zones.length > 0

  const positionedTokens = participants.filter(p => p.grid_x !== null && p.grid_y !== null)
  const unpositionedTokens = participants.filter(p => p.grid_x === null || p.grid_y === null)

  const measureA = positionedTokens.find(p => p.id === measureTokenA)
  const measureB = positionedTokens.find(p => p.id === measureTokenB)
  let measureResult: { cells: number; feet: number; meters: number } | null = null
  if (measureA && measureB && measureA.id !== measureB.id) {
    const cells = Math.max(Math.abs((measureA.grid_x ?? 0) - (measureB.grid_x ?? 0)), Math.abs((measureA.grid_y ?? 0) - (measureB.grid_y ?? 0)))
    measureResult = { cells, feet: cells * 5, meters: cells * (battlefieldConfig?.cellMeters ?? 1.5) }
  }

  const selectedGridParticipant = participants.find(p => p.id === selectedGridTokenId) || null
  const zoomPercent = Math.round((gridCellSize / DEFAULT_GRID_CELL_SIZE) * 100)

  const campoPanel = combat && (
    <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-accent" />
          Campo de Batalha
        </h2>
        <Badge
          variant="outline"
          className={`text-[10px] uppercase tracking-widest ${isGridMode ? 'border-primary/40 text-primary' : 'border-accent/40 text-accent'}`}
        >
          Modo: {isGridMode ? 'Grid Tático D&D' : 'Zonas Narrativas'}
        </Badge>
        {isGridMode && battlefieldConfig?.backgroundImageUrl && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            Imagem ativa
          </Badge>
        )}
      </div>

      {isGridMode ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground font-heading uppercase tracking-widest">
          <span>{battlefieldConfig?.width ?? DEFAULT_GRID_WIDTH} x {battlefieldConfig?.height ?? DEFAULT_GRID_HEIGHT} células</span>
          <span className="opacity-40">·</span>
          <span>1 célula = 5ft / 1,5m</span>
          <span className="opacity-40">·</span>
          <span>Tokens posicionados: {positionedTokens.length}/{participants.length}</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-heading italic">
          Você está usando zonas narrativas. Ideal para combate rápido.
        </p>
      )}

      {isMaster && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleUseZones}
            variant={!isGridMode ? 'default' : 'outline'}
            size="sm"
            className="rounded-full border-accent/30"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Usar Zonas
          </Button>
          <Button
            onClick={openGridSetup}
            variant={isGridMode ? 'default' : 'outline'}
            size="sm"
            className="rounded-full border-primary/30"
          >
            <Grid3x3 className="h-3 w-3 mr-1" />
            Usar Grid Tático
          </Button>
          {isGridMode ? (
            <>
              <Button onClick={openGridSetup} variant="outline" size="sm" className="rounded-full border-primary/30 text-primary">
                <Grid3x3 className="h-3 w-3 mr-1" />
                Ajustar Grid
              </Button>
              <R2ImageUpload
                campaignId={campaignId}
                usageType="battlefield_map"
                visibility="party"
                label={battlefieldConfig?.backgroundImageUrl ? "Trocar Imagem" : "Imagem de Fundo"}
                mode="direct"
                entityType="combat"
                entityId={combat.id}
                onUploaded={handleBattlefieldImageUploaded}
              />
            </>
          ) : (
            <Button onClick={() => setBattlefieldOpen(true)} variant="outline" size="sm" className="rounded-full border-accent/30 text-accent">
              <Plus className="h-3 w-3 mr-1" />
              Criar/Editar Zonas
            </Button>
          )}
        </div>
      )}

      {isGridMode && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGridCenterView} variant="outline" size="sm" className="rounded-full border-primary/20">
            <Crosshair className="h-3 w-3 mr-1" />
            Centralizar
          </Button>
          <Button onClick={handleGridZoomOut} variant="outline" size="sm" className="rounded-full border-primary/20" aria-label="Diminuir zoom">
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground font-heading w-12 text-center">{zoomPercent}%</span>
          <Button onClick={handleGridZoomIn} variant="outline" size="sm" className="rounded-full border-primary/20" aria-label="Aumentar zoom">
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button onClick={handleGridResetView} variant="outline" size="sm" className="rounded-full border-primary/20">
            <RotateCcw className="h-3 w-3 mr-1" />
            Resetar Visão
          </Button>
        </div>
      )}

      {isGridMode ? (
        <>
          {unpositionedTokens.length > 0 && (
            <div className="space-y-1 rounded-xl border border-accent/20 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Participantes não posicionados</p>
              <div className="flex flex-wrap gap-2">
                {unpositionedTokens.map((p) => (
                  isMaster ? (
                    <Button
                      key={p.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedGridTokenId(selectedGridTokenId === p.id ? null : p.id)}
                      className={`rounded-full text-[10px] ${selectedGridTokenId === p.id ? 'border-accent text-accent' : 'border-primary/20'}`}
                    >
                      {selectedGridTokenId === p.id ? `Selecionado: ${p.name}` : `Posicionar ${p.name}`}
                    </Button>
                  ) : (
                    <Badge key={p.id} variant="outline" className="text-[10px] border-primary/20">{p.name}</Badge>
                  )
                ))}
              </div>
            </div>
          )}

          {isMaster && selectedGridParticipant && (
            <p className="text-xs text-accent font-heading italic">
              Movendo {selectedGridParticipant.name} — clique em uma célula do grid para posicionar.
            </p>
          )}

          <div ref={gridScrollRef} className="w-full overflow-auto rounded-2xl border border-primary/10 bg-black/30 max-h-[60vh] md:max-h-[70vh]">
            <div className="flex w-full justify-center p-2">
              <BattlefieldGrid
                config={battlefieldConfig!}
                participants={positionedTokens}
                avatarByParticipantId={participantAvatars}
                isMaster={isMaster}
                selectedTokenId={selectedGridTokenId}
                onSelectToken={setSelectedGridTokenId}
                onMoveToken={(x, y) => selectedGridTokenId && handleMoveParticipantGrid(selectedGridTokenId, x, y)}
                cellSize={gridCellSize}
              />
            </div>
          </div>

          {positionedTokens.length >= 2 && (
            <div className="space-y-2 rounded-xl border border-primary/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Medir Distância</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={measureTokenA} onValueChange={setMeasureTokenA}>
                  <SelectTrigger className="bg-black/30 border-primary/20 text-xs">
                    <SelectValue placeholder="Token A" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionedTokens.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={measureTokenB} onValueChange={setMeasureTokenB}>
                  <SelectTrigger className="bg-black/30 border-primary/20 text-xs">
                    <SelectValue placeholder="Token B" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionedTokens.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {measureResult && (
                <p className="text-sm font-display font-bold text-accent text-center">
                  {measureResult.cells} célula{measureResult.cells !== 1 ? 's' : ''} · {measureResult.feet} ft · {measureResult.meters.toFixed(1)} m
                </p>
              )}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground font-heading italic space-y-1">
            <p>O mestre valida deslocamento, terreno difícil e alcance.</p>
            {isMaster ? (
              <p>Clique em um token ou em "Posicionar" para selecioná-lo e depois em uma célula para movê-lo.</p>
            ) : (
              <p>Apenas o mestre pode mover tokens. Use os controles de zoom para navegar pelo mapa.</p>
            )}
          </div>
        </>
      ) : isZonesConfigured ? (
        <>
          {isMaster && (
            <p className="text-xs text-primary font-heading italic">
              Este combate usa zonas narrativas. Para usar mapa com imagem e quadrados, clique em "Usar Grid Tático".
            </p>
          )}
          <div
            className="relative w-full h-72 md:h-96 rounded-[1.5rem] border border-primary/10 overflow-hidden bg-gradient-to-br from-primary/5 via-black/40 to-accent/5"
            style={combat.metadata?.battlefield_image_url ? {
              backgroundImage: `url(${combat.metadata.battlefield_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {zoneLinks.map((link) => {
                const from = zones.find(z => z.id === link.from_zone_id)
                const to = zones.find(z => z.id === link.to_zone_id)
                if (!from || !to) return null
                return (
                  <line
                    key={link.id}
                    x1={from.position_x}
                    y1={from.position_y}
                    x2={to.position_x}
                    y2={to.position_y}
                    stroke="currentColor"
                    strokeWidth={0.4}
                    className="text-primary/30"
                  />
                )
              })}
            </svg>

            {zones.map((zone) => {
              const occupants = participants.filter(p => p.current_zone_id === zone.id)
              return (
                <div
                  key={zone.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-32 md:w-40 rounded-xl border border-primary/20 bg-black/60 backdrop-blur-sm p-2 space-y-1"
                  style={{ left: `${zone.position_x}%`, top: `${zone.position_y}%` }}
                >
                  <p className="text-[10px] md:text-xs font-display font-bold tracking-tight truncate" title={zone.name}>
                    {zone.name}
                  </p>
                  {zone.difficult_terrain && (
                    <Badge className="text-[8px] bg-accent/20 text-accent border-accent/30">Terreno difícil</Badge>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {occupants.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        title={isMaster ? `Gerenciar / mover ${p.name}` : p.name}
                        onClick={() => isMaster && openManage(p)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                          p.participant_type === 'enemy'
                            ? 'border-destructive/40 bg-destructive/20 text-destructive'
                            : 'border-primary/40 bg-primary/20 text-primary'
                        } ${isMaster ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-[10px] text-muted-foreground font-heading italic space-y-1">
            <p>Movimento sugerido: 1 zona por deslocamento. O mestre decide o resultado.</p>
            {isMaster && (
              <p>Clique em um participante no mapa para gerenciar/mover (modal "Gerenciar").</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground font-heading italic">
          {isMaster
            ? 'Nenhuma zona criada ainda. Clique em "Criar/Editar Zonas" para montar o campo com zonas narrativas, ou em "Usar Grid Tático" para um mapa com imagem e quadrados.'
            : "O mestre ainda não definiu o campo de batalha."}
        </p>
      )}
    </Card>
  )

  // ---- Painel: Participantes -----------------------------------------------
  const participantesPanel = combat && (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Participantes
        </h2>
        {isMaster && (
          <Button onClick={() => setAddParticipantOpen(true)} size="sm" variant="outline" className="rounded-full border-primary/30 text-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar ao Combate
          </Button>
        )}
      </div>
      {participants.length === 0 ? (
        <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-8 text-center">
          <p className="text-muted-foreground font-heading italic">Nenhum participante neste combate.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {participants.map((p) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              avatarUrl={participantAvatars[p.id] ?? null}
              npcRole={p.npc_id ? npcSheets[p.npc_id]?.role ?? null : null}
              isMaster={isMaster}
              isCurrentTurn={currentTurnParticipant?.id === p.id}
              zones={zones}
              zoneLinks={zoneLinks}
              currentTurnZoneId={currentTurnZoneId}
              onManage={() => openManage(p)}
              onMakeCurrentTurn={() => handleSetCurrentTurn(p.id)}
              isGridMode={isGridMode}
              isSelectedForMove={isGridMode && selectedGridTokenId === p.id}
              onToggleSelectForMove={() => setSelectedGridTokenId(selectedGridTokenId === p.id ? null : p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )

  // ---- Painel: Ações ---------------------------------------------------------
  // TAREFA 2-6: ações reais da ficha do personagem que está "atuando".
  const actingSheet = actingParticipant?.character_id ? characterSheets[actingParticipant.character_id] ?? null : null
  const actingItems = actingParticipant?.character_id ? characterItems[actingParticipant.character_id] ?? [] : []
  const resolvedAttacks = React.useMemo(() => buildResolvedAttacks(actingSheet, actingItems), [actingSheet, actingItems])
  const resolvedSpells = React.useMemo(() => buildResolvedSpells(actingSheet), [actingSheet])
  const resolvedItems = React.useMemo(() => buildResolvedItems(actingItems), [actingItems])

  // TAREFA 3: alvos vivos (PV nulo ou > 0), com CA/PV/posição para a seleção de alvo.
  const livingTargets = participants.filter(p => p.current_hp === null || p.current_hp > 0)

  // TAREFA 3: seletor de alvo compartilhado pelas abas Ataques/Magias/Itens.
  const targetSelector = (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Alvo</Label>
      <Select value={actionTargetId || "__none__"} onValueChange={(v) => setActionTargetId(v === "__none__" ? "" : v)}>
        <SelectTrigger className="bg-black/30 border-primary/20">
          <SelectValue placeholder="Escolha um alvo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Sem alvo definido</SelectItem>
          {livingTargets.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
              {p.armor_class !== null ? ` · CA ${p.armor_class}` : ''}
              {p.current_hp !== null ? ` · PV ${p.current_hp}${p.max_hp !== null ? `/${p.max_hp}` : ''}` : ''}
              {p.grid_x !== null && p.grid_y !== null ? ` · (${p.grid_x}, ${p.grid_y})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  // TAREFA 2: card de uma ação resolvida (ataque ou magia/habilidade) com botão "Usar".
  function renderActionCard(action: ResolvedAction) {
    const isSelected = selectedAction?.key === action.key
    return (
      <div
        key={action.key}
        className={`rounded-xl border p-3 space-y-1 ${isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 bg-black/20'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading font-bold text-sm">{action.name}</p>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={() => handleSelectAction(action)}
            className="rounded-full h-7 px-3 text-xs shrink-0"
          >
            {isSelected ? "Selecionado" : "Usar"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
          {action.attackBonus !== null && (
            <span>Bônus {action.attackBonus >= 0 ? '+' : ''}{action.attackBonus}</span>
          )}
          {action.damageFormula && (
            <span>Dano {action.damageFormula}{action.damageType ? ` (${action.damageType})` : ''}</span>
          )}
          {action.range && <span>Alcance {action.range}</span>}
          {action.saveAbility && action.saveDC !== null && action.saveDC !== undefined && (
            <span>CD {action.saveDC} {ABILITY_KEY_LABEL[action.saveAbility]}</span>
          )}
          {action.concentration && <span>Concentração</span>}
        </div>
        {action.notes && <p className="text-[10px] text-muted-foreground">{action.notes}</p>}
      </div>
    )
  }

  // TAREFA 2/5: card de item usável — "Usar Item" apenas declara o uso; se houver
  // fórmula de dano/cura, "Rolar efeito" abre o painel de rolagem (sem consumir o item).
  function renderItemCard(action: ResolvedAction) {
    const isSelected = selectedAction?.key === action.key
    return (
      <div
        key={action.key}
        className={`rounded-xl border p-3 space-y-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 bg-black/20'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading font-bold text-sm">{action.name}</p>
          {action.notes && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">{action.notes}</span>
          )}
        </div>
        {(action.damageFormula || action.range) && (
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            {action.damageFormula && (
              <span>
                {action.damageType === 'cura' ? 'Cura' : 'Dano'} {action.damageFormula}
                {action.damageType && action.damageType !== 'cura' ? ` (${action.damageType})` : ''}
              </span>
            )}
            {action.range && <span>Alcance {action.range}</span>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUseItem(action)}
            disabled={actionRollSubmitting}
            className="rounded-full h-7 text-xs border-primary/30 text-primary"
          >
            Usar Item
          </Button>
          {action.damageFormula && (
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => handleSelectAction(action)}
              className="rounded-full h-7 text-xs"
            >
              {isSelected ? "Selecionado" : "Rolar efeito"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // TAREFA 4-6: painel de rolagem da ação selecionada (ataque vs CA, teste de
  // resistência e dano sugerido). Compartilhado pelas abas Ataques/Magias/Itens.
  const actionRollPanel = selectedAction && (
    <div className="rounded-xl border border-primary/20 bg-black/30 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-black text-sm">{selectedAction.name}</p>
        <Button size="sm" variant="ghost" onClick={() => setSelectedAction(null)} className="h-7 px-2 text-xs text-muted-foreground">
          Limpar
        </Button>
      </div>

      {selectedAction.attackBonus !== null && (
        <div className="space-y-2">
          <Button onClick={handleRollAction} disabled={actionRollSubmitting} variant="outline" className="w-full rounded-full border-primary/30 text-primary">
            <Dices className="h-4 w-4 mr-2" />
            Rolar Ataque (1d20{selectedAction.attackBonus >= 0 ? '+' : ''}{selectedAction.attackBonus})
          </Button>
          {actionRoll && (
            <div className="text-center space-y-1">
              <p className="text-2xl font-display font-black">{actionRoll.total}</p>
              <p className={`text-xs font-bold ${actionRoll.outcome === 'hit' || actionRoll.outcome === 'critical_hit' ? 'text-primary' : 'text-destructive'}`}>
                {ATTACK_OUTCOME_LABEL[actionRoll.outcome as keyof typeof ATTACK_OUTCOME_LABEL] ?? actionRoll.outcome}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedAction.saveAbility && selectedAction.saveDC !== null && selectedAction.saveDC !== undefined && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Teste de {ABILITY_KEY_LABEL[selectedAction.saveAbility]} · CD {selectedAction.saveDC}
          </p>
          <Button
            onClick={handleRequestSavingThrow}
            disabled={saveRequestSubmitting || !actionTargetId}
            variant="outline"
            className="w-full rounded-full border-accent/30 text-accent"
          >
            <Shield className="h-4 w-4 mr-2" />
            Solicitar Teste de Resistência
          </Button>
          {saveRequestResult && (
            <div className="text-center space-y-1">
              <p className="text-2xl font-display font-black">{saveRequestResult.total}</p>
              <p className={`text-xs font-bold ${saveRequestResult.success ? 'text-primary' : 'text-destructive'}`}>
                vs CD {saveRequestResult.dc} — {saveRequestResult.success ? 'Sucesso' : 'Falha'}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedAction.damageFormula && (
        <div className="space-y-2">
          <Button onClick={handleRollDamage} variant="outline" className="w-full rounded-full border-destructive/30 text-destructive">
            Rolar {selectedAction.damageType === 'cura' ? 'Cura' : 'Dano'} Sugerido ({selectedAction.damageFormula}
            {selectedAction.damageType && selectedAction.damageType !== 'cura' ? ` ${selectedAction.damageType}` : ''})
          </Button>
          {actionDamageRoll && (
            <div className="text-center space-y-2">
              <p className="text-2xl font-display font-black">
                {actionDamageRoll.total}
                {selectedAction.damageType && selectedAction.damageType !== 'cura' ? ` ${selectedAction.damageType}` : ''}
                {actionDamageRoll.critical && <span className="text-primary"> (crítico!)</span>}
              </p>
              {isMaster ? (
                <Button onClick={handleApplyActionEffect} disabled={actionDamageSubmitting || !actionTargetId} className="w-full btn-ritual rounded-full">
                  Aplicar {selectedAction.damageType === 'cura' ? 'Cura' : 'Dano'} Sugerido
                </Button>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Aguarde o mestre confirmar e aplicar o efeito.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const acoesPanel = combat && (
    <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-4">
      <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Ação do Turno
      </h2>

      {!actingParticipant ? (
        <p className="text-sm text-muted-foreground font-heading italic">
          Seu personagem não está neste combate.
        </p>
      ) : (
        <div className="space-y-4">
          {isMaster && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Atuando como</Label>
              <Select value={actingParticipantId} onValueChange={setActingParticipantId}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Tabs value={actionTab} onValueChange={setActionTab}>
            <TabsList className="grid grid-cols-5 gap-1 bg-black/30">
              <TabsTrigger value="ataques" title="Ataques"><Swords className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="magias" title="Magias/Habilidades"><BookOpen className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="itens" title="Itens"><Backpack className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="movimento" title="Movimento"><Footprints className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="manual" title="Manual"><Wand2 className="h-4 w-4" /></TabsTrigger>
            </TabsList>

            <TabsContent value="ataques" className="pt-3 space-y-3">
              {targetSelector}
              {resolvedAttacks.length === 0 ? (
                <p className="text-xs text-muted-foreground font-heading italic">
                  Nenhum ataque cadastrado na ficha (Ataques/Equipamentos). Preencha na Ficha do personagem.
                </p>
              ) : (
                <div className="space-y-2">{resolvedAttacks.map(renderActionCard)}</div>
              )}
              {selectedAction?.source === "attack" && actionRollPanel}
            </TabsContent>

            <TabsContent value="magias" className="pt-3 space-y-3">
              {targetSelector}
              {resolvedSpells.length === 0 ? (
                <p className="text-xs text-muted-foreground font-heading italic">
                  Nenhuma magia/habilidade cadastrada na ficha. Preencha na Ficha do personagem.
                </p>
              ) : (
                <div className="space-y-2">{resolvedSpells.map(renderActionCard)}</div>
              )}
              {selectedAction?.source === "spell" && actionRollPanel}
            </TabsContent>

            <TabsContent value="itens" className="pt-3 space-y-3">
              {targetSelector}
              {resolvedItems.length === 0 ? (
                <p className="text-xs text-muted-foreground font-heading italic">
                  Nenhum item usável equipado no inventário.
                </p>
              ) : (
                <div className="space-y-2">{resolvedItems.map(renderItemCard)}</div>
              )}
              {selectedAction?.source === "item" && actionRollPanel}
            </TabsContent>

            <TabsContent value="movimento" className="pt-3 space-y-3">
              <div className="rounded-xl border border-primary/10 bg-black/20 p-3 space-y-1">
                <p className="text-sm font-heading">
                  Deslocamento: <span className="font-bold text-primary">{formatSpeed(actingSheet?.speed ?? null)}</span>
                </p>
                <p className="text-sm font-heading">
                  Posição atual:{' '}
                  {actingParticipant.grid_x !== null && actingParticipant.grid_y !== null
                    ? <span className="font-bold text-primary">({actingParticipant.grid_x}, {actingParticipant.grid_y})</span>
                    : 'não posicionado no grid'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Para mover, selecione o token no grid e clique na célula de destino.
              </p>
            </TabsContent>

            <TabsContent value="manual" className="pt-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ação</Label>
                <Select value={turnActionType} onValueChange={setTurnActionType}>
                  <SelectTrigger className="bg-black/30 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TURN_ACTIONS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Descrição (opcional)</Label>
                <Textarea
                  value={turnActionNote}
                  onChange={(e) => setTurnActionNote(e.target.value)}
                  placeholder="Ex.: Ataca o bandido com a espada longa"
                  className="bg-black/30 border-primary/20"
                  rows={2}
                />
              </div>

              <Button onClick={handleRegisterTurnAction} disabled={turnActionSubmitting} className="w-full btn-ritual rounded-full">
                Registrar Ação
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  )

  // ---- Painel: Eventos Recentes ----------------------------------------------
  // Eventos repetidos de "battlefield_configured" são colapsados em uma única
  // entrada (com contador) e a lista exibida é limitada às 5 mais recentes,
  // sem alterar os registros gravados em scene_events.
  const collapsedEvents: (SceneEvent & { _count?: number })[] = []
  for (const event of sceneEvents) {
    const last = collapsedEvents[collapsedEvents.length - 1]
    if (event.event_type === 'battlefield_configured' && last?.event_type === 'battlefield_configured') {
      last._count = (last._count ?? 1) + 1
      continue
    }
    collapsedEvents.push(event.event_type === 'battlefield_configured' ? { ...event, _count: 1 } : event)
  }
  const visibleEvents = collapsedEvents.slice(0, 5)

  const eventosPanel = combat && (
    <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-3">
      <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        Eventos Recentes
      </h2>
      {visibleEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground font-heading italic">Nenhum evento registrado ainda.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {visibleEvents.map((event) => {
            const meta = EVENT_META[event.event_type] || { label: event.event_type, icon: Info, color: "text-muted-foreground" }
            const EventIcon = meta.icon
            return (
              <div key={event.id} className="flex items-start gap-2 rounded-lg border border-primary/5 bg-black/20 p-2">
                <EventIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading">{event.content}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                    {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {meta.label}
                    {event._count && event._count > 1 ? ` (x${event._count})` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )

  return (
    <div className="min-h-screen bg-[#050711] p-6 md:p-10 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px]">
            {combat ? `Rodada ${combat.round_number}` : "Sem combate"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-foreground literary-shadow">
            {combat ? combat.title : "Nenhum combate ativo"}
          </h1>
          {combat && currentTurnParticipant && (
            <p className="text-muted-foreground font-heading italic">
              Turno de <span className="text-primary font-bold">{currentTurnParticipant.name}</span>
              {isMyTurn && (
                <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px] align-middle">
                  É o seu turno!
                </Badge>
              )}
            </p>
          )}
          {!combat && (
            <p className="text-muted-foreground font-heading italic">
              {isMaster
                ? "Inicie um combate para registrar participantes, turnos e rolagens."
                : "Aguardando o mestre iniciar um combate."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!combat && isMaster && (
            <Dialog open={startOpen} onOpenChange={(open) => { setStartOpen(open); if (!open) resetStartForm() }}>
              <DialogTrigger asChild>
                <Button className="btn-ritual rounded-full px-6 shadow-arcane">
                  <Swords className="h-4 w-4 mr-2" />
                  Iniciar Combate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-[#0b0e1c] border-primary/20 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl text-primary">Iniciar Combate</DialogTitle>
                  <DialogDescription>
                    Selecione os participantes e defina a iniciativa de cada um.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="combat-title">Título do combate</Label>
                    <Input
                      id="combat-title"
                      value={combatTitle}
                      onChange={(e) => setCombatTitle(e.target.value)}
                      placeholder="Ex.: Emboscada nas Docas"
                      className="bg-black/30 border-primary/20"
                    />
                  </div>

                  {campaignCharacters.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-primary uppercase text-[10px] tracking-widest">Personagens</Label>
                      <div className="space-y-2">
                        {campaignCharacters.map((c) => {
                          const sel = selectedCharacters[c.id]
                          const incomplete = c.max_hp === null || c.current_hp === null || c.armor_class === null
                          return (
                            <div key={c.id} className="rounded-xl border border-primary/10 p-3 space-y-2">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={!!sel?.selected}
                                  onCheckedChange={(checked) => setSelectedCharacters(prev => ({
                                    ...prev,
                                    [c.id]: { ...prev[c.id], selected: !!checked, initiative: prev[c.id]?.initiative || "" },
                                  }))}
                                />
                                <span className="flex-1 font-heading">{c.name}</span>
                                {incomplete && (
                                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[9px] uppercase tracking-widest gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Ficha incompleta
                                  </Badge>
                                )}
                                <Input
                                  type="number"
                                  placeholder="Iniciativa"
                                  value={sel?.initiative || ""}
                                  onChange={(e) => setSelectedCharacters(prev => ({
                                    ...prev,
                                    [c.id]: { ...prev[c.id], selected: prev[c.id]?.selected || false, initiative: e.target.value },
                                  }))}
                                  className="w-28 bg-black/30 border-primary/20"
                                />
                              </div>
                              {incomplete && sel?.selected && (
                                <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                  <p className="text-[10px] text-amber-300/90">
                                    Personagem com ficha incompleta. Preencha PV/CA manualmente para este combate ou peça ao jogador para usar &quot;Configurar Ficha Inicial&quot; na Ficha.
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="PV atual"
                                      value={sel?.overrideCurrentHp || ""}
                                      onChange={(e) => setSelectedCharacters(prev => ({
                                        ...prev,
                                        [c.id]: { ...prev[c.id], overrideCurrentHp: e.target.value },
                                      }))}
                                      className="bg-black/30 border-amber-500/20"
                                      disabled={c.current_hp !== null}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="PV máximo"
                                      value={sel?.overrideMaxHp || ""}
                                      onChange={(e) => setSelectedCharacters(prev => ({
                                        ...prev,
                                        [c.id]: { ...prev[c.id], overrideMaxHp: e.target.value },
                                      }))}
                                      className="bg-black/30 border-amber-500/20"
                                      disabled={c.max_hp !== null}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="CA"
                                      value={sel?.overrideArmorClass || ""}
                                      onChange={(e) => setSelectedCharacters(prev => ({
                                        ...prev,
                                        [c.id]: { ...prev[c.id], overrideArmorClass: e.target.value },
                                      }))}
                                      className="bg-black/30 border-amber-500/20"
                                      disabled={c.armor_class !== null}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {campaignNpcs.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-primary uppercase text-[10px] tracking-widest">NPCs</Label>
                      <div className="space-y-2">
                        {campaignNpcs.map((n) => (
                          <div key={n.id} className="flex items-center gap-3 rounded-xl border border-primary/10 p-3">
                            <Checkbox
                              checked={!!selectedNpcs[n.id]?.selected}
                              onCheckedChange={(checked) => setSelectedNpcs(prev => ({
                                ...prev,
                                [n.id]: { selected: !!checked, initiative: prev[n.id]?.initiative || "" },
                              }))}
                            />
                            <span className="flex-1 font-heading">{n.name}</span>
                            <Input
                              type="number"
                              placeholder="Iniciativa"
                              value={selectedNpcs[n.id]?.initiative || ""}
                              onChange={(e) => setSelectedNpcs(prev => ({
                                ...prev,
                                [n.id]: { selected: prev[n.id]?.selected || false, initiative: e.target.value },
                              }))}
                              className="w-28 bg-black/30 border-primary/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-primary uppercase text-[10px] tracking-widest">Inimigos manuais</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addManualEnemy} className="border-primary/30">
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {manualEnemies.map((enemy) => (
                        <div key={enemy.localId} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-primary/10 p-3">
                          <Input
                            placeholder="Nome"
                            value={enemy.name}
                            onChange={(e) => updateManualEnemy(enemy.localId, 'name', e.target.value)}
                            className="col-span-4 bg-black/30 border-primary/20"
                          />
                          <Input
                            type="number"
                            placeholder="PV atual"
                            value={enemy.current_hp}
                            onChange={(e) => updateManualEnemy(enemy.localId, 'current_hp', e.target.value)}
                            className="col-span-2 bg-black/30 border-primary/20"
                          />
                          <Input
                            type="number"
                            placeholder="PV máx"
                            value={enemy.max_hp}
                            onChange={(e) => updateManualEnemy(enemy.localId, 'max_hp', e.target.value)}
                            className="col-span-2 bg-black/30 border-primary/20"
                          />
                          <Input
                            type="number"
                            placeholder="CA"
                            value={enemy.armor_class}
                            onChange={(e) => updateManualEnemy(enemy.localId, 'armor_class', e.target.value)}
                            className="col-span-1 bg-black/30 border-primary/20"
                          />
                          <Input
                            type="number"
                            placeholder="Iniciativa"
                            value={enemy.initiative}
                            onChange={(e) => updateManualEnemy(enemy.localId, 'initiative', e.target.value)}
                            className="col-span-2 bg-black/30 border-primary/20"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeManualEnemy(enemy.localId)} className="col-span-1 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleStartCombat} disabled={startSubmitting} className="btn-ritual rounded-full px-8">
                    {startSubmitting ? "Iniciando..." : "Confirmar e Iniciar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {combat && isMaster && (
            <>
              <Button
                onClick={handleAdvanceTurn}
                disabled={turnSubmitting}
                variant="outline"
                className="rounded-full border-primary/30 text-primary"
              >
                <ChevronsRight className="h-4 w-4 mr-2" />
                Finalizar Turno
              </Button>
              <Button
                onClick={handleEndCombat}
                disabled={endSubmitting}
                variant="outline"
                className="rounded-full border-destructive/40 text-destructive"
              >
                <Flag className="h-4 w-4 mr-2" />
                Encerrar Combate
              </Button>
            </>
          )}

          <Button variant="outline" disabled title="Em desenvolvimento" className="rounded-full border-accent/30 text-accent/60">
            <Sparkles className="h-4 w-4 mr-2" />
            Narrar Resultado
          </Button>
        </div>
      </div>

      {/* Linha de iniciativa */}
      {combat && participants.length > 0 && (
        <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-4 overflow-x-auto">
          <div className="flex gap-3">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border min-w-[100px] transition-all ${
                  i === combat.current_turn_index
                    ? 'border-primary bg-primary/10 oracle-glow'
                    : 'border-primary/10 bg-black/20'
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display font-bold">
                  Iniciativa {p.initiative ?? "—"}
                </span>
                <span className="font-heading font-bold text-sm truncate max-w-[120px]">{p.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!combat && (
        <Card className="bg-card/40 border-primary/10 rounded-[2.5rem] p-12 text-center">
          <Swords className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-heading italic text-lg">
            {isMaster
              ? "Nenhum combate em andamento. Use \"Iniciar Combate\" para começar."
              : "Aguardando o mestre iniciar um combate."}
          </p>
        </Card>
      )}

      {combat && (
        <>
          {/* Layout em abas para telas pequenas */}
          <div className="lg:hidden">
            <Tabs defaultValue="participantes" className="w-full">
              <TabsList className="grid grid-cols-4 gap-1 bg-black/30">
                <TabsTrigger value="campo">Campo</TabsTrigger>
                <TabsTrigger value="participantes">Participantes</TabsTrigger>
                <TabsTrigger value="acoes">Ações</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
              </TabsList>
              <TabsContent value="campo" className="pt-4">{campoPanel}</TabsContent>
              <TabsContent value="participantes" className="pt-4">{participantesPanel}</TabsContent>
              <TabsContent value="acoes" className="pt-4">{acoesPanel}</TabsContent>
              <TabsContent value="eventos" className="pt-4">{eventosPanel}</TabsContent>
            </Tabs>
          </div>

          {/* Layout em grade para telas grandes */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {campoPanel}
              {participantesPanel}
            </div>
            <div className="space-y-6">
              {acoesPanel}
              {eventosPanel}
            </div>
          </div>
        </>
      )}

      {/* Modal de gerenciamento do participante (mestre) */}
      <Dialog open={!!manageParticipant} onOpenChange={(open) => { if (!open) setManageParticipant(null) }}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">{manageParticipant?.name}</DialogTitle>
            <DialogDescription>
              PV: {manageParticipant?.current_hp ?? "—"} / {manageParticipant?.max_hp ?? "—"} · CA: {manageParticipant?.armor_class ?? "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-destructive"><Skull className="h-4 w-4" /> Aplicar dano</Label>
              <div className="flex gap-2">
                <Input type="number" value={damageAmount} onChange={(e) => setDamageAmount(e.target.value)} placeholder="Quantidade" className="bg-black/30 border-primary/20" />
                <Input value={damageType} onChange={(e) => setDamageType(e.target.value)} placeholder="Tipo (opcional)" className="bg-black/30 border-primary/20" />
                <Button onClick={handleApplyDamage} disabled={actionSubmitting} variant="outline" className="border-destructive/40 text-destructive whitespace-nowrap">
                  Aplicar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary"><Heart className="h-4 w-4" /> Aplicar cura</Label>
              <div className="flex gap-2">
                <Input type="number" value={healAmount} onChange={(e) => setHealAmount(e.target.value)} placeholder="Quantidade" className="bg-black/30 border-primary/20" />
                <Button onClick={handleApplyHealing} disabled={actionSubmitting} variant="outline" className="border-primary/40 text-primary whitespace-nowrap">
                  Aplicar
                </Button>
              </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-accent"><ShieldPlus className="h-4 w-4" /> Condições</Label>

              {(manageParticipant?.conditions || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(manageParticipant?.conditions || []).map((c) => (
                    <Badge key={c.key} className="text-[9px] bg-accent/20 text-accent border-accent/30 flex items-center gap-1 pr-1">
                      <span title={[c.source, c.duration, c.save, c.notes].filter(Boolean).join(' · ') || undefined}>{c.label}</span>
                      <button type="button" onClick={() => handleRemoveCondition(c.key)} className="hover:text-destructive" aria-label={`Remover ${c.label}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Select value={conditionKey} onValueChange={setConditionKey}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue placeholder="Escolha uma condição oficial" />
                </SelectTrigger>
                <SelectContent>
                  {DND_CONDITIONS.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={conditionSource} onChange={(e) => setConditionSource(e.target.value)} placeholder="Origem (ex.: Mordida de criatura)" className="bg-black/30 border-primary/20" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={conditionDuration} onChange={(e) => setConditionDuration(e.target.value)} placeholder="Duração (ex.: 1 minuto)" className="bg-black/30 border-primary/20" />
                <Input value={conditionSave} onChange={(e) => setConditionSave(e.target.value)} placeholder="Resistência (ex.: CON CD 12)" className="bg-black/30 border-primary/20" />
              </div>
              <Textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="Efeito (ex.: Desvantagem em ataques)" className="bg-black/30 border-primary/20" rows={2} />
              <Button onClick={handleApplyCondition} disabled={actionSubmitting || !conditionKey} variant="outline" className="w-full border-accent/40 text-accent">
                Aplicar Condição
              </Button>
            </div>

            {manageParticipant?.character_id && manageParticipant?.current_hp === 0 && (
              <>
                <Separator className="bg-primary/10" />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-destructive"><Activity className="h-4 w-4" /> Testes contra a morte</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground">Sucessos (0-3)</span>
                      <Input type="number" min={0} max={3} value={deathSuccesses} onChange={(e) => setDeathSuccesses(e.target.value)} className="bg-black/30 border-primary/20" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground">Falhas (0-3)</span>
                      <Input type="number" min={0} max={3} value={deathFailures} onChange={(e) => setDeathFailures(e.target.value)} className="bg-black/30 border-primary/20" />
                    </div>
                  </div>
                  <Button onClick={handleUpdateDeathSaves} disabled={actionSubmitting} variant="outline" className="w-full border-destructive/40 text-destructive">
                    Salvar Testes contra a Morte
                  </Button>
                </div>
              </>
            )}

            <Separator className="bg-primary/10" />

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary"><Wand2 className="h-4 w-4" /> Concentração</Label>
              <div className="flex items-center gap-3">
                <Switch checked={concentrationActive} onCheckedChange={setConcentrationActive} />
                <Input
                  value={concentrationSpell}
                  onChange={(e) => setConcentrationSpell(e.target.value)}
                  placeholder="Magia (ex.: Bênção)"
                  disabled={!concentrationActive}
                  className="bg-black/30 border-primary/20 flex-1"
                />
              </div>
              <Button onClick={handleSetConcentration} disabled={actionSubmitting} variant="outline" className="w-full border-primary/40 text-primary">
                Salvar Concentração
              </Button>
            </div>

            {zones.length > 0 && (
              <>
                <Separator className="bg-primary/10" />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-accent"><MapIcon className="h-4 w-4" /> Posição no Campo de Batalha</Label>
                  <Select value={moveZoneId || "__none__"} onValueChange={(v) => setMoveZoneId(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="bg-black/30 border-primary/20">
                      <SelectValue placeholder="Sem posição definida" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem posição definida</SelectItem>
                      {zones.map(z => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleMoveParticipant} disabled={actionSubmitting} variant="outline" className="w-full border-accent/40 text-accent">
                    Mover
                  </Button>
                </div>
              </>
            )}

            {isGridMode && (
              <>
                <Separator className="bg-primary/10" />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-accent"><Grid3x3 className="h-4 w-4" /> Posição no Grid</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min={0} value={gridMoveX} onChange={(e) => setGridMoveX(e.target.value)} placeholder="X (0-índice)" className="bg-black/30 border-primary/20" />
                    <Input type="number" min={0} value={gridMoveY} onChange={(e) => setGridMoveY(e.target.value)} placeholder="Y (0-índice)" className="bg-black/30 border-primary/20" />
                  </div>
                  <Button onClick={handleMoveParticipantGridFromModal} disabled={actionSubmitting} variant="outline" className="w-full border-accent/40 text-accent">
                    Mover no Grid
                  </Button>
                </div>
              </>
            )}

            <Separator className="bg-primary/10" />

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary"><Grid3x3 className="h-4 w-4" /> Tamanho do Token</Label>
              <Select value={tokenSize} onValueChange={setTokenSize}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_SIZES.map(t => (
                    <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSetTokenSize} disabled={actionSubmitting} variant="outline" className="w-full border-primary/40 text-primary">
                Salvar Tamanho do Token
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal "Adicionar ao Combate" (TAREFA 8-9, somente mestre) */}
      <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
        <DialogContent className="max-w-lg bg-[#0b0e1c] border-primary/20 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Adicionar ao Combate
            </DialogTitle>
            <DialogDescription>
              Adicione personagens, NPCs ou um inimigo surpresa ao combate em andamento.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personagens">
            <TabsList className="grid grid-cols-3 gap-1 bg-black/30">
              <TabsTrigger value="personagens">Personagens</TabsTrigger>
              <TabsTrigger value="npcs">NPCs</TabsTrigger>
              <TabsTrigger value="surpresa">Inimigo Surpresa</TabsTrigger>
            </TabsList>

            <TabsContent value="personagens" className="pt-3 space-y-2">
              {(() => {
                const inCombatIds = new Set(participants.map(p => p.character_id).filter((id): id is string => !!id))
                const available = campaignCharacters.filter(c => !inCombatIds.has(c.id))
                if (available.length === 0) {
                  return <p className="text-sm text-muted-foreground font-heading italic">Todos os personagens da campanha já estão no combate.</p>
                }
                return available.map((c) => (
                  <div key={c.id} className="rounded-xl border border-primary/10 p-3 flex items-center gap-3">
                    <span className="flex-1 font-heading">{c.name}</span>
                    <Input
                      type="number"
                      placeholder="Iniciativa (auto)"
                      value={addInitiativeByCharacter[c.id] || ""}
                      onChange={(e) => setAddInitiativeByCharacter(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-32 bg-black/30 border-primary/20"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddCharacterParticipant(c.id)}
                      disabled={addingCharacterId === c.id}
                      className="rounded-full btn-ritual"
                    >
                      Adicionar
                    </Button>
                  </div>
                ))
              })()}
            </TabsContent>

            <TabsContent value="npcs" className="pt-3 space-y-2">
              {(() => {
                const inCombatIds = new Set(participants.map(p => p.npc_id).filter((id): id is string => !!id))
                const available = campaignNpcs.filter(n => !inCombatIds.has(n.id))
                if (available.length === 0) {
                  return <p className="text-sm text-muted-foreground font-heading italic">Todos os NPCs da campanha já estão no combate.</p>
                }
                return available.map((n) => (
                  <div key={n.id} className="rounded-xl border border-primary/10 p-3 flex flex-wrap items-center gap-2">
                    <span className="flex-1 font-heading min-w-[100px]">{n.name}</span>
                    <Select
                      value={addNpcTypeById[n.id] || "npc"}
                      onValueChange={(v) => setAddNpcTypeById(prev => ({ ...prev, [n.id]: v }))}
                    >
                      <SelectTrigger className="w-32 bg-black/30 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="npc">NPC</SelectItem>
                        <SelectItem value="ally">Aliado</SelectItem>
                        <SelectItem value="enemy">Inimigo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Iniciativa"
                      value={addInitiativeByNpc[n.id] || ""}
                      onChange={(e) => setAddInitiativeByNpc(prev => ({ ...prev, [n.id]: e.target.value }))}
                      className="w-24 bg-black/30 border-primary/20"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddNpcParticipant(n.id)}
                      disabled={addingNpcId === n.id}
                      className="rounded-full btn-ritual"
                    >
                      Adicionar
                    </Button>
                  </div>
                ))
              })()}
              <p className="text-[10px] text-muted-foreground italic">
                PV e CA podem ser definidos depois em &quot;Gerenciar&quot;, no card do participante.
              </p>
            </TabsContent>

            <TabsContent value="surpresa" className="pt-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</Label>
                <Input value={surpriseName} onChange={(e) => setSurpriseName(e.target.value)} placeholder="Ex.: Lobo das sombras" className="bg-black/30 border-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">PV atual</Label>
                  <Input type="number" value={surpriseCurrentHp} onChange={(e) => setSurpriseCurrentHp(e.target.value)} placeholder="Ex.: 11" className="bg-black/30 border-primary/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">PV máximo</Label>
                  <Input type="number" value={surpriseMaxHp} onChange={(e) => setSurpriseMaxHp(e.target.value)} placeholder="Ex.: 11" className="bg-black/30 border-primary/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">CA</Label>
                  <Input type="number" value={surpriseArmorClass} onChange={(e) => setSurpriseArmorClass(e.target.value)} placeholder="Ex.: 13" className="bg-black/30 border-primary/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Iniciativa</Label>
                  <Input type="number" value={surpriseInitiative} onChange={(e) => setSurpriseInitiative(e.target.value)} placeholder="Ex.: 15" className="bg-black/30 border-primary/20" />
                </div>
              </div>
              <Button onClick={handleAddSurpriseEnemy} disabled={surpriseSubmitting} className="w-full btn-ritual rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Inimigo Surpresa
              </Button>
              <p className="text-[10px] text-muted-foreground italic">
                Um evento &quot;Um inimigo surpresa entrou no combate&quot; será registrado.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de criação rápida do campo de batalha */}
      <Dialog open={battlefieldOpen} onOpenChange={setBattlefieldOpen}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <MapIcon className="h-5 w-5" /> Criar Campo de Batalha
            </DialogTitle>
            <DialogDescription>
              Escolha um modelo narrativo. As zonas e conexões serão criadas para este combate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={battlefieldTemplate} onValueChange={setBattlefieldTemplate}>
              <SelectTrigger className="bg-black/30 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATTLEFIELD_TEMPLATES.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-xl border border-primary/10 bg-black/20 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Zonas deste modelo</p>
              <div className="flex flex-wrap gap-1">
                {BATTLEFIELD_TEMPLATES.find(t => t.key === battlefieldTemplate)?.zones.map(z => (
                  <Badge key={z.name} variant="outline" className="text-[10px] border-primary/20">{z.name}</Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateBattlefield} disabled={battlefieldSubmitting} className="btn-ritual rounded-full px-8">
              {battlefieldSubmitting ? "Criando..." : "Criar Zonas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de configuração do Grid Tático D&D */}
      <Dialog open={gridSetupOpen} onOpenChange={setGridSetupOpen}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" /> Grid Tático D&D
            </DialogTitle>
            <DialogDescription>
              1 célula = 5 ft / 1,5 m (1 quadrado físico = 2,5 cm). Padrão: 24x18 células. A imagem de fundo atual é preservada ao ajustar a grid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Largura (células)</Label>
              <Input type="number" min={1} max={60} value={gridWidthInput} onChange={(e) => setGridWidthInput(e.target.value)} className="bg-black/30 border-primary/20" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Altura (células)</Label>
              <Input type="number" min={1} max={60} value={gridHeightInput} onChange={(e) => setGridHeightInput(e.target.value)} className="bg-black/30 border-primary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Modo da imagem</Label>
              <Select value={gridFitInput} onValueChange={(v) => setGridFitInput(v as "contain" | "cover")}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Conter (mostrar tudo)</SelectItem>
                  <SelectItem value="cover">Preencher (cortar bordas)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground font-heading italic">
                Use "Conter" para mapas que já têm grade própria. Use "Preencher" para a imagem ocupar toda a área.
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Opacidade da grid</Label>
              <Select value={gridOpacityInput} onValueChange={setGridOpacityInput}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-black/20 p-3">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Mostrar linhas da grid</Label>
            <Switch checked={gridShowGridInput} onCheckedChange={setGridShowGridInput} />
          </div>

          <DialogFooter>
            <Button onClick={handleSetupGrid} disabled={gridSetupSubmitting} className="btn-ritual rounded-full px-8">
              {gridSetupSubmitting ? "Configurando..." : "Configurar Grid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ParticipantCard({
  participant,
  avatarUrl,
  npcRole,
  isMaster,
  isCurrentTurn,
  zones,
  zoneLinks,
  currentTurnZoneId,
  onManage,
  onMakeCurrentTurn,
  isGridMode,
  isSelectedForMove,
  onToggleSelectForMove,
}: {
  participant: Participant
  avatarUrl: string | null
  npcRole: string | null
  isMaster: boolean
  isCurrentTurn: boolean
  zones: CombatZone[]
  zoneLinks: CombatZoneLink[]
  currentTurnZoneId: string | null
  onManage: () => void
  onMakeCurrentTurn: () => void
  isGridMode: boolean
  isSelectedForMove: boolean
  onToggleSelectForMove: () => void
}) {
  const hpPercent = participant.max_hp && participant.max_hp > 0
    ? Math.max(0, Math.min(100, ((participant.current_hp ?? 0) / participant.max_hp) * 100))
    : null

  const isEnemy = participant.participant_type === 'enemy'
  const isDefeated = participant.status !== 'active'
  const isSurprise = !!participant.metadata?.surprise
  const conditions = participant.conditions || []
  const deathSaves = participant.metadata?.death_saves
  const concentration = participant.metadata?.concentration
  const zone = zones.find(z => z.id === participant.current_zone_id)
  const distance = zone && participant.current_zone_id !== currentTurnZoneId
    ? zoneDistanceLabel(currentTurnZoneId, participant.current_zone_id, zoneLinks)
    : null

  return (
    <Card className={`bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-3 ${isDefeated ? 'opacity-50' : ''} ${isCurrentTurn ? 'border-primary oracle-glow' : ''} ${isSelectedForMove ? 'ring-2 ring-amber-300 border-amber-300/60' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-black/40 border border-primary/20 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={participant.name} className="h-full w-full object-cover" />
          ) : isEnemy ? (
            <Skull className="h-5 w-5 text-destructive/60" />
          ) : (
            <Crown className="h-5 w-5 text-primary/60" />
          )}
        </div>
        <h3 className="font-display font-black tracking-tight text-lg truncate flex-1">{participant.name}</h3>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-1">
        <Badge variant="outline" className={`text-[10px] ${PARTICIPANT_TYPE_BADGE[participant.participant_type]?.className ?? 'border-primary/20'}`}>
          {PARTICIPANT_TYPE_BADGE[participant.participant_type]?.label ?? participant.participant_type}
        </Badge>
        {isSurprise && (
          <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
            Surpresa
          </Badge>
        )}
        {npcRole && (
          <span className="text-[10px] text-muted-foreground font-heading italic truncate">{npcRole}</span>
        )}
        <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-widest">
          Iniciativa {participant.initiative ?? "—"}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground font-heading">
          <span>PV</span>
          <span>{participant.current_hp ?? "—"} / {participant.max_hp ?? "—"}</span>
        </div>
        {hpPercent !== null ? (
          <Progress value={hpPercent} className="h-2" />
        ) : (
          <p className="text-[10px] text-muted-foreground italic">HP não definido</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-heading">
        <span className="text-muted-foreground">CA</span>
        <span>{participant.armor_class ?? "Não definida"}</span>
      </div>

      {zone && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-heading">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{zone.name}{distance ? ` · ${distance}` : ''}</span>
        </div>
      )}

      {participant.grid_x !== null && participant.grid_y !== null && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-heading">
          <Grid3x3 className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Grid [{participant.grid_x},{participant.grid_y}]
            {participant.token_size > 1 ? ` · ${participant.token_size}x${participant.token_size}` : ''}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px] border-primary/20">
          {STATUS_LABEL[participant.status] || participant.status}
        </Badge>
        {concentration?.active && (
          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
            <Wand2 className="h-2.5 w-2.5" />
            Concentração{concentration.spell ? `: ${concentration.spell}` : ''}
          </Badge>
        )}
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conditions.map((c) => (
            <Badge
              key={c.key}
              title={[c.source, c.duration, c.save, c.notes].filter(Boolean).join(' · ') || undefined}
              className="text-[9px] bg-accent/20 text-accent border-accent/30"
            >
              {c.label}
            </Badge>
          ))}
        </div>
      )}

      {participant.character_id && participant.current_hp === 0 && (
        <div className="text-[10px] space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-2">
          <div className="flex justify-between">
            <span>Sucessos contra morte</span>
            <span>{deathSaves?.successes ?? 0}/3</span>
          </div>
          <div className="flex justify-between">
            <span>Falhas contra morte</span>
            <span>{deathSaves?.failures ?? 0}/3</span>
          </div>
        </div>
      )}

      {isMaster && isGridMode && (
        <Button
          onClick={onToggleSelectForMove}
          variant="outline"
          size="sm"
          className={`w-full rounded-full text-[10px] ${isSelectedForMove ? 'border-amber-300 text-amber-300' : 'border-primary/20'}`}
        >
          {isSelectedForMove ? `Cancelar seleção — clique numa célula` : 'Selecionar para mover'}
        </Button>
      )}

      {isMaster && !isCurrentTurn && (
        <Button onClick={onMakeCurrentTurn} variant="outline" size="sm" className="w-full rounded-full border-accent/30 text-accent">
          <ChevronsRight className="h-3.5 w-3.5 mr-2" />
          Tornar turno atual
        </Button>
      )}

      {isMaster && (
        <Button onClick={onManage} variant="outline" size="sm" className="w-full rounded-full border-primary/30 text-primary">
          Gerenciar
        </Button>
      )}
    </Card>
  )
}

function BattlefieldGrid({
  config,
  participants,
  avatarByParticipantId,
  isMaster,
  selectedTokenId,
  onSelectToken,
  onMoveToken,
  cellSize,
}: {
  config: BattlefieldConfig
  participants: Participant[]
  avatarByParticipantId: Record<string, string | null>
  isMaster: boolean
  selectedTokenId: string | null
  onSelectToken: (id: string | null) => void
  onMoveToken: (x: number, y: number) => void
  cellSize: number
}) {
  const width = config.width ?? DEFAULT_GRID_WIDTH
  const height = config.height ?? DEFAULT_GRID_HEIGHT
  const backgroundImageUrl = config.backgroundImageUrl
  const backgroundFit = config.backgroundFit ?? 'contain'
  const gridOpacity = config.gridOpacity ?? 0.5
  const showGrid = config.showGrid ?? true

  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({ x, y })
    }
  }

  const cellTitle = isMaster ? undefined : 'Apenas o mestre pode mover tokens.'

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-2xl border border-primary/20"
      style={{ width: `${width * cellSize}px`, height: `${height * cellSize}px`, backgroundColor: '#0b0e1c' }}
    >
      {backgroundImageUrl ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: backgroundFit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : isMaster ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="text-center text-xs text-accent font-heading italic max-w-xs">
            Grid ativo. Adicione uma imagem de fundo para usar como mapa de batalha.
          </p>
        </div>
      ) : null}

      {showGrid && (
        <div
          className="absolute inset-0 grid pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
            opacity: gridOpacity,
          }}
        >
          {cells.map(({ x, y }) => (
            <div key={`${x}-${y}`} className="border border-white/20" />
          ))}
        </div>
      )}

      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)`, gridTemplateRows: `repeat(${height}, 1fr)` }}
      >
        {cells.map(({ x, y }) => (
          <button
            key={`${x}-${y}`}
            type="button"
            onClick={() => onMoveToken(x, y)}
            disabled={!isMaster || !selectedTokenId}
            title={cellTitle}
            className="transition-colors hover:bg-primary/10 disabled:cursor-default"
            aria-label={`Célula ${x},${y}`}
          />
        ))}
      </div>

      {participants.map((p) => renderToken(p, p.grid_x ?? 0, p.grid_y ?? 0))}
    </div>
  )

  function renderToken(p: Participant, gridX: number, gridY: number) {
    const isEnemy = p.participant_type === 'enemy'
    const isSelected = selectedTokenId === p.id
    const conditionCount = p.conditions?.length ?? 0
    const avatarUrl = avatarByParticipantId[p.id]
    const size = Math.max(42, p.token_size * cellSize)
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => isMaster && onSelectToken(isSelected ? null : p.id)}
        disabled={!isMaster}
        style={{
          left: `${gridX * cellSize}px`,
          top: `${gridY * cellSize}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        className={`absolute z-10 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border-[3px] p-0.5 text-[9px] font-heading leading-tight transition-shadow ${
          isEnemy ? 'border-destructive bg-destructive/60' : 'border-amber-400 bg-amber-900/40'
        } ${isSelected ? 'ring-4 ring-amber-300 animate-pulse shadow-[0_0_18px_rgba(252,211,77,0.7)]' : ''} ${isMaster ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}`}
        title={isMaster ? p.name : 'Apenas o mestre pode mover tokens.'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="text-center font-black text-white">
            {p.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="relative z-10 mt-auto w-full truncate rounded-sm bg-black/60 text-center text-white">
          {p.name}
        </span>
        {(p.current_hp !== null || p.max_hp !== null) && (
          <span className="relative z-10 rounded-sm bg-black/60 px-0.5 text-white/80">
            {p.current_hp ?? '—'}/{p.max_hp ?? '—'}
          </span>
        )}
        {conditionCount > 0 && (
          <span className="relative z-10 rounded-sm bg-black/60 px-0.5 text-[8px] text-white/70">{conditionCount} cond.</span>
        )}
      </button>
    )
  }
}
