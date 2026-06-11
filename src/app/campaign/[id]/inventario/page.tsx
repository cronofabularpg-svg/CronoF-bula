
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Lock,
  Hourglass,
  Backpack,
  Shirt,
  ScrollText,
  FlaskConical,
  BookOpen,
  Map as MapIcon,
  FileText,
  KeyRound,
  Loader2,
} from "lucide-react"

type ItemRow = {
  id: string
  name: string
  item_type: string | null
  description: string | null
  rarity: string | null
  visibility: string | null
  properties: Record<string, any> | null
}

type CharacterItem = {
  id: string
  quantity: number
  equipped: boolean
  notes: string | null
  item_id: string
  item: ItemRow | null
}

type Category = "documentos" | "consumiveis" | "historia" | "geral"

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Público",
  party: "Grupo",
  master_only: "Apenas Mestre",
}

function categorize(item: ItemRow): Category {
  const type = (item.item_type || "").toLowerCase()
  const name = (item.name || "").toLowerCase()

  if (
    ["journal", "map", "document", "key"].includes(type) ||
    /di[áa]rio|mapa|documento|chave/.test(name)
  ) {
    return "documentos"
  }

  if (["consumable", "potion", "food", "scroll", "poção", "pocao"].includes(type)) {
    return "consumiveis"
  }

  if (["quest_item", "quest", "story", "story_item", "relic", "relíquia", "reliquia"].includes(type)) {
    return "historia"
  }

  return "geral"
}

type SpecialAction = "journal" | "map" | "document" | "key" | null

function specialActionFor(item: ItemRow): SpecialAction {
  const type = (item.item_type || "").toLowerCase()
  const name = (item.name || "").toLowerCase()

  if (type === "journal" || /di[áa]rio/.test(name)) return "journal"
  if (type === "map" || /mapa/.test(name)) return "map"
  if (type === "document" || /documento/.test(name)) return "document"
  if (type === "key" || /chave/.test(name)) return "key"
  return null
}

