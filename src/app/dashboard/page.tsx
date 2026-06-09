
"use client"

import * as React from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  PlusCircle, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  User as UserIcon,
  Crown,
  BookOpen,
  Hourglass,
  ChevronRight,
  History,
  Dices,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isDemo, setIsDemo] = React.useState(false);
  const [demoRole, setDemoRole] = React.useState<'master' | 'player' | null>(null);
  const [isCreatingTestChar, setIsCreatingTestChar] = React.useState(false);
  const [isStartingSolo, setIsStartingSolo] = React.useState(false);

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
    }
  ];

  const displayCampaigns = isDemo 
    ? (demoRole === 'master' ? MOCK_CAMPAIGNS : [MOCK_CAMPAIGNS[0]]) 
    : (firebaseCampaigns || []);

  const isMasterView = isDemo ? demoRole === 'master' : true;

  async function handleCreateTestCharacter() {
    if (!db || !user) return;
    setIsCreatingTestChar(true);

    try {
      // Se estiver no modo demo, sai dele para criar dados reais
      if (isDemo) {
        localStorage.removeItem('cronofabula_demo_mode');
        localStorage.removeItem('cronofabula_demo_role');
        setIsDemo(false);
      }

      const newCampId = doc(collection(db, 'campaigns')).id;
      const testCampaign = {
        id: newCampId,
        name: "Crônica de Teste: Valerius",
        system: "D&D 5e",
        masterId: user.uid,
        status: "active",
        tone: "dark",
        createdAt: serverTimestamp()
      };

      const charId = doc(collection(db, 'campaigns', newCampId, 'characters')).id;
      const testChar = {
        id: charId,
        campaignId: newCampId,
        ownerId: user.uid,
        name: "Valerius, o Rubro",
        race: "Tiefling",
        class: "Mago",
        level: 3,
        xp: 1250,
        hp: 22,
        maxHp: 30,
        mana: 15,
        maxMana: 20,
        ac: 13,
        initiative: 2,
        hasInspiration: true,
        exhaustion: 1,
        gold: 150,
        conditions: ["Bêbado", "Encantado"],
        savingThrows: ["int", "wis"],
        stats: {
          str: 8,
          dex: 14,
          con: 14,
          int: 18,
          wis: 12,
          cha: 12
        },
        status: "active",
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'campaigns', newCampId), testCampaign);
      await setDoc(doc(db, 'campaigns', newCampId, 'characters', charId), testChar);
      
      toast({ 
        title: "Herói Evocado", 
        description: "Valerius foi manifestado. O destino agora pode ser consultado." 
      });

      router.push(`/campaign/${newCampId}/ficha`);
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `campaigns/new`,
        operation: 'write'
      } satisfies SecurityRuleContext));
    } finally {
      setIsCreatingTestChar(false);
    }
  }

  async function handleStartSoloAdventure() {
    if (!db || !user) return;
    setIsStartingSolo(true);
    
    try {
      // Se estiver no modo demo, sai dele para criar dados reais
      if (isDemo) {
        localStorage.removeItem('cronofabula_demo_mode');
        localStorage.removeItem('cronofabula_demo_role');
        setIsDemo(false);
      }

      const newId = doc(collection(db, 'campaigns')).id;
      const soloCamp = {
        id: newId,
        name: "Jornada do Destino Único",
        masterId: user.uid,
        status: "active",
        isSoloJourneyEnabled: true,
        isAiNarratorEnabled: true,
        system: "D&D 5e",
        tone: "epic",
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'campaigns', newId), soloCamp);
      
      // Criar também uma sessão ativa para que a Mesa Viva funcione
      await addDoc(collection(db, "campaigns", newId, "sessions"), {
        campaignId: newId,
        title: "Abertura da Crônica",
        status: "active",
        diceMode: "flexible",
        createdAt: serverTimestamp()
      });

      router.push(`/campaign/${newId}/mesa-viva`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Iniciar", description: "O portal solo não pôde ser aberto." });
    } finally {
      setIsStartingSolo(false);
    }
  }

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-primary/20 pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-display font-black tracking-tighter text-primary">Minhas Crônicas</h1>
            {isDemo && (
              <Badge className="canon-seal animate-pulse">
                Portal de Teste: {demoRole === 'master' ? 'Mestre' : 'Jogador'}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-heading italic text-muted-foreground max-w-xl">
            "Bem-vindo, {user?.displayName}. Os anais do tempo aguardam seu comando."
          </p>
        </div>
        <div className="flex gap-6">
          <Button variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary/5 text-xs font-display tracking-widest" onClick={() => {
            localStorage.removeItem('cronofabula_demo_mode');
            localStorage.removeItem('cronofabula_demo_role');
            window.location.href = '/login';
          }}>
            {isDemo ? "Sair do Portal" : <><History className="mr-2 h-4 w-4" /> Ver Passado</>}
          </Button>
          <Button asChild className="btn-ritual rounded-full px-10 h-14 literary-shadow">
            <Link href="/onboarding">
              <PlusCircle className="mr-2 h-5 w-5" /> Nova Crônica
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
        <div className="xl:col-span-2 space-y-10">
          <h2 className="text-3xl font-display font-bold flex items-center gap-4 text-primary">
            <BookOpen className="h-8 w-8" /> {isMasterView ? 'Grimórios que Eu Mestro' : 'Minhas Jornadas'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {campaignsLoading && !isDemo ? (
              <div className="col-span-2 p-20 text-center text-muted-foreground italic font-heading text-2xl opacity-40">Consultando pergaminhos...</div>
            ) : displayCampaigns.length > 0 ? (
              displayCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="grimoire-card group">
                  <div className="relative h-64 w-full bg-muted overflow-hidden">
                    <Image 
                      src={campaign.bannerImage || `https://picsum.photos/seed/${campaign.id}/800/400`} 
                      alt={campaign.name} 
                      fill 
                      className="object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-transparent to-transparent" />
                    <div className="absolute top-6 left-6 flex gap-3">
                      <Badge className="bg-primary text-black font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                        {campaign.status}
                      </Badge>
                      {campaign.masterId === user?.uid && (
                        <Badge className="bg-[#3A1F5D] text-primary border border-primary/30 font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                          <Crown className="mr-1.5 h-3 w-3" /> Mestre
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-4xl font-display tracking-tight group-hover:text-primary transition-colors">{campaign.name}</CardTitle>
                    <CardDescription className="font-heading italic text-xl mt-2 opacity-60">
                      Mestre: {campaign.masterId === user?.uid ? 'Você' : campaign.masterName || 'Outro Arcano'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-10 space-y-6">
                    <div className="flex justify-between items-center text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">
                      <span className="text-muted-foreground opacity-40">Sistema Arcano</span>
                      <span className="text-primary font-bold">{campaign.system || 'D&D 5e'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-6 p-8 pt-0">
                    <Button asChild className="btn-ritual w-full h-14" variant="default">
                      <Link href={`/campaign/${campaign.id}/mesa-viva`}>
                        <Play className="mr-2 h-4 w-4" /> Entrar
                      </Link>
                    </Button>
                    {campaign.masterId === user?.uid ? (
                      <Button asChild variant="ghost" className="w-full h-14 border border-white/5 hover:bg-primary/5 text-xs font-display tracking-widest">
                        <Link href={`/campaign/${campaign.id}/master`}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Gestão
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="w-full h-14 border border-white/5 hover:bg-primary/5 text-xs font-display tracking-widest">
                        <Link href={`/campaign/${campaign.id}/ficha`}>
                          <UserIcon className="mr-2 h-4 w-4" /> Ficha
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 p-32 border-2 border-dashed border-primary/20 rounded-[2rem] text-center space-y-10 bg-primary/5">
                <div className="p-8 rounded-full bg-primary/10 w-fit mx-auto">
                   <Hourglass className="h-16 v-16 text-primary opacity-30" />
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground font-heading italic text-3xl">O silêncio ecoa nestas páginas. Nenhuma crônica foi iniciada.</p>
                  <p className="text-lg text-muted-foreground/60 font-body">Todo herói precisa de um mestre. Toda lenda precisa de um começo.</p>
                </div>
                <Button asChild className="btn-ritual rounded-full px-16 h-16 text-xl literary-shadow">
                  <Link href="/onboarding">Fundar Minha Primeira Lenda</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Barra Lateral Arcana */}
        <div className="space-y-16">
          <section className="space-y-8">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-primary">
              <Sparkles className="h-6 w-6" /> Oráculo de Teste
            </h2>
            <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-6 relative overflow-hidden oracle-glow">
               <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
               <p className="text-xl font-heading italic leading-relaxed text-muted-foreground">
                 "Deseja manifestar um herói pronto para testar as leis de D&D 5e e os temas visuais?"
               </p>
               <Button 
                onClick={handleCreateTestCharacter}
                disabled={isCreatingTestChar}
                variant="outline" 
                className="w-full border-primary/30 text-primary hover:bg-primary/10 rounded-xl h-12 font-display text-[10px] tracking-widest uppercase font-bold"
               >
                 {isCreatingTestChar ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Dices className="mr-2 h-4 w-4" /> Evocar Herói de Teste</>}
               </Button>
               <Button 
                onClick={() => {
                  const campId = firebaseCampaigns?.[0]?.id;
                  if (campId) router.push(`/campaign/${campId}/ficha`);
                  else toast({ title: "Nenhuma Crônica", description: "Evoque um herói primeiro." });
                }}
                variant="ghost" 
                className="text-[10px] font-display uppercase tracking-widest p-0 h-auto hover:bg-transparent text-primary hover:text-accent transition-colors"
               >
                  Consultar Destino <ChevronRight className="ml-1 h-3 w-3" />
               </Button>
            </div>
          </section>

          <section className="p-10 rounded-[2rem] bg-[#3A1F5D]/10 border border-[#7B4FB3]/20 space-y-8 relative overflow-hidden group">
            <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-[#7B4FB3] opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000" />
            <div className="space-y-4">
              <h3 className="text-3xl font-display font-bold text-primary">Jornada Solo</h3>
              <p className="text-lg text-muted-foreground font-heading italic leading-relaxed opacity-70">
                "Não aguarde pela mesa. O Oráculo pode assumir o papel de Mestre e conduzir sua própria crônica."
              </p>
            </div>
            <Button 
              onClick={handleStartSoloAdventure}
              disabled={isStartingSolo}
              variant="outline" 
              className="w-full border-primary/30 text-primary hover:bg-primary/10 literary-shadow rounded-2xl h-14 font-display text-[10px] tracking-widest"
            >
              {isStartingSolo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Iniciar Aventura Individual
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
