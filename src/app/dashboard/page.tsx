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
  Sparkles,
  History,
  Ghost,
  User as UserIcon,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const MOCK_CAMPAIGNS = [
  {
    id: 'demo-1',
    name: 'Sombras de Arvand',
    system: 'D&D 5e',
    status: 'active',
    masterId: 'demo-master-id',
    bannerImage: 'https://picsum.photos/seed/cronofabula1/800/400',
    masterName: 'Mestre Arcano',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    name: 'O Despertar do Vazio',
    system: 'Custom',
    status: 'active',
    masterId: 'another-master-id',
    bannerImage: 'https://picsum.photos/seed/cronofabula2/800/400',
    masterName: 'Dungeon Lord',
    createdAt: new Date().toISOString()
  }
];

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [isDemo, setIsDemo] = React.useState(false);
  const [demoRole, setDemoRole] = React.useState<'master' | 'player' | null>(null);

  React.useEffect(() => {
    setIsDemo(localStorage.getItem('cronofabula_demo_mode') === 'true');
    setDemoRole(localStorage.getItem('cronofabula_demo_role') as any);
  }, []);

  const campaignsQuery = React.useMemo(() => {
    if (!db || !user || isDemo) return null;
    return query(
      collection(db, 'campaigns'),
      where('masterId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user, isDemo]);

  const { data: firebaseCampaigns, loading: campaignsLoading } = useCollection(campaignsQuery);
  
  const displayCampaigns = isDemo 
    ? (demoRole === 'master' ? MOCK_CAMPAIGNS : [MOCK_CAMPAIGNS[0]]) 
    : (firebaseCampaigns || []);

  const isMasterView = isDemo ? demoRole === 'master' : true;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-16">
      <header className="flex justify-between items-end border-b pb-10 border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-display font-black tracking-tighter text-accent">Minhas Crônicas</h1>
            {isDemo && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 animate-pulse uppercase tracking-[0.2em] text-[10px]">
                Modo {demoRole === 'master' ? 'Mestre' : 'Jogador'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-heading text-xl italic">
            Bem-vindo, {user?.displayName}. A mesa aguarda sua vontade.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5" onClick={() => {
            localStorage.removeItem('cronofabula_demo_mode');
            localStorage.removeItem('cronofabula_demo_role');
            window.location.href = '/login';
          }}>
            {isDemo ? "Sair do Teste" : <><History className="mr-2 h-4 w-4" /> Ver Histórico</>}
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
            <Compass className="mr-3 h-6 w-6 text-primary" /> {isMasterView ? 'Campanhas que Eu Mestro' : 'Minhas Jornadas'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {campaignsLoading && !isDemo ? (
              <div className="col-span-2 p-12 text-center text-muted-foreground italic">Consultando pergaminhos...</div>
            ) : displayCampaigns.length > 0 ? (
              displayCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="overflow-hidden bg-card/30 border-white/5 hover:border-accent/30 transition-all group literary-shadow">
                  <div className="relative h-56 w-full bg-muted">
                    <Image 
                      src={campaign.bannerImage || `https://picsum.photos/seed/${campaign.id}/800/400`} 
                      alt={campaign.name} 
                      fill 
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-primary text-primary-foreground font-ui uppercase tracking-widest text-[9px]">
                        {campaign.status}
                      </Badge>
                      {campaign.masterId === user?.uid && (
                        <Badge className="bg-accent/20 text-accent border-accent/30 font-ui uppercase tracking-widest text-[9px]">
                          <Crown className="mr-1 h-3 w-3" /> Mestre
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-display">{campaign.name}</CardTitle>
                    <CardDescription className="font-heading italic">
                      Mestre: {campaign.masterId === user?.uid ? 'Você' : campaign.masterName || 'Outro Arcano'}
                    </CardDescription>
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
                    {campaign.masterId === user?.uid ? (
                      <Button asChild variant="ghost" className="w-full hover:bg-white/5">
                        <Link href={`/campaign/${campaign.id}/master`}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Gestão
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="w-full hover:bg-white/5">
                        <Link href={`/campaign/${campaign.id}/ficha`}>
                          <UserIcon className="mr-2 h-4 w-4" /> Ficha
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
                <p className="text-muted-foreground font-heading italic text-lg">O silêncio ecoa. Nenhuma crônica foi iniciada.</p>
                <Button asChild className="rounded-full bg-primary px-10">
                  <Link href="/onboarding">Fundar Minha Primeira Lenda</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center">
              <Sparkles className="mr-3 h-6 w-6 text-primary" /> Sugestões da IA
            </h2>
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden">
               <p className="text-sm font-heading italic leading-relaxed text-muted-foreground">
                 "Um sussurro na névoa de Arvand sugere que novos aventureiros buscam sua orientação, Mestre."
               </p>
               <Button variant="ghost" className="text-xs uppercase font-bold tracking-widest p-0 h-auto hover:bg-transparent text-primary">
                 Explorar Destino
               </Button>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-6 relative overflow-hidden group">
            <Ghost className="absolute -top-4 -right-4 h-24 w-24 text-secondary opacity-5 group-hover:scale-125 transition-transform" />
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold">Jornada Solo</h3>
              <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
                Quer testar sua ficha ou explorar o mundo sozinho? A IA assumirá o papel de Mestre para você.
              </p>
            </div>
            <Button variant="outline" className="w-full border-secondary/30 text-secondary hover:bg-secondary/10 literary-shadow rounded-xl">
              Iniciar Aventura Individual
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
