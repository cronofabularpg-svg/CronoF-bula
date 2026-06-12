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

const ABILITIES: { key: string; label: string }[] = [
  { key: "STR", label: "Força (STR)" },
  { key: "DEX", label: "Destreza (DEX)" },
  { key: "CON", label: "Constituição (CON)" },
  { key: "INT", label: "Inteligência (INT)" },
  { key: "WIS", label: "Sabedoria (WIS)" },
  { key: "CHA", label: "Carisma (CHA)" },
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
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function rollFormula(formula: string): number | null {
  const match = formula.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) return null
  const count = Math.min(parseInt(match[1], 10), 100)
  const sides = Math.max(parseInt(match[2], 10), 1)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  let total = 0
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }
  return total + modifier
}

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

  // Rolagem de ataque contra CA
  const [attackOpen, setAttackOpen] = React.useState(false)
  const [attackTargetId, setAttackTargetId] = React.useState("")
  const [attackFormula, setAttackFormula] = React.useState("1d20")
  const [attackResult, setAttackResult] = React.useState<number | null>(null)
  const [attackSubmitting, setAttackSubmitting] = React.useState(false)

  // Teste de resistência
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [saveAbility, setSaveAbility] = React.useState(ABILITIES[0].key)
  const [saveDC, setSaveDC] = React.useState("")
  const [saveModifier, setSaveModifier] = React.useState("0")
  const [saveResult, setSaveResult] = React.useState<number | null>(null)
  const [saveSubmitting, setSaveSubmitting] = React.useState(false)

  // Campo de batalha: criação rápida por modelo (zonas) ou configuração de grid
  const [battlefieldOpen, setBattlefieldOpen] = React.useState(false)
  const [battlefieldTemplate, setBattlefieldTemplate] = React.useState(BATTLEFIELD_TEMPLATES[0].key)
  const [battlefieldSubmitting, setBattlefieldSubmitting] = React.useState(false)

  // Grid Tático D&D
  const [gridSetupOpen, setGridSetupOpen] = React.useState(false)
  const [gridWidthInput, setGridWidthInput] = React.useState(String(DEFAULT_GRID_WIDTH))
  const [gridHeightInput, setGridHeightInput] = React.useState(String(DEFAULT_GRID_HEIGHT))
  const [gridSetupSubmitting, setGridSetupSubmitting] = React.useState(false)
  const [selectedGridTokenId, setSelectedGridTokenId] = React.useState<string | null>(null)
  const [measureTokenA, setMeasureTokenA] = React.useState("")
  const [measureTokenB, setMeasureTokenB] = React.useState("")

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

      setParticipants((participantsData as Participant[]) || [])

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

  async function handleSetupGrid() {
    const width = Math.max(1, Math.min(60, parseInt(gridWidthInput, 10) || DEFAULT_GRID_WIDTH))
    const height = Math.max(1, Math.min(60, parseInt(gridHeightInput, 10) || DEFAULT_GRID_HEIGHT))

    setGridSetupSubmitting(true)
    await handleSetBattlefieldMode('grid', {
      width,
      height,
      cellUnit: '5ft',
      cellMeters: 1.5,
      physicalCellCm: 2.5,
      backgroundImageUrl: combat?.battlefield_config?.backgroundImageUrl ?? null,
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
      return
    }
    await loadCombat()
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

  function openAttack() {
    setAttackTargetId("")
    setAttackFormula("1d20")
    setAttackResult(null)
    setAttackOpen(true)
  }

  function rollAttack() {
    const total = rollFormula(attackFormula)
    if (total === null) {
      toast({ variant: "destructive", title: "Fórmula inválida", description: "Use o formato NdM (ex.: 1d20, 1d20+5)." })
      return
    }
    setAttackResult(total)
  }

  // Apenas calcula e registra a rolagem; o mestre confirma o dano manualmente depois.
  async function registerAttack() {
    if (!combat || !actingParticipant || !user || attackResult === null) return

    setAttackSubmitting(true)
    const supabase = createClient()

    const target = participants.find(p => p.id === attackTargetId) || null

    const { error: rollError } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: combat.session_id ?? activeSession?.id ?? null,
      scene_id: combat.scene_id ?? activeScene?.id ?? null,
      character_id: actingParticipant.character_id,
      user_id: user.uid,
      roll_type: 'attack',
      formula: attackFormula.trim() || '1d20',
      raw_result: attackResult,
      modifier: 0,
      total: attackResult,
      reason: target ? `Ataque contra ${target.name}` : 'Rolagem de ataque',
      visibility: 'scene',
    })

    if (rollError) {
      setAttackSubmitting(false)
      toast({ variant: "destructive", title: "Erro ao registrar rolagem", description: rollError.message })
      return
    }

    let outcome: 'hit' | 'miss' | 'unknown' = 'unknown'
    let content = `${actingParticipant.name} rolou ataque: ${attackResult}`
    if (target) {
      content += ` contra ${target.name}`
      if (target.armor_class !== null) {
        outcome = attackResult >= target.armor_class ? 'hit' : 'miss'
        content += ` (CA ${target.armor_class}) — ${outcome === 'hit' ? 'possível acerto' : 'possível erro'}.`
      } else {
        content += '.'
      }
    } else {
      content += '.'
    }

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'attack_roll',
      content,
      event_metadata: {
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
        target_participant_id: target?.id ?? null,
        total: attackResult,
        target_ac: target?.armor_class ?? null,
        outcome,
      },
    })
    setAttackSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar evento", description: error.message })
      return
    }

    toast({ title: "Rolagem registrada", description: content })
    setAttackOpen(false)
    await loadCombat()
  }

  function openSavingThrow() {
    setSaveAbility(ABILITIES[0].key)
    setSaveDC("")
    setSaveModifier("0")
    setSaveResult(null)
    setSaveOpen(true)
  }

  function rollSavingThrow() {
    const d20 = rollFormula("1d20")
    if (d20 === null) return
    const modifier = parseInt(saveModifier, 10) || 0
    setSaveResult(d20 + modifier)
  }

  async function registerSavingThrow() {
    if (!combat || !actingParticipant || !user || saveResult === null) return

    setSaveSubmitting(true)
    const supabase = createClient()

    const modifier = parseInt(saveModifier, 10) || 0
    const formula = modifier !== 0 ? `1d20${modifier > 0 ? '+' : ''}${modifier}` : '1d20'

    const { error: rollError } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: combat.session_id ?? activeSession?.id ?? null,
      scene_id: combat.scene_id ?? activeScene?.id ?? null,
      character_id: actingParticipant.character_id,
      user_id: user.uid,
      roll_type: 'saving_throw',
      formula,
      raw_result: saveResult,
      modifier,
      total: saveResult,
      reason: `Teste de resistência (${saveAbility})`,
      visibility: 'scene',
    })

    if (rollError) {
      setSaveSubmitting(false)
      toast({ variant: "destructive", title: "Erro ao registrar rolagem", description: rollError.message })
      return
    }

    const dc = parseInt(saveDC, 10)
    let outcome: 'success' | 'failure' | 'unknown' = 'unknown'
    let content = `${actingParticipant.name} fez um teste de resistência de ${saveAbility}: ${saveResult}`
    if (!isNaN(dc)) {
      outcome = saveResult >= dc ? 'success' : 'failure'
      content += ` vs CD ${dc} — ${outcome === 'success' ? 'sucesso provável' : 'falha provável'}.`
    } else {
      content += '.'
    }

    const { error } = await supabase.rpc('log_combat_event', {
      target_combat_id: combat.id,
      event_type: 'saving_throw',
      content,
      event_metadata: {
        character_id: actingParticipant.character_id,
        participant_id: actingParticipant.id,
        ability: saveAbility,
        dc: isNaN(dc) ? null : dc,
        total: saveResult,
        outcome,
      },
    })
    setSaveSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar evento", description: error.message })
      return
    }

    toast({ title: "Teste registrado", description: content })
    setSaveOpen(false)
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
  const battlefieldUnconfigured = !isGridMode && !isZonesConfigured

  const positionedTokens = participants.filter(p => p.grid_x !== null && p.grid_y !== null)
  const unpositionedTokens = participants.filter(p => p.grid_x === null || p.grid_y === null)

  const measureA = positionedTokens.find(p => p.id === measureTokenA)
  const measureB = positionedTokens.find(p => p.id === measureTokenB)
  let measureResult: { cells: number; feet: number; meters: number } | null = null
  if (measureA && measureB && measureA.id !== measureB.id) {
    const cells = Math.max(Math.abs((measureA.grid_x ?? 0) - (measureB.grid_x ?? 0)), Math.abs((measureA.grid_y ?? 0) - (measureB.grid_y ?? 0)))
    measureResult = { cells, feet: cells * 5, meters: cells * (battlefieldConfig?.cellMeters ?? 1.5) }
  }

  const campoPanel = combat && (
    <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-accent" />
          Campo de Batalha
        </h2>
        {battlefieldUnconfigured && isMaster && (
          <div className="flex gap-2">
            <Button onClick={() => setBattlefieldOpen(true)} variant="outline" size="sm" className="rounded-full border-accent/30 text-accent">
              <Plus className="h-3 w-3 mr-1" />
              Zonas Narrativas
            </Button>
            <Button onClick={() => setGridSetupOpen(true)} variant="outline" size="sm" className="rounded-full border-primary/30 text-primary">
              <Grid3x3 className="h-3 w-3 mr-1" />
              Grid Tático D&D
            </Button>
          </div>
        )}
      </div>

      {battlefieldUnconfigured ? (
        <p className="text-sm text-muted-foreground font-heading italic">
          {isMaster
            ? "Nenhum campo de batalha definido ainda. Escolha \"Zonas Narrativas\" (modelo rápido) ou \"Grid Tático D&D\"."
            : "O mestre ainda não definiu o campo de batalha."}
        </p>
      ) : isGridMode ? (
        <>
          <BattlefieldGrid
            config={battlefieldConfig!}
            participants={positionedTokens}
            isMaster={isMaster}
            selectedTokenId={selectedGridTokenId}
            onSelectToken={setSelectedGridTokenId}
            onMoveToken={(x, y) => selectedGridTokenId && handleMoveParticipantGrid(selectedGridTokenId, x, y)}
          />

          {isMaster && unpositionedTokens.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sem posição no grid</p>
              <div className="flex flex-wrap gap-2">
                {unpositionedTokens.map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedGridTokenId(p.id)}
                    className={`rounded-full text-[10px] ${selectedGridTokenId === p.id ? 'border-accent text-accent' : 'border-primary/20'}`}
                  >
                    {selectedGridTokenId === p.id ? `Clique numa célula: ${p.name}` : `Posicionar ${p.name}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

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

          {isMaster && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Imagem de fundo (opcional)</p>
              <R2ImageUpload
                campaignId={campaignId}
                usageType="battlefield_map"
                visibility="party"
                label="Adicionar imagem de fundo"
                onUploaded={handleBattlefieldImageUploaded}
              />
            </div>
          )}

          <div className="text-[10px] text-muted-foreground font-heading italic space-y-1">
            <p>Grid {battlefieldConfig?.width}x{battlefieldConfig?.height} — 1 célula = 5 ft / 1,5 m.</p>
            <p>O mestre valida deslocamento, terreno difícil e alcance.</p>
            {isMaster && (
              <p>Clique em um token para selecioná-lo e depois em uma célula para movê-lo.</p>
            )}
          </div>
        </>
      ) : (
        <>
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
            <p>Imagem de campo de batalha será adicionada em fase futura.</p>
            {isMaster && (
              <p>Clique em um participante no mapa para gerenciar/mover (modal "Gerenciar").</p>
            )}
          </div>
        </>
      )}
    </Card>
  )

  // ---- Painel: Participantes -----------------------------------------------
  const participantesPanel = combat && (
    <div className="space-y-4">
      <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        Participantes
      </h2>
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
              isMaster={isMaster}
              isCurrentTurn={currentTurnParticipant?.id === p.id}
              zones={zones}
              zoneLinks={zoneLinks}
              currentTurnZoneId={currentTurnZoneId}
              onManage={() => openManage(p)}
            />
          ))}
        </div>
      )}
    </div>
  )

  // ---- Painel: Ações ---------------------------------------------------------
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

          <Separator className="bg-primary/10" />

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={openAttack} variant="outline" className="rounded-full border-destructive/30 text-destructive">
              <Target className="h-4 w-4 mr-2" />
              Ataque
            </Button>
            <Button onClick={openSavingThrow} variant="outline" className="rounded-full border-accent/30 text-accent">
              <Shield className="h-4 w-4 mr-2" />
              Teste de Resistência
            </Button>
          </div>
        </div>
      )}
    </Card>
  )

  // ---- Painel: Eventos Recentes ----------------------------------------------
  const eventosPanel = combat && (
    <Card className="bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-3">
      <h2 className="font-display font-black tracking-tight text-lg flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        Eventos Recentes
      </h2>
      {sceneEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground font-heading italic">Nenhum evento registrado ainda.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sceneEvents.map((event) => {
            const meta = EVENT_META[event.event_type] || { label: event.event_type, icon: Info, color: "text-muted-foreground" }
            const EventIcon = meta.icon
            return (
              <div key={event.id} className="flex items-start gap-2 rounded-lg border border-primary/5 bg-black/20 p-2">
                <EventIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading">{event.content}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                    {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {meta.label}
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
                        {campaignCharacters.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-primary/10 p-3">
                            <Checkbox
                              checked={!!selectedCharacters[c.id]?.selected}
                              onCheckedChange={(checked) => setSelectedCharacters(prev => ({
                                ...prev,
                                [c.id]: { selected: !!checked, initiative: prev[c.id]?.initiative || "" },
                              }))}
                            />
                            <span className="flex-1 font-heading">{c.name}</span>
                            <Input
                              type="number"
                              placeholder="Iniciativa"
                              value={selectedCharacters[c.id]?.initiative || ""}
                              onChange={(e) => setSelectedCharacters(prev => ({
                                ...prev,
                                [c.id]: { selected: prev[c.id]?.selected || false, initiative: e.target.value },
                              }))}
                              className="w-28 bg-black/30 border-primary/20"
                            />
                          </div>
                        ))}
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

      {/* Modal de rolagem de ataque contra CA */}
      <Dialog open={attackOpen} onOpenChange={setAttackOpen}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <Target className="h-5 w-5" /> Rolagem de Ataque
            </DialogTitle>
            <DialogDescription>
              {actingParticipant ? `Atuando como ${actingParticipant.name}.` : ''} O mestre confirma o dano depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Alvo</Label>
              <Select value={attackTargetId || "__none__"} onValueChange={(v) => setAttackTargetId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue placeholder="Escolha um alvo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem alvo definido</SelectItem>
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.armor_class !== null ? ` (CA ${p.armor_class})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Fórmula (d20 + modificador)</Label>
              <Input value={attackFormula} onChange={(e) => setAttackFormula(e.target.value)} placeholder="Ex.: 1d20+5" className="bg-black/30 border-primary/20" />
            </div>

            <Button onClick={rollAttack} variant="outline" className="w-full rounded-full border-primary/30 text-primary">
              Rolar
            </Button>

            {attackResult !== null && (
              <div className="rounded-xl border border-primary/10 bg-black/30 p-3 text-center space-y-1">
                <p className="text-2xl font-display font-black">{attackResult}</p>
                {(() => {
                  const target = participants.find(p => p.id === attackTargetId)
                  if (!target) return <p className="text-xs text-muted-foreground">Sem alvo selecionado.</p>
                  if (target.armor_class === null) return <p className="text-xs text-muted-foreground">CA do alvo não definida.</p>
                  const hit = attackResult >= target.armor_class
                  return (
                    <p className={`text-xs font-bold ${hit ? 'text-primary' : 'text-destructive'}`}>
                      vs CA {target.armor_class} — {hit ? 'Possível acerto' : 'Possível erro'}
                    </p>
                  )
                })()}
              </div>
            )}

            <Button onClick={registerAttack} disabled={attackSubmitting || attackResult === null} className="w-full btn-ritual rounded-full">
              Registrar Rolagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de teste de resistência */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
              <Shield className="h-5 w-5" /> Teste de Resistência
            </DialogTitle>
            <DialogDescription>
              {actingParticipant ? `Atuando como ${actingParticipant.name}.` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Atributo</Label>
              <Select value={saveAbility} onValueChange={setSaveAbility}>
                <SelectTrigger className="bg-black/30 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ABILITIES.map(a => (
                    <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">CD (opcional)</Label>
                <Input type="number" value={saveDC} onChange={(e) => setSaveDC(e.target.value)} placeholder="Ex.: 12" className="bg-black/30 border-primary/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Modificador</Label>
                <Input type="number" value={saveModifier} onChange={(e) => setSaveModifier(e.target.value)} placeholder="Ex.: 2" className="bg-black/30 border-primary/20" />
              </div>
            </div>

            <Button onClick={rollSavingThrow} variant="outline" className="w-full rounded-full border-primary/30 text-primary">
              Rolar 1d20 + modificador
            </Button>

            {saveResult !== null && (
              <div className="rounded-xl border border-primary/10 bg-black/30 p-3 text-center space-y-1">
                <p className="text-2xl font-display font-black">{saveResult}</p>
                {(() => {
                  const dc = parseInt(saveDC, 10)
                  if (isNaN(dc)) return <p className="text-xs text-muted-foreground">CD não definida.</p>
                  const success = saveResult >= dc
                  return (
                    <p className={`text-xs font-bold ${success ? 'text-primary' : 'text-destructive'}`}>
                      vs CD {dc} — {success ? 'Sucesso provável' : 'Falha provável'}
                    </p>
                  )
                })()}
              </div>
            )}

            <Button onClick={registerSavingThrow} disabled={saveSubmitting || saveResult === null} className="w-full btn-ritual rounded-full">
              Registrar Teste
            </Button>
          </div>
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
              1 célula = 5 ft / 1,5 m (1 quadrado físico = 2,5 cm). Padrão: 24x18 células.
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
  isMaster,
  isCurrentTurn,
  zones,
  zoneLinks,
  currentTurnZoneId,
  onManage,
}: {
  participant: Participant
  isMaster: boolean
  isCurrentTurn: boolean
  zones: CombatZone[]
  zoneLinks: CombatZoneLink[]
  currentTurnZoneId: string | null
  onManage: () => void
}) {
  const hpPercent = participant.max_hp && participant.max_hp > 0
    ? Math.max(0, Math.min(100, ((participant.current_hp ?? 0) / participant.max_hp) * 100))
    : null

  const isEnemy = participant.participant_type === 'enemy'
  const isDefeated = participant.status !== 'active'
  const conditions = participant.conditions || []
  const deathSaves = participant.metadata?.death_saves
  const concentration = participant.metadata?.concentration
  const zone = zones.find(z => z.id === participant.current_zone_id)
  const distance = zone && participant.current_zone_id !== currentTurnZoneId
    ? zoneDistanceLabel(currentTurnZoneId, participant.current_zone_id, zoneLinks)
    : null

  return (
    <Card className={`bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-3 ${isDefeated ? 'opacity-50' : ''} ${isCurrentTurn ? 'border-primary oracle-glow' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display font-black tracking-tight text-lg truncate">{participant.name}</h3>
        {isEnemy ? (
          <Skull className="h-4 w-4 text-destructive/60 shrink-0" />
        ) : (
          <Crown className="h-4 w-4 text-primary/60 shrink-0" />
        )}
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
  isMaster,
  selectedTokenId,
  onSelectToken,
  onMoveToken,
}: {
  config: BattlefieldConfig
  participants: Participant[]
  isMaster: boolean
  selectedTokenId: string | null
  onSelectToken: (id: string | null) => void
  onMoveToken: (x: number, y: number) => void
}) {
  const width = config.width ?? DEFAULT_GRID_WIDTH
  const height = config.height ?? DEFAULT_GRID_HEIGHT
  const backgroundImageUrl = config.backgroundImageUrl

  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({ x, y })
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-primary/20"
      style={{
        aspectRatio: `${width} / ${height}`,
        backgroundColor: '#0b0e1c',
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
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
            className="border border-white/5 transition-colors hover:bg-primary/10 disabled:cursor-default"
            aria-label={`Célula ${x},${y}`}
          />
        ))}
      </div>

      {participants.map((p) => {
        const isEnemy = p.participant_type === 'enemy'
        const isSelected = selectedTokenId === p.id
        const conditionCount = p.conditions?.length ?? 0
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => isMaster && onSelectToken(isSelected ? null : p.id)}
            disabled={!isMaster}
            style={{
              left: `${((p.grid_x ?? 0) / width) * 100}%`,
              top: `${((p.grid_y ?? 0) / height) * 100}%`,
              width: `${(p.token_size / width) * 100}%`,
              height: `${(p.token_size / height) * 100}%`,
            }}
            className={`absolute flex flex-col items-center justify-center gap-0.5 rounded-md border-2 p-0.5 text-[9px] font-heading leading-tight transition-shadow ${
              isEnemy ? 'border-destructive/70 bg-destructive/60' : 'border-primary/70 bg-primary/60'
            } ${isSelected ? 'ring-2 ring-accent oracle-glow' : ''} ${isMaster ? 'cursor-pointer' : 'cursor-default'}`}
            title={p.name}
          >
            <span className="w-full truncate text-center font-black text-white">{p.name}</span>
            <span className="text-white/80">{p.current_hp ?? '—'}/{p.max_hp ?? '—'}</span>
            {conditionCount > 0 && (
              <span className="text-[8px] text-white/70">{conditionCount} cond.</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
