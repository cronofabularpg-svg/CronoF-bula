
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Flame
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"

type CharacterStats = {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  saving_throws: string[] | null
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
  level: number
  status: string
  current_hp: number | null
  max_hp: number | null
  armor_class: number | null
  avatar_url: string | null
  character_stats: CharacterStats | null
}

export default function FichaPersonagem() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [character, setCharacter] = React.useState<Character | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [isEditingPhoto, setIsEditingPhoto] = React.useState(false)
  const [photoUrlInput, setPhotoUrlUrlInput] = React.useState("")

  const [isCreatingCharacter, setIsCreatingCharacter] = React.useState(false)
  const [isCreateCharacterOpen, setIsCreateCharacterOpen] = React.useState(false)
  const [newCharacter, setNewCharacter] = React.useState({ name: "", race: "", class: "", level: 1 })

  const loadCharacter = React.useCallback(async () => {
    if (!user || !campaignId) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from('characters')
      .select('id, name, race, class, level, status, current_hp, max_hp, armor_class, avatar_url, character_stats(*)')
      .eq('campaign_id', campaignId)
      .eq('owner_user_id', user.uid)
      .maybeSingle()

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar Ficha", description: error.message })
    }
    setCharacter((data as unknown as Character) || null)
    setLoading(false)
  }, [user, campaignId, toast])

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
      const { error } = await supabase
        .from('characters')
        .insert({
          campaign_id: campaignId,
          owner_user_id: user.uid,
          name: newCharacter.name.trim(),
          race: newCharacter.race.trim() || null,
          class: newCharacter.class.trim() || null,
          level: newCharacter.level,
        })

      if (error) throw error

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
          <h2 className="text-3xl font-display font-black text-primary">Nenhum herói encontrado</h2>
          <p className="text-muted-foreground italic font-heading text-xl max-w-md mx-auto">
            Você ainda não tem um personagem nesta campanha. Crie um para começar a jogar.
          </p>
        </div>
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
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newCharacter.level}
                  onChange={e => setNewCharacter({ ...newCharacter, level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                />
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
      </div>
    )
  }

  const calculateModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
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
  const proficiency = Math.floor((character.level - 1) / 4) + 2;

  const charPhoto = character.avatar_url || `https://picsum.photos/seed/${character.id}/500/500`;

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

  async function updateSheetState(patch: Record<string, unknown>) {
    if (!character) return
    const nextState = { ...sheetState, ...patch }
    const supabase = createClient()
    const { error } = await supabase
      .from('character_stats')
      .update({ sheet_state: nextState })
      .eq('character_id', character.id)

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
                    <Label className="text-[10px] uppercase font-bold tracking-widest">Link da Imagem</Label>
                    <Input
                      placeholder="https://..."
                      value={photoUrlInput}
                      onChange={e => setPhotoUrlUrlInput(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Use um link público de imagem (Unsplash, Pinterest, etc).</p>
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
                Nvl {character.level}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleInspiration}
                className={`rounded-full border px-4 transition-all ${sheetState.hasInspiration ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 opacity-30 hover:opacity-100'}`}
              >
                <Star className={`mr-2 h-4 w-4 ${sheetState.hasInspiration ? 'fill-current' : ''}`} /> Inspiração
              </Button>
            </div>
            <p className="text-2xl font-heading italic text-muted-foreground mt-2 capitalize opacity-70">
              {character.race} {character.class} • Status: {character.status === 'pending_approval' ? 'Aguardando Aprovação' : 'Ativo'}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Coluna 1: Atributos e Resistências */}
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

        {/* Coluna 2: Status Vital e Combate */}
        <div className="lg:col-span-6 space-y-10">
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
                    <span className="text-4xl font-display font-bold text-destructive">{character.current_hp || 0} / {character.max_hp || 0}</span>
                  </div>
                </div>
                <Progress value={((character.current_hp || 0) / (character.max_hp || 1)) * 100} className="h-2 bg-destructive/10" />

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

          <div className="grid grid-cols-2 gap-6">
             <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                <Shield className="h-10 w-10 text-primary mb-4" />
                <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Defesa (CA)</span>
                <span className="text-6xl font-display font-black text-primary">{character.armor_class || 10}</span>
             </div>
             <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Iniciativa</span>
                <span className="text-6xl font-display font-black text-accent">{Number(calculateModifier(stats.dex)) >= 0 ? `+${calculateModifier(stats.dex)}` : calculateModifier(stats.dex)}</span>
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

        {/* Coluna 3: Condições e Informações */}
        <div className="lg:col-span-3 space-y-10">
          <section className="space-y-6">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 flex items-center">
              <Ghost className="mr-2 h-4 w-4 text-primary" /> Condições Ativas
            </h3>
            <div className="flex flex-col gap-3">
              {sheetState.conditions && sheetState.conditions.length > 0 ? sheetState.conditions.map((cond: string, i: number) => (
                <ConditionBadge key={i} condition={cond} />
              )) : (
                <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center opacity-30 italic text-xs">Sem enfermidades</div>
              )}
            </div>
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

function ConditionBadge({ condition }: { condition: string }) {
  const getIcon = () => {
    const c = condition.toLowerCase();
    if (c.includes('envenenado')) return <Skull className="h-3 w-3" />;
    if (c.includes('bêbado') || c.includes('bebado')) return <Wine className="h-3 w-3" />;
    if (c.includes('sangramento')) return <Droplets className="h-3 w-3" />;
    return <Ghost className="h-3 w-3" />;
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
       <div className="flex items-center gap-3">
         {getIcon()}
         <span className="text-[10px] font-black uppercase tracking-widest">{condition}</span>
       </div>
       <Info className="h-3 w-3 opacity-30" />
    </div>
  )
}