function extractItem(raw: any): ItemRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export default function Inventario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [characterId, setCharacterId] = React.useState<string | null>(null)
  const [characterName, setCharacterName] = React.useState<string | null>(null)
  const [characterItems, setCharacterItems] = React.useState<CharacterItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [inspectItem, setInspectItem] = React.useState<ItemRow | null>(null)

  const loadInventory = React.useCallback(async () => {
    if (!user || !campaignId) return
    const supabase = createClient()

    const { data: character } = await supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .eq("owner_user_id", user.uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!character) {
      setCharacterId(null)
      setCharacterName(null)
      setCharacterItems([])
      setLoading(false)
      return
    }

    setCharacterId(character.id)
    setCharacterName(character.name)

    const { data: items, error } = await supabase
      .from("character_items")
      .select("id, quantity, equipped, notes, item_id, items(id, name, item_type, description, rarity, visibility, properties)")
      .eq("character_id", character.id)
      .order("created_at", { ascending: true })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar Inventário", description: error.message })
      setLoading(false)
      return
    }

    setCharacterItems(
      (items || []).map((row: any) => ({
        id: row.id,
        quantity: row.quantity,
        equipped: row.equipped,
        notes: row.notes,
        item_id: row.item_id,
        item: extractItem(row.items),
      }))
    )
    setLoading(false)
  }, [user, campaignId, toast])

  React.useEffect(() => {
    setLoading(true)
    loadInventory()
  }, [loadInventory])

  async function handleToggleEquip(characterItem: CharacterItem) {
    if (!characterItem.item) return
    setUpdatingId(characterItem.id)
    const supabase = createClient()
    const nextEquipped = !characterItem.equipped

    const { error } = await supabase
      .from("character_items")
      .update({ equipped: nextEquipped })
      .eq("id", characterItem.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Item", description: error.message })
      setUpdatingId(null)
      return
    }

    setCharacterItems((prev) =>
      prev.map((ci) => (ci.id === characterItem.id ? { ...ci, equipped: nextEquipped } : ci))
    )
    toast({
      title: nextEquipped ? "Item equipado" : "Item desequipado",
      description: characterItem.item.name,
    })
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050711] text-[#FFF6E5]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!characterId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 bg-[#050711] text-[#FFF6E5] text-center space-y-12 animate-in fade-in duration-700">
        <div className="relative">
          <div className="p-12 rounded-full bg-accent/10 border-2 border-accent/30 shadow-[0_0_50px_rgba(200,162,74,0.15)]">
            <Package className="h-24 w-24 text-accent" />
          </div>
          <Hourglass className="absolute -bottom-4 -right-4 h-12 w-12 text-primary animate-spin-slow" />
        </div>
        <div className="max-w-2xl space-y-6">
          <h1 className="text-6xl font-display font-black tracking-tighter text-accent">Bolsa de Aventureiro</h1>
          <p className="text-3xl font-heading italic text-muted-foreground leading-relaxed">
            Você ainda não possui um personagem nesta crônica.
          </p>
        </div>
        <Button asChild className="btn-ritual rounded-full px-16 h-16 literary-shadow">
          <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
        </Button>
      </div>
    )
  }

  const equipados = characterItems.filter((ci) => ci.equipped && ci.item)
  const notEquipped = characterItems.filter((ci) => !ci.equipped && ci.item)
  const documentos = notEquipped.filter((ci) => categorize(ci.item!) === "documentos")
  const consumiveis = notEquipped.filter((ci) => categorize(ci.item!) === "consumiveis")
  const historia = notEquipped.filter((ci) => categorize(ci.item!) === "historia")
  const mochila = notEquipped.filter((ci) => categorize(ci.item!) === "geral")

  const hasAnyItem = characterItems.some((ci) => ci.item)

  return (
    <div className="min-h-screen bg-[#050711] text-[#FFF6E5] p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/30">
            <Package className="h-10 w-10 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter text-accent">Inventário</h1>
            <p className="text-muted-foreground font-heading italic">
              Itens carregados por {characterName}.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-10 h-12 font-display text-[10px] tracking-widest">
          <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
        </Button>
      </header>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200/80 font-heading italic">
        Bônus automáticos serão aplicados na fase de combate/ficha avançada.
      </div>

      {!hasAnyItem && (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-4">
          <Backpack className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-2xl font-heading italic text-muted-foreground">
            {characterName} ainda não carrega nenhum item.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Itens entregues pelo mestre aparecerão aqui automaticamente.
          </p>
        </div>
      )}

      {hasAnyItem && (
        <div className="space-y-10">
          <InventorySection
            title="Equipados"
            icon={<Shirt className="h-5 w-5 text-primary" />}
            items={equipados}
            onToggleEquip={handleToggleEquip}
            updatingId={updatingId}
            emptyLabel="Nenhum item equipado."
          />
          <InventorySection
            title="Mochila"
            icon={<Backpack className="h-5 w-5 text-primary" />}
            items={mochila}
            onToggleEquip={handleToggleEquip}
            updatingId={updatingId}
            emptyLabel="Mochila vazia."
          />
          <InventorySection
            title="Itens de História"
            icon={<ScrollText className="h-5 w-5 text-primary" />}
            items={historia}
            onToggleEquip={handleToggleEquip}
            updatingId={updatingId}
            emptyLabel="Nenhum item de história."
          />
          <InventorySection
            title="Consumíveis"
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            items={consumiveis}
            onToggleEquip={handleToggleEquip}
            updatingId={updatingId}
            emptyLabel="Nenhum consumível."
          />
          <InventorySection
            title="Documentos / Diário / Mapa"
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            description="Itens desta seção podem desbloquear áreas e registros da campanha."
            items={documentos}
            onToggleEquip={handleToggleEquip}
            updatingId={updatingId}
            emptyLabel="Nenhum documento."
            campaignId={campaignId}
            onInspect={setInspectItem}
          />
        </div>
      )}

      <Dialog open={!!inspectItem} onOpenChange={(open) => !open && setInspectItem(null)}>
        <DialogContent className="bg-card/95 border-white/10 text-[#FFF6E5]">
          <DialogHeader>
            <DialogTitle className="font-display">{inspectItem?.name}</DialogTitle>
            <DialogDescription className="font-heading italic">
              {inspectItem?.description || "Sem descrição registrada."}
            </DialogDescription>
          </DialogHeader>
          {inspectItem?.properties && Object.keys(inspectItem.properties).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(inspectItem.properties).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-[9px] border-white/10 text-muted-foreground/80">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InventorySection({
  title,
  icon,
  description,
  items,
  onToggleEquip,
  updatingId,
  emptyLabel,
  campaignId,
  onInspect,
}: {
  title: string
  icon: React.ReactNode
  description?: string
  items: CharacterItem[]
  onToggleEquip: (item: CharacterItem) => void
  updatingId: string | null
  emptyLabel: string
  campaignId?: string
  onInspect?: (item: ItemRow) => void
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
          {icon} {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground/60 font-heading italic pl-7">{description}</p>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 font-heading italic pl-1">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((ci) => (
            <ItemCard
              key={ci.id}
              characterItem={ci}
              onToggleEquip={onToggleEquip}
              updating={updatingId === ci.id}
              campaignId={campaignId}
              onInspect={onInspect}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ItemCard({
  characterItem,
  onToggleEquip,
  updating,
  campaignId,
  onInspect,
}: {
  characterItem: CharacterItem
  onToggleEquip: (item: CharacterItem) => void
  updating: boolean
  campaignId?: string
  onInspect?: (item: ItemRow) => void
}) {
  const item = characterItem.item!
  const properties = item.properties && Object.keys(item.properties).length > 0 ? item.properties : null
  const action = specialActionFor(item)

  return (
    <Card className="bg-card/30 border-white/5 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg">{item.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
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
            <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-secondary/30 text-secondary">
              {VISIBILITY_LABEL[item.visibility || "master_only"] || item.visibility}
            </Badge>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs font-bold shrink-0">x{characterItem.quantity}</Badge>
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">{item.description}</p>
      )}

      {characterItem.notes && (
        <p className="text-xs text-muted-foreground/70">Obs: {characterItem.notes}</p>
      )}

      {properties && (
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(properties).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-[9px] border-white/10 text-muted-foreground/80">
              {key}: {String(value)}
            </Badge>
          ))}
        </div>
      )}

      {action && campaignId && (
        <div className="pt-1">
          {action === "journal" && (
            <Button asChild size="sm" variant="outline" className="w-full rounded-full border-primary/30 hover:bg-primary/5 font-display text-[10px] tracking-widest gap-2">
              <Link href={`/campaign/${campaignId}/diario`}>
                <BookOpen className="h-3.5 w-3.5" /> Abrir Diário
              </Link>
            </Button>
          )}
          {action === "map" && (
            <Button asChild size="sm" variant="outline" className="w-full rounded-full border-primary/30 hover:bg-primary/5 font-display text-[10px] tracking-widest gap-2">
              <Link href={`/campaign/${campaignId}/mapa-vivo`}>
                <MapIcon className="h-3.5 w-3.5" /> Abrir Mapa
              </Link>
            </Button>
          )}
          {action === "document" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-full border-primary/30 hover:bg-primary/5 font-display text-[10px] tracking-widest gap-2"
              onClick={() => onInspect?.(item)}
            >
              <FileText className="h-3.5 w-3.5" /> Ler Documento
            </Button>
          )}
          {action === "key" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-full border-primary/30 hover:bg-primary/5 font-display text-[10px] tracking-widest gap-2"
              onClick={() => onInspect?.(item)}
            >
              <KeyRound className="h-3.5 w-3.5" /> Inspecionar Chave
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          {characterItem.equipped ? "Equipado" : "Equipar"}
        </span>
        <Switch
          checked={characterItem.equipped}
          disabled={updating}
          onCheckedChange={() => onToggleEquip(characterItem)}
        />
      </div>
    </Card>
  )
}
