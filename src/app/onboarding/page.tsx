
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  User,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Camera,
  Crown,
  MapPin,
  Trash2,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const DND_RACES = [
  { id: "human", name: "Humano" },
  { id: "elf", name: "Elfo" },
  { id: "dwarf", name: "Anão" },
  { id: "halfling", name: "Halfling" },
  { id: "dragonborn", name: "Draconato" },
  { id: "tiefling", name: "Tiefling" },
  { id: "gnome", name: "Gnomo" },
  { id: "half-orc", name: "Meio-Orc" },
  { id: "half-elf", name: "Meio-Elfo" },
  { id: "goblin", name: "Goblin (Toca)" }
];

const DND_CLASSES = [
  { id: "fighter", name: "Guerreiro" },
  { id: "wizard", name: "Mago" },
  { id: "rogue", name: "Ladino" },
  { id: "cleric", name: "Clérigo" },
  { id: "paladin", name: "Paladino" },
  { id: "ranger", name: "Patrulheiro" },
  { id: "bard", name: "Bardo" },
  { id: "druid", name: "Druida" },
  { id: "barbarian", name: "Bárbaro" },
  { id: "sorcerer", name: "Feiticeiro" },
  { id: "warlock", name: "Bruxo" },
  { id: "monk", name: "Monge" }
];

const NARRATIVE_GENRES = [
  { id: "heroic_fantasy", name: "Fantasia Heroica" },
  { id: "dark_fantasy", name: "Fantasia Sombria" },
  { id: "political", name: "Intriga Política" },
  { id: "exploration", name: "Exploração" },
  { id: "horror", name: "Terror" },
  { id: "mystery", name: "Mistério" },
  { id: "sandbox", name: "Sandbox Aberto" }
];

const AI_ROLES = [
  { id: "assistant", name: "Assistente (apoia o Mestre)" },
  { id: "narrator", name: "Narrador Auxiliar" },
  { id: "oracle", name: "Oráculo Solo" }
];

type Step = 'role' | 'basics' | 'narrative' | 'character' | 'done'

