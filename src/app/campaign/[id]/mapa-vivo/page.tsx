
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
import { MapPin, Search, ChevronRight, ChevronLeft, Lock, Eye, EyeOff, Info, Sparkles, Plus, Sword, Package, MessageSquare, Dices, ShieldCheck, XCircle, PanelRightClose, PanelRightOpen, Route, NotebookTabs, Compass, Building2, Mountain, Skull, Landmark, DoorOpen, AlertTriangle, Store, Star, Image as ImageIcon, Settings2, Crosshair } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"

// ----------------------------------------------------------------------------
// Mapa Vivo em camadas: cada location tem uma escala (map_scope) e pode
// pertencer a outra location (parent_location_id), formando a hierarquia
// Mundo -> Região/Cidade -> Local/Dungeon. A aba "Locais/Dungeons" agrupa os
// escopos 'local' e 'dungeon' em uma única visão de navegação.
// ----------------------------------------------------------------------------

type MapScope = "world" | "region" | "city" | "local" | "dungeon"
type MapTab = "world" | "region" | "city" | "local_dungeon"
type MapMarkerType = "point" | "city" | "region" | "dungeon" | "landmark" | "portal" | "danger" | "shop" | "quest"

type Location = {
  id: string
  name: string
  type: string | null
  description: string | null
  visibility: string | null
  status: string | null
  image_url: string | null
  map_scope: MapScope
  parent_location_id: string | null
  map_position_x: number
  map_position_y: number
  map_marker_type: MapMarkerType
  map_icon: string | null
  map_scale: "tiny" | "small" | "medium" | "large" | "huge"
  map_image_fit: "contain" | "cover"
  map_grid_enabled: boolean
  map_grid_opacity: number
}

type BreadcrumbEntry = { id: string | null; name: string; tab: MapTab }

const MAP_TABS: { key: MapTab; label: string }[] = [
  { key: "world", label: "Mundo" },
  { key: "region", label: "Regiões" },
  { key: "city", label: "Cidades" },
  { key: "local_dungeon", label: "Locais/Dungeons" },
]

const TAB_LABEL: Record<MapTab, string> = {
  world: "Mundo",
  region: "Regiões",
  city: "Cidades",
  local_dungeon: "Locais/Dungeons",
}

const SCOPE_PANEL_TITLE: Record<MapTab, string> = {
  world: "Locais do Mundo",
  region: "Locais da Região",
  city: "Locais da Cidade",
  local_dungeon: "Pontos Internos",
}

const MAP_SCOPE_LABEL: Record<MapScope, string> = {
  world: "Mundo",
  region: "Região",
  city: "Cidade",
  local: "Local",
  dungeon: "Dungeon",
}

const MARKER_TYPE_META: Record<MapMarkerType, { label: string; icon: React.ElementType }> = {
  point: { label: "Ponto", icon: MapPin },
  city: { label: "Cidade", icon: Building2 },
  region: { label: "Região", icon: Mountain },
  dungeon: { label: "Dungeon", icon: Skull },
  landmark: { label: "Marco", icon: Landmark },
  portal: { label: "Portal", icon: DoorOpen },
  danger: { label: "Perigo", icon: AlertTriangle },
  shop: { label: "Loja", icon: Store },
  quest: { label: "Missão", icon: Star },
}

const SCALE_SIZE_PX: Record<Location["map_scale"], number> = {
  tiny: 28,
  small: 34,
  medium: 42,
  large: 52,
  huge: 64,
}

function tabToScope(tab: MapTab): MapScope | null {
  if (tab === "local_dungeon") return null
  return tab
}

function locationMatchesTab(loc: Location, tab: MapTab): boolean {
  if (tab === "local_dungeon") return loc.map_scope === "local" || loc.map_scope === "dungeon"
  return loc.map_scope === tab
}

