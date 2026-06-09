
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Star, 
  Book, 
  Backpack, 
  User as UserIcon,
  Sparkles
} from "lucide-react"

export default function FichaPersonagem() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()

  const charactersQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(
      collection(db, "campaigns", campaignId, "characters"),
      where("ownerId", "==", user.uid)
    )
  }, [db, user, campaignId])

  const { data: characters, loading } = useCollection(charactersQuery)
  const character = characters?.[0]

  if (loading) return <div className="p-20 text-center italic">Consultando os anais...</div>
  if (!character) return <div className="p-20 text-center text-muted-foreground italic">Nenhum herói encontrado nesta campanha.</div>

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div className="flex items-center gap-8">
          <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-arcane">
            <img 
              src={`https://picsum.photos/seed/${character.id}/300/300`} 
              alt={character.name} 
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-display font-black tracking-tighter">{character.name}</h1>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                Nvl {character.level}
              </Badge>
            </div>
            <p className="text-xl font-heading italic text-muted-foreground mt-2">
              {character.race} {character.class} • Status: {character.status === 'pending' ? 'Aguardando Aprovação' : 'Ativo'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">XP Atual</span>
            <div className="flex items-center gap-3">
              <Progress value={25} className="w-32 h-2" />
              <span className="text-xs font-code font-bold">1200 / 5000</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Atributos e Defesas */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-50 flex items-center font-ui">
              <Star className="mr-2 h-4 w-4" /> Atributos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="FOR" value={14} mod="+2" />
              <StatCard label="DES" value={16} mod="+3" />
              <StatCard label="CON" value={12} mod="+1" />
              <StatCard label="INT" value={10} mod="0" />
              <StatCard label="SAB" value={13} mod="+1" />
              <StatCard label="CAR" value={15} mod="+2" />
            </div>
          </section>

          <Card className="bg-card/30 border-white/5">
            <CardContent className="p-6 grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <Shield className="h-6 w-6 text-accent mb-2" />
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Defesa (CA)</span>
                <span className="text-2xl font-display font-bold">16</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/5">
                <Zap className="h-6 w-6 text-primary mb-2" />
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Iniciativa</span>
                <span className="text-2xl font-display font-bold">+3</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vitalidade e Combate */}
        <div className="md:col-span-2 space-y-10">
          <Card className="bg-[#2B1218]/20 border-destructive/20 literary-shadow overflow-hidden">
            <div className="h-1 bg-destructive/30" />
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/20 text-destructive">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest">Vitalidade</h4>
                    <p className="text-xs text-muted-foreground font-ui">Pontos de Vida Atuais</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-display font-bold text-destructive">24 / 30</span>
                </div>
              </div>
              <Progress value={80} className="h-3 bg-destructive/10" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-50 flex items-center font-ui">
                <Sword className="mr-2 h-4 w-4" /> Ataques
              </h3>
              <div className="space-y-3">
                <ActionCard name="Adaga de Prata" detail="+5 para atingir | 1d4+3 per" />
                <ActionCard name="Arco Curto" detail="+6 para atingir | 1d6+3 perf" />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-50 flex items-center font-ui">
                <Sparkles className="mr-2 h-4 w-4" /> Habilidades
              </h3>
              <div className="space-y-3">
                <ActionCard name="Ataque Furtivo" detail="2d6 dano extra" />
                <ActionCard name="Ação Ardilosa" detail="Desengajar/Esconder" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, mod }: { label: string, value: number, mod: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-white/5 flex flex-col items-center group hover:border-accent/30 transition-all">
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{label}</span>
      <span className="text-xl font-display font-bold">{value}</span>
      <Badge className="mt-2 bg-accent/10 text-accent border-accent/20 group-hover:bg-accent group-hover:text-accent-foreground">{mod}</Badge>
    </div>
  )
}

function ActionCard({ name, detail }: { name: string, detail: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
      <div>
        <h5 className="text-sm font-bold">{name}</h5>
        <p className="text-[10px] text-muted-foreground font-ui uppercase tracking-tighter mt-1">{detail}</p>
      </div>
      <Badge variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
        Rolar
      </Badge>
    </div>
  )
}
