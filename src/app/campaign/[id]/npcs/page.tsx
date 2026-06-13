
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Skull,
  ImagePlus,
  Swords,
  Bot,
  Hand,
  BookOpen,
  ChevronDown,
  Sparkles,
  Swords as SwordsIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"
import {
  SRD_MONSTERS,
  searchSrdMonsters,
  getSrdMonstersByType,
  getSrdMonstersByChallenge,
  type SrdMonster,
} from "@/lib/dnd/srd-monsters"
import { convertSrdMonsterToNpcInput, type SrdImportNpcType, type SrdImportCombatRole } from "@/lib/dnd/srd-monster-to-npc"

// TAREFA 3 — classificação de NPCs principais x mobs/criaturas de combate.
const NPC_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "main", label: "Principal" },
  { value: "mob", label: "Mob" },
  { value: "boss", label: "Boss" },
  { value: "ally", label: "Aliado" },
  { value: "merchant", label: "Comerciante" },
  { value: "mentor", label: "Mentor" },
  { value: "neutral", label: "Neutro" },
  { value: "creature", label: "Criatura" },
]

const NPC_TYPE_LABEL: Record<string, string> = Object.fromEntries(NPC_TYPE_OPTIONS.map(o => [o.value, o.label]))

const COMBAT_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "enemy", label: "Inimigo" },
  { value: "ally", label: "Aliado" },
  { value: "neutral", label: "Neutro" },
  { value: "summon", label: "Invocação" },
  { value: "environmental", label: "Ambiental" },
]

const COMBAT_ROLE_LABEL: Record<string, string> = Object.fromEntries(COMBAT_ROLE_OPTIONS.map(o => [o.value, o.label]))

const COMBAT_TYPES = new Set(["mob", "boss", "creature"])

const NPC_TYPE_BADGE_CLASS: Record<string, string> = {
  main: "bg-primary/20 text-primary border-primary/30",
  mob: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  boss: "bg-destructive/20 text-destructive border-destructive/30",
  ally: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  merchant: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  mentor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  neutral: "bg-muted text-muted-foreground border-white/10",
  creature: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
}

type NpcFormState = {
  name: string
  role: string
  personality: string
  goals: string
  knows: string
  secrets: string
  visibility: string
  status: "alive" | "dead" | "missing"
  npc_type: string
  combat_role: string
  ai_control_enabled: boolean
  challenge_level: string
  armor_class: string
  max_hp: string
  current_hp: string
  movement_meters: string
  attacks_text: string
  combat_behavior: string
  spawn_min: string
  spawn_max: string
}

const EMPTY_NPC_FORM: NpcFormState = {
  name: "",
  role: "",
  personality: "",
  goals: "",
  knows: "",
  secrets: "",
  visibility: "master_only",
  status: "alive",
  npc_type: "main",
  combat_role: "",
  ai_control_enabled: false,
  challenge_level: "",
  armor_class: "",
  max_hp: "",
  current_hp: "",
  movement_meters: "",
  attacks_text: "",
  combat_behavior: "",
  spawn_min: "",
  spawn_max: "",
}

// "Nome: bônus, dano, tipo" por linha -> jsonb [{ name, attackBonus?, damage?, damageType? }]
function parseAttacksText(text: string): Array<Record<string, unknown>> {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [namePart, restPart] = line.split(":")
      const name = (namePart || line).trim()
      if (!restPart) return { name }
      const parts = restPart.split(",").map(p => p.trim()).filter(Boolean)
      const attack: Record<string, unknown> = { name }
      if (parts[0]) {
        const bonus = Number(parts[0].replace("+", ""))
        if (!Number.isNaN(bonus)) attack.attackBonus = bonus
        else attack.damage = parts[0]
      }
      if (parts[1]) attack.damage = parts[1]
      if (parts[2]) attack.damageType = parts[2]
      return attack
    })
}

