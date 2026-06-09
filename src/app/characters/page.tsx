
"use client"

import * as React from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collectionGroup, query, where, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, User, Compass, Swords } from "lucide-react"
import Link from "next/link"

export default function MyCharacters() {
  const { user } = useUser()
  const db = useFirestore()

  // Usamos collectionGroup para buscar personagens em todas as campanhas vinculados ao ownerId
  const charactersQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collectionGroup(db, "characters"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: characters, loading } = useCollection(charactersQuery)

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b pb-10 border-white/5">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-primary">Meus Heróis</h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">Seu grimório de identidades e lendas.</p>
        </div>
        <Button asChild className="rounded-full px-8 bg-primary hover:bg-primary/90 literary-shadow">
          <Link href="/onboarding">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Herói
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full p-20 text-center italic opacity-50">Consultando oráculos...</div>
        ) : characters && characters.length > 0 ? (
          characters.map((char: any) => (
            <Card key={char.id} className="bg-card/30 border-white/5 hover:border-accent/30 transition-all group overflow-hidden">
              <div className="relative h-48 bg-muted">
                <img 
                  src={`https://picsum.photos/seed/${char.id}/400/300`} 
                  alt={char.name} 
                  className="object-cover w-full h-full opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-4 left-4">
                  <Badge className={`uppercase tracking-widest text-[9px] ${char.status === 'active' ? 'bg-primary' : 'bg-destructive'}`}>
                    {char.status}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-display">{char.name}</CardTitle>
                <CardDescription className="font-heading italic">
                  {char.race} {char.class} • Nível {char.level}
                </CardDescription>
              </CardHeader>
              <CardFooter className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 p-6">
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href={`/campaign/${char.campaignId}/ficha`}>
                    <User className="mr-2 h-4 w-4" /> Ver Ficha
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full hover:bg-white/5">
                  <Link href={`/campaign/${char.campaignId}/mesa-viva`}>
                    <Compass className="mr-2 h-4 w-4" /> Jogar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
            <p className="text-muted-foreground font-heading italic text-lg">Nenhum herói encontrado. Toda lenda precisa de um rosto.</p>
            <Button asChild className="rounded-full bg-primary">
              <Link href="/onboarding">Criar Primeiro Personagem</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
