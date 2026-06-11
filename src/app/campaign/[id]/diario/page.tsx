
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Lock, Hourglass, BookOpen, Loader2, Feather, Plus, Pencil, Trash2 } from "lucide-react"
import {
  JournalEntryDialog,
  JOURNAL_VISIBILITY_LABEL,
  type JournalVisibility,
} from "@/components/journal/journal-entry-dialog"

type ItemRow = {
  id: string
  name: string
  item_type: string | null
  description: string | null
}

type JournalEntry = {
  id: string
  title: string | null
  content: string
  mood: string | null
  tags: string[] | null
  visibility: JournalVisibility
  entry_date: string
}

const FILTERS: { value: "all" | JournalVisibility; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "private", label: "Privadas" },
  { value: "master", label: "Mestre" },
  { value: "party", label: "Grupo" },
  { value: "public", label: "Públicas" },
]

function isJournalItem(item: ItemRow | null): boolean {
  if (!item) return false
  const type = (item.item_type || "").toLowerCase()
  const name = (item.name || "").toLowerCase()
  return type === "journal" || /di[áa]rio/.test(name)
}

function extractItem(raw: any): ItemRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export default function Diario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [characterId, setCharacterId] = React.useState<string | null>(null)
  const [characterName, setCharacterName] = React.useState<string | null>(null)
  const [journalItem, setJournalItem] = React.useState<ItemRow | null>(null)
  const [isMaster, setIsMaster] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [isDelivering, setIsDelivering] = React.useState(false)

  const [entries, setEntries] = React.useState<JournalEntry[]>([])
  const [loadingEntries, setLoadingEntries] = React.useState(true)
  const [filter, setFilter] = React.useState<"all" | JournalVisibility>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null)

  const [activeSession, setActiveSession] = React.useState<{ id: string } | null>(null)
  const [activeScene, setActiveScene] = React.useState<{ id: string } | null>(null)

  const loadDiario = React.useCallback(async () => {
    if (!user || !campaignId) return
    const supabase = createClient()

    const [{ data: campaign }, { data: character }] = await Promise.all([
      supabase.from("campaigns").select("owner_id").eq("id", campaignId).maybeSingle(),
      supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .eq("owner_user_id", user.uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    setIsMaster(Boolean(campaign && campaign.owner_id === user.uid))

    if (!character) {
      setCharacterId(null)
      setCharacterName(null)
      setJournalItem(null)
      setLoading(false)
      return
    }

    setCharacterId(character.id)
    setCharacterName(character.name)

    const { data: items, error } = await supabase
      .from("character_items")
      .select("items(id, name, item_type, description)")
      .eq("character_id", character.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Verificar Diário", description: error.message })
      setLoading(false)
      return
    }

    const found = (items || [])
      .map((row: any) => extractItem(row.items))
      .find((item) => isJournalItem(item))

    setJournalItem(found ?? null)
    setLoading(false)
  }, [user, campaignId, toast])

  React.useEffect(() => {
    setLoading(true)
    loadDiario()
  }, [loadDiario])

  // Sessão e cena ativas (opcional, usado para vincular novas entradas).
  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .from("sessions")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: sessionData }) => {
        if (!active) return
        setActiveSession(sessionData)

        if (sessionData) {
          supabase
            .from("scenes")
            .select("id")
            .eq("session_id", sessionData.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: sceneData }) => {
              if (active) setActiveScene(sceneData)
            })
        } else {
          setActiveScene(null)
        }
      })

    return () => {
      active = false
    }
  }, [campaignId])

  const loadEntries = React.useCallback(async () => {
    if (!characterId) return
    setLoadingEntries(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, title, content, mood, tags, visibility, entry_date")
      .eq("character_id", characterId)
      .order("entry_date", { ascending: false })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar Entradas", description: error.message })
      setLoadingEntries(false)
      return
    }

    setEntries((data || []) as JournalEntry[])
    setLoadingEntries(false)
  }, [characterId, toast])

  React.useEffect(() => {
    if (journalItem && characterId) {
      loadEntries()
    } else {
      setLoadingEntries(false)
    }
  }, [journalItem, characterId, loadEntries])

  async function handleDeliverToSelf() {
    if (!user || !characterId) return
    setIsDelivering(true)
    const supabase = createClient()

    let itemId: string | null = null

    const { data: existingItems, error: searchError } = await supabase
      .from("items")
      .select("id, name, item_type")
      .eq("campaign_id", campaignId)

    if (searchError) {
      toast({ variant: "destructive", title: "Erro ao Buscar Itens", description: searchError.message })
      setIsDelivering(false)
      return
    }

    const existingJournal = (existingItems || []).find((item) => isJournalItem(item as ItemRow))

    if (existingJournal) {
      itemId = existingJournal.id
    } else {
      const { data: created, error: createError } = await supabase
        .from("items")
        .insert({
          campaign_id: campaignId,
          name: "Diário",
          item_type: "journal",
          description: "Um diário de bordo para registrar memórias da jornada.",
          rarity: "common",
          visibility: "party",
          created_by: user.uid,
        })
        .select("id")
        .single()

      if (createError) {
        toast({ variant: "destructive", title: "Erro ao Criar Diário", description: createError.message })
        setIsDelivering(false)
        return
      }
      itemId = created.id
    }

    const { data: existingCharacterItem } = await supabase
      .from("character_items")
      .select("id, quantity")
      .eq("character_id", characterId)
      .eq("item_id", itemId)
      .maybeSingle()

    if (existingCharacterItem) {
      const { error: updateError } = await supabase
        .from("character_items")
        .update({ quantity: existingCharacterItem.quantity + 1 })
        .eq("id", existingCharacterItem.id)

      if (updateError) {
        toast({ variant: "destructive", title: "Erro ao Entregar Diário", description: updateError.message })
        setIsDelivering(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from("character_items").insert({
        campaign_id: campaignId,
        character_id: characterId,
        item_id: itemId,
        quantity: 1,
        equipped: false,
      })

      if (insertError) {
        toast({ variant: "destructive", title: "Erro ao Entregar Diário", description: insertError.message })
        setIsDelivering(false)
        return
      }
    }

    toast({ title: "Diário entregue", description: `${characterName} agora possui um Diário.` })
    await loadDiario()
    setIsDelivering(false)
  }

  async function handleDeleteEntry(entry: JournalEntry) {
    if (!confirm("Excluir esta entrada do Diário? Esta ação não pode ser desfeita.")) return

    const supabase = createClient()
    const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Excluir Entrada", description: error.message })
      return
    }

    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    toast({ title: "Entrada excluída" })
  }

  async function handleVisibilityChange(entry: JournalEntry, visibility: JournalVisibility) {
    const supabase = createClient()
    const { error } = await supabase.from("journal_entries").update({ visibility }).eq("id", entry.id)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Visibilidade", description: error.message })
      return
    }

    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, visibility } : e)))
    toast({ title: "Visibilidade atualizada", description: JOURNAL_VISIBILITY_LABEL[visibility] })
  }

  function openNewEntry() {
    setEditingEntry(null)
    setDialogOpen(true)
  }

  function openEditEntry(entry: JournalEntry) {
    setEditingEntry(entry)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050711] text-[#FFF6E5]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (journalItem && characterId) {
    const filteredEntries = filter === "all" ? entries : entries.filter((e) => e.visibility === filter)

    return (
      <div className="min-h-screen bg-[#050711] text-[#FFF6E5] p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black tracking-tighter text-primary">Diário de {characterName}</h1>
              <p className="text-muted-foreground font-heading italic">Registros pessoais da jornada.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-8 h-12 font-display text-[10px] tracking-widest">
              <Link href={`/campaign/${campaignId}/inventario`}>Inventário</Link>
            </Button>
            <Button onClick={openNewEntry} className="btn-ritual rounded-full px-8 h-12 gap-2 font-display text-[10px] tracking-widest">
              <Plus className="h-4 w-4" /> Nova Entrada
            </Button>
          </div>
        </header>

        <p className="text-sm text-muted-foreground/60 font-heading italic max-w-3xl">
          O Diário é um item físico/diegético da campanha. Suas memórias ficam guardadas aqui, com a visibilidade que você escolher para cada entrada.
        </p>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 h-9 rounded-full text-[10px] font-display uppercase tracking-widest border transition-all ${
                filter === f.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-white/10 text-muted-foreground hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loadingEntries ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-4">
            <Feather className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-2xl font-heading italic text-muted-foreground">
              {entries.length === 0 ? "Nenhuma memória registrada ainda." : "Nenhuma entrada nesta categoria."}
            </p>
            {entries.length === 0 && (
              <Button onClick={openNewEntry} className="btn-ritual rounded-full px-10 h-12 font-display text-[10px] tracking-widest">
                Escrever primeira entrada
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onEdit={openEditEntry}
                onDelete={handleDeleteEntry}
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </div>
        )}

        <JournalEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
          characterId={characterId}
          sessionId={activeSession?.id}
          sceneId={activeScene?.id}
          entry={editingEntry}
          onSaved={loadEntries}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-10 bg-[#050711] text-[#FFF6E5] text-center space-y-12 animate-in fade-in duration-700">
      <div className="relative">
        <div className="p-12 rounded-full bg-destructive/10 border-2 border-destructive/30 shadow-[0_0_50px_rgba(185,74,72,0.2)]">
          <Lock className="h-24 w-24 text-destructive" />
        </div>
        <Hourglass className="absolute -bottom-4 -right-4 h-12 w-12 text-primary animate-spin-slow" />
      </div>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-6xl font-display font-black tracking-tighter text-primary">Memórias Inacessíveis</h1>
        <p className="text-3xl font-heading italic text-muted-foreground leading-relaxed">
          Você ainda não possui um Diário no Inventário.
        </p>
        <p className="text-lg text-muted-foreground/70 font-heading italic">
          O Diário é um item físico/diegético da campanha. Peça ao mestre para entregá-lo através do Portal do Mestre ou verifique seu Inventário.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-12 h-16 font-display text-[10px] tracking-widest">
          <Link href={`/campaign/${campaignId}/inventario`}>Voltar ao Inventário</Link>
        </Button>
        <Button asChild className="btn-ritual rounded-full px-16 h-16 literary-shadow">
          <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
        </Button>
        {isMaster && characterId && (
          <Button
            onClick={handleDeliverToSelf}
            disabled={isDelivering}
            variant="outline"
            className="rounded-full border-accent/30 text-accent hover:bg-accent/10 px-12 h-16 font-display text-[10px] tracking-widest"
          >
            {isDelivering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Entregar Diário
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3 text-muted-foreground/40 text-[10px] uppercase font-display font-black tracking-[0.3em]">
        <BookOpen className="h-4 w-4" /> Em Desenvolvimento
      </div>
    </div>
  )
}

function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  onVisibilityChange,
}: {
  entry: JournalEntry
  onEdit: (entry: JournalEntry) => void
  onDelete: (entry: JournalEntry) => void
  onVisibilityChange: (entry: JournalEntry, visibility: JournalVisibility) => void
}) {
  return (
    <Card className="bg-card/30 border-white/5 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-xl">{entry.title || "Entrada sem título"}</h3>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-display mt-1">
            {new Date(entry.entry_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        {entry.mood && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-secondary/30 text-secondary shrink-0">
            {entry.mood}
          </Badge>
        )}
      </div>

      <p className="text-base text-foreground/80 font-heading italic leading-relaxed whitespace-pre-wrap">
        {entry.content}
      </p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[9px] border-white/10 text-muted-foreground/80">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-white/5">
        <Select value={entry.visibility} onValueChange={(value) => onVisibilityChange(entry, value as JournalVisibility)}>
          <SelectTrigger className="h-9 w-36 bg-black/30 border-white/10 text-[10px] uppercase tracking-widest">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(JOURNAL_VISIBILITY_LABEL) as JournalVisibility[]).map((value) => (
              <SelectItem key={value} value={value}>{JOURNAL_VISIBILITY_LABEL[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(entry)}
            className="rounded-full border-white/10 gap-2 text-[10px] uppercase tracking-widest"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(entry)}
            className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 text-[10px] uppercase tracking-widest"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </Card>
  )
}
