
"use client"

import * as React from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  PlusCircle, 
  Play, 
  ScrollText, 
  ShieldCheck, 
  Compass, 
  Users, 
  BookOpen,
  History,
  Clock,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const campaignsQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'campaigns'),
      where('masterId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: myCampaigns, loading: campaignsLoading } = useCollection(campaignsQuery);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-16">
      <header className="flex justify-between items-end border-b pb-10 border-white/5">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-accent">Minhas Crônicas</h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">
            Bem-vindo de volta, {user?.displayName || 'aventureiro'}. O tempo aguarda seu comando.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5">
            <History className="mr-2 h-4 w-4" /> Ver Histórico
          </Button>
          <Button asChild className="rounded-full px-8 bg-primary hover:bg-primary/90 literary-shadow">
            <Link href="/onboarding">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Campanha
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <div className="xl:col-span-2 space-y-8">
          <h2 className="text-2xl font-display font-bold flex items-center">
            <Compass className="mr-3 h-6 w-6 text-primary" /> Campanhas Ativas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {campaignsLoading ? (
              <div className="col-span-2 p-12 text-center text-muted-foreground italic">Consultando pergaminhos...</div>
            ) : myCampaigns && myCampaigns.length > 0 ? (
              myCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="overflow-hidden bg-card/30 border-white/5 hover:border-accent/30 transition-all group literary-shadow">
                  <div className="relative h-56 w-full bg-muted">
                    <Image 
                      src={campaign.bannerImage || `https://picsum.photos/seed/${campaign.id}/800/400`} 
                      alt={campaign.name} 
                      fill 
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-primary-foreground font-ui uppercase tracking-widest text-[9px] px-2 py-1">
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-display">{campaign.name}</CardTitle>
                    <CardDescription className="font-heading italic">Mestre: Você</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-8">
                    <div className="flex justify-between text-sm font-ui border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Sistema:</span>
                      <span className="font-bold">{campaign.system}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 p-6">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90" variant="default">
                      <Link href={`/campaign/${campaign.id}/mesa-viva`}>
                        <Play className="mr-2 h-4 w-4" /> Jogar
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full hover:bg-white/5">
                      <Link href={`/campaign/${campaign.id}/master`}>
                        <ShieldCheck className="mr-2 h-4 w-4" /> Gestão
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
                <p className="text-muted-foreground font-heading italic text-lg">Nenhuma campanha encontrada. Toda lenda começa com um nome.</p>
                <Button asChild className="rounded-full bg-primary">
                  <Link href="/onboarding">Criar Minha Primeira Lenda</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center">
              <ScrollText className="mr-3 h-6 w-6 text-primary" /> Atividades Recentes
            </h2>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground italic p-4 text-center">Nenhuma atividade recente registrada nos anais.</p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-primary/10 border border-primary/20 space-y-6 relative overflow-hidden group">
            <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 group-hover:scale-125 transition-transform" />
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold">Inicie sua Própria Lenda</h3>
              <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
                Crie um mundo persistente, convide seus jogadores e deixe a IA Mestre ajudar na narração.
              </p>
            </div>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 literary-shadow rounded-xl">
              <Link href="/onboarding">Criar Nova Campanha</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
