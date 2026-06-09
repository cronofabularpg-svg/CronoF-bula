
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  PlusCircle, 
  Play, 
  ScrollText, 
  Settings, 
  ShieldCheck, 
  Compass, 
  Users, 
  BookOpen,
  History,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'A Queda de Eldrakar',
    master: 'Vaelin',
    tone: 'Fantasia Sombria',
    system: 'D&D 5e SRD',
    lastSession: '2 dias atrás',
    activeCharacter: 'Gob (Ladino)',
    image: 'https://picsum.photos/seed/campaign1/800/400',
    players: 4,
    status: 'Ativa'
  },
  {
    id: '2',
    name: 'Sombras nas Docas',
    master: 'Isabela',
    tone: 'Mistério Urbano',
    system: 'Custom d20',
    lastSession: '1 semana atrás',
    activeCharacter: 'Mora (Guerreira)',
    image: 'https://picsum.photos/seed/campaign2/800/400',
    players: 3,
    status: 'Ativa'
  }
];

export default function Dashboard() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-16">
      <header className="flex justify-between items-end border-b pb-10 border-white/5">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter">Minhas Crônicas</h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">Bem-vindo de volta, aventureiro. O tempo aguarda seu comando.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5">
            <History className="mr-2 h-4 w-4" /> Ver Histórico
          </Button>
          <Button className="rounded-full px-8 bg-primary hover:bg-primary/90 literary-shadow">
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Left Column: Campaigns */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center">
              <Compass className="mr-3 h-6 w-6 text-primary" /> Campanhas Ativas
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_CAMPAIGNS.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden bg-card/30 border-white/5 hover:border-accent/30 transition-all group literary-shadow">
                <div className="relative h-56 w-full bg-muted">
                  <Image 
                    src={campaign.image} 
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
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-ui uppercase tracking-[0.2em] text-accent-foreground bg-accent px-3 py-1 rounded">
                      {campaign.tone}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl font-display">{campaign.name}</CardTitle>
                    <div className="flex items-center text-muted-foreground text-xs font-ui">
                      <Users className="h-3 w-3 mr-1" /> {campaign.players}
                    </div>
                  </div>
                  <CardDescription className="font-heading italic">Mestre: {campaign.master}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8">
                  <div className="flex justify-between text-sm font-ui border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">Sistema:</span>
                    <span className="font-bold">{campaign.system}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">Personagem:</span>
                    <span className="text-accent font-bold">{campaign.activeCharacter}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" /> Última Sessão:</span>
                    <span className="text-muted-foreground">{campaign.lastSession}</span>
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
            ))}
          </div>
        </div>

        {/* Right Column: Profile & Quick Actions */}
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center">
              <ScrollText className="mr-3 h-6 w-6 text-primary" /> Atividades Recentes
            </h2>
            <div className="space-y-4">
              <ActivityItem 
                icon={<BookOpen className="h-4 w-4" />}
                title="Sessão Encerrada" 
                desc="Isabela gerou o resumo da sessão 'Sombras nas Docas'." 
                time="Há 3 horas" 
              />
              <ActivityItem 
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Novo Item Aprovado" 
                desc="O mestre aprovou 'Adaga de Prata' no inventário de Gob." 
                time="Há 1 dia" 
              />
              <ActivityItem 
                icon={<Compass className="h-4 w-4" />}
                title="Local Descoberto" 
                desc="Você descobriu a Passagem Secreta no Porão da Taverna." 
                time="Há 2 dias" 
              />
            </div>
            <Button variant="link" className="text-accent w-full justify-end font-ui text-xs">
              Ver todas as atividades <PlusCircle className="ml-1 h-3 w-3" />
            </Button>
          </section>

          <section className="p-8 rounded-2xl bg-primary/10 border border-primary/20 space-y-6 relative overflow-hidden group">
            <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 group-hover:scale-125 transition-transform" />
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold">Inicie sua Própria Lenda</h3>
              <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">
                Crie um mundo persistente, convide seus jogadores e deixe a IA Mestre ajudar na narração.
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 literary-shadow rounded-xl">
              Criar Nova Campanha
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, desc, time }: { icon: React.ReactNode, title: string, desc: string, time: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card/20 border border-white/5 flex items-start gap-4 hover:border-white/10 transition-colors">
      <div className="p-2 rounded-lg bg-primary/20 text-primary">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold">{title}</p>
          <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground font-ui">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