// Ao "Entrar neste mapa", decide qual aba abrir por padrão: se a location já
// tem filhos, abre na aba do escopo predominante entre eles; caso contrário,
// usa a camada "natural" abaixo do escopo da location (cidade -> locais,
// região -> cidades, mundo -> regiões).
function childTabForLocation(loc: Location, allLocations: Location[]): MapTab {
  const children = allLocations.filter((l) => l.parent_location_id === loc.id)

  if (children.length > 0) {
    const counts: Record<MapTab, number> = { world: 0, region: 0, city: 0, local_dungeon: 0 }
    for (const child of children) {
      const tab: MapTab = child.map_scope === "local" || child.map_scope === "dungeon" ? "local_dungeon" : (child.map_scope as MapTab)
      counts[tab] = (counts[tab] ?? 0) + 1
    }
    let predominant: MapTab = "local_dungeon"
    let max = -1
    for (const tab of Object.keys(counts) as MapTab[]) {
      if (counts[tab] > max) {
        max = counts[tab]
        predominant = tab
      }
    }
    return predominant
  }

  switch (loc.map_scope) {
    case "world": return "region"
    case "region": return "city"
    case "city": return "local_dungeon"
    case "local": return "local_dungeon"
    case "dungeon": return "local_dungeon"
    default: return "city"
  }
}

function normalizeLocation(raw: any): Location {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type ?? null,
    description: raw.description ?? null,
    visibility: raw.visibility ?? null,
    status: raw.status ?? null,
    image_url: raw.image_url ?? null,
    map_scope: (raw.map_scope ?? "world") as MapScope,
    parent_location_id: raw.parent_location_id ?? null,
    map_position_x: raw.map_position_x ?? 50,
    map_position_y: raw.map_position_y ?? 50,
    map_marker_type: (raw.map_marker_type ?? "point") as MapMarkerType,
    map_icon: raw.map_icon ?? null,
    map_scale: (raw.map_scale ?? "medium") as Location["map_scale"],
    map_image_fit: (raw.map_image_fit ?? "contain") as "contain" | "cover",
    map_grid_enabled: raw.map_grid_enabled ?? false,
    map_grid_opacity: raw.map_grid_opacity ?? 0.35,
  }
}

const LOCATION_SELECT = "id, name, type, description, visibility, status, image_url, map_scope, parent_location_id, map_position_x, map_position_y, map_marker_type, map_icon, map_scale, map_image_fit, map_grid_enabled, map_grid_opacity"