function formatAttacksForText(attacks: unknown): string {
  if (!Array.isArray(attacks)) return ""
  return attacks
    .map((a: any) => {
      const bits = [a.attackBonus !== undefined ? `+${a.attackBonus}` : null, a.damage || null, a.damageType || null].filter(Boolean)
      return bits.length > 0 ? `${a.name}: ${bits.join(", ")}` : a.name
    })
    .filter(Boolean)
    .join("\n")
}

function npcToFormState(npc: any): NpcFormState {
  return {
    name: npc.name || "",
    role: npc.role || "",
    personality: npc.personality || "",
    goals: npc.goals || "",
    knows: (npc.knowledge || []).join(", "),
    secrets: npc.secrets || "",
    visibility: npc.visibility || "master_only",
    status: npc.status || "alive",
    npc_type: npc.npc_type || "main",
    combat_role: npc.combat_role || "",
    ai_control_enabled: !!npc.ai_control_enabled,
    challenge_level: npc.challenge_level || "",
    armor_class: npc.armor_class !== null && npc.armor_class !== undefined ? String(npc.armor_class) : "",
    max_hp: npc.max_hp !== null && npc.max_hp !== undefined ? String(npc.max_hp) : "",
    current_hp: npc.current_hp !== null && npc.current_hp !== undefined ? String(npc.current_hp) : "",
    movement_meters: npc.movement_meters !== null && npc.movement_meters !== undefined ? String(npc.movement_meters) : "",
    attacks_text: formatAttacksForText(npc.attacks),
    combat_behavior: npc.combat_behavior || "",
    spawn_min: npc.spawn_min !== null && npc.spawn_min !== undefined ? String(npc.spawn_min) : "",
    spawn_max: npc.spawn_max !== null && npc.spawn_max !== undefined ? String(npc.spawn_max) : "",
  }
}

function formStateToPayload(form: NpcFormState) {
  const toIntOrNull = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10))
  const toNumOrNull = (v: string) => (v.trim() === "" ? null : Number.parseFloat(v))
  return {
    name: form.name,
    role: form.role || null,
    personality: form.personality || null,
    goals: form.goals || null,
    secrets: form.secrets || null,
    knowledge: form.knows.split(",").map(k => k.trim()).filter(Boolean),
    visibility: form.visibility,
    status: form.status,
    npc_type: form.npc_type,
    combat_role: form.combat_role || null,
    ai_control_enabled: form.ai_control_enabled,
    challenge_level: form.challenge_level || null,
    armor_class: toIntOrNull(form.armor_class),
    max_hp: toIntOrNull(form.max_hp),
    current_hp: toIntOrNull(form.current_hp),
    movement_meters: toNumOrNull(form.movement_meters),
    attacks: parseAttacksText(form.attacks_text),
    combat_behavior: form.combat_behavior || null,
    spawn_min: toIntOrNull(form.spawn_min),
    spawn_max: toIntOrNull(form.spawn_max),
  }
}

const SELECT_COLUMNS = 'id, name, role, description, personality, goals, knowledge, relationship_status, current_location_id, current_scene_id, visibility, status, image_url, npc_type, combat_role, ai_control_enabled, challenge_level, armor_class, max_hp, current_hp, movement_meters, attacks, combat_behavior, spawn_min, spawn_max, metadata'

