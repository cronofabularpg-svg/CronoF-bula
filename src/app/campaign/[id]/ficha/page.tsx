
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Shield,
  Sword,
  Heart,
  Zap,
  Star,
  Sparkles,
  Info,
  Camera,
  Maximize2,
  Skull,
  Ghost,
  Droplets,
  Wine,
  Wind,
  Flame,
  Footprints,
  Shirt,
  Backpack,
  Plus,
  Minus,
  TrendingUp,
  Loader2,
  BookMarked,
  AlertTriangle,
  CheckCircle2,
  Wand2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"
import { CharacterSetupWizard } from "./character-setup-wizard"
import {
  getAbilityModifier,
  getProficiencyBonus,
  getSuggestedArmorClass,
  formatSpeed,
  GRID_CELL_FT,
  GRID_CELL_M,
  STANDARD_SPEEDS,
  type ArmorProperties,
} from "@/lib/dnd/srd-rules"

type CharacterStats = {
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
  saving_throws: string[] | null
  skills: Record<string, unknown> | null
  sheet_state: {
    hasInspiration?: boolean
    exhaustion?: number
    xp?: number
    gold?: number
    mana?: number
    maxMana?: number
    conditions?: string[]
  } | null
}

type Character = {
  id: string
  name: string
  race: string | null
  class: string | null
  subclass: string | null
  level: number
  status: string
  background: string | null
  alignment: string | null
  notes: string | null
  current_hp: number | null
  max_hp: number | null
  armor_class: number | null
  speed: number | null
  proficiency_bonus: number | null
  avatar_url: string | null
  character_stats: CharacterStats | null
}

type CharacterResource = {
  id: string
  resource_key: string
  label: string
  current_value: number
  max_value: number
  resource_type: string
  recovery_rule: string | null
}

type CharacterCondition = {
  id: string
  condition_key: string
  label: string
  description: string | null
  source: string | null
  status: string
}

type ItemRow = {
  id: string
  name: string
  item_type: string | null
  rarity: string | null
  description: string | null
  properties: Record<string, unknown> | null
}

type EquippedItem = {
  id: string
  quantity: number
  notes: string | null
  item: ItemRow | null
}

type LevelUpRequest = {
  id: string
  from_level: number
  to_level: number
  status: "pending" | "approved" | "rejected" | "applied"
  proposed_changes: Record<string, unknown> | null
  created_at: string
}

