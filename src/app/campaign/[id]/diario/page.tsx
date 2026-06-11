
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Lock, Hourglass, BookOpen, Loader2, Feather } from "lucide-react"

type ItemRow = {
  id: string
  name: string
  item_type: string | null
  description: string | null
}

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050711] text-[#FFF6E5]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (journalItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#050711] text-[#FFF6E5] text-center space-y-12 animate-in fade-in duration-700">
        <div className="relative">
          <div className="p-12 rounded-full bg-primary/10 border-2 border-primary/30 shadow-[0_0_50px_rgba(200,162,74,0.15)]">
            <BookOpen className="h-24 w-24 text-primary" />
          </div>
          <Feather className="absolute -bottom-4 -right-4 h-12 w-12 text-accent" />
        </div>
        <div className="max-w-2xl space-y-6">
          <h1 className="text-6xl font-display font-black tracking-tighter text-primary">Diário de {characterName}</h1>
          <p className="text-3xl font-heading italic text-muted-foreground leading-relaxed">
            {journalItem.description || "As páginas em branco aguardam suas memórias."}
          </p>
          <p className="text-lg text-muted-foreground/70 font-heading italic">
            A escrita e o registro de memórias serão ativados em uma fase futura. Por enquanto, seu Diário está liberado.
          </p>
          <p className="text-sm text-muted-foreground/50 font-heading italic">
            O Diário é um item físico/diegético da campanha — guarde-o com cuidado em seu Inventário.
          </p>
        </div>
        <div className="flex gap-8">
          <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-12 h-16 font-display text-[10px] tracking-widest">
            <Link href={`/campaign/${campaignId}/inventario`}>Ver Inventário</Link>
          </Button>
          <Button asChild className="btn-ritual rounded-full px-16 h-16 literary-shadow">
            <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
          </Button>
        </div>
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
