
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Play, ScrollText, Settings, Ghost } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'A Queda de Eldrakar',
    master: 'Vaelin',
    tone: 'Fantasia Sombria',
    system: 'D&D 5e SRD',
    lastSession: '2 dias atrás',
    activeCharacter: 'Gob (Ladino)',
    image: 'https://picsum.photos/seed/campaign1/800/400'
  },
  {
    id: '2',
    name: 'Sombras nas Docas',
    master: 'Isabela',
    tone: 'Mistério Urbano',
    system: 'Custom d20',
    lastSession: '1 semana atrás',
    activeCharacter: 'Mora (Guerreira)',
    image: 'https://picsum.photos/seed/campaign2/800/400'
  }
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <header className="flex justify-between items-center border-b pb-8 border-white/5">
        <div>
          <h1 className="text-4xl font-bold">Minhas Crônicas</h1>
          <p className="text-muted-foreground mt-2">Bem-vindo de volta, aventureiro.</p>
        </div>
        <Button className="rounded-full px-6">
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Campanha
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_CAMPAIGNS.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden arcane-border literary-shadow group">
            <div className="relative h-48 w-full bg-muted">
              <Image 
                src={campaign.image} 
                alt={campaign.name} 
                fill 
                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-ui uppercase tracking-widest text-primary-foreground bg-primary px-2 py-1 rounded">
                  {campaign.tone}
                </span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <CardDescription className="font-ui">Mestre: {campaign.master}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sistema:</span>
                <span>{campaign.system}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Personagem:</span>
                <span className="text-accent">{campaign.activeCharacter}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Visto por último:</span>
                <span>{campaign.lastSession}</span>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
              <Button asChild className="w-full" variant="default">
                <Link href={`/campaign/${campaign.id}/mesa-viva`}>
                  <Play className="mr-2 h-4 w-4" /> Jogar
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/campaign/${campaign.id}/master`}>
                  <Settings className="mr-2 h-4 w-4" /> Gestão
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card className="flex flex-col items-center justify-center p-8 border-dashed border-2 opacity-50 hover:opacity-100 transition-opacity bg-transparent cursor-pointer">
          <PlusCircle className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="font-bold">Começar Nova Lenda</p>
          <p className="text-sm text-center text-muted-foreground mt-2">Crie um mundo persistente e convide seus amigos.</p>
        </Card>
      </div>

      <section className="space-y-6 pt-12">
        <h2 className="text-2xl font-bold flex items-center">
          <ScrollText className="mr-2 h-5 w-5 text-primary" /> Atividades Recentes
        </h2>
        <div className="space-y-4">
          <ActivityItem 
            title="Sessão Encerrada" 
            desc="Isabela gerou o resumo da sessão 'Sombras nas Docas'." 
            time="Há 3 horas" 
          />
          <ActivityItem 
            title="Novo Item Aprovado" 
            desc="O mestre aprovou 'Adaga de Prata' no inventário de Gob." 
            time="Há 1 dia" 
          />
          <ActivityItem 
            title="Local Descoberto" 
            desc="Você descobriu a Passagem Secreta no Porão da Taverna." 
            time="Há 2 dias" 
          />
        </div>
      </section>
    </div>
  );
}

function ActivityItem({ title, desc, time }: { title: string, desc: string, time: string }) {
  return (
    <div className="p-4 rounded-xl bg-card/30 border border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">{time}</span>
    </div>
  );
}