function extractItem(raw: any): ItemRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export default function FichaPersonagem() {
  const { id: campaignId } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const [character, setCharacter] = React.useState<Character | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [resources, setResources] = React.useState<CharacterResource[]>([])
  const [conditions, setConditions] = React.useState<CharacterCondition[]>([])
  const [equippedItems, setEquippedItems] = React.useState<EquippedItem[]>([])
  const [levelUpRequest, setLevelUpRequest] = React.useState<LevelUpRequest | null>(null)

  const [isEditingPhoto, setIsEditingPhoto] = React.useState(false)
  const [photoUrlInput, setPhotoUrlUrlInput] = React.useState("")

  const [isCreatingCharacter, setIsCreatingCharacter] = React.useState(false)
  const [isCreateCharacterOpen, setIsCreateCharacterOpen] = React.useState(false)
  const [newCharacter, setNewCharacter] = React.useState({ name: "", race: "", class: "", level: 1 })

  const [identityForm, setIdentityForm] = React.useState({ background: "", alignment: "" })
  const [isSavingIdentity, setIsSavingIdentity] = React.useState(false)
  const [notesInput, setNotesInput] = React.useState("")
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)

  const [isLevelUpOpen, setIsLevelUpOpen] = React.useState(false)
  const [isRequestingLevelUp, setIsRequestingLevelUp] = React.useState(false)

  const [isSetupWizardOpen, setIsSetupWizardOpen] = React.useState(false)

  const loadExtras = React.useCallback(async (characterId: string) => {
    const supabase = createClient()

    const [resourcesRes, conditionsRes, itemsRes, levelUpRes] = await Promise.all([
      supabase
        .from('character_resources')
        .select('id, resource_key, label, current_value, max_value, resource_type, recovery_rule')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true }),
      supabase
        .from('character_conditions')
        .select('id, condition_key, label, description, source, status')
        .eq('character_id', characterId)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
      supabase
        .from('character_items')
        .select('id, quantity, notes, items!inner(id, name, item_type, rarity, description, properties)')
        .eq('character_id', characterId)
        .eq('equipped', true)
        .neq('items.item_type', 'journal'),
      supabase
        .from('character_level_ups')
        .select('id, from_level, to_level, status, proposed_changes, created_at')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    setResources((resourcesRes.data as CharacterResource[]) || [])
    setConditions((conditionsRes.data as CharacterCondition[]) || [])
    setEquippedItems(
      ((itemsRes.data as any[]) || []).map((row) => ({
        id: row.id,
        quantity: row.quantity,
        notes: row.notes,
        item: extractItem(row.items),
      }))
    )
    setLevelUpRequest((levelUpRes.data as LevelUpRequest | null) || null)
  }, [])

  const loadCharacter = React.useCallback(async () => {
    if (!user || !campaignId) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('characters')
      .select('id, name, race, class, subclass, level, status, background, alignment, notes, current_hp, max_hp, armor_class, speed, proficiency_bonus, avatar_url, character_stats(*)')
      .eq('campaign_id', campaignId)
      .eq('owner_user_id', user.uid)
      .order('created_at', { ascending: false })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar Ficha", description: error.message })
    }

    const rows = (data as unknown as Character[]) || []
    const chosen = rows.find((row) => row.status === 'active') ?? rows[0] ?? null
    setCharacter(chosen)

    if (chosen) {
      setIdentityForm({ background: chosen.background || "", alignment: chosen.alignment || "" })
      setNotesInput(chosen.notes || "")
      await loadExtras(chosen.id)
    }

    setLoading(false)
  }, [user, campaignId, toast, loadExtras])

  React.useEffect(() => {
    if (!user || !campaignId) return
    let active = true

    loadCharacter().then(() => {
      if (!active) return
    })

    return () => {
      active = false
    }
  }, [user, campaignId, loadCharacter])

  async function handleCreateCharacter() {
    if (!user || !campaignId || !newCharacter.name.trim()) return
    setIsCreatingCharacter(true)
    try {
      const supabase = createClient()
      const { data: created, error } = await supabase
        .from('characters')
        .insert({
          campaign_id: campaignId,
          owner_user_id: user.uid,
          name: newCharacter.name.trim(),
          race: newCharacter.race.trim() || null,
          class: newCharacter.class.trim() || null,
          level: newCharacter.level,
        })
        .select('id')
        .single()

      if (error) throw error

      if (created?.id) {
        await supabase.from('character_stats').insert({ character_id: created.id })
      }

      toast({ title: "Personagem Criado!", description: `${newCharacter.name} entra nos anais desta campanha.` })
      setIsCreateCharacterOpen(false)
      setNewCharacter({ name: "", race: "", class: "", level: 1 })
      setLoading(true)
      await loadCharacter()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Criar Personagem", description: error.message })
    } finally {
      setIsCreatingCharacter(false)
    }
  }

  if (loading) return <div className="p-20 text-center italic font-heading text-2xl opacity-40">Consultando os anais...</div>

  if (!character) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-8 text-center min-h-[60vh]">
        <div className="space-y-3">
          <h2 className="text-3xl font-display font-black text-primary">Nenhum personagem selecionado</h2>
          <p className="text-muted-foreground italic font-heading text-xl max-w-md mx-auto">
            Você ainda não tem um personagem nesta campanha. Crie um para começar a jogar ou volte ao painel.
          </p>
        </div>
        <div className="flex gap-4">
        <Dialog open={isCreateCharacterOpen} onOpenChange={setIsCreateCharacterOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary px-10 h-12 rounded-full">Criar Personagem</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-accent/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Criar Personagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Nome</Label>
                <Input
                  placeholder="Ex: Eldric, o Audaz"
                  value={newCharacter.name}
                  onChange={e => setNewCharacter({ ...newCharacter, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Raça</Label>
                  <Input
                    placeholder="Ex: Humano"
                    value={newCharacter.race}
                    onChange={e => setNewCharacter({ ...newCharacter, race: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Classe</Label>
                  <Input
                    placeholder="Ex: Guerreiro"
                    value={newCharacter.class}
                    onChange={e => setNewCharacter({ ...newCharacter, class: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Nível</Label>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  Personagens novos começam no nível 1. Evoluções são solicitadas aqui e aplicadas pelo mestre.
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsCreateCharacterOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateCharacter} disabled={isCreatingCharacter || !newCharacter.name.trim()} className="bg-primary px-8">
                {isCreatingCharacter ? "Criando..." : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" className="px-10 h-12 rounded-full" onClick={() => router.push('/dashboard')}>
          Voltar ao Dashboard
        </Button>
        </div>
      </div>
    )
  }

  const calculateModifier = (value: number) => {
    const mod = getAbilityModifier(value);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  // O Supabase pode retornar a relação 1:1 como objeto ou como array
  // dependendo da introspecção do PostgREST — tratamos ambos os casos.
  const charStatsRaw = character.character_stats as unknown
  const charStats: CharacterStats | null = Array.isArray(charStatsRaw)
    ? (charStatsRaw[0] as CharacterStats | undefined) ?? null
    : (charStatsRaw as CharacterStats | null)
  const stats = {
    str: charStats?.strength ?? 10,
    dex: charStats?.dexterity ?? 10,
    con: charStats?.constitution ?? 10,
    int: charStats?.intelligence ?? 10,
    wis: charStats?.wisdom ?? 10,
    cha: charStats?.charisma ?? 10,
  };
  // saving_throws é jsonb e pode vir como {} (default no banco) em vez de array.
  const savingThrows = Array.isArray(charStats?.saving_throws) ? charStats!.saving_throws : [];
  const sheetState = (charStats?.sheet_state && typeof charStats.sheet_state === 'object' && !Array.isArray(charStats.sheet_state))
    ? charStats.sheet_state
    : {};
  const characterLevel = character.level ?? 1;
  const expectedProficiency = getProficiencyBonus(characterLevel);
  const proficiency = character.proficiency_bonus ?? expectedProficiency;
  const dexMod = getAbilityModifier(stats.dex);

  const charPhoto = character.avatar_url || `https://picsum.photos/seed/${character.id}/500/500`;

  // TAREFA 1/3: detecta ficha incompleta para exibir banner/badges e bloquear combate sem dados.
  const ATTRIBUTE_KEYS: (keyof CharacterStats)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
  const combatIncomplete = character.current_hp === null || character.max_hp === null || character.armor_class === null || character.speed === null || character.proficiency_bonus === null
  const attributesIncomplete = !charStats || ATTRIBUTE_KEYS.some((key) => charStats![key] === null)
  const sheetIncomplete = combatIncomplete || attributesIncomplete || !character.class || !character.race

  // TAREFA 4: "Validação SRD" — alertas discretos para fichas já configuradas
  // (sheetIncomplete = false) cujos valores divergem do esperado pelo SRD.
  // Não bloqueia o jogo, apenas orienta o jogador/mestre a revisar.
  const srdWarnings: string[] = []
  if (!sheetIncomplete) {
    if (character.proficiency_bonus !== expectedProficiency) {
      srdWarnings.push(`Bônus de proficiência +${character.proficiency_bonus} não corresponde ao nível ${characterLevel} (SRD sugere +${expectedProficiency}).`)
    }
    if (character.speed !== null && !STANDARD_SPEEDS.includes(character.speed)) {
      srdWarnings.push(`Deslocamento de ${character.speed} ft é incomum (padrão SRD: ${STANDARD_SPEEDS.join("/")} ft).`)
    }
    if (character.current_hp !== null && character.max_hp !== null && character.current_hp > character.max_hp) {
      srdWarnings.push(`PV atual (${character.current_hp}) é maior que o PV máximo (${character.max_hp}).`)
    }
    if (character.armor_class !== null && character.armor_class < 10 + dexMod) {
      srdWarnings.push(`CA ${character.armor_class} está abaixo do mínimo sem armadura (10 + DEX = ${10 + dexMod}).`)
    }
  }

  // TAREFA 5: CA sugerida a partir do equipamento equipado (armor/shield) + DEX.
  const equippedArmor = equippedItems.find((ci) => ci.item?.item_type === 'armor')?.item ?? null
  const hasEquippedShield = equippedItems.some((ci) => ci.item?.item_type === 'shield')
  const armorProperties = (equippedArmor?.properties as ArmorProperties) ?? null
  const suggestedArmorClass = getSuggestedArmorClass({ dexMod, armor: armorProperties, hasShield: hasEquippedShield })
  const armorClassDiffersFromSuggestion = character.armor_class !== null && character.armor_class !== suggestedArmorClass

  async function handleUpdatePhoto() {
    if (!character) return
    const supabase = createClient()
    const { error } = await supabase
      .from('characters')
      .update({ avatar_url: photoUrlInput })
      .eq('id', character.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro na Invocação", description: error.message })
      return
    }

    setCharacter({ ...character, avatar_url: photoUrlInput })
    toast({ title: "Retrato Atualizado", description: "Sua nova aparência foi gravada nos anais." })
    setIsEditingPhoto(false)
  }

  async function handleAvatarUploaded(mediaAsset: MediaAsset) {
    if (!character || !mediaAsset.public_url) return
    const supabase = createClient()
    const { error } = await supabase
      .from('characters')
      .update({ avatar_url: mediaAsset.public_url })
      .eq('id', character.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro na Invocação", description: error.message })
      return
    }

    setCharacter({ ...character, avatar_url: mediaAsset.public_url })
    toast({ title: "Retrato Atualizado", description: "Sua nova aparência foi gravada nos anais." })
    setIsEditingPhoto(false)
  }

  async function updateSheetState(patch: Record<string, unknown>) {
    if (!character) return
    const nextState = { ...sheetState, ...patch }
    const supabase = createClient()
    const { error } = await supabase
      .from('character_stats')
      .upsert({ character_id: character.id, sheet_state: nextState }, { onConflict: 'character_id' })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message })
      return
    }

    setCharacter({
      ...character,
      character_stats: character.character_stats
        ? { ...character.character_stats, sheet_state: nextState }
        : character.character_stats,
    })
  }

  async function toggleInspiration() {
    await updateSheetState({ hasInspiration: !sheetState.hasInspiration })
  }

  async function updateExhaustion(val: number[]) {
    await updateSheetState({ exhaustion: val[0] })
  }

  async function handleSaveIdentity() {
    if (!character) return
    setIsSavingIdentity(true)
    const supabase = createClient()
    const payload = {
      background: identityForm.background.trim() || null,
      alignment: identityForm.alignment.trim() || null,
    }
    const { error } = await supabase.from('characters').update(payload).eq('id', character.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message })
      setIsSavingIdentity(false)
      return
    }

    setCharacter({ ...character, ...payload })
    toast({ title: "Identidade Atualizada" })
    setIsSavingIdentity(false)
  }

  async function handleSaveNotes() {
    if (!character) return
    setIsSavingNotes(true)
    const supabase = createClient()
    const payload = { notes: notesInput.trim() || null }
    const { error } = await supabase.from('characters').update(payload).eq('id', character.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message })
      setIsSavingNotes(false)
      return
    }

    setCharacter({ ...character, ...payload })
    toast({ title: "Anotações Salvas" })
    setIsSavingNotes(false)
  }

  async function handleAdjustResource(resource: CharacterResource, delta: number) {
    const next = Math.max(0, Math.min(resource.max_value, resource.current_value + delta))
    if (next === resource.current_value) return

    const supabase = createClient()
    const { error } = await supabase
      .from('character_resources')
      .update({ current_value: next })
      .eq('id', resource.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Recurso", description: error.message })
      return
    }

    setResources((prev) => prev.map((r) => (r.id === resource.id ? { ...r, current_value: next } : r)))
  }

  // TAREFA 5: aplica a CA sugerida (10 + DEX, ou armadura/escudo equipados)
  // via RPC — armor_class é um campo crítico travado fora do setup inicial,
  // então a atualização passa pela mesma escotilha de escape (0029).
  async function handleApplySuggestedArmorClass() {
    if (!character) return
    const supabase = createClient()
    const { error } = await supabase.rpc('apply_character_armor_class', {
      target_character_id: character.id,
      new_armor_class: suggestedArmorClass,
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Aplicar CA", description: error.message })
      return
    }

    setCharacter({ ...character, armor_class: suggestedArmorClass })
    toast({ title: "CA Atualizada", description: `Classe de Armadura ajustada para ${suggestedArmorClass}.` })
  }

  function openLevelUpDialog() {
    setIsLevelUpOpen(true)
  }

  async function handleRequestLevelUp() {
    if (!character || !user) return
    setIsRequestingLevelUp(true)

    const toLevel = characterLevel + 1
    const supabase = createClient()
    const { data, error } = await supabase.rpc('request_character_level_up', { target_character_id: character.id })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Solicitar Level Up", description: error.message })
      setIsRequestingLevelUp(false)
      return
    }

    setLevelUpRequest(data as unknown as LevelUpRequest)
    toast({ title: "Pedido Enviado", description: `Solicitação para o nível ${toLevel} aguarda o mestre.` })
    setIsLevelUpOpen(false)
    setIsRequestingLevelUp(false)
  }

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div className={`relative h-44 w-44 rounded-2xl overflow-hidden border-2 shadow-arcane cursor-zoom-in group transition-all ${sheetState.hasInspiration ? 'border-primary ring-4 ring-primary/20' : 'border-white/10'}`}>
                  <img
                    src={charPhoto}
                    alt={character.name}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  {sheetState.hasInspiration && (
                    <div className="absolute top-2 right-2 p-1.5 bg-primary rounded-full shadow-gold animate-bounce">
                      <Star className="h-4 w-4 text-black" />
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-primary/20 max-w-4xl p-0 overflow-hidden">
                <img src={charPhoto} alt={character.name} className="w-full h-full object-contain max-h-[85vh]" />
                <div className="p-6 bg-gradient-to-t from-black to-transparent absolute bottom-0 w-full">
                  <h2 className="text-3xl font-display font-black text-primary">{character.name}</h2>
                  <p className="text-muted-foreground font-heading italic">{character.race} {character.class}</p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="absolute -bottom-2 -right-2 bg-background border border-primary/30 rounded-full h-10 w-10 shadow-arcane">
                  <Camera className="h-4 w-4 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-accent/30">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display">Consagrar Novo Retrato</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest">Alterar Imagem do Personagem</Label>
                    <R2ImageUpload
                      campaignId={campaignId}
                      usageType="character_avatar"
                      visibility="party"
                      label="Alterar imagem do personagem"
                      onUploaded={handleAvatarUploaded}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest">Ou Link da Imagem</Label>
                    <Input
                      placeholder="https://..."
                      value={photoUrlInput}
                      onChange={e => setPhotoUrlUrlInput(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Use um link público de imagem (Unsplash, Pinterest, etc) ou envie um arquivo.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsEditingPhoto(false)}>Cancelar</Button>
                  <Button onClick={handleUpdatePhoto} className="bg-primary px-8">Manifestar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-6xl font-display font-black tracking-tighter text-primary">{character.name}</h1>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary bg-primary/5 px-4 h-6">
                Nvl {characterLevel}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleInspiration}
                className={`rounded-full border px-4 transition-all ${sheetState.hasInspiration ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 opacity-30 hover:opacity-100'}`}
              >
                <Star className={`mr-2 h-4 w-4 ${sheetState.hasInspiration ? 'fill-current' : ''}`} /> Inspiração
              </Button>
              {sheetIncomplete ? (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-amber-500/40 text-amber-400 bg-amber-500/10 px-4 h-6 gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Configuração Inicial Pendente
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-4 h-6 gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Pronto para Combate
                </Badge>
              )}
            </div>
            <p className="text-2xl font-heading italic text-muted-foreground mt-2 capitalize opacity-70">
              {character.race || "Raça desconhecida"} {character.class || "Classe desconhecida"} • Status: {character.status === 'pending_approval' ? 'Aguardando Aprovação' : 'Ativo'}
            </p>
          </div>
        </div>
        <div className="flex gap-10">
          <div className="text-right">
             <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground block mb-1">Riqueza</span>
             <span className="text-3xl font-code font-bold text-primary">{sheetState.gold || 0} <span className="text-xs opacity-50 uppercase">po</span></span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground block mb-1">Experiência (XP)</span>
            <div className="flex items-center gap-4">
              <Progress value={((sheetState.xp || 0) % 1000) / 10} className="w-40 h-2" />
              <span className="text-xs font-code font-bold text-primary">{sheetState.xp || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* TAREFA 1/3: banner de ficha incompleta */}
      {sheetIncomplete && (
        <section className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-amber-300">Ficha incompleta — configurar personagem</p>
              <p className="text-sm text-muted-foreground font-heading italic mt-1">
                {combatIncomplete
                  ? "Faltam dados de combate (PV, CA, deslocamento ou proficiência). Ficha incompleta para combate."
                  : "Complete raça, classe e atributos para liberar a ficha completa."}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsSetupWizardOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-black font-display gap-2 shrink-0">
            <Wand2 className="h-4 w-4" /> Configurar Ficha Inicial
          </Button>
        </section>
      )}

      {/* TAREFA 4: Validação SRD — alertas discretos para fichas já configuradas */}
      {srdWarnings.length > 0 && (
        <section className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-display font-bold text-amber-300">Validação SRD</p>
              <ul className="space-y-1">
                {srdWarnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground font-heading italic">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button onClick={() => setIsSetupWizardOpen(true)} variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-display gap-2 shrink-0">
            <Wand2 className="h-4 w-4" /> Revisar Configuração
          </Button>
        </section>
      )}

      <CharacterSetupWizard
        open={isSetupWizardOpen}
        onOpenChange={setIsSetupWizardOpen}
        character={{
          id: character.id,
          name: character.name,
          race: character.race,
          class: character.class,
          background: character.background,
          alignment: character.alignment,
          level: characterLevel,
        }}
        charStats={charStats}
        combat={{
          current_hp: character.current_hp,
          max_hp: character.max_hp,
          armor_class: character.armor_class,
          speed: character.speed,
          proficiency_bonus: character.proficiency_bonus,
        }}
        onCompleted={async () => {
          setLoading(true)
          await loadCharacter()
        }}
      />

      {/* Bloco: Identidade */}
      <section className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
          <Info className="mr-2 h-4 w-4 text-primary" /> Identidade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Raça</span>
            <span className="font-heading italic">{character.race || "—"}</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Classe</span>
            <span className="font-heading italic">{character.class || "—"}{character.subclass ? ` (${character.subclass})` : ""}</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Nível</span>
            <span className="font-heading italic">{characterLevel}</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Status</span>
            <span className="font-heading italic">{character.status === 'pending_approval' ? 'Aguardando Aprovação' : 'Ativo'}</span>
          </div>
        </div>

        {!charStats && (
          <p className="text-[11px] text-muted-foreground/70 italic">
            Este personagem ainda não possui atributos registrados — exibindo valores padrão (10).
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Antecedente</Label>
            <Input
              value={identityForm.background}
              onChange={(e) => setIdentityForm({ ...identityForm, background: e.target.value })}
              placeholder="Ex: Eremita, Soldado, Charlatão..."
              className="bg-black/30 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tendência</Label>
            <Input
              value={identityForm.alignment}
              onChange={(e) => setIdentityForm({ ...identityForm, alignment: e.target.value })}
              placeholder="Ex: Neutro e Bom"
              className="bg-black/30 border-white/10"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveIdentity} disabled={isSavingIdentity} variant="outline" className="rounded-full border-primary/30 hover:bg-primary/5 text-[10px] uppercase tracking-widest font-display">
            {isSavingIdentity ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
            Salvar Identidade
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Bloco: Atributos */}
        <div className="lg:col-span-3 space-y-10">
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
              <Star className="mr-2 h-4 w-4 text-primary" /> Atributos Principais
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(stats).map(([key, val]) => (
                <StatCard key={key} label={key.toUpperCase()} value={val} mod={calculateModifier(val)} />
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-6">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
              <Shield className="mr-2 h-4 w-4 text-primary" /> Resistências (Saves)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(stats).map(s => {
                const isProficient = savingThrows?.includes(s);
                const modVal = Number(calculateModifier(stats[s as keyof typeof stats]));
                const finalSave = isProficient ? modVal + proficiency : modVal;
                return (
                  <div key={s} className={`p-3 rounded-lg border flex justify-between items-center ${isProficient ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-transparent opacity-50'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest">{s}</span>
                    <span className="font-code font-bold">{finalSave >= 0 ? `+${finalSave}` : finalSave}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bloco: Combate básico */}
        <div className="lg:col-span-6 space-y-10">
          <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
            <Sword className="mr-2 h-4 w-4 text-primary" /> Combate Básico
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#2B1218]/20 border-destructive/20 literary-shadow overflow-hidden group">
              <div className="h-1 bg-destructive/30" />
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-destructive/20 text-destructive shadow-arcane group-hover:scale-110 transition-transform">
                      <Heart className="h-7 w-7" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive">Vitalidade</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-display font-bold text-destructive">{character.current_hp ?? 0} / {character.max_hp ?? 0}</span>
                  </div>
                </div>
                <Progress value={((character.current_hp ?? 0) / (character.max_hp || 1)) * 100} className="h-2 bg-destructive/10" />

                {(character.current_hp ?? 0) <= 0 && (
                   <div className="pt-4 space-y-3">
                      <p className="text-[9px] uppercase font-black text-center tracking-widest text-destructive">Testes contra Morte</p>
                      <div className="flex justify-center gap-4">
                         <div className="flex gap-1"><Skull className="h-4 w-4 opacity-20" /><Skull className="h-4 w-4 opacity-20" /><Skull className="h-4 w-4 opacity-20" /></div>
                         <div className="h-4 w-px bg-white/10" />
                         <div className="flex gap-1"><Heart className="h-4 w-4 opacity-20" /><Heart className="h-4 w-4 opacity-20" /><Heart className="h-4 w-4 opacity-20" /></div>
                      </div>
                   </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#12182B]/20 border-accent/20 literary-shadow overflow-hidden group">
              <div className="h-1 bg-accent/30" />
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/20 text-accent shadow-arcane group-hover:scale-110 transition-transform">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Energia Arcana</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-display font-bold text-accent">{sheetState.mana ?? 0} / {sheetState.maxMana ?? 0}</span>
                  </div>
                </div>
                <Progress value={((sheetState.mana || 0) / (sheetState.maxMana || 1)) * 100} className="h-2 bg-accent/10" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-1">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Defesa (CA)</span>
                <span className="text-4xl font-display font-black text-primary">{character.armor_class ?? 10}</span>
                {armorClassDiffersFromSuggestion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplySuggestedArmorClass}
                    className="mt-2 h-auto py-1 px-2 text-[8px] uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10"
                  >
                    Aplicar CA sugerida ({suggestedArmorClass})
                  </Button>
                )}
             </div>
             <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                <Zap className="h-8 w-8 text-accent mb-3" />
                <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Iniciativa</span>
                <span className="text-4xl font-display font-black text-accent">{Number(calculateModifier(stats.dex)) >= 0 ? `+${calculateModifier(stats.dex)}` : calculateModifier(stats.dex)}</span>
             </div>
             <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-1">
                <Footprints className="h-8 w-8 text-secondary mb-3" />
                <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Deslocamento</span>
                <span className="text-2xl font-display font-black text-secondary">{formatSpeed(character.speed)}</span>
                <span className="text-[8px] uppercase tracking-widest opacity-30">1 célula = {GRID_CELL_FT} ft / {GRID_CELL_M} m</span>
             </div>
             <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                <Star className="h-8 w-8 text-primary mb-3" />
                <span className="text-[9px] uppercase font-black tracking-widest opacity-40">Proficiência</span>
                <span className="text-4xl font-display font-black text-primary">+{proficiency}</span>
             </div>
          </div>

          <section className="space-y-6 bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
             <div className="flex justify-between items-center">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
                  <Wind className="mr-2 h-4 w-4 text-primary" /> Nível de Exaustão
                </h3>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{sheetState.exhaustion || 0} / 6</Badge>
             </div>
             <Slider
              value={[sheetState.exhaustion || 0]}
              max={6}
              step={1}
              onValueChange={updateExhaustion}
              className="py-4"
             />
             <p className="text-xs italic text-muted-foreground leading-relaxed">
               {sheetState.exhaustion === 1 && "Desvantagem em Testes de Atributo."}
               {sheetState.exhaustion === 2 && "Deslocamento reduzido à metade."}
               {sheetState.exhaustion === 3 && "Desvantagem em Jogadas de Ataque e Resistência."}
               {sheetState.exhaustion === 4 && "Pontos de vida máximo reduzidos à metade."}
               {sheetState.exhaustion === 5 && "Deslocamento reduzido a 0."}
               {sheetState.exhaustion === 6 && "Morte imediata."}
               {!sheetState.exhaustion && "O herói está plenamente revigorado."}
             </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 flex items-center font-display">
                <Sword className="mr-2 h-4 w-4 text-primary" /> Ataques Principais
              </h3>
              <div className="space-y-3">
                <ActionCard name="Golpe de Aço" detail={`+${Number(calculateModifier(stats.str)) + proficiency} | 1d8 ${calculateModifier(stats.str)}`} />
                <ActionCard name="Arremesso" detail={`+${Number(calculateModifier(stats.dex)) + proficiency} | 1d4 ${calculateModifier(stats.dex)}`} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 flex items-center font-display">
                <Flame className="mr-2 h-4 w-4 text-primary" /> Magias / Truques
              </h3>
              <div className="space-y-3">
                <ActionCard name="Chama Sagrada" detail={`CD ${8 + proficiency + Number(calculateModifier(stats.wis))} | 1d8 Radiano`} />
                <ActionCard name="Benção" detail="Concentração" />
              </div>
            </section>
          </div>
        </div>

        {/* Bloco: Condições e Itens Equipados */}
        <div className="lg:col-span-3 space-y-10">
          <section className="space-y-6">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
              <Ghost className="mr-2 h-4 w-4 text-primary" /> Condições Ativas
            </h3>
            <div className="flex flex-col gap-3">
              {conditions.length > 0 ? conditions.map((cond) => (
                <ConditionBadge key={cond.id} condition={cond} />
              )) : (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center opacity-30 italic text-xs">Sem enfermidades</div>
              )}
            </div>
          </section>

          {/* Bloco: Itens Equipados */}
          <section className="space-y-6">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
              <Shirt className="mr-2 h-4 w-4 text-primary" /> Itens Equipados
            </h3>
            <div className="flex flex-col gap-3">
              {equippedItems.length > 0 ? equippedItems.map((ci) => (
                <EquippedItemCard key={ci.id} characterItem={ci} />
              )) : (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center opacity-30 italic text-xs flex flex-col items-center gap-2">
                  <Backpack className="h-5 w-5" />
                  Nenhum item equipado.
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
              Bônus de equipamentos serão aplicados automaticamente na fase de combate/ficha avançada.
            </p>
          </section>

          <Card className="bg-primary/5 border-primary/20 oracle-glow">
            <CardContent className="p-8 space-y-4">
               <div className="flex items-center gap-3">
                 <Info className="h-5 w-5 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Oráculo do SRD</span>
               </div>
               <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                 Seu Bônus de Proficiência de <span className="text-primary font-bold">+{proficiency}</span> é adicionado a testes de perícias que você domina e aos Testes de Resistência marcados como proficientes.
               </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloco: Recursos */}
      <section className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
          <BookMarked className="mr-2 h-4 w-4 text-primary" /> Recursos
        </h3>
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="bg-white/5 border-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm">{resource.label}</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/10 text-muted-foreground">
                    {resource.resource_type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full border border-white/10"
                    disabled={resource.current_value <= 0}
                    onClick={() => handleAdjustResource(resource, -1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-code font-bold text-lg">{resource.current_value} / {resource.max_value}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full border border-white/10"
                    disabled={resource.current_value >= resource.max_value}
                    onClick={() => handleAdjustResource(resource, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {resource.recovery_rule && (
                  <p className="text-[10px] text-muted-foreground/70 italic">{resource.recovery_rule}</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center opacity-30 italic text-xs">
            Nenhum recurso registrado. O mestre poderá adicionar dados de vida, espaços de magia e outros recursos conforme a campanha evolui.
          </div>
        )}
      </section>

      {/* Bloco: Anotações */}
      <section className="space-y-4">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
          <BookMarked className="mr-2 h-4 w-4 text-primary" /> Anotações
        </h3>
        <Textarea
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder="Anotações pessoais, lembretes, segredos do personagem..."
          className="bg-black/30 border-white/10 min-h-32 font-heading italic"
        />
        <div className="flex justify-end">
          <Button onClick={handleSaveNotes} disabled={isSavingNotes} variant="outline" className="rounded-full border-primary/30 hover:bg-primary/5 text-[10px] uppercase tracking-widest font-display">
            {isSavingNotes ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
            Salvar Anotações
          </Button>
        </div>
      </section>

      {/* Bloco: Progressão / Level Up */}
      <section className="space-y-4">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
          <TrendingUp className="mr-2 h-4 w-4 text-primary" /> Progressão / Level Up
        </h3>
        <Card className="bg-white/5 border-white/5 p-8 space-y-4">
          <p className="text-sm text-muted-foreground font-heading italic">
            {character.name} está atualmente no nível <span className="text-primary font-bold not-italic">{characterLevel}</span>.
          </p>

          {levelUpRequest?.status === 'pending' ? (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm">
              Pedido de level up para o nível <span className="font-bold">{levelUpRequest.to_level}</span> enviado e aguardando aprovação do mestre.
            </div>
          ) : (
            <>
              {levelUpRequest?.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
                  Seu último pedido de level up (nível {levelUpRequest.to_level}) foi rejeitado pelo mestre. Você pode enviar um novo pedido.
                </div>
              )}
              <Dialog open={isLevelUpOpen} onOpenChange={setIsLevelUpOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openLevelUpDialog} className="bg-primary rounded-full px-8 font-display text-[10px] uppercase tracking-widest gap-2">
                    <TrendingUp className="h-4 w-4" /> Solicitar Level Up
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card/95 border-white/10 text-[#FFF6E5]">
                  <DialogHeader>
                    <DialogTitle className="font-display">Solicitar Level Up</DialogTitle>
                    <DialogDescription className="font-heading italic">
                      Solicite sua evolução do nível {characterLevel} para o nível {characterLevel + 1}. O mestre revisará e aplicará HP, proficiência e demais ajustes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm space-y-1">
                      <p>Bônus de Proficiência sugerido: <span className="font-bold text-primary">+{Math.floor(((characterLevel + 1) - 1) / 4) + 2}</span></p>
                      <p className="text-muted-foreground font-heading italic">
                        O pedido não altera sua ficha imediatamente. O mestre precisa aprovar sua evolução no Portal do Mestre.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLevelUpOpen(false)} className="rounded-full border-white/10">
                      Cancelar
                    </Button>
                    <Button onClick={handleRequestLevelUp} disabled={isRequestingLevelUp} className="btn-ritual rounded-full">
                      {isRequestingLevelUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Enviar Pedido
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </Card>
      </section>
    </div>
  )
}

function StatCard({ label, value, mod }: { label: string, value: number, mod: string }) {
  return (
    <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5 flex justify-between items-center group hover:border-primary/40 transition-all cursor-default overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
         <span className="text-6xl font-black">{label[0]}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">{label}</span>
        <span className="text-3xl font-display font-black group-hover:text-primary transition-colors">{value}</span>
      </div>
      <div className={`p-4 rounded-xl font-code font-black text-xl transition-all ${Number(mod) >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
        {mod}
      </div>
    </div>
  )
}

function ActionCard({ name, detail }: { name: string, detail: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer">
      <div>
        <h5 className="text-sm font-bold group-hover:text-primary transition-colors">{name}</h5>
        <p className="text-[10px] text-muted-foreground font-heading italic uppercase tracking-tighter mt-1">{detail}</p>
      </div>
      <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary text-[8px] uppercase font-black">
        Rolar
      </Badge>
    </div>
  )
}

function ConditionBadge({ condition }: { condition: CharacterCondition }) {
  const getIcon = () => {
    const c = condition.label.toLowerCase();
    if (c.includes('envenenado')) return <Skull className="h-3 w-3" />;
    if (c.includes('bêbado') || c.includes('bebado')) return <Wine className="h-3 w-3" />;
    if (c.includes('sangramento')) return <Droplets className="h-3 w-3" />;
    return <Ghost className="h-3 w-3" />;
  }

  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           {getIcon()}
           <span className="text-[10px] font-black uppercase tracking-widest">{condition.label}</span>
         </div>
         <Info className="h-3 w-3 opacity-30" />
       </div>
       {condition.description && (
         <p className="text-[10px] text-destructive/70 italic">{condition.description}</p>
       )}
    </div>
  )
}

function EquippedItemCard({ characterItem }: { characterItem: EquippedItem }) {
  const item = characterItem.item
  if (!item) return null
  const properties = item.properties && Object.keys(item.properties).length > 0 ? item.properties : null
  const isCombatEquipment = item.item_type === 'armor' || item.item_type === 'shield'

  return (
    <div className={`p-4 rounded-xl bg-white/5 border space-y-2 ${isCombatEquipment ? 'border-primary/30' : 'border-white/5'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-display font-bold">{item.name}</span>
        {characterItem.quantity > 1 && (
          <Badge variant="secondary" className="text-[9px] shrink-0">x{characterItem.quantity}</Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {isCombatEquipment && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-primary/30 text-primary flex items-center gap-1">
            <Shield className="h-3 w-3" /> Equipamento de combate
          </Badge>
        )}
        {item.item_type && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/10 text-muted-foreground">
            {item.item_type}
          </Badge>
        )}
        {item.rarity && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-accent/30 text-accent">
            {item.rarity}
          </Badge>
        )}
      </div>
      {properties && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(properties).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-[9px] border-white/10 text-muted-foreground/80">
              {key}: {String(value)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