export default function NPCManager() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingNpc, setEditingNpc] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingNpcs, setLoadingNpcs] = React.useState(true)
  const [npcs, setNpcs] = React.useState<any[]>([])
  const [isMaster, setIsMaster] = React.useState(false)

  const [npcData, setNpcData] = React.useState<NpcFormState>({ ...EMPTY_NPC_FORM })

  // Biblioteca SRD — filtros
  const [srdSearch, setSrdSearch] = React.useState("")
  const [srdType, setSrdType] = React.useState("all")
  const [srdChallenge, setSrdChallenge] = React.useState("all")
  const [importingMonster, setImportingMonster] = React.useState<SrdMonster | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [importForm, setImportForm] = React.useState({
    name: "",
    npcType: "mob" as SrdImportNpcType,
    combatRole: "enemy" as SrdImportCombatRole,
    aiControlEnabled: false,
    visibility: "master_only",
    armorClass: "",
    maxHp: "",
  })

  React.useEffect(() => {
    if (!campaignId || !user) return
    let active = true
    const userId = user.uid
    const supabase = createClient()

    async function load() {
      setLoadingNpcs(true)

      const [{ data: member }, { data, error }] = await Promise.all([
        supabase
          .from('campaign_members')
          .select('role')
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .rpc('get_campaign_npcs', { target_campaign_id: campaignId })
      ])

      if (!active) return
      setIsMaster(['owner', 'master', 'assistant_master'].includes(member?.role || ''))
      if (error) {
        toast({ variant: "destructive", title: "Erro ao Carregar NPCs", description: error.message })
      }
      setNpcs(data || [])
      setLoadingNpcs(false)
    }

    load()

    return () => {
      active = false
    }
  }, [campaignId, user, toast])

  const searchedNpcs = npcs.filter(npc =>
    (npc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (npc.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredNpcs = React.useMemo(() => {
    switch (activeTab) {
      case "main":
        return searchedNpcs.filter(n => (n.npc_type || "main") === "main")
      case "mob":
        return searchedNpcs.filter(n => n.npc_type === "mob")
      case "boss":
        return searchedNpcs.filter(n => n.npc_type === "boss")
      case "ally":
        return searchedNpcs.filter(n => n.npc_type === "ally")
      case "merchant":
        return searchedNpcs.filter(n => n.npc_type === "merchant")
      case "bestiary":
        return searchedNpcs.filter(n => COMBAT_TYPES.has(n.npc_type))
      default:
        return searchedNpcs
    }
  }, [searchedNpcs, activeTab])

  const filteredSrdMonsters = React.useMemo(() => {
    let list = searchSrdMonsters(srdSearch)
    if (srdType !== "all") {
      const byType = new Set(getSrdMonstersByType(srdType).map(m => m.id))
      list = list.filter(m => byType.has(m.id))
    }
    if (srdChallenge !== "all") {
      const byChallenge = new Set(getSrdMonstersByChallenge(srdChallenge).map(m => m.id))
      list = list.filter(m => byChallenge.has(m.id))
    }
    return list
  }, [srdSearch, srdType, srdChallenge])

  const srdTypes = React.useMemo(() => Array.from(new Set(SRD_MONSTERS.map(m => m.type))).sort(), [])
  const srdChallenges = React.useMemo(() => Array.from(new Set(SRD_MONSTERS.map(m => m.challengeRating))), [])

  async function handleCreateNPC() {
    if (!campaignId || !user || !npcData.name) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('npcs')
        .insert({
          campaign_id: campaignId,
          created_by: user.uid,
          ...formStateToPayload(npcData),
        })
        .select(SELECT_COLUMNS)
        .single()

      if (error) throw error
      toast({ title: "NPC Criado", description: `${npcData.name} agora habita Arvand.` })
      setNpcs((prev) => [...prev, { ...data, secrets: isMaster ? npcData.secrets : null }].sort((a, b) => a.name.localeCompare(b.name)))
      setIsCreateOpen(false)
      setNpcData({ ...EMPTY_NPC_FORM })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao criar", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateNPC() {
    if (!editingNpc || !campaignId || !npcData.name) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('npcs')
        .update(formStateToPayload(npcData))
        .eq('id', editingNpc.id)
        .eq('campaign_id', campaignId)
        .select(SELECT_COLUMNS)
        .single()

      if (error) throw error
      toast({ title: "NPC Atualizado", description: `${npcData.name} foi atualizado.` })
      setNpcs((prev) => prev.map((npc) => npc.id === editingNpc.id ? { ...npc, ...data } : npc).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingNpc(null)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateNpcImage(npcId: string, mediaAsset: MediaAsset) {
    if (!mediaAsset.public_url) return
    const supabase = createClient()
    const { error } = await supabase
      .from('npcs')
      .update({ image_url: mediaAsset.public_url })
      .eq('id', npcId)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Imagem", description: error.message })
      return
    }

    setNpcs((prev) => prev.map((npc) => npc.id === npcId ? { ...npc, image_url: mediaAsset.public_url } : npc))
    toast({ title: "Imagem Atualizada" })
  }

  async function handleKillNPC(npcId: string, npcName: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('npcs')
      .update({ status: "dead" })
      .eq('id', npcId)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar NPC", description: error.message })
      return
    }

    setNpcs((prev) => prev.map((npc) => npc.id === npcId ? { ...npc, status: "dead" } : npc))
    toast({ title: "Fábula Sombria", description: `${npcName} encontrou seu fim.` })
  }

  function openImportModal(monster: SrdMonster) {
    setImportingMonster(monster)
    setImportForm({
      name: monster.portugueseName,
      npcType: "mob",
      combatRole: "enemy",
      aiControlEnabled: false,
      visibility: "master_only",
      armorClass: String(monster.armorClass),
      maxHp: String(monster.hitPoints),
    })
  }

  async function handleImportSrdMonster() {
    if (!importingMonster || !campaignId || !user) return
    setImporting(true)
    try {
      const supabase = createClient()
      const acOverride = Number.parseInt(importForm.armorClass, 10)
      const hpOverride = Number.parseInt(importForm.maxHp, 10)
      const payload = convertSrdMonsterToNpcInput(importingMonster, {
        customName: importForm.name,
        npcType: importForm.npcType,
        combatRole: importForm.combatRole,
        aiControlEnabled: importForm.aiControlEnabled,
        visibility: importForm.visibility,
        armorClassOverride: Number.isNaN(acOverride) ? undefined : acOverride,
        maxHpOverride: Number.isNaN(hpOverride) ? undefined : hpOverride,
      })

      const { data, error } = await supabase
        .from('npcs')
        .insert({
          campaign_id: campaignId,
          created_by: user.uid,
          status: "alive",
          knowledge: [],
          ...payload,
        })
        .select(SELECT_COLUMNS)
        .single()

      if (error) throw error
      toast({ title: "Importado para o Bestiário", description: `${payload.name} foi adicionado à campanha.` })
      setNpcs((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setImportingMonster(null)
      setActiveTab("bestiary")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao importar", description: e.message })
    } finally {
      setImporting(false)
    }
  }

  const isCombatType = COMBAT_TYPES.has(npcData.npc_type)

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 sm:pb-10 border-white/5 gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tighter text-accent flex items-center gap-3 sm:gap-4">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" /> População da Crônica
          </h1>
          <p className="text-muted-foreground mt-3 font-heading text-base sm:text-lg lg:text-xl italic">Aliados, inimigos e almas perdidas que cruzam o caminho dos heróis.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou papel..."
              className="pl-10 bg-card/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isMaster && (
            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (open) setNpcData({ ...EMPTY_NPC_FORM }) }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 literary-shadow rounded-full px-8 w-full sm:w-auto shrink-0">
                  <UserPlus className="mr-2 h-4 w-4" /> Novo NPC
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-accent/30 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display text-accent">Evocar Personagem</DialogTitle>
                </DialogHeader>
                <NpcForm form={npcData} setForm={setNpcData} isCombatType={isCombatType} />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button disabled={loading || !npcData.name} onClick={handleCreateNPC} className="bg-primary px-10">
                    {loading ? "Evocando..." : "Finalizar Criação"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full overflow-x-auto gap-1 bg-black/30 p-1 sm:flex-wrap">
          <TabsTrigger value="all" className="shrink-0 whitespace-nowrap">Todos</TabsTrigger>
          <TabsTrigger value="main" className="shrink-0 whitespace-nowrap">Principais</TabsTrigger>
          <TabsTrigger value="mob" className="shrink-0 whitespace-nowrap">Mobs</TabsTrigger>
          <TabsTrigger value="boss" className="shrink-0 whitespace-nowrap">Bosses</TabsTrigger>
          <TabsTrigger value="ally" className="shrink-0 whitespace-nowrap">Aliados</TabsTrigger>
          <TabsTrigger value="merchant" className="shrink-0 whitespace-nowrap">Comerciantes</TabsTrigger>
          {isMaster && <TabsTrigger value="srd" className="shrink-0 whitespace-nowrap">Biblioteca SRD</TabsTrigger>}
          <TabsTrigger value="bestiary" className="shrink-0 whitespace-nowrap">Bestiário</TabsTrigger>
        </TabsList>

        {["all", "main", "mob", "boss", "ally", "merchant", "bestiary"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="pt-6 sm:pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {loadingNpcs ? (
                <div className="col-span-full p-8 sm:p-12 lg:p-20 text-center italic opacity-50">Consultando o oráculo populacional...</div>
              ) : filteredNpcs.length > 0 ? (
                filteredNpcs.map((npc: any) => (
                  <NpcCard
                    key={npc.id}
                    npc={npc}
                    isMaster={isMaster}
                    campaignId={campaignId}
                    onUpdateImage={handleUpdateNpcImage}
                    onKill={handleKillNPC}
                    onEdit={() => { setEditingNpc(npc); setNpcData(npcToFormState(npc)) }}
                  />
                ))
              ) : (
                <div className="col-span-full p-8 sm:p-12 lg:p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
                  <p className="text-muted-foreground font-heading italic text-base sm:text-lg">
                    {tabValue === "bestiary"
                      ? "Nenhuma criatura no Bestiário ainda. Importe da Biblioteca SRD ou crie um Mob/Boss."
                      : "O silêncio ecoa nas ruas de Arvand. Nenhum NPC encontrado."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}

        {isMaster && (
          <TabsContent value="srd" className="pt-6 sm:pt-8 space-y-6 sm:space-y-8">
            <div className="rounded-2xl border border-white/5 bg-card/30 p-4 space-y-4">
              <p className="text-sm text-muted-foreground font-heading italic">
                Modelos de monstros do SRD 5.1 (CC-BY-4.0). Importar cria uma cópia editável no Bestiário desta campanha —
                nada aqui é salvo automaticamente.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome..." className="pl-10 bg-background/50" value={srdSearch} onChange={e => setSrdSearch(e.target.value)} />
                </div>
                <Select value={srdType} onValueChange={setSrdType}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {srdTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={srdChallenge} onValueChange={setSrdChallenge}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="ND/CR" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os ND/CR</SelectItem>
                    {srdChallenges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredSrdMonsters.map((monster) => (
                <Card key={monster.id} className="bg-card/30 border-white/5 hover:border-accent/30 transition-all">
                  <CardHeader>
                    <CardTitle className="text-xl font-display flex items-center justify-between">
                      <span>{monster.portugueseName}</span>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{monster.challengeRating}</Badge>
                    </CardTitle>
                    <CardDescription className="font-heading italic">
                      {monster.name} · {monster.type} · {monster.size}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-black/20 p-2">
                        <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">CA</span>
                        <span className="font-bold text-base">{monster.armorClass}</span>
                      </div>
                      <div className="rounded-lg bg-black/20 p-2">
                        <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">PV</span>
                        <span className="font-bold text-base">{monster.hitPoints}</span>
                      </div>
                      <div className="rounded-lg bg-black/20 p-2">
                        <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">Desl.</span>
                        <span className="font-bold text-base">{monster.speed.walk ?? monster.speed.fly ?? monster.speed.swim ?? "—"} ft</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ataques</span>
                      <p className="line-clamp-2">{monster.actions.map(a => a.name).join(", ")}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Comportamento</span>
                      <p className="line-clamp-2 italic text-muted-foreground">{monster.behaviorHint}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full rounded-full bg-primary/90" onClick={() => openImportModal(monster)}>
                      <BookOpen className="mr-2 h-4 w-4" /> Importar para Bestiário
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de edição (TAREFA 3) */}
      <Dialog open={!!editingNpc} onOpenChange={(open) => { if (!open) setEditingNpc(null) }}>
        <DialogContent className="bg-card border-accent/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-accent">Editar {editingNpc?.name}</DialogTitle>
          </DialogHeader>
          <NpcForm form={npcData} setForm={setNpcData} isCombatType={isCombatType} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingNpc(null)}>Cancelar</Button>
            <Button disabled={loading || !npcData.name} onClick={handleUpdateNPC} className="bg-primary px-10">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de importação SRD -> Bestiário (TAREFA 6) */}
      <Dialog open={!!importingMonster} onOpenChange={(open) => { if (!open) setImportingMonster(null) }}>
        <DialogContent className="bg-card border-accent/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-accent">
              Importar {importingMonster?.portugueseName}
            </DialogTitle>
            <DialogDescription>
              Ajuste os dados antes de adicionar ao Bestiário desta campanha. A IA Mestre não poderá controlar este NPC
              até que você habilite manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest">Nome na campanha</Label>
              <Input value={importForm.name} onChange={e => setImportForm({ ...importForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Tipo</Label>
                <Select value={importForm.npcType} onValueChange={(v) => setImportForm({ ...importForm, npcType: v as SrdImportNpcType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mob">Mob</SelectItem>
                    <SelectItem value="boss">Boss</SelectItem>
                    <SelectItem value="creature">Criatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Função</Label>
                <Select value={importForm.combatRole} onValueChange={(v) => setImportForm({ ...importForm, combatRole: v as SrdImportCombatRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enemy">Inimigo</SelectItem>
                    <SelectItem value="ally">Aliado</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">CA</Label>
                <Input type="number" value={importForm.armorClass} onChange={e => setImportForm({ ...importForm, armorClass: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">PV</Label>
                <Input type="number" value={importForm.maxHp} onChange={e => setImportForm({ ...importForm, maxHp: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest">Visibilidade</Label>
              <Select value={importForm.visibility} onValueChange={(v) => setImportForm({ ...importForm, visibility: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="master_only">Apenas Mestre</SelectItem>
                  <SelectItem value="visible">Visível aos Jogadores</SelectItem>
                  <SelectItem value="scene">Presente em Cena</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 p-3">
              <div>
                <Label className="uppercase text-[10px] font-bold tracking-widest">IA pode controlar?</Label>
                <p className="text-[10px] text-muted-foreground italic">Desativado por padrão. Habilite quando confiar no comportamento.</p>
              </div>
              <Switch checked={importForm.aiControlEnabled} onCheckedChange={(v) => setImportForm({ ...importForm, aiControlEnabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportingMonster(null)}>Cancelar</Button>
            <Button disabled={importing || !importForm.name} onClick={handleImportSrdMonster} className="bg-primary px-10">
              {importing ? "Importando..." : "Confirmar Importação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NpcCard({ npc, isMaster, campaignId, onUpdateImage, onKill, onEdit }: {
  npc: any
  isMaster: boolean
  campaignId: string
  onUpdateImage: (npcId: string, asset: MediaAsset) => void
  onKill: (npcId: string, npcName: string) => void
  onEdit: () => void
}) {
  const npcType = npc.npc_type || "main"
  return (
    <Card className={`bg-card/30 border-white/5 hover:border-accent/30 transition-all group overflow-hidden ${npc.status === 'dead' ? 'grayscale opacity-60' : ''}`}>
      <div className="relative h-48 bg-muted">
        {npc.image_url ? (
          <img
            src={npc.image_url}
            alt={npc.name}
            className="object-cover w-full h-full opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary/50">
            {COMBAT_TYPES.has(npcType) ? <Swords className="h-12 w-12" /> : <Users className="h-12 w-12" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[80%]">
          <Badge className={`uppercase tracking-widest text-[9px] ${npc.status === 'alive' ? 'bg-primary' : 'bg-destructive'}`}>
            {npc.status === 'alive' ? 'Vivo' : 'Morto'}
          </Badge>
          <Badge variant="outline" className={`text-[9px] uppercase tracking-widest ${NPC_TYPE_BADGE_CLASS[npcType] || 'bg-background/50'}`}>
            {NPC_TYPE_LABEL[npcType] || npcType}
          </Badge>
          {npc.combat_role && (
            <Badge variant="outline" className="text-[9px] bg-background/50 uppercase tracking-widest">
              {COMBAT_ROLE_LABEL[npc.combat_role] || npc.combat_role}
            </Badge>
          )}
        </div>
        {isMaster && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="absolute bottom-3 right-3 bg-background/70 border border-white/10 rounded-full h-9 w-9">
                <ImagePlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-accent/30 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Token/Imagem de {npc.name}</DialogTitle>
              </DialogHeader>
              <R2ImageUpload
                campaignId={campaignId}
                usageType="npc_token"
                visibility={npc.visibility === 'master_only' ? 'master_only' : 'party'}
                label="Adicionar token/imagem"
                mode="direct"
                entityType="npc"
                entityId={npc.id}
                onUploaded={(asset) => onUpdateImage(npc.id, asset)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-display flex justify-between items-center">
          {npc.name}
          {npc.status === 'dead' && <Skull className="h-5 w-5 text-destructive" />}
        </CardTitle>
        <CardDescription className="font-heading italic min-h-[40px]">
          {npc.personality ? `"${npc.personality}"` : npc.role}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {COMBAT_TYPES.has(npcType) ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-black/20 p-2">
                <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">CA</span>
                <span className="font-bold text-base">{npc.armor_class ?? "—"}</span>
              </div>
              <div className="rounded-lg bg-black/20 p-2">
                <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">PV</span>
                <span className="font-bold text-base">{npc.current_hp ?? "—"}/{npc.max_hp ?? "—"}</span>
              </div>
              <div className="rounded-lg bg-black/20 p-2">
                <span className="block text-[9px] uppercase text-muted-foreground tracking-widest">ND</span>
                <span className="font-bold text-base">{npc.challenge_level ?? "—"}</span>
              </div>
            </div>
            {Array.isArray(npc.attacks) && npc.attacks.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ataques</span>
                <p className="text-xs line-clamp-2">{npc.attacks.map((a: any) => a.name).join(", ")}</p>
              </div>
            )}
            {npc.combat_behavior && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Comportamento</span>
                <p className="text-xs line-clamp-2 italic text-muted-foreground">{npc.combat_behavior}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Objetivos</span>
            <p className="text-xs line-clamp-2">{npc.goals}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {(npc.knowledge || []).map((k: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[8px] opacity-70">{k}</Badge>
          ))}
        </div>
        {isMaster && npc.secrets && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Segredos</span>
            <p className="text-xs line-clamp-2 text-primary/80">{npc.secrets}</p>
          </div>
        )}
        {isMaster && (
          <Badge variant="outline" className={`text-[9px] uppercase tracking-widest flex items-center gap-1 w-fit ${npc.ai_control_enabled ? 'border-accent/40 text-accent' : 'border-white/10 text-muted-foreground'}`}>
            {npc.ai_control_enabled ? <Bot className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
            {npc.ai_control_enabled ? "IA pode controlar" : "Controle manual"}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-white/5 pt-4 sm:pt-6 p-4 sm:p-6">
        {isMaster ? (
          <Button variant="ghost" size="sm" className="w-full hover:bg-white/5" onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" /> Editar
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="w-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed" disabled title="Apenas o mestre pode editar">
            <Edit2 className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
        {isMaster && npc.status === 'alive' && (
          <Button variant="outline" size="sm" className="w-full border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => onKill(npc.id, npc.name)}>
            <Skull className="mr-2 h-4 w-4" /> Matar
          </Button>
        )}
        {isMaster && COMBAT_TYPES.has(npcType) && npc.status === 'alive' && (
          <Button asChild variant="outline" size="sm" className="w-full col-span-2 border-primary/30 text-primary hover:bg-primary/10">
            <Link href={`/campaign/${campaignId}/combate`}>
              <SwordsIcon className="mr-2 h-4 w-4" /> Adicionar ao Combate
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function NpcForm({ form, setForm, isCombatType }: {
  form: NpcFormState
  setForm: React.Dispatch<React.SetStateAction<NpcFormState>>
  isCombatType: boolean
}) {
  const combatFields = (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-primary">
        <Swords className="h-4 w-4" />
        <span className="text-xs uppercase font-bold tracking-widest">Estatísticas de Combate</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Função de Combate</Label>
          <Select value={form.combat_role || "none"} onValueChange={(v) => setForm({ ...form, combat_role: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {COMBAT_ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Nível de Ameaça (ND/CR)</Label>
          <Input value={form.challenge_level} onChange={e => setForm({ ...form, challenge_level: e.target.value })} placeholder="Ex: 1/4, 2, 5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">CA</Label>
          <Input type="number" value={form.armor_class} onChange={e => setForm({ ...form, armor_class: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">PV Máximo</Label>
          <Input type="number" value={form.max_hp} onChange={e => setForm({ ...form, max_hp: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">PV Atual</Label>
          <Input type="number" value={form.current_hp} onChange={e => setForm({ ...form, current_hp: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Movimento (m)</Label>
          <Input type="number" value={form.movement_meters} onChange={e => setForm({ ...form, movement_meters: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Qtd. Mínima</Label>
          <Input type="number" value={form.spawn_min} onChange={e => setForm({ ...form, spawn_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Qtd. Máxima</Label>
          <Input type="number" value={form.spawn_max} onChange={e => setForm({ ...form, spawn_max: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="uppercase text-[10px] font-bold tracking-widest">Ataques (um por linha: Nome: bônus, dano, tipo)</Label>
        <Textarea value={form.attacks_text} onChange={e => setForm({ ...form, attacks_text: e.target.value })} placeholder={"Mordida: +4, 1d6+2, piercing"} rows={3} />
      </div>
      <div className="space-y-2">
        <Label className="uppercase text-[10px] font-bold tracking-widest">Comportamento em Combate</Label>
        <Textarea value={form.combat_behavior} onChange={e => setForm({ ...form, combat_behavior: e.target.value })} placeholder="Ex: Ataca em grupo, foge se ferido." rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/5 p-3">
        <div>
          <Label className="uppercase text-[10px] font-bold tracking-widest flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> IA pode controlar?
          </Label>
          <p className="text-[10px] text-muted-foreground italic">O mestre precisa habilitar manualmente.</p>
        </div>
        <Switch checked={form.ai_control_enabled} onCheckedChange={(v) => setForm({ ...form, ai_control_enabled: v })} />
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Nome do NPC</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mestre Thaddeus" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-bold tracking-widest">Tipo de NPC</Label>
            <Select value={form.npc_type} onValueChange={(v) => setForm({ ...form, npc_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NPC_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-bold tracking-widest">Papel/Ocupação</Label>
            <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Ex: Guardião da Biblioteca" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Personalidade</Label>
          <Textarea value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} placeholder="Ex: Ranzinza, mas protetor dos livros." />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as NpcFormState["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alive">Vivo</SelectItem>
              <SelectItem value="dead">Morto</SelectItem>
              <SelectItem value="missing">Desaparecido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Objetivos</Label>
          <Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="Ex: Preservar o segredo do portal." />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Conhecimentos (separados por vírgula)</Label>
          <Input value={form.knows} onChange={e => setForm({ ...form, knows: e.target.value })} placeholder="Ex: Local do Templo, Senha da Torre" />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Segredos do Mestre</Label>
          <Textarea value={form.secrets} onChange={e => setForm({ ...form, secrets: e.target.value })} placeholder="Não aparece para jogadores." />
        </div>
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-bold tracking-widest">Visibilidade</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
            <option value="master_only">Apenas Mestre</option>
            <option value="visible">Visível aos Jogadores</option>
            <option value="scene">Presente em Cena</option>
          </select>
        </div>
      </div>

      <div className="md:col-span-2">
        {isCombatType ? combatFields : (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" type="button" className="w-full justify-between border-white/10">
                <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                  <Swords className="h-4 w-4" /> Estatísticas de Combate (opcional)
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              {combatFields}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
