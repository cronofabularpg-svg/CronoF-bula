
"use client"

import * as React from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  PlusCircle,
  Play,
  ShieldCheck,
  User as UserIcon,
  Crown,
  BookOpen,
  Hourglass,
  LogOut,
  Sparkles,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string
  owner_id: string
  name: string
  system_key: string | null
  tone: string | null
  status: string
}

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = React.useState(true);
  const [isStartingSolo, setIsStartingSolo] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    let active = true;
    const supabase = createClient();

    supabase
      .from('campaigns')
      .select('id, owner_id, name, system_key, tone, status')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar", description: error.message });
        }
        setCampaigns((data as Campaign[]) || []);
        setCampaignsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, toast]);

  const displayCampaigns = campaigns;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleStartSoloAdventure() {
    if (!user) return;
    setIsStartingSolo(true);

    try {
      const supabase = createClient();
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          owner_id: user.uid,
          name: "Jornada do Destino Único",
          system_key: "dnd_srd",
          tone: "epic",
          solo_enabled: true,
          ai_enabled: true,
        })
        .select('id')
        .single();

      if (error || !campaign) throw error || new Error("Falha ao criar campanha.");

      // Sessão da Mesa Viva ainda vive no Firestore (Fase 4 migra esta camada).
      if (db) {
        await addDoc(collection(db, "campaigns", campaign.id, "sessions"), {
          campaignId: campaign.id,
          title: "Abertura da Crônica",
          status: "active",
          diceMode: "flexible",
          createdAt: serverTimestamp()
        });
      }

      router.push(`/campaign/${campaign.id}/mesa-viva`);
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
          </div>
          <p className="text-2xl font-heading italic text-muted-foreground max-w-xl">
            "Bem-vindo, {user?.displayName}. Os anais do tempo aguardam seu comando."
          </p>
        </div>
        <div className="flex gap-6">
          <Button variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary/5 text-xs font-display tracking-widest" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
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
            <BookOpen className="h-8 w-8" /> Grimórios que Eu Mestro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {campaignsLoading ? (
              <div className="col-span-2 p-20 text-center text-muted-foreground italic font-heading text-2xl opacity-40">Consultando pergaminhos...</div>
            ) : displayCampaigns.length > 0 ? (
              displayCampaigns.map((campaign) => (
                <Card key={campaign.id} className="grimoire-card group">
                  <div className="relative h-64 w-full bg-muted overflow-hidden">
                    <Image
                      src={`https://picsum.photos/seed/${campaign.id}/800/400`}
                      alt={campaign.name}
                      fill
                      className="object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-transparent to-transparent" />
                    <div className="absolute top-6 left-6 flex gap-3">
                      <Badge className="bg-primary text-black font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                        {campaign.status}
                      </Badge>
                      {campaign.owner_id === user?.uid && (
                        <Badge className="bg-[#3A1F5D] text-primary border border-primary/30 font-display text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg">
                          <Crown className="mr-1.5 h-3 w-3" /> Mestre
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-4xl font-display tracking-tight group-hover:text-primary transition-colors">{campaign.name}</CardTitle>
                    <CardDescription className="font-heading italic text-xl mt-2 opacity-60">
                      Mestre: {campaign.owner_id === user?.uid ? 'Você' : 'Outro Arcano'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-10 space-y-6">
                    <div className="flex justify-between items-center text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">
                      <span className="text-muted-foreground opacity-40">Sistema Arcano</span>
                      <span className="text-primary font-bold">{campaign.system_key || 'D&D 5e'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-6 p-8 pt-0">
                    <Button asChild className="btn-ritual w-full h-14" variant="default">
                      <Link href={`/campaign/${campaign.id}/mesa-viva`}>
                        <Play className="mr-2 h-4 w-4" /> Entrar
                      </Link>
                    </Button>
                    {campaign.owner_id === user?.uid ? (
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