export default function MapaVivo() {
  const { id: campaignId } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const [activeNode, setActiveNode] = React.useState<Location | null>(null)
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
  const [locations, setLocations] = React.useState<Location[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateLocationOpen, setIsCreateLocationOpen] = React.useState(false)
  const [isCreatingLocation, setIsCreatingLocation] = React.useState(false)
  const [isInvestigateOpen, setIsInvestigateOpen] = React.useState(false)
  const [isPanelOpen, setIsPanelOpen] = React.useState(true)
  const [mobileMapTab, setMobileMapTab] = React.useState("mapa")
  const [newLocation, setNewLocation] = React.useState({
    name: "",
    type: "city",
    description: "",
    visibility: "visible",
    map_scope: "world" as MapScope,
    map_marker_type: "point" as MapMarkerType,
    parent_location_id: "",
    map_position_x: "50",
    map_position_y: "50",
  })
  const [membershipRole, setMembershipRole] = React.useState<string | null>(null)

  // Navegação em camadas: pilha de breadcrumb. O primeiro item é sempre o
  // Mundo (id null). "Entrar neste mapa" empilha; "Voltar" desempilha.
  const [breadcrumbStack, setBreadcrumbStack] = React.useState<BreadcrumbEntry[]>([
    { id: null, name: "Mundo", tab: "world" },
  ])

  // Edição de posição de marcador (mestre): X%/Y% manuais ou clique no mapa.
  const [positioningLocationId, setPositioningLocationId] = React.useState<string | null>(null)
  const [posXInput, setPosXInput] = React.useState("50")
  const [posYInput, setPosYInput] = React.useState("50")

  // Ajuste de imagem/grade da camada atual (mestre).
  const [adjustImageOpen, setAdjustImageOpen] = React.useState(false)
  const [adjustFitInput, setAdjustFitInput] = React.useState<"contain" | "cover">("contain")
  const [adjustGridEnabledInput, setAdjustGridEnabledInput] = React.useState(false)
  const [adjustGridOpacityInput, setAdjustGridOpacityInput] = React.useState("35")
  const [adjustSubmitting, setAdjustSubmitting] = React.useState(false)

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
  const allVisibleLocations = locations.filter((location) => isMaster || isVisibleToPlayers(location.visibility))

  // Navegação em camadas: a camada/escopo atual e o "local pai" são derivados
  // do topo da pilha de breadcrumb.
  const currentCrumb = breadcrumbStack[breadcrumbStack.length - 1]
  const currentTab = currentCrumb.tab
  const currentParentLocationId = currentCrumb.id

  // Título da camada atual: sem local pai, mostra só o nome da aba
  // ("Mundo", "Regiões", "Cidades", "Locais/Dungeons"); dentro de um local
  // pai, mostra a cadeia completa ("Mundo > Hive Primus > Locais/Dungeons").
  const pageTitle = currentParentLocationId
    ? `Mundo > ${breadcrumbStack.slice(1).map((entry) => entry.name).join(" > ")} > ${TAB_LABEL[currentTab]}`
    : TAB_LABEL[currentTab]

  // Filtro por camada: na raiz (currentParentLocationId === null), cada aba
  // mostra apenas locations com o map_scope correspondente e sem pai (exceto
  // "Mundo", que agrega tudo que está na raiz). Dentro de um local pai, cada
  // aba mostra os filhos diretos com o map_scope correspondente. Isso permite
  // que "Hive Primus" (city, sem pai) apareça na aba Cidades da raiz, e que
  // seus locais internos apareçam em "Locais/Dungeons" só depois de "Entrar
  // neste mapa".
  const scopedLocations = locations.filter((location) => {
    if (currentTab === "world") {
      return location.map_scope === "world" || location.parent_location_id === null
    }
    return locationMatchesTab(location, currentTab) && location.parent_location_id === currentParentLocationId
  })

  const visibleLocations = scopedLocations.filter((location) => isMaster || isVisibleToPlayers(location.visibility))
  const secretLocations = isMaster ? scopedLocations.filter((location) => !isVisibleToPlayers(location.visibility)) : []
  const markersToRender = isMaster ? scopedLocations : visibleLocations

  // A imagem de fundo da camada atual vem do local "pai" (quando navegando
  // para dentro de uma cidade/local) ou, na raiz do Mundo, de uma location
  // com map_scope='world' sem pai que tenha uma imagem cadastrada (a
  // selecionada no momento, se aplicável, ou a primeira visível).
  const worldRootImageLocation = locations.find((location) => location.map_scope === "world" && location.parent_location_id === null && !!location.image_url) ?? null

  const currentViewLocation = currentParentLocationId
    ? locations.find((location) => location.id === currentParentLocationId) ?? null
    : (activeNode && activeNode.map_scope === "world" && activeNode.parent_location_id === null && activeNode.image_url
        ? activeNode
        : worldRootImageLocation)

  const backgroundImageUrl = currentViewLocation?.image_url ?? null

  function handleTabClick(tab: MapTab) {
    setActiveNode(null)
    setPositioningLocationId(null)
    if (tab === "world") {
      setBreadcrumbStack([{ id: null, name: "Mundo", tab: "world" }])
      return
    }
    setBreadcrumbStack((prev) => {
      const next = [...prev]
      next[next.length - 1] = { ...next[next.length - 1], tab }
      return next
    })
  }

  function handleEnterLocation(location: Location) {
    setActiveNode(null)
    setPositioningLocationId(null)
    setBreadcrumbStack((prev) => [...prev, { id: location.id, name: location.name, tab: childTabForLocation(location, locations) }])
  }

  function handleGoBack() {
    setActiveNode(null)
    setPositioningLocationId(null)
    setBreadcrumbStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    async function loadMapData() {
      setLoading(true)

      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select(LOCATION_SELECT)
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
      setLocations((locationData || []).map(normalizeLocation))
      setActiveSession(sessionData)
      setActiveScene(sceneData)
      setLoading(false)
    }

    loadMapData()

    return () => {
      active = false
    }
  }, [campaignId, toast, user])

  // Mantém os campos de posição (X%/Y%) do painel sincronizados com o local
  // selecionado, para que "Salvar Posição" comece a partir do valor atual.
  React.useEffect(() => {
    if (activeNode) {
      setPosXInput(String(activeNode.map_position_x))
      setPosYInput(String(activeNode.map_position_y))
    }
  }, [activeNode?.id])

  const displayLocations = visibleLocations.map((location, index) => ({
    ...location,
    coords: {
      x: 180 + ((index * 227) % 760),
      y: 140 + ((index * 173) % 420)
    }
  }))

  function renderLocationRows(items: Location[], emptyText: string, secret = false) {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground font-heading italic py-4">
          {emptyText}
        </p>
      )
    }

    return (
      <div className="space-y-3">
        {items.map((loc) => {
          const markerMeta = MARKER_TYPE_META[loc.map_marker_type] || MARKER_TYPE_META.point
          const MarkerIcon = markerMeta.icon
          const parent = loc.parent_location_id ? locations.find((l) => l.id === loc.parent_location_id) : null
          const hasChildren = locations.some((l) => l.parent_location_id === loc.id)
          // "Entrar neste mapa" fica disponível se já houver imagem, filhos
          // cadastrados, ou se o mestre quiser começar a criar filhos aqui.
          const canEnter = !!loc.image_url || hasChildren || isMaster

          return (
            <div
              key={loc.id}
              className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-colors space-y-3"
            >
              <button type="button" onClick={() => setActiveNode(loc)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-accent flex items-center gap-2">
                      <MarkerIcon className="h-4 w-4 text-primary" /> {loc.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">
                      {MAP_SCOPE_LABEL[loc.map_scope]} · {markerMeta.label}
                      {parent && <> · em {parent.name}</>}
                    </p>
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
              {canEnter && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-[10px] uppercase tracking-widest"
                  onClick={() => handleEnterLocation(loc)}
                >
                  Entrar neste mapa <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Estado vazio da camada atual: explica o que esta aba mostra e, para o
  // mestre, oferece um caminho direto para cadastrar o primeiro ponto aqui.
  function renderEmptyLayerState() {
    if (scopedLocations.length > 0) return null

    // Atenção: usa o local pai do breadcrumb (currentParentLocationId), não
    // currentViewLocation — na raiz, currentViewLocation pode ser uma
    // location de escopo Mundo usada só como imagem de fundo, sem relação
    // com a navegação em camadas.
    const parentLocation = currentParentLocationId ? locations.find((l) => l.id === currentParentLocationId) ?? null : null
    const parentName = parentLocation?.name ?? null
    let title = ""
    let description = ""
    let actions: React.ReactNode = null

    if (currentTab === "world") {
      title = "Nenhum ponto do mundo cadastrado ainda."
      description = "Marque cidades, regiões e marcos importantes para começar a cartografia desta crônica."
      if (isMaster) {
        actions = (
          <Button size="sm" className="rounded-full" onClick={() => handleOpenCreateLocation(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Ponto do Mundo
          </Button>
        )
      }
    } else if (currentTab === "region") {
      title = "Nenhuma região cadastrada ainda."
      description = parentName
        ? `Nenhuma região foi cadastrada dentro de ${parentName}.`
        : "Cadastre as grandes regiões do mundo para organizar cidades e locais."
      if (isMaster) {
        actions = (
          <Button size="sm" className="rounded-full" onClick={() => handleOpenCreateLocation(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Região
          </Button>
        )
      }
    } else if (currentTab === "city") {
      title = "Nenhuma cidade cadastrada ainda."
      description = parentName
        ? `Nenhuma cidade foi cadastrada dentro de ${parentName}.`
        : "Cadastre as cidades conhecidas do mundo para organizar locais e dungeons."
      if (isMaster) {
        actions = (
          <Button size="sm" className="rounded-full" onClick={() => handleOpenCreateLocation(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Cidade
          </Button>
        )
      }
    } else if (currentTab === "local_dungeon") {
      if (!parentName) {
        title = "Nenhum local independente cadastrado."
        description = "Locais e dungeons normalmente pertencem a uma cidade, região ou ponto do mundo. Selecione um mapa e clique em \"Entrar neste mapa\", ou crie um local independente."
        if (isMaster) {
          actions = (
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" className="rounded-full" onClick={() => handleOpenCreateLocation(true)}>
                <Plus className="mr-2 h-4 w-4" /> Criar Local Independente
              </Button>
              <Button size="sm" variant="outline" className="rounded-full border-white/10" onClick={() => handleTabClick("world")}>
                Voltar ao Mundo
              </Button>
            </div>
          )
        }
      } else {
        title = `Nenhum local interno foi cadastrado em ${parentName}.`
        description = "Locais e dungeons internos aparecem aqui depois de criados dentro deste mapa."
        if (isMaster) {
          actions = (
            <Button size="sm" className="rounded-full" onClick={() => handleOpenCreateLocation(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Local em {parentName}
            </Button>
          )
        }
      }
    }

    if (!title) return null

    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-6">
        <div className="pointer-events-auto max-w-md w-full text-center space-y-4 rounded-3xl border border-white/10 bg-card/90 backdrop-blur-xl p-6 literary-shadow">
          <p className="font-display text-xl text-accent">{title}</p>
          <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">{description}</p>
          {actions}
        </div>
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
                <Compass className="mr-2 h-4 w-4 text-primary" /> {SCOPE_PANEL_TITLE[currentTab]}
              </AccordionTrigger>
              <AccordionContent>
                {renderLocationRows(visibleLocations, "Nenhum local visível foi registrado nesta camada ainda.")}
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
          <h2 className="font-display text-2xl text-accent mb-4">{SCOPE_PANEL_TITLE[currentTab]}</h2>
          <ScrollArea className="h-[54vh] pr-3">
            {renderLocationRows(visibleLocations, "Nenhum local visível foi registrado nesta camada ainda.")}
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

  function handleOpenCreateLocation(open: boolean) {
    if (open) {
      setNewLocation((p) => ({
        ...p,
        map_scope: tabToScope(currentTab) ?? "local",
        parent_location_id: currentParentLocationId ?? "",
      }))
    }
    setIsCreateLocationOpen(open)
  }

  async function handleCreateLocation() {
    if (!campaignId || !user || !newLocation.name.trim()) return
    setIsCreatingLocation(true)
    try {
      const supabase = createClient()
      const posX = Math.max(0, Math.min(100, parseFloat(newLocation.map_position_x) || 50))
      const posY = Math.max(0, Math.min(100, parseFloat(newLocation.map_position_y) || 50))
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
          map_scope: newLocation.map_scope,
          map_marker_type: newLocation.map_marker_type,
          parent_location_id: newLocation.parent_location_id || null,
          map_position_x: posX,
          map_position_y: posY,
        })
        .select(LOCATION_SELECT)
        .single()

      if (error) throw error

      setLocations((prev) => [normalizeLocation(data), ...prev])
      toast({ title: "Ponto Marcado", description: `${newLocation.name} agora existe no mapa.` })
      setIsCreateLocationOpen(false)
      setNewLocation({
        name: "",
        type: "city",
        description: "",
        visibility: "visible",
        map_scope: tabToScope(currentTab) ?? "local",
        map_marker_type: "point",
        parent_location_id: currentParentLocationId ?? "",
        map_position_x: "50",
        map_position_y: "50",
      })
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
    setActiveNode((prev) => prev ? { ...prev, image_url: mediaAsset.public_url } : prev)
    toast({ title: "Imagem do local atualizada" })
  }

  async function handleSavePosition(locationId: string, x: number, y: number) {
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))
    const supabase = createClient()
    const { error } = await supabase
      .from('locations')
      .update({ map_position_x: clampedX, map_position_y: clampedY })
      .eq('id', locationId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar posição", description: error.message })
      return
    }

    setLocations((prev) => prev.map((loc) => loc.id === locationId ? { ...loc, map_position_x: clampedX, map_position_y: clampedY } : loc))
    setActiveNode((prev) => prev && prev.id === locationId ? { ...prev, map_position_x: clampedX, map_position_y: clampedY } : prev)
    setPositioningLocationId(null)
    toast({ title: "Posição atualizada", description: `X: ${clampedX.toFixed(1)}% · Y: ${clampedY.toFixed(1)}%` })
  }

  function handleMapAreaClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isMaster || !positioningLocationId || !backgroundImageUrl) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    handleSavePosition(positioningLocationId, x, y)
  }

  function openAdjustImage() {
    if (!currentViewLocation) return
    setAdjustFitInput(currentViewLocation.map_image_fit)
    setAdjustGridEnabledInput(currentViewLocation.map_grid_enabled)
    setAdjustGridOpacityInput(String(Math.round(currentViewLocation.map_grid_opacity * 100)))
    setAdjustImageOpen(true)
  }

  async function handleSaveImageAdjust() {
    if (!currentViewLocation) return
    setAdjustSubmitting(true)
    const supabase = createClient()
    const opacity = Math.max(10, Math.min(100, parseInt(adjustGridOpacityInput, 10) || 35)) / 100
    const { error } = await supabase
      .from('locations')
      .update({ map_image_fit: adjustFitInput, map_grid_enabled: adjustGridEnabledInput, map_grid_opacity: opacity })
      .eq('id', currentViewLocation.id)

    setAdjustSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao ajustar mapa", description: error.message })
      return
    }

    const viewLocationId = currentViewLocation.id
    setLocations((prev) => prev.map((loc) => loc.id === viewLocationId ? { ...loc, map_image_fit: adjustFitInput, map_grid_enabled: adjustGridEnabledInput, map_grid_opacity: opacity } : loc))
    setAdjustImageOpen(false)
    toast({ title: "Configuração do mapa atualizada" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-5 lg:p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex flex-col gap-4 z-10 shrink-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
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
            <Dialog open={isCreateLocationOpen} onOpenChange={handleOpenCreateLocation}>
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
                {newLocation.parent_location_id && (
                  <p className="text-xs text-accent font-heading italic -mt-2">
                    Criando ponto dentro de {locations.find((l) => l.id === newLocation.parent_location_id)?.name ?? "local selecionado"}.
                  </p>
                )}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Escala / Camada</Label>
                      <Select value={newLocation.map_scope} onValueChange={(v) => setNewLocation((p) => ({ ...p, map_scope: v as MapScope }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="world">Mundo</SelectItem>
                          <SelectItem value="region">Região</SelectItem>
                          <SelectItem value="city">Cidade</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="dungeon">Dungeon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marcador</Label>
                      <Select value={newLocation.map_marker_type} onValueChange={(v) => setNewLocation((p) => ({ ...p, map_marker_type: v as MapMarkerType }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MARKER_TYPE_META).map(([key, meta]) => (
                            <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-1">
                      <Label>Pertence a</Label>
                      <Select value={newLocation.parent_location_id || "none"} onValueChange={(v) => setNewLocation((p) => ({ ...p, parent_location_id: v === "none" ? "" : v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (Mundo)</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loc-pos-x">Posição X%</Label>
                      <Input
                        id="loc-pos-x"
                        type="number"
                        min={0}
                        max={100}
                        value={newLocation.map_position_x}
                        onChange={(e) => setNewLocation((p) => ({ ...p, map_position_x: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loc-pos-y">Posição Y%</Label>
                      <Input
                        id="loc-pos-y"
                        type="number"
                        min={0}
                        max={100}
                        value={newLocation.map_position_y}
                        onChange={(e) => setNewLocation((p) => ({ ...p, map_position_y: e.target.value }))}
                      />
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
                  {allVisibleLocations.length === 0 && (
                    <p className="text-sm text-muted-foreground font-heading italic text-center py-8">
                      Nenhum local foi descoberto ainda.
                    </p>
                  )}
                  {allVisibleLocations.map((loc) => (
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
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex-wrap">
              {breadcrumbStack.map((entry, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
                  <button
                    type="button"
                    onClick={() => setBreadcrumbStack(breadcrumbStack.slice(0, idx + 1))}
                    className="hover:text-accent transition-colors"
                  >
                    {idx === 0 ? "Mundo" : entry.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <p className="font-display text-lg text-accent">{pageTitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MAP_TABS.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={currentTab === tab.key ? "default" : "outline"}
                className={`rounded-full text-[10px] uppercase tracking-widest ${currentTab === tab.key ? "" : "border-white/10"}`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
            {breadcrumbStack.length > 1 && (
              <Button size="sm" variant="ghost" className="rounded-full text-[10px] uppercase tracking-widest" onClick={handleGoBack}>
                <ChevronLeft className="mr-1 h-3 w-3" /> Voltar
              </Button>
            )}
          </div>
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
        {backgroundImageUrl ? (
          <div
            className="absolute inset-0 bg-[#05050A]"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: currentViewLocation?.map_image_fit === 'cover' ? 'cover' : 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: isMaster && positioningLocationId ? 'crosshair' : 'default',
            }}
            onClick={handleMapAreaClick}
          />
        ) : (
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        )}

        {backgroundImageUrl && currentViewLocation?.map_grid_enabled && (
          <div
            className="absolute inset-0 grid pointer-events-none"
            style={{ gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(10, 1fr)', opacity: currentViewLocation.map_grid_opacity }}
          >
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-amber-200/40" />
            ))}
          </div>
        )}

        {!backgroundImageUrl && isMaster && !loading && (
          <p className="absolute bottom-4 left-4 right-4 text-center text-[11px] text-muted-foreground font-heading italic bg-black/40 rounded-xl py-2 px-4 border border-white/5 z-10">
            {currentViewLocation
              ? `Adicione uma imagem em ${currentViewLocation.name} para usar como mapa desta camada.`
              : "Adicione uma imagem a uma location de escopo Mundo para usar como mapa-múndi de fundo."}
          </p>
        )}

        {isMaster && backgroundImageUrl && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 left-4 rounded-full bg-black/50 border-white/10 text-[10px] uppercase tracking-widest z-30"
            onClick={openAdjustImage}
          >
            <Settings2 className="mr-2 h-3 w-3" /> Ajustar imagem/grade
          </Button>
        )}

        {isMaster && positioningLocationId && (
          <div className="absolute top-4 right-4 z-30 px-3 py-2 rounded-full bg-primary/90 text-[10px] uppercase tracking-widest font-bold text-primary-foreground flex items-center gap-2">
            <Crosshair className="h-3 w-3" /> Clique no mapa para posicionar
            <button type="button" className="ml-1 underline" onClick={() => setPositioningLocationId(null)}>Cancelar</button>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-heading italic">
              Consultando rotas e presságios...
            </div>
          )}
          {!loading && (backgroundImageUrl ? (
            markersToRender.map((location) => (
              <MapMarker
                key={location.id}
                location={location}
                isActive={activeNode?.id === location.id}
                isSecret={!isVisibleToPlayers(location.visibility)}
                onClick={() => setActiveNode(location)}
              />
            ))
          ) : (
            displayLocations.map((node) => (
              <MapNode
                key={node.id}
                node={node}
                isActive={activeNode?.id === node.id}
                onClick={() => setActiveNode(node)}
              />
            ))
          ))}
        </div>

        {!loading && renderEmptyLayerState()}

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
               <div className="flex items-start justify-between gap-3">
                 <h2 className="text-2xl font-display font-bold text-accent">{activeNode.name}</h2>
                 {isMaster && (
                   <Badge variant="outline" className={!isVisibleToPlayers(activeNode.visibility) ? "border-destructive/30 text-destructive shrink-0" : "border-primary/30 text-primary shrink-0"}>
                     {activeNode.visibility || 'visible'}
                   </Badge>
                 )}
               </div>
               <p className="text-xs text-muted-foreground font-heading italic leading-relaxed">
                 {activeNode.description || 'Um local envolto em névoas e mistérios.'}
               </p>
               {isMaster && (
                 <R2ImageUpload
                   campaignId={campaignId}
                   usageType="location_image"
                   visibility="party"
                   label={activeNode.image_url ? "Usar imagem como mapa desta camada" : "Adicionar imagem do mapa"}
                   mode="direct"
                   entityType="location"
                   entityId={activeNode.id}
                   onUploaded={handleLocationImageUploaded}
                 />
               )}
               {isMaster && backgroundImageUrl && (
                 <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                     <Crosshair className="h-3 w-3" /> Posição no Mapa
                   </p>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <Label htmlFor="pos-x" className="text-[10px]">X%</Label>
                       <Input id="pos-x" type="number" min={0} max={100} value={posXInput} onChange={(e) => setPosXInput(e.target.value)} />
                     </div>
                     <div className="space-y-1">
                       <Label htmlFor="pos-y" className="text-[10px]">Y%</Label>
                       <Input id="pos-y" type="number" min={0} max={100} value={posYInput} onChange={(e) => setPosYInput(e.target.value)} />
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       size="sm"
                       variant="outline"
                       className="flex-1 text-[10px] uppercase tracking-widest"
                       onClick={() => handleSavePosition(activeNode.id, parseFloat(posXInput) || 0, parseFloat(posYInput) || 0)}
                     >
                       Salvar Posição
                     </Button>
                     <Button
                       size="sm"
                       variant={positioningLocationId === activeNode.id ? "default" : "outline"}
                       className="flex-1 text-[10px] uppercase tracking-widest"
                       onClick={() => setPositioningLocationId(positioningLocationId === activeNode.id ? null : activeNode.id)}
                     >
                       {positioningLocationId === activeNode.id ? "Clique no mapa..." : "Clicar no Mapa"}
                     </Button>
                   </div>
                 </div>
               )}
               {(activeNode.image_url || locations.some((loc) => loc.parent_location_id === activeNode.id)) && (
                 <Button
                   variant="secondary"
                   className="w-full py-5 rounded-xl font-bold uppercase tracking-widest text-[11px]"
                   onClick={() => handleEnterLocation(activeNode)}
                 >
                   Entrar neste mapa <ChevronRight className="ml-2 h-4 w-4" />
                 </Button>
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

        <Dialog open={adjustImageOpen} onOpenChange={setAdjustImageOpen}>
          <DialogContent className="bg-card border-primary/20 literary-shadow max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display text-accent">Ajustar Imagem do Mapa</DialogTitle>
              <DialogDescription className="font-heading italic">
                Controla como a imagem de {currentViewLocation?.name ?? "esta camada"} se encaixa e se uma grade decorativa é exibida sobre ela.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Ajuste da Imagem</Label>
                <Select value={adjustFitInput} onValueChange={(v) => setAdjustFitInput(v as "contain" | "cover")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Conter (mostra a imagem inteira)</SelectItem>
                    <SelectItem value="cover">Cobrir (preenche o quadro, pode cortar bordas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <Label className="text-sm">Grade decorativa</Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Apenas visual — não é o grid tático de combate</p>
                </div>
                <Switch checked={adjustGridEnabledInput} onCheckedChange={setAdjustGridEnabledInput} />
              </div>
              {adjustGridEnabledInput && (
                <div className="space-y-2">
                  <Label>Opacidade da Grade</Label>
                  <Select value={adjustGridOpacityInput} onValueChange={setAdjustGridOpacityInput}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="35">35%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button className="bg-primary hover:bg-primary/90" disabled={adjustSubmitting} onClick={handleSaveImageAdjust}>
                {adjustSubmitting ? "Salvando..." : "Salvar Ajustes"}
              </Button>
            </DialogFooter>
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

function MapNode({ node, isActive, onClick }: { node: Location & { coords: { x: number, y: number } }, isActive: boolean, onClick: () => void }) {
  const isUnknown = node.status === 'unknown'
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-700 flex flex-col items-center group pointer-events-auto
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

function MapMarker({ location, isActive, isSecret, onClick }: { location: Location, isActive: boolean, isSecret: boolean, onClick: () => void }) {
  const markerMeta = MARKER_TYPE_META[location.map_marker_type] || MARKER_TYPE_META.point
  const Icon = markerMeta.icon
  const size = SCALE_SIZE_PX[location.map_scale] ?? 42

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute flex flex-col items-center transition-all duration-300 pointer-events-auto
        ${isActive ? 'z-20 scale-110' : 'z-10 hover:scale-105'}
      `}
      style={{ left: `${location.map_position_x}%`, top: `${location.map_position_y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div
        className={`rounded-2xl border-2 flex items-center justify-center shadow-arcane transition-all
          ${isActive ? 'bg-primary border-accent animate-glow' : 'bg-card/90 border-white/10 hover:border-primary/50'}
          ${isSecret ? 'border-dashed border-destructive/50' : ''}
        `}
        style={{ width: size, height: size }}
      >
        <Icon className={isActive ? 'text-white' : 'text-primary'} style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
      <span className={`mt-1 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-card/70 backdrop-blur-sm border border-white/5 ${isActive ? 'text-white bg-primary' : 'text-muted-foreground'}`}>
        {location.name}
      </span>
    </button>
  )
}
