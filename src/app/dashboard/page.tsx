
"use client"

import * as React from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  PlusCircle,
  Play,
  ShieldCheck,
  User as UserIcon,
  Crown,
  BookOpen,
  Hourglass,
  LogOut,
  Sparkles,
  Loader2,
  Wand2,
  ScrollText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Campaign = {
  id: string
  owner_id: string
  name: string
  system_key: string | null
  tone: string | null
  status: string
}

type CharacterOption = {
  id: string
  name: string
  race: string | null
  class: string | null
  level: number | null
}

const NARRATIVE_GENRES = [
  { id: "heroic_fantasy", name: "Fantasia Heroica" },
  { id: "dark_fantasy", name: "Fantasia Sombria" },
  { id: "political", name: "Intriga Política" },
  { id: "exploration", name: "Exploração" },
  { id: "horror", name: "Terror" },
  { id: "mystery", name: "Mistério" },
  { id: "sandbox", name: "Sandbox Aberto" }
];

const ADVENTURE_DURATIONS = [
  { id: "short", name: "Curta (1-2 sessões)" },
  { id: "medium", name: "Média (uma arco completo)" },
  { id: "long", name: "Longa (campanha contínua)" }
];

const DND_RACES = [
  { id: "human", name: "Humano" },
  { id: "elf", name: "Elfo" },
  { id: "dwarf", name: "Anão" },
  { id: "halfling", name: "Halfling" },
  { id: "dragonborn", name: "Draconato" },
  { id: "tiefling", name: "Tiefling" },
  { id: "gnome", name: "Gnomo" },
  { id: "half-orc", name: "Meio-Orc" },
  { id: "half-elf", name: "Meio-Elfo" }
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

type SoloStep = 'select' | 'existing' | 'new' | 'new-confirm'

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = React.useState(true);
  const [isStartingSolo, setIsStartingSolo] = React.useState(false);

  const [isSoloDialogOpen, setIsSoloDialogOpen] = React.useState(false)
  const [soloStep, setSoloStep] = React.useState<SoloStep>('select')

  // Modo A: continuar crônica existente
  const [selectedExistingCampaignId, setSelectedExistingCampaignId] = React.useState("")
  const [existingCharacters, setExistingCharacters] = React.useState<CharacterOption[]>([])
  const [loadingExistingCharacters, setLoadingExistingCharacters] = React.useState(false)
  const [selectedExistingCharacterId, setSelectedExistingCharacterId] = React.useState("")

  // Modo B: nova aventura do zero
  const [newAdventure, setNewAdventure] = React.useState({
    name: "",
    genre: "heroic_fantasy",
    duration: "medium",
    theme: "",
    characterName: "",
    characterRace: "human",
    characterClass: "fighter",
  })

  React.useEffect(() => {
    if (!user) return;

    let active = true;
    const supabase = createClient();

    supabase
      .from('campaigns')
      .select('id, owner_id, name, system_key, tone, status')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar", description: error.message });
        }
        setCampaigns((data as Campaign[]) || []);
        setCampaignsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, toast]);

  const displayCampaigns = campaigns;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function openSoloDialog() {
    setSoloStep('select')
    setSelectedExistingCampaignId("")
    setExistingCharacters([])
    setSelectedExistingCharacterId("")
    setNewAdventure({
      name: "",
      genre: "heroic_fantasy",
      duration: "medium",
      theme: "",
      characterName: "",
      characterRace: "human",
      characterClass: "fighter",
    })
    setIsSoloDialogOpen(true)
  }

  React.useEffect(() => {
    if (!selectedExistingCampaignId || !user) {
      setExistingCharacters([])
      setSelectedExistingCharacterId("")
      return
    }
    let active = true
    setLoadingExistingCharacters(true)
    const supabase = createClient()
    supabase
      .from('characters')
      .select('id, name, race, class, level')
      .eq('campaign_id', selectedExistingCampaignId)
      .eq('owner_user_id', user.uid)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar Personagens", description: error.message })
        }
        const rows = (data as CharacterOption[]) || []
        setExistingCharacters(rows)
        setSelectedExistingCharacterId(rows[0]?.id || "")
        setLoadingExistingCharacters(false)
      })
    return () => { active = false }
  }, [selectedExistingCampaignId, user, toast])

  function handleEnterExistingSolo() {
    if (!selectedExistingCampaignId) return
    setIsSoloDialogOpen(false)
    router.push(`/campaign/${selectedExistingCampaignId}/mesa-viva`)
  }

  async function handleCreateSoloAdventure() {
    if (!user) return
    setIsStartingSolo(true)

    try {
      const supabase = createClient()
      const characterName = newAdventure.characterName.trim()
      const campaignName = newAdventure.name.trim() || `Aventura Solo de ${characterName || 'um Herói Sem Nome'}`

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          owner_id: user.uid,
          name: campaignName,
          description: newAdventure.theme.trim() || null,
          system_key: "dnd_srd",
          tone: newAdventure.genre,
          solo_enabled: true,
          ai_enabled: true,
        })
        .select('id')
        .single();

      if (error || !campaign) throw error || new Error("Falha ao criar campanha.");

      await supabase
        .from('campaign_settings')
        .update({ ai_default_mode: 'oracle', solo_requires_approval: false })
        .eq('campaign_id', campaign.id)

      if (characterName) {
        await supabase.from('characters').insert({
          campaign_id: campaign.id,
          owner_user_id: user.uid,
          name: characterName,
          race: newAdventure.characterRace,
          class: newAdventure.characterClass,
          level: 1,
        })
      }

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          campaign_id: campaign.id,
          title: "Abertura da Crônica",
          status: "active",
          started_at: new Date().toISOString(),
          created_by: user.uid,
        })
        .select('id')
        .single();

      if (sessionError || !session) throw sessionError || new Error("Falha ao iniciar sessão.");

      const { error: sceneError } = await supabase
        .from('scenes')
        .insert({
          campaign_id: campaign.id,
          session_id: session.id,
          title: "Cena Inicial",
          status: "active",
          created_by: user.uid,
        });

      if (sceneError) throw sceneError;

      if (newAdventure.theme.trim()) {
        const nowIso = new Date().toISOString()
        await supabase.from('campaign_memory').insert({
          campaign_id: campaign.id,
          source_type: 'onboarding',
          memory_type: 'lore',
          title: 'Premissa da Aventura Solo',
          content: newAdventure.theme.trim(),
          visibility: 'party',
          importance: 'high',
          created_by: user.uid,
          approved_by: user.uid,
          approved_at: nowIso,
        })
      }

      setIsSoloDialogOpen(false)
      router.push(`/campaign/${campaign.id}/mesa-viva`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Iniciar", description: e.message || "O portal solo não pôde ser aberto." });
    } finally {
      setIsStartingSolo(false);
    }
  }

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-primary/20 pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-display font-black tracking-tighter text-primary">Minhas Crônicas</h1>
          </div>
          <p className="text-2xl font-heading italic text-muted-foreground max-w-xl">
            "Bem-vindo, {user?.displayName}. Os anais do tempo aguardam seu comando."
          </p>
        </div>
        <div className="flex gap-6">
          <Button variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary/5 text-xs font-display tracking-widest" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
          <Button asChild className="btn-ritual rounded-full px-10 h-14 literary-shadow">
            <Link href="/onboarding">
              <PlusCircle className="mr-2 h-5 w-5" /> Nova Crônica
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
        <div className="xl:col-span-2 space-y-10">
          <h2 className="text-3xl font-display font-bold flex items-center gap-4 text-primary">
            <BookOpen className="h-8 w-8" /> Grimórios que Eu Mestro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {campaignsLoading ? (
              <div className="col-span-2 p-20 text-center text-muted-foreground italic font-heading text-2xl opacity-40">Consultando pergaminhos...</div>
            ) : displayCampaigns.length > 0 ? (
              displayCampaigns.map((campaign) => (
                <Card key={campaign.id} className="grimoire-card group">
                  <div className="relative h-64 w-full bg-muted overflow-hidden">
                    <Image
                      src={`https://picsum.photos/seed/${campaign.id}/800/400`}
                      alt={campaign.name}
                      fill
                      className="object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-transparent to-transparent" />
                    <div className="absolute top-6 left-6 flex gap-3">
                      <Badge className="bg-primary text-black font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                        {campaign.status}
                      </Badge>
                      {campaign.owner_id === user?.uid && (
                        <Badge className="bg-[#3A1F5D] text-primary border border-primary/30 font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                          <Crown className="mr-1.5 h-3 w-3" /> Mestre
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-4xl font-display tracking-tight group-hover:text-primary transition-colors">{campaign.name}</CardTitle>
                    <CardDescription className="font-heading italic text-xl mt-2 opacity-60">
                      Mestre: {campaign.owner_id === user?.uid ? 'Você' : 'Outro Arcano'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-10 space-y-6">
                    <div className="flex justify-between items-center text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">
                      <span className="text-muted-foreground opacity-40">Sistema Arcano</span>
                      <span className="text-primary font-bold">{campaign.system_key || 'D&D 5e'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-6 p-8 pt-0">
                    <Button asChild className="btn-ritual w-full h-14" variant="default">
                      <Link href={`/campaign/${campaign.id}/mesa-viva`}>
                        <Play className="mr-2 h-4 w-4" /> Entrar
                      </Link>
                    </Button>
                    {campaign.owner_id === user?.uid ? (
                      <Button asChild variant="ghost" className="w-full h-14 border border-white/5 hover:bg-primary/5 text-xs font-display tracking-widest">
                        <Link href={`/campaign/${campaign.id}/master`}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Gestão
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="w-full h-14 border border-white/5 hover:bg-primary/5 text-xs font-display tracking-widest">
                        <Link href={`/campaign/${campaign.id}/ficha`}>
                          <UserIcon className="mr-2 h-4 w-4" /> Ficha
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 p-32 border-2 border-dashed border-primary/20 rounded-[2rem] text-center space-y-10 bg-primary/5">
                <div className="p-8 rounded-full bg-primary/10 w-fit mx-auto">
                   <Hourglass className="h-16 v-16 text-primary opacity-30" />
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground font-heading italic text-3xl">O silêncio ecoa nestas páginas. Nenhuma crônica foi iniciada.</p>
                  <p className="text-lg text-muted-foreground/60 font-body">Todo herói precisa de um mestre. Toda lenda precisa de um começo.</p>
                </div>
                <Button asChild className="btn-ritual rounded-full px-16 h-16 text-xl literary-shadow">
                  <Link href="/onboarding">Fundar Minha Primeira Lenda</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Barra Lateral Arcana */}
        <div className="space-y-16">
          <section className="p-10 rounded-[2rem] bg-[#3A1F5D]/10 border border-[#7B4FB3]/20 space-y-8 relative overflow-hidden group">
            <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-[#7B4FB3] opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000" />
            <div className="space-y-4">
              <h3 className="text-3xl font-display font-bold text-primary">Jornada Solo</h3>
              <p className="text-lg text-muted-foreground font-heading italic leading-relaxed opacity-70">
                "Não aguarde pela mesa. O Oráculo pode assumir o papel de Mestre e conduzir sua própria crônica."
              </p>
            </div>
            <Button
              onClick={openSoloDialog}
              disabled={isStartingSolo}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 literary-shadow rounded-2xl h-14 font-display text-[10px] tracking-widest"
            >
              {isStartingSolo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Iniciar Aventura Individual
            </Button>
          </section>
        </div>
      </div>

      <Dialog open={isSoloDialogOpen} onOpenChange={setIsSoloDialogOpen}>
        <DialogContent className="bg-card border-primary/20 literary-shadow max-w-2xl">
          {soloStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-display text-primary">Jornada Solo</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Como você quer trilhar sua crônica hoje?
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <button
                  onClick={() => setSoloStep('existing')}
                  className="p-8 rounded-2xl border-2 border-white/5 bg-black/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-left space-y-4 group"
                >
                  <ScrollText className="h-8 w-8 text-primary" />
                  <h4 className="text-xl font-display font-bold group-hover:text-primary transition-colors">Continuar uma Crônica</h4>
                  <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
                    Use uma campanha onde você já é membro e seu personagem existente para uma sessão individual.
                  </p>
                </button>
                <button
                  onClick={() => setSoloStep('new')}
                  className="p-8 rounded-2xl border-2 border-white/5 bg-black/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-left space-y-4 group"
                >
                  <Wand2 className="h-8 w-8 text-primary" />
                  <h4 className="text-xl font-display font-bold group-hover:text-primary transition-colors">Nova Aventura do Zero</h4>
                  <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
                    Descreva o tipo de aventura, seu herói e o tom narrativo. Você revisa tudo antes de criar.
                  </p>
                </button>
              </div>
            </>
          )}

          {soloStep === 'existing' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-display text-primary">Continuar uma Crônica</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Escolha a campanha e o personagem com quem deseja jogar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Campanha</Label>
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Você ainda não participa de nenhuma campanha.</p>
                  ) : (
                    <Select value={selectedExistingCampaignId} onValueChange={setSelectedExistingCampaignId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedExistingCampaignId && (
                  <div className="space-y-2">
                    <Label>Personagem</Label>
                    {loadingExistingCharacters ? (
                      <p className="text-sm text-muted-foreground italic">Buscando seus heróis...</p>
                    ) : existingCharacters.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                        <p className="text-sm text-muted-foreground font-heading italic">
                          Você ainda não tem um personagem nesta campanha.
                        </p>
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href={`/campaign/${selectedExistingCampaignId}/ficha`} onClick={() => setIsSoloDialogOpen(false)}>
                            Criar Personagem na Ficha
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Select value={selectedExistingCharacterId} onValueChange={setSelectedExistingCharacterId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um personagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingCharacters.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name} {c.race ? `— ${c.race}` : ''} {c.class ? `(${c.class})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => setSoloStep('select')}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  disabled={!selectedExistingCampaignId || (existingCharacters.length > 0 && !selectedExistingCharacterId)}
                  onClick={handleEnterExistingSolo}
                >
                  Entrar na Mesa Viva <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}

          {soloStep === 'new' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-display text-primary">Nova Aventura do Zero</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Descreva os fundamentos. Você revisará tudo antes de criar o mundo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Nome da Aventura (opcional)</Label>
                  <Input
                    placeholder="Ex: A Sombra sobre Vaelhall"
                    value={newAdventure.name}
                    onChange={(e) => setNewAdventure((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gênero / Tom</Label>
                    <Select value={newAdventure.genre} onValueChange={(v) => setNewAdventure((p) => ({ ...p, genre: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NARRATIVE_GENRES.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duração Esperada</Label>
                    <Select value={newAdventure.duration} onValueChange={(v) => setNewAdventure((p) => ({ ...p, duration: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADVENTURE_DURATIONS.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tema / Premissa</Label>
                  <Textarea
                    rows={3}
                    placeholder="Sobre o que é esta aventura?"
                    value={newAdventure.theme}
                    onChange={(e) => setNewAdventure((p) => ({ ...p, theme: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
                  <div className="space-y-2 col-span-1">
                    <Label>Nome do Herói</Label>
                    <Input
                      placeholder="Ex: Eldric"
                      value={newAdventure.characterName}
                      onChange={(e) => setNewAdventure((p) => ({ ...p, characterName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Raça</Label>
                    <Select value={newAdventure.characterRace} onValueChange={(v) => setNewAdventure((p) => ({ ...p, characterRace: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DND_RACES.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Classe</Label>
                    <Select value={newAdventure.characterClass} onValueChange={(v) => setNewAdventure((p) => ({ ...p, characterClass: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DND_CLASSES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => setSoloStep('select')}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setSoloStep('new-confirm')}>
                  Revisar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}

          {soloStep === 'new-confirm' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-display text-primary">Confirmar Novo Mundo</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Revise antes de gravar isto nos anais. Nada é salvo até você confirmar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p><span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Aventura: </span>{newAdventure.name.trim() || `Aventura Solo de ${newAdventure.characterName.trim() || 'um Herói Sem Nome'}`}</p>
                  <p><span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gênero: </span>{NARRATIVE_GENRES.find(g => g.id === newAdventure.genre)?.name}</p>
                  <p><span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Duração: </span>{ADVENTURE_DURATIONS.find(d => d.id === newAdventure.duration)?.name}</p>
                  {newAdventure.theme.trim() && (
                    <p><span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Premissa: </span>{newAdventure.theme.trim()}</p>
                  )}
                  {newAdventure.characterName.trim() && (
                    <p><span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Herói: </span>{newAdventure.characterName.trim()} — {DND_RACES.find(r => r.id === newAdventure.characterRace)?.name} {DND_CLASSES.find(c => c.id === newAdventure.characterClass)?.name}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic opacity-70">
                  Será criada uma campanha solo, com sessão e cena inicial prontas para a Mesa Viva. O Oráculo atuará como Mestre.
                </p>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => setSoloStep('new')}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                <Button className="bg-primary hover:bg-primary/90" disabled={isStartingSolo} onClick={handleCreateSoloAdventure}>
                  {isStartingSolo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmar e Criar Mundo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
