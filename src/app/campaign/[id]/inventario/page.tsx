
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Package, Lock, Hourglass } from "lucide-react"

export default function Inventario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()

  const [characterName, setCharacterName] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user || !campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .from('characters')
      .select('name')
      .eq('campaign_id', campaignId)
      .eq('owner_user_id', user.uid)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCharacterName(data?.name ?? null)
      })

    return () => {
      active = false
    }
  }, [user, campaignId])

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
          {characterName
            ? `${characterName} ainda não carrega itens registrados.`
            : "O sistema de itens ainda não foi forjado nesta crônica."}
        </p>
        <p className="text-lg text-muted-foreground/70 font-heading italic">
          Inventário será ativado na fase de itens.
        </p>
      </div>
      <div className="flex gap-8">
        <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-12 h-16 font-display text-[10px] tracking-widest">
          <Link href={`/campaign/${campaignId}/ficha`}>Ver Ficha</Link>
        </Button>
        <Button asChild className="btn-ritual rounded-full px-16 h-16 literary-shadow">
          <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground/40 text-[10px] uppercase font-display font-black tracking-[0.3em]">
        <Lock className="h-4 w-4" /> Em Desenvolvimento
      </div>
    </div>
  )
}
