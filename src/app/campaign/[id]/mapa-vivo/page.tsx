
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MapPin, Search, ChevronRight, Lock, Eye, EyeOff, Info, Sparkles, Plus, Sword, Package, MessageSquare, Dices, ShieldCheck, XCircle, PanelRightClose, PanelRightOpen, Route, NotebookTabs, Compass } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"

export default function MapaVivo() {
  const { id: campaignId } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const [activeNode, setActiveNode] = React.useState<any>(null)
  const [isTraveling, setIsTraveling] = React.useState(false)
  const [travelEvent, setTravelEvent] = React.useState<{ 
    type: 'peaceful' | 'item' | 'combat' | 'dialogue', 
    title: string, 
    description: string, 
    roll: number,
    targetLocationId: string,
    targetLocationName: string
  } | null>(null)
  
  // Busca campanha (Supabase) para verificar se o usuário atual é o mestre
  const [campaign, setCampaign] = React.useState<{ id: string; owner_id: string } | null>(null)
  const [activeSession, setActiveSession] = React.useState<{ id: string; title: string } | null>(null)
  const [activeScene, setActiveScene] = React.useState<{ id: string; title: string } | null>(null)
  const [locations, setLocations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateLocationOpen, setIsCreateLocationOpen] = React.useState(false)
  const [isCreatingLocation, setIsCreatingLocation] = React.useState(false)
  const [isInvestigateOpen, setIsInvestigateOpen] = React.useState(false)
  const [isPanelOpen, setIsPanelOpen] = React.useState(true)
  const [mobileMapTab, setMobileMapTab] = React.useState("mapa")
  const [newLocation, setNewLocation] = React.useState({ name: "", type: "city", description: "", visibility: "visible" })
  const [membershipRole, setMembershipRole] = React.useState<string | null>(null)

  // Preparação Fase 10: item_type='map' poderá liberar anotações pessoais no Mapa Vivo.
  // Não bloqueia a visualização básica de locais já visíveis.
  const [hasMapItem, setHasMapItem] = React.useState(false)

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    async function loadCampaignAccess() {
      const { data } = await supabase
        .from('campaigns')
        .select('id, owner_id')
        .eq('id', campaignId)
        .maybeSingle()

      if (active) setCampaign(data)

      if (user?.uid) {
        const { data: membership } = await supabase
          .from('campaign_members')
          .select('role')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.uid)
          .eq('status', 'active')
          .maybeSingle()

        if (active) setMembershipRole(membership?.role ?? null)
      } else if (active) {
        setMembershipRole(null)
      }
    }

    loadCampaignAccess()

    return () => {
      active = false
    }
  }, [campaignId, user?.uid])

  const isMaster = campaign?.owner_id === user?.uid || ['owner', 'master', 'assistant_master'].includes(membershipRole || '')
  const isVisibleToPlayers = (visibility: string | null | undefined) => !['secret', 'master_only', 'hidden'].includes(visibility || '')
  const visibleLocations = locations.filter((location) => isMaster || isVisibleToPlayers(location.visibility))
  const secretLocations = isMaster ? locations.filter((location) => !isVisibleToPlayers(location.visibility)) : []

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    async function loadMapData() {
      setLoading(true)

      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id, name, type, description, visibility, status, image_url')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (locationError && active) {
        toast({ variant: "destructive", title: "Erro ao Carregar Mapa", description: locationError.message })
      }

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, title')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let sceneData = null
      if (sessionData) {
        const { data } = await supabase
          .from('scenes')
          .select('id, title')
          .eq('session_id', sessionData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        sceneData = data
      }

      if (user) {
        const { data: character } = await supabase
          .from('characters')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('owner_user_id', user.uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (character) {
          const { data: itemRows } = await supabase
            .from('character_items')
            .select('items(name, item_type)')
            .eq('character_id', character.id)

          const found = (itemRows || []).some((row: any) => {
            const item = Array.isArray(row.items) ? row.items[0] : row.items
            if (!item) return false
            const type = (item.item_type || '').toLowerCase()
            const name = (item.name || '').toLowerCase()
            return type === 'map' || /mapa/.test(name)
          })

          if (active) setHasMapItem(found)
        }
      }

      if (!active) return
      setLocations(locationData || [])
      setActiveSession(sessionData)
      setActiveScene(sceneData)
      setLoading(false)
    }

    loadMapData()

    return () => {
      active = false
    }
  }, [campaignId, toast, user])

  const displayLocations = visibleLocations.map((location, index) => ({
    ...location,
    coords: {
      x: 180 + ((index * 227) % 760),
      y: 140 + ((index * 173) % 420)
    }
  }))

  function renderLocationRows(items: any[], emptyText: string, secret = false) {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground font-heading italic py-4">
          {emptyText}
        </p>
      )
    }

    return (
      <div className="space-y-3">
        {items.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveNode(displayLocations.find((node) => node.id === loc.id) || loc)}
            className="w-full text-left p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold text-accent">{loc.name}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">{loc.type || 'local'}</p>
              </div>
              <Badge variant="outline" className={secret ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"}>
                {loc.visibility || 'visible'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-heading italic leading-relaxed mt-3 line-clamp-3">
              {loc.description || 'Nenhum detalhe registrado ainda.'}
            </p>
            {loc.image_url && (
              <div className="mt-3 h-20 w-full rounded-lg overflow-hidden border border-white/10">
                <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover opacity-70" />
              </div>
            )}
          </button>
        ))}
      </div>
    )
  }

  function renderMapSidePanel() {
    return (
      <div className="h-full rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl literary-shadow overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">Cartografia</p>
            <h2 className="font-display text-2xl text-accent">Painel do Mapa</h2>
          </div>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setIsPanelOpen(false)}>
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-84px)]">
          <Accordion type="multiple" defaultValue={["locais", "legenda"]} className="px-5 py-4">
            <AccordionItem value="locais" className="border-white/10">
              <AccordionTrigger className="font-ui text-xs uppercase tracking-widest">
                <Compass className="mr-2 h-4 w-4 text-primary" /> Locais Visíveis
              </AccordionTrigger>
              <AccordionContent>
                {renderLocationRows(visibleLocations, "Nenhum local visível foi registrado ainda.")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conexoes" className="border-white/10">
              <AccordionTrigger className="font-ui text-xs uppercase tracking-widest">
                <Route className="mr-2 h-4 w-4 text-primary" /> Caminhos / Conexões
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground font-heading italic py-4">
                  Nenhuma conexão real foi cadastrada para este mapa ainda.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="anotacoes" className="border-white/10">
              <AccordionTrigger className="font-ui text-xs uppercase tracking-widest">
                <NotebookTabs className="mr-2 h-4 w-4 text-primary" /> Anotações
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground font-heading italic py-4">
                  Anotações do mapa ainda não foram implementadas. {hasMapItem ? "Você possui um item Mapa para liberar esse fluxo em fase futura." : "Um item Mapa poderá liberar esse recurso em fase futura."}
                </p>
              </AccordionContent>
            </AccordionItem>

            {isMaster && (
              <AccordionItem value="segredos" className="border-white/10">
                <AccordionTrigger className="font-ui text-xs uppercase tracking-widest">
                  <Lock className="mr-2 h-4 w-4 text-destructive" /> Segredos do Mestre
                </AccordionTrigger>
                <AccordionContent>
                  {renderLocationRows(secretLocations, "Nenhum local secreto foi registrado ainda.", true)}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="legenda" className="border-white/10">
              <AccordionTrigger className="font-ui text-xs uppercase tracking-widest">
                <Info className="mr-2 h-4 w-4 text-primary" /> Legenda
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Local disponível para a mesa.</p>
                  <p className="flex items-center gap-2"><EyeOff className="h-4 w-4" /> Local oculto ou desconhecido.</p>
                  <p className="flex items-center gap-2"><Dices className="h-4 w-4 text-accent" /> Viagens registram rolagem real quando há sessão ativa.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </div>
    )
  }

  function renderMobilePanel() {
    if (mobileMapTab === "locais") {
      return (
        <div className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl p-5">
          <h2 className="font-display text-2xl text-accent mb-4">Locais Visíveis</h2>
          <ScrollArea className="h-[54vh] pr-3">
            {renderLocationRows(visibleLocations, "Nenhum local visível foi registrado ainda.")}
          </ScrollArea>
        </div>
      )
    }

    if (mobileMapTab === "anotacoes") {
      return (
        <div className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl p-5">
          <h2 className="font-display text-2xl text-accent mb-4">Anotações</h2>
          <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
            Anotações do mapa ainda não foram implementadas. {hasMapItem ? "Você possui um item Mapa para liberar esse fluxo em fase futura." : "Um item Mapa poderá liberar esse recurso em fase futura."}
          </p>
        </div>
      )
    }

    return (
      <div className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl p-5">
        <h2 className="font-display text-2xl text-accent mb-4">Legenda</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Local disponível para a mesa.</p>
          <p className="flex items-center gap-2"><EyeOff className="h-4 w-4" /> Local oculto ou desconhecido.</p>
          <p className="flex items-center gap-2"><Dices className="h-4 w-4 text-accent" /> Viagens registram rolagem real quando há sessão ativa.</p>
          {isMaster && <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-destructive" /> Segredos aparecem apenas para mestre/owner.</p>}
        </div>
      </div>
    )
  }

  async function handleMoveGroup(locationId: string, locationName: string) {
    setIsTraveling(true)
    
    // Rolagem 1d20 oficial
    const roll = Math.floor(Math.random() * 20) + 1
    
    // Registro da rolagem no banco (Fase 5/8)
    if (activeSession && user) {
      const supabase = createClient()
      await supabase.from('dice_rolls').insert({
        campaign_id: campaignId,
        session_id: activeSession.id,
        scene_id: activeScene?.id ?? null,
        character_id: null,
        user_id: user.uid,
        roll_type: 'virtual',
        formula: '1d20',
        raw_result: roll,
        modifier: 0,
        total: roll,
        reason: `Viagem para ${locationName}`,
        visibility: activeScene ? 'scene' : 'public'
      })

      if (activeScene && isMaster) {
        await supabase.from('scene_messages').insert({
          campaign_id: campaignId,
          session_id: activeSession.id,
          scene_id: activeScene.id,
          sender_user_id: user.uid,
          character_id: null,
          message_type: 'dice',
          visibility: 'scene',
          content: `Rolou 1d20 para Viagem para ${locationName}: **${roll}**`,
          metadata: { rollData: { formula: '1d20', result: roll, reason: `Viagem para ${locationName}` } }
        })
      }
    }

    setTimeout(() => {
      let event: any = null
      
      if (roll <= 8) {
        event = { type: 'peaceful', title: 'Caminho Desimpedido', description: `A estrada para ${locationName} revela-se clemente. O grupo avança sob o silêncio das estrelas.`, roll }
      } else if (roll <= 13) {
        event = { type: 'dialogue', title: 'Vulto na Estrada', description: `Uma figura encapuzada observa vocês de longe. "A crônica de ${locationName} ainda tem páginas em branco", murmura antes de sumir.`, roll }
      } else if (roll <= 17) {
        event = { type: 'item', title: 'Relíquia Esquecida', description: `Luzes arcanas refletem em algo enterrado. Parece ser um fragmento de pergaminho antigo ou um amuleto quebrado.`, roll }
      } else {
        event = { type: 'combat', title: 'Presságio de Sangue', description: `O vento traz o cheiro de aço e fumaça. Sombras hostis bloqueiam o caminho para ${locationName}.`, roll }
      }
      
      setTravelEvent({ ...event, targetLocationId: locationId, targetLocationName: locationName })
      setIsTraveling(false)
    }, 1500)
  }

  async function finalizeTravel(approved: boolean = true) {
    if (approved && travelEvent) {
      // No MVP, a mudança de posição é imediata após aprovação/conclusão
      toast({ title: "Jornada Concluída", description: `O grupo chegou a ${travelEvent.targetLocationName}.` })
    }
    setTravelEvent(null)
  }

  async function sendToApprovals(type: string) {
    if (!campaignId || !travelEvent || !user) return
    const supabase = createClient()
    
    const { error } = await supabase.from('approval_requests').insert({
      campaign_id: campaignId,
      session_id: activeSession?.id ?? null,
      scene_id: activeScene?.id ?? null,
      requested_by: user.uid,
      request_type: type,
      title: `Encontro de Viagem: ${travelEvent.title}`,
      description: travelEvent.description,
      status: 'pending',
      payload: { roll: travelEvent.roll, location: travelEvent.targetLocationName, target_location_id: travelEvent.targetLocationId }
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Enviar Solicitação", description: error.message })
      return
    }

    toast({ title: "Enviado ao Mestre", description: "O evento aguarda validação canônica." })
    setTravelEvent(null)
  }

  async function handleCreateLocation() {
    if (!campaignId || !user || !newLocation.name.trim()) return
    setIsCreatingLocation(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .insert({
          campaign_id: campaignId,
          name: newLocation.name.trim(),
          type: newLocation.type,
          description: newLocation.description || null,
          visibility: newLocation.visibility,
          status: 'active',
          created_by: user.uid,
        })
        .select('id, name, type, description, visibility, status, image_url')
        .single()

      if (error) throw error

      setLocations((prev) => [data, ...prev])
      toast({ title: "Ponto Marcado", description: `${newLocation.name} agora existe no mapa.` })
      setIsCreateLocationOpen(false)
      setNewLocation({ name: "", type: "city", description: "", visibility: "visible" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Cartografia", description: e.message })
    } finally {
      setIsCreatingLocation(false)
    }
  }

  async function handleLocationImageUploaded(mediaAsset: MediaAsset) {
    if (!activeNode || !mediaAsset.public_url) return
    const supabase = createClient()
    const { error } = await supabase
      .from('locations')
      .update({ image_url: mediaAsset.public_url })
      .eq('id', activeNode.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar imagem", description: error.message })
      return
    }

    setLocations((prev) => prev.map((loc) => loc.id === activeNode.id ? { ...loc, image_url: mediaAsset.public_url } : loc))
    setActiveNode((prev: any) => prev ? { ...prev, image_url: mediaAsset.public_url } : prev)
    toast({ title: "Imagem do local atualizada" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-5 lg:p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center z-10 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center tracking-tight">
            <MapPin className="mr-3 h-6 w-6 text-primary animate-pulse" /> Mapa Vivo
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-1">Cartografia canônica da campanha</p>
          {hasMapItem && (
            <Badge variant="outline" className="mt-2 text-[9px] uppercase tracking-widest border-accent/30 text-accent">
              Mapa em posse — anotações pessoais em breve
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => router.push(`/campaign/${campaignId}/mesa-viva`)}>
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" /> Voltar à Mesa
          </Button>
          {!isPanelOpen && (
            <Button variant="outline" size="sm" className="hidden lg:inline-flex rounded-full border-primary/30 text-primary" onClick={() => setIsPanelOpen(true)}>
              <PanelRightOpen className="mr-2 h-4 w-4" /> Painel
            </Button>
          )}
          {isMaster && (
            <Dialog open={isCreateLocationOpen} onOpenChange={setIsCreateLocationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full border-primary/30 text-primary hover:bg-primary/10">
                  <Plus className="mr-2 h-4 w-4" /> Novo Ponto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 literary-shadow max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display text-accent">Marcar Novo Ponto no Mapa</DialogTitle>
                  <DialogDescription className="font-heading italic">
                    Registre um novo local na cartografia desta crônica.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="loc-name">Nome</Label>
                    <Input
                      id="loc-name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Vila de Arvand"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={newLocation.type} onValueChange={(v) => setNewLocation((p) => ({ ...p, type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">Cidade</SelectItem>
                          <SelectItem value="village">Vilarejo</SelectItem>
                          <SelectItem value="dungeon">Masmorra</SelectItem>
                          <SelectItem value="wilderness">Natureza Selvagem</SelectItem>
                          <SelectItem value="landmark">Marco</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Visibilidade</Label>
                      <Select value={newLocation.visibility} onValueChange={(v) => setNewLocation((p) => ({ ...p, visibility: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visible">Visível aos Jogadores</SelectItem>
                          <SelectItem value="known">Conhecido</SelectItem>
                          <SelectItem value="hidden">Oculto</SelectItem>
                          <SelectItem value="secret">Secreto</SelectItem>
                          <SelectItem value="master_only">Apenas Mestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc-desc">Descrição</Label>
                    <Textarea
                      id="loc-desc"
                      value={newLocation.description}
                      onChange={(e) => setNewLocation((p) => ({ ...p, description: e.target.value }))}
                      placeholder="O que torna este lugar memorável?"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    disabled={!newLocation.name.trim() || isCreatingLocation}
                    onClick={handleCreateLocation}
                  >
                    {isCreatingLocation ? "Marcando..." : "Marcar no Mapa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isInvestigateOpen} onOpenChange={setIsInvestigateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10">
                <Search className="mr-2 h-4 w-4" /> Investigar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-accent/20 literary-shadow max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display text-accent">Locais Conhecidos</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Tudo o que sua party já descobriu sobre esta região.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-4">
                  {locations.length === 0 && (
                    <p className="text-sm text-muted-foreground font-heading italic text-center py-8">
                      Nenhum local foi descoberto ainda.
                    </p>
                  )}
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-accent">{loc.name}</span>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{loc.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-heading italic leading-relaxed">
                        {loc.description || 'Nenhum detalhe registrado ainda.'}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 bg-[#0A0A0F] p-4 lg:p-6 overflow-hidden">
        <Tabs value={mobileMapTab} onValueChange={setMobileMapTab} className="lg:hidden mb-4">
          <TabsList className="grid grid-cols-4 bg-card/70 border border-white/10">
            <TabsTrigger value="mapa" className="text-[10px] uppercase tracking-widest">Mapa</TabsTrigger>
            <TabsTrigger value="locais" className="text-[10px] uppercase tracking-widest">Locais</TabsTrigger>
            <TabsTrigger value="anotacoes" className="text-[10px] uppercase tracking-widest">Notas</TabsTrigger>
            <TabsTrigger value="legenda" className="text-[10px] uppercase tracking-widest">Legenda</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className={`h-[calc(100vh-184px)] min-h-[560px] grid gap-4 ${isPanelOpen ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-1'}`}>
          <div className={`${mobileMapTab === "mapa" ? "block" : "hidden"} lg:block relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0F]`}>
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="absolute inset-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-heading italic">
              Consultando rotas e presságios...
            </div>
          )}
          {!loading && displayLocations.map((node: any) => (
            <MapNode 
              key={node.id} 
              node={node} 
              isActive={activeNode?.id === node.id} 
              onClick={() => setActiveNode(node)}
            />
          ))}
        </div>

        {activeNode && !isTraveling && (
          <div className="absolute top-8 right-8 w-80 rounded-3xl bg-card/90 backdrop-blur-2xl border border-accent/20 literary-shadow animate-in slide-in-from-right-8 duration-500 overflow-hidden">
             <div className="relative h-40">
               {activeNode.image_url ? (
                 <img src={activeNode.image_url} alt={activeNode.name} className="object-cover w-full h-full opacity-70" />
               ) : (
                 <img src={`https://picsum.photos/seed/${activeNode.id}/400/200`} alt={activeNode.name} className="object-cover w-full h-full opacity-40" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
               <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/50" onClick={() => setActiveNode(null)}>
                 <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
             <div className="p-6 space-y-6">
               <h2 className="text-2xl font-display font-bold text-accent">{activeNode.name}</h2>
               <p className="text-xs text-muted-foreground font-heading italic leading-relaxed">
                 {activeNode.description || 'Um local envolto em névoas e mistérios.'}
               </p>
               {isMaster && (
                 <R2ImageUpload
                   campaignId={campaignId}
                   usageType="location_image"
                   visibility="party"
                   label="Definir imagem do local"
                   mode="direct"
                   entityType="location"
                   entityId={activeNode.id}
                   onUploaded={handleLocationImageUploaded}
                 />
               )}
               <Button
                 className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[11px]"
                 onClick={() => handleMoveGroup(activeNode.id, activeNode.name)}
               >
                 Viajar para cá <ChevronRight className="ml-2 h-4 w-4" />
               </Button>
             </div>
          </div>
        )}

        {isTraveling && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
             <div className="p-8 rounded-full bg-primary/20 border border-primary/30 animate-pulse mb-6">
                <MapPin className="h-12 w-12 text-primary" />
             </div>
             <h2 className="text-3xl font-display font-black text-white">Cruzando a Fronteira...</h2>
             <p className="text-muted-foreground font-heading italic mt-2">O destino está sendo traçado pelos dados.</p>
          </div>
        )}

        <Dialog open={!!travelEvent} onOpenChange={() => finalizeTravel(false)}>
          <DialogContent className="bg-card border-accent/30 literary-shadow max-w-lg">
            <DialogHeader>
              <div className="flex justify-center mb-6">
                <div className={`p-5 rounded-2xl border-2 ${
                  travelEvent?.type === 'combat' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                  travelEvent?.type === 'item' ? 'bg-primary/20 text-primary border-primary/30' :
                  'bg-accent/20 text-accent border-accent/30'
                }`}>
                   {travelEvent?.type === 'combat' ? <Sword className="h-10 w-10" /> :
                    travelEvent?.type === 'item' ? <Package className="h-10 w-10" /> :
                    <Sparkles className="h-10 w-10" />}
                </div>
              </div>
              <DialogTitle className="text-3xl font-display text-center text-accent">{travelEvent?.title}</DialogTitle>
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="bg-black/20 text-[10px] uppercase font-black tracking-widest">
                  <Dices className="mr-2 h-3 w-3 text-primary" /> Resultado: {travelEvent?.roll}
                </Badge>
              </div>
              <DialogDescription className="text-xl font-heading italic text-center text-foreground/90 mt-6 leading-relaxed">
                "{travelEvent?.description}"
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {isMaster ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-primary h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => finalizeTravel(true)}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Concluir Viagem
                    </Button>
                    <Button variant="outline" className="h-12 rounded-xl border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-widest" onClick={() => finalizeTravel(false)}>
                      <XCircle className="mr-2 h-4 w-4" /> Ignorar Encontro
                    </Button>
                  </div>
                  {travelEvent?.type === 'combat' && (
                    <Button className="bg-destructive hover:bg-destructive/90 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push(`/campaign/${campaignId}/combate`)}>
                      Iniciar Combate Agora
                    </Button>
                  )}
                  {travelEvent?.type === 'dialogue' && (
                    <Button variant="secondary" className="h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push(`/campaign/${campaignId}/mesa-viva`)}>
                      Transformar em Cena
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest bg-white/5 p-3 rounded-lg border border-white/5">
                    Este evento requer validação do Mestre para se tornar canônico.
                  </p>
                  <Button className="w-full bg-accent text-accent-foreground h-12 rounded-xl font-bold" onClick={() => sendToApprovals(travelEvent?.type || 'travel')}>
                    Notificar Mestre e Aguardar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
          </div>

          <aside className={`${mobileMapTab === "mapa" ? "hidden" : "block"} lg:block ${isPanelOpen ? "" : "lg:hidden"} min-h-0 overflow-hidden`}>
            <div className="hidden lg:block h-full">
              {renderMapSidePanel()}
            </div>
            <div className="lg:hidden">
              {renderMobilePanel()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MapNode({ node, isActive, onClick }: { node: any, isActive: boolean, onClick: () => void }) {
  const isUnknown = node.status === 'unknown'
  return (
    <div 
      className={`absolute cursor-pointer transition-all duration-700 flex flex-col items-center group
        ${isActive ? 'z-20 scale-125' : 'z-10 hover:scale-110'}
        ${isUnknown ? 'opacity-20' : 'opacity-100'}
      `}
      style={{ left: `${node.coords.x}px`, top: `${node.coords.y}px`, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`p-4 rounded-2xl border-2 transition-all shadow-arcane
        ${isActive ? 'bg-primary border-accent animate-glow' : 'bg-card border-white/10 group-hover:border-primary/50'}
      `}>
        {isUnknown ? <EyeOff className="h-6 w-6 text-muted-foreground" /> : <MapPin className={`h-6 w-6 ${isActive ? 'text-white' : 'text-primary'}`} />}
      </div>
      <span className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-white/5 ${isActive ? 'text-white bg-primary' : 'text-muted-foreground'}`}>
        {isUnknown ? '???' : node.name}
      </span>
    </div>
  )
}
