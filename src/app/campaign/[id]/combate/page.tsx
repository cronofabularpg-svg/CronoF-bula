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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
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
  Dices,
  Crown,
} from "lucide-react"

type Combat = {
  id: string
  campaign_id: string
  session_id: string | null
  scene_id: string | null
  title: string
  status: string
  round_number: number
  current_turn_index: number
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
  conditions: string[] | null
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

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  defeated: "Derrotado",
  dead: "Morto",
  fled: "Fugiu",
  inactive: "Inativo",
}

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

  const [campaignCharacters, setCampaignCharacters] = React.useState<CampaignCharacter[]>([])
  const [campaignNpcs, setCampaignNpcs] = React.useState<CampaignNpc[]>([])

  // Estado do modal "Iniciar Combate"
  const [startOpen, setStartOpen] = React.useState(false)
  const [combatTitle, setCombatTitle] = React.useState("")
  const [selectedCharacters, setSelectedCharacters] = React.useState<Record<string, SelectedCombatant>>({})
  const [selectedNpcs, setSelectedNpcs] = React.useState<Record<string, SelectedCombatant>>({})
  const [manualEnemies, setManualEnemies] = React.useState<ManualEnemy[]>([])
  const [startSubmitting, setStartSubmitting] = React.useState(false)

  // Estado do modal de ações do mestre por participante
  const [manageParticipant, setManageParticipant] = React.useState<Participant | null>(null)
  const [damageAmount, setDamageAmount] = React.useState("")
  const [damageType, setDamageType] = React.useState("")
  const [healAmount, setHealAmount] = React.useState("")
  const [conditionLabel, setConditionLabel] = React.useState("")
  const [actionSubmitting, setActionSubmitting] = React.useState(false)

  // Estado do diálogo de rolagem do jogador
  const [rollOpen, setRollOpen] = React.useState(false)
  const [rollFormulaInput, setRollFormulaInput] = React.useState("1d20")
  const [rollReason, setRollReason] = React.useState("")
  const [physicalResult, setPhysicalResult] = React.useState("")
  const [rollSubmitting, setRollSubmitting] = React.useState(false)

  const [turnSubmitting, setTurnSubmitting] = React.useState(false)
  const [endSubmitting, setEndSubmitting] = React.useState(false)

  const loadCombat = React.useCallback(async () => {
    if (!campaignId) return
    const supabase = createClient()

    const { data: combatData } = await supabase
      .from('combats')
      .select('id, campaign_id, session_id, scene_id, title, status, round_number, current_turn_index')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setCombat((combatData as Combat | null) ?? null)

    if (combatData) {
      const { data: participantsData } = await supabase
        .from('combat_participants')
        .select('id, character_id, npc_id, name, participant_type, initiative, armor_class, current_hp, max_hp, turn_order, status, conditions')
        .eq('combat_id', combatData.id)
        .order('turn_order', { ascending: true })

      setParticipants((participantsData as Participant[]) || [])
    } else {
      setParticipants([])
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

  // Realtime: recarrega o combate quando combats/combat_participants mudarem.
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, loadCombat])

  const currentTurnParticipant = React.useMemo(() => {
    if (!combat || participants.length === 0) return null
    return participants[combat.current_turn_index] || null
  }, [combat, participants])

  const isMyTurn = !!(currentTurnParticipant && myCharacter && currentTurnParticipant.character_id === myCharacter.id)

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
    setConditionLabel("")
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
    if (!manageParticipant) return
    if (!conditionLabel.trim()) {
      toast({ variant: "destructive", title: "Informe a condição", description: "Digite o nome da condição a aplicar." })
      return
    }

    setActionSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('apply_combat_condition', {
      target_participant_id: manageParticipant.id,
      condition_label: conditionLabel.trim(),
    })
    setActionSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao aplicar condição", description: error.message })
      return
    }
    setConditionLabel("")
    await loadCombat()
  }

  function openRoll() {
    setRollFormulaInput("1d20")
    setRollReason("")
    setPhysicalResult("")
    setRollOpen(true)
  }

  async function submitRoll(kind: 'virtual' | 'physical', reasonLabel: string) {
    if (!user) return

    let total: number | null = null
    let formula = rollFormulaInput.trim()

    if (kind === 'virtual') {
      total = rollFormula(formula)
      if (total === null) {
        toast({ variant: "destructive", title: "Fórmula inválida", description: "Use o formato NdM (ex.: 1d20, 2d6+3)." })
        return
      }
    } else {
      const parsed = parseInt(physicalResult, 10)
      if (isNaN(parsed)) {
        toast({ variant: "destructive", title: "Resultado inválido", description: "Informe o número que saiu no dado físico." })
        return
      }
      total = parsed
      formula = formula || 'físico'
    }

    setRollSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: combat?.session_id ?? activeSession?.id ?? null,
      scene_id: combat?.scene_id ?? activeScene?.id ?? null,
      character_id: myCharacter?.id ?? null,
      user_id: user.uid,
      roll_type: kind,
      formula,
      raw_result: total,
      modifier: 0,
      total,
      reason: rollReason.trim() || reasonLabel,
      visibility: 'scene',
    })
    setRollSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar rolagem", description: error.message })
      return
    }

    toast({ title: "Rolagem registrada", description: `${reasonLabel}: ${total}` })
    setRollOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050711]">
        <p className="text-muted-foreground font-heading italic">Carregando combate...</p>
      </div>
    )
  }

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

          {combat && !isMaster && (
            <Dialog open={rollOpen} onOpenChange={setRollOpen}>
              <DialogTrigger asChild>
                <Button onClick={openRoll} className="btn-ritual rounded-full px-6 shadow-arcane">
                  <Dices className="h-4 w-4 mr-2" />
                  Rolar Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl text-primary">Rolar Dados</DialogTitle>
                  {isMyTurn && (
                    <DialogDescription>É o seu turno!</DialogDescription>
                  )}
                </DialogHeader>

                <Tabs defaultValue="ataque" className="w-full">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-black/30">
                    <TabsTrigger value="ataque">Ataque</TabsTrigger>
                    <TabsTrigger value="dano">Dano</TabsTrigger>
                    <TabsTrigger value="teste">Teste</TabsTrigger>
                    <TabsTrigger value="iniciativa">Iniciativa</TabsTrigger>
                  </TabsList>

                  {(['ataque', 'dano', 'teste', 'iniciativa'] as const).map((kind) => (
                    <TabsContent key={kind} value={kind} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Fórmula</Label>
                        <Input
                          value={rollFormulaInput}
                          onChange={(e) => setRollFormulaInput(e.target.value)}
                          placeholder="Ex.: 1d20+3"
                          className="bg-black/30 border-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo (opcional)</Label>
                        <Input
                          value={rollReason}
                          onChange={(e) => setRollReason(e.target.value)}
                          placeholder="Ex.: Ataque com espada longa"
                          className="bg-black/30 border-primary/20"
                        />
                      </div>
                      <Button
                        onClick={() => submitRoll('virtual', kind.charAt(0).toUpperCase() + kind.slice(1))}
                        disabled={rollSubmitting}
                        className="w-full btn-ritual rounded-full"
                      >
                        Rolar
                      </Button>

                      <Separator className="bg-primary/10" />

                      <div className="space-y-2">
                        <Label>Registrar rolagem física (dado de mesa)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={physicalResult}
                            onChange={(e) => setPhysicalResult(e.target.value)}
                            placeholder="Resultado no dado"
                            className="bg-black/30 border-primary/20"
                          />
                          <Button
                            onClick={() => submitRoll('physical', kind.charAt(0).toUpperCase() + kind.slice(1))}
                            disabled={rollSubmitting}
                            variant="outline"
                            className="border-primary/30 whitespace-nowrap"
                          >
                            Registrar
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </DialogContent>
            </Dialog>
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

      {/* Participantes */}
      {combat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {participants.map((p) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              isMaster={isMaster}
              onManage={() => openManage(p)}
            />
          ))}
        </div>
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

      {/* Modal de gerenciamento do participante (mestre) */}
      <Dialog open={!!manageParticipant} onOpenChange={(open) => { if (!open) setManageParticipant(null) }}>
        <DialogContent className="max-w-md bg-[#0b0e1c] border-primary/20">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-accent"><ShieldPlus className="h-4 w-4" /> Aplicar condição</Label>
              <div className="flex gap-2">
                <Input value={conditionLabel} onChange={(e) => setConditionLabel(e.target.value)} placeholder="Ex.: Envenenado" className="bg-black/30 border-primary/20" />
                <Button onClick={handleApplyCondition} disabled={actionSubmitting} variant="outline" className="border-accent/40 text-accent whitespace-nowrap">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ParticipantCard({
  participant,
  isMaster,
  onManage,
}: {
  participant: Participant
  isMaster: boolean
  onManage: () => void
}) {
  const hpPercent = participant.max_hp && participant.max_hp > 0
    ? Math.max(0, Math.min(100, ((participant.current_hp ?? 0) / participant.max_hp) * 100))
    : null

  const isEnemy = participant.participant_type === 'enemy'
  const isDefeated = participant.status !== 'active'

  return (
    <Card className={`bg-card/40 border-primary/10 rounded-[2rem] p-5 space-y-3 ${isDefeated ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black tracking-tight text-lg truncate">{participant.name}</h3>
        {isEnemy ? (
          <Skull className="h-4 w-4 text-destructive/60" />
        ) : (
          <Crown className="h-4 w-4 text-primary/60" />
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

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] border-primary/20">
          {STATUS_LABEL[participant.status] || participant.status}
        </Badge>
        {participant.conditions && participant.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {participant.conditions.map((c, i) => (
              <Badge key={i} className="text-[9px] bg-accent/20 text-accent border-accent/30">{c}</Badge>
            ))}
          </div>
        )}
      </div>

      {isMaster && (
        <Button onClick={onManage} variant="outline" size="sm" className="w-full rounded-full border-primary/30 text-primary">
          Gerenciar
        </Button>
      )}
    </Card>
  )
}