const MASTER_STEPS: Step[] = ['role', 'basics', 'narrative', 'character', 'done']
const PLAYER_STEPS: Step[] = ['role', 'character', 'done']

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = React.useState<Step>('role');
  const [role, setRole] = React.useState<'master' | 'player' | null>(null);
  const [loading, setLoading] = React.useState(false)

  const [campaignId, setCampaignId] = React.useState<string>("");
  const [campaignData, setCampaignData] = React.useState({
    name: "",
    system: "dnd5e",
    tone: "heroic_fantasy",
    aiEnabled: true
  })

  const [narrativeData, setNarrativeData] = React.useState({
    premise: "",
    initialLore: "",
    factions: "",
    mainThreat: "",
    masterSecret: "",
    coverImageUrl: "",
    startingLevel: 1,
    aiRole: "assistant",
    soloRequiresApproval: true,
  })

  const [initialNpcs, setInitialNpcs] = React.useState<{ name: string; description: string }[]>([])
  const [initialLocations, setInitialLocations] = React.useState<{ name: string; description: string }[]>([])

  const [characterData, setCharacterData] = React.useState({
    name: "",
    race: "human",
    class: "fighter",
    level: 1,
    photoURL: ""
  })

  const stepOrder = role === 'player' ? PLAYER_STEPS : MASTER_STEPS
  const stepIndex = stepOrder.indexOf(step) + 1
  const totalSteps = stepOrder.length

  function prevStep() {
    if (step === 'character') {
      setStep(role === 'player' ? 'role' : 'narrative')
    } else if (step === 'narrative') {
      setStep('basics')
    } else if (step === 'basics') {
      setStep('role')
    }
  }

  function addInitialNpc() {
    setInitialNpcs(prev => [...prev, { name: "", description: "" }])
  }
  function updateInitialNpc(index: number, field: 'name' | 'description', value: string) {
    setInitialNpcs(prev => prev.map((n, i) => i === index ? { ...n, [field]: value } : n))
  }
  function removeInitialNpc(index: number) {
    setInitialNpcs(prev => prev.filter((_, i) => i !== index))
  }

  function addInitialLocation() {
    setInitialLocations(prev => [...prev, { name: "", description: "" }])
  }
  function updateInitialLocation(index: number, field: 'name' | 'description', value: string) {
    setInitialLocations(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }
  function removeInitialLocation(index: number) {
    setInitialLocations(prev => prev.filter((_, i) => i !== index))
  }

  async function handleCreateCampaign() {
    if (!user) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          owner_id: user.uid,
          name: campaignData.name,
          system_key: campaignData.system,
          tone: campaignData.tone,
          ai_enabled: campaignData.aiEnabled,
        })
        .select('id')
        .single()

      if (error || !data) throw error || new Error("Falha ao criar a campanha.")

      setCampaignId(data.id)
      toast({ title: "Campanha Criada!", description: `${campaignData.name} aguarda seus jogadores.` })
      setStep('narrative')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar lenda", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNarrative() {
    if (!campaignId || !user) {
      setStep('character')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

      const campaignUpdates: Record<string, any> = {}
      if (narrativeData.premise.trim()) campaignUpdates.description = narrativeData.premise.trim()
      if (narrativeData.coverImageUrl.trim()) campaignUpdates.cover_image_url = narrativeData.coverImageUrl.trim()

      if (Object.keys(campaignUpdates).length > 0) {
        const { error } = await supabase.from('campaigns').update(campaignUpdates).eq('id', campaignId)
        if (error) throw error
      }

      const { error: settingsError } = await supabase
        .from('campaign_settings')
        .update({
          starting_level: narrativeData.startingLevel,
          ai_default_mode: narrativeData.aiRole,
          solo_requires_approval: narrativeData.soloRequiresApproval,
        })
        .eq('campaign_id', campaignId)
      if (settingsError) throw settingsError

      const nowIso = new Date().toISOString()
      const memoryEntries: Record<string, any>[] = []
      if (narrativeData.initialLore.trim()) {
        memoryEntries.push({
          campaign_id: campaignId, source_type: 'onboarding', memory_type: 'lore',
          title: 'Lore Inicial', content: narrativeData.initialLore.trim(),
          visibility: 'party', importance: 'high',
          created_by: user.uid, approved_by: user.uid, approved_at: nowIso,
        })
      }
      if (narrativeData.factions.trim()) {
        memoryEntries.push({
          campaign_id: campaignId, source_type: 'onboarding', memory_type: 'faction',
          title: 'Reinos e Facções', content: narrativeData.factions.trim(),
          visibility: 'party', importance: 'normal',
          created_by: user.uid, approved_by: user.uid, approved_at: nowIso,
        })
      }
      if (narrativeData.mainThreat.trim()) {
        memoryEntries.push({
          campaign_id: campaignId, source_type: 'onboarding', memory_type: 'threat',
          title: 'Ameaça Principal', content: narrativeData.mainThreat.trim(),
          visibility: 'party', importance: 'high',
          created_by: user.uid, approved_by: user.uid, approved_at: nowIso,
        })
      }
      if (narrativeData.masterSecret.trim()) {
        memoryEntries.push({
          campaign_id: campaignId, source_type: 'onboarding', memory_type: 'secret',
          title: 'Segredo do Mestre', content: narrativeData.masterSecret.trim(),
          visibility: 'master_only', importance: 'high',
          created_by: user.uid, approved_by: user.uid, approved_at: nowIso,
        })
      }
      if (memoryEntries.length > 0) {
        const { error: memoryError } = await supabase.from('campaign_memory').insert(memoryEntries)
        if (memoryError) throw memoryError
      }

      const npcRows = initialNpcs
        .filter(n => n.name.trim())
        .map(n => ({
          campaign_id: campaignId,
          name: n.name.trim(),
          description: n.description.trim() || null,
          visibility: 'known',
          status: 'alive',
          created_by: user.uid,
        }))
      if (npcRows.length > 0) {
        const { error: npcError } = await supabase.from('npcs').insert(npcRows)
        if (npcError) throw npcError
      }

      const locationRows = initialLocations
        .filter(l => l.name.trim())
        .map(l => ({
          campaign_id: campaignId,
          name: l.name.trim(),
          description: l.description.trim() || null,
          type: 'landmark',
          visibility: 'visible',
          status: 'active',
          created_by: user.uid,
        }))
      if (locationRows.length > 0) {
        const { error: locationError } = await supabase.from('locations').insert(locationRows)
        if (locationError) throw locationError
      }

      toast({ title: "Mundo Construído!", description: "A lore inicial foi registrada nos anais da campanha." })
      setStep('character')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Salvar Lore", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCharacter() {
    if (!user) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('characters')
        .insert({
          campaign_id: campaignId || null,
          owner_user_id: user.uid,
          name: characterData.name,
          race: characterData.race,
          class: characterData.class,
          level: characterData.level,
          avatar_url: characterData.photoURL || null,
        })

      if (error) throw error

      toast({ title: "Personagem Criado!", description: `${characterData.name} está pronto para a aventura.` })
      setStep('done')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar herói", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12">
        {step === 'role' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo {stepIndex} de {totalSteps}</div>
              <h1 className="text-5xl font-display font-black tracking-tighter">Bem-vindo ao Cronofábula</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Qual será seu papel inicial nesta jornada?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RoleCard
                icon={<ShieldCheck className="h-10 w-10" />}
                title="Sou Mestre"
                desc="Quero criar um mundo, gerenciar campanhas e narrar histórias baseadas em D&D 5e."
                active={role === 'master'}
                onClick={() => { setRole('master'); setStep('basics'); }}
              />
              <RoleCard
                icon={<User className="h-10 w-10" />}
                title="Sou Jogador"
                desc="Quero entrar em uma campanha existente ou jogar sozinho com o Oráculo."
                active={role === 'player'}
                onClick={() => router.push('/dashboard')}
              />
            </div>
          </div>
        )}

        {step === 'basics' && role === 'master' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo {stepIndex} de {totalSteps}</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Inicie sua Crônica</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Defina os pilares do seu novo mundo.</p>
            </div>

            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome da Campanha</Label>
                      <Input
                        placeholder="Ex: O Retorno dos Antigos"
                        value={campaignData.name}
                        onChange={e => setCampaignData({...campaignData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Sistema de Regras</Label>
                      <Select value={campaignData.system} onValueChange={v => setCampaignData({...campaignData, system: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dnd5e">D&D 5e (SRD Oficial)</SelectItem>
                          <SelectItem value="custom">Sistema Customizado (D20)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Tom / Gênero Narrativo</Label>
                      <Select value={campaignData.tone} onValueChange={v => setCampaignData({...campaignData, tone: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NARRATIVE_GENRES.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Oráculo D&D Ativo</Label>
                        <p className="text-xs text-muted-foreground italic">IA auxiliar com conhecimento estrito do manual.</p>
                      </div>
                      <Switch
                        checked={campaignData.aiEnabled}
                        onCheckedChange={v => setCampaignData({...campaignData, aiEnabled: v})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button disabled={loading || !campaignData.name} onClick={handleCreateCampaign} className="bg-primary hover:bg-primary/90 rounded-full px-10">
                {loading ? "Invocando Mundo..." : "Continuar"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'narrative' && role === 'master' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo {stepIndex} de {totalSteps}</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Construa o Mundo</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Tudo aqui é opcional, mas dá vida à sua crônica desde o primeiro instante.</p>
            </div>

            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Premissa Central</Label>
                    <Textarea
                      rows={3}
                      placeholder="Em uma frase: do que trata esta crônica?"
                      value={narrativeData.premise}
                      onChange={e => setNarrativeData({...narrativeData, premise: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Lore Inicial</Label>
                    <Textarea
                      rows={3}
                      placeholder="História, geografia ou costumes que o grupo já conhece."
                      value={narrativeData.initialLore}
                      onChange={e => setNarrativeData({...narrativeData, initialLore: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Reinos e Facções</Label>
                    <Textarea
                      rows={3}
                      placeholder="Quem detém o poder e o que disputam?"
                      value={narrativeData.factions}
                      onChange={e => setNarrativeData({...narrativeData, factions: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Ameaça Principal</Label>
                    <Textarea
                      rows={3}
                      placeholder="O que paira sobre o mundo, visível aos jogadores."
                      value={narrativeData.mainThreat}
                      onChange={e => setNarrativeData({...narrativeData, mainThreat: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
                      <Crown className="h-3 w-3 text-primary" /> Segredo do Mestre <span className="opacity-40 normal-case font-normal">(visível apenas para você)</span>
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="A verdade oculta que guiará suas reviravoltas."
                      value={narrativeData.masterSecret}
                      onChange={e => setNarrativeData({...narrativeData, masterSecret: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nível Inicial</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={narrativeData.startingLevel}
                      onChange={e => setNarrativeData({...narrativeData, startingLevel: Math.max(1, Math.min(20, Number(e.target.value) || 1))})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Papel da IA</Label>
                    <Select value={narrativeData.aiRole} onValueChange={v => setNarrativeData({...narrativeData, aiRole: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_ROLES.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
                      <ImageIcon className="h-3 w-3 text-primary" /> Capa (URL)
                    </Label>
                    <Input
                      placeholder="https://..."
                      value={narrativeData.coverImageUrl}
                      onChange={e => setNarrativeData({...narrativeData, coverImageUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Jornada Solo exige aprovação do Mestre</Label>
                    <p className="text-xs text-muted-foreground italic">Eventos solo dos jogadores aguardam validação antes de virarem cânone.</p>
                  </div>
                  <Switch
                    checked={narrativeData.soloRequiresApproval}
                    onCheckedChange={v => setNarrativeData({...narrativeData, soloRequiresApproval: v})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
                        <User className="h-3 w-3 text-primary" /> NPCs Iniciais
                      </Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addInitialNpc} className="text-primary hover:text-primary h-7 px-2">
                        <PlusCircle className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {initialNpcs.length === 0 && (
                      <p className="text-xs text-muted-foreground italic opacity-60">Nenhum NPC inicial adicionado.</p>
                    )}
                    <div className="space-y-3">
                      {initialNpcs.map((npc, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 relative">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeInitialNpc(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Input
                            placeholder="Nome do NPC"
                            value={npc.name}
                            onChange={e => updateInitialNpc(i, 'name', e.target.value)}
                            className="pr-8"
                          />
                          <Textarea
                            rows={2}
                            placeholder="Curta descrição (papel, aparência, motivação)"
                            value={npc.description}
                            onChange={e => updateInitialNpc(i, 'description', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary" /> Locais Iniciais
                      </Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addInitialLocation} className="text-primary hover:text-primary h-7 px-2">
                        <PlusCircle className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {initialLocations.length === 0 && (
                      <p className="text-xs text-muted-foreground italic opacity-60">Nenhum local inicial adicionado.</p>
                    )}
                    <div className="space-y-3">
                      {initialLocations.map((loc, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 relative">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeInitialLocation(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Input
                            placeholder="Nome do local"
                            value={loc.name}
                            onChange={e => updateInitialLocation(i, 'name', e.target.value)}
                            className="pr-8"
                          />
                          <Textarea
                            rows={2}
                            placeholder="Curta descrição (o que torna este lugar notável)"
                            value={loc.description}
                            onChange={e => updateInitialLocation(i, 'description', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button disabled={loading} onClick={handleSaveNarrative} className="bg-primary hover:bg-primary/90 rounded-full px-10">
                {loading ? "Gravando Lore..." : "Continuar"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'character' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo {stepIndex} de {totalSteps}</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Sua Identidade</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Escolha sua raça, classe e imagem oficial.</p>
            </div>

            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome do Personagem</Label>
                      <Input
                        placeholder="Ex: Eldric, o Audaz"
                        value={characterData.name}
                        onChange={e => setCharacterData({...characterData, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Raça</Label>
                        <Select value={characterData.race} onValueChange={v => setCharacterData({...characterData, race: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_RACES.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Classe</Label>
                        <Select value={characterData.class} onValueChange={v => setCharacterData({...characterData, class: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_CLASSES.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">URL do Retrato</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Link da imagem..."
                          value={characterData.photoURL}
                          onChange={e => setCharacterData({...characterData, photoURL: e.target.value})}
                        />
                        <div className="h-10 w-10 shrink-0 bg-primary/20 border border-primary/30 rounded-md flex items-center justify-center overflow-hidden">
                          {characterData.photoURL ? (
                            <img src={characterData.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                       <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Resumo das Regras</h4>
                       <p className="text-xs text-muted-foreground italic leading-relaxed">
                         Como um(a) {DND_RACES.find(r => r.id === characterData.race)?.name} {DND_CLASSES.find(c => c.id === characterData.class)?.name}, você começa no Nível 1 com as habilidades básicas do SRD. O Oráculo guiará suas rolagens de atributos em breve.
                       </p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl text-center">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Dica Arcana</p>
                       <p className="text-xs italic text-muted-foreground">"Um herói sem rosto é uma lenda esquecida. Adicione uma imagem para ser reconhecido na Mesa Viva."</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button
                disabled={loading || !characterData.name}
                onClick={handleCreateCharacter}
                className="bg-primary hover:bg-primary/90 rounded-full px-10"
              >
                {loading ? "Invocando Herói..." : "Concluir"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
              <h1 className="text-6xl font-display font-black tracking-tighter">Sua Fábula Começou</h1>
              <p className="text-2xl font-heading italic text-muted-foreground max-w-2xl mx-auto">
                As leis de D&D 5e foram gravadas no pergaminho. O tempo agora corre a seu favor.
              </p>
            </div>
            <Button asChild size="lg" className="px-16 py-10 text-2xl font-display rounded-full btn-arcane border-2 border-accent">
              <Link href="/dashboard">Entrar na Mesa Viva</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleCard({ icon, title, desc, active, onClick }: { icon: React.ReactNode, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-10 rounded-3xl border-2 cursor-pointer transition-all duration-300 group ${active ? 'bg-primary/10 border-primary shadow-arcane' : 'bg-card/30 border-white/5 hover:border-primary/40'}`}
    >
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-colors ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground font-heading italic leading-relaxed">{desc}</p>
    </div>
  )
}
