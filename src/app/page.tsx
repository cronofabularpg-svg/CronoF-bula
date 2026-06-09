
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Hourglass, 
  BookOpen, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Map as MapIcon, 
  ScrollText, 
  Sword, 
  Zap, 
  ChevronRight,
  Database,
  Search,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5 px-10 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hourglass className="h-8 w-8 text-primary" />
          <span className="text-2xl font-display font-black tracking-tighter">Cronofábula</span>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-sm font-ui uppercase tracking-widest hover:text-primary transition-colors">Recursos</Link>
          <Link href="#master" className="text-sm font-ui uppercase tracking-widest hover:text-primary transition-colors">Para Mestres</Link>
          <Link href="#how-it-works" className="text-sm font-ui uppercase tracking-widest hover:text-primary transition-colors">Como Funciona</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/signup">Começar</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-10 flex flex-col items-center text-center mesa-viva-bg bg-fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
        <div className="relative z-10 space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-[0.3em] font-ui px-4 py-1.5">
            A Fábula que Atravessa o Tempo
          </Badge>
          <h1 className="text-7xl md:text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary tracking-tighter drop-shadow-2xl">
            Cronofábula
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-heading italic max-w-3xl mx-auto leading-relaxed">
            Sua campanha viva no tempo de cada jogador. Uma plataforma de RPG persistente com narração auxiliar por IA.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
            <Button asChild size="lg" className="px-16 py-10 text-2xl font-display rounded-full btn-arcane border-2 border-accent">
              <Link href="/signup">Criar Minha Campanha</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-12 py-10 text-xl font-heading italic rounded-full border-white/20 hover:bg-white/5">
              <Link href="#features">Ver como funciona</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-10 bg-card/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-accent">
            Campanhas não morrem por falta de história. Morrem por falta de tempo.
          </h2>
          <p className="text-xl text-muted-foreground font-heading italic leading-relaxed">
            Agendas que não batem, sessões que atrasam meses e detalhes que se perdem no esquecimento. O Cronofábula mantém o mundo vivo mesmo quando a mesa está separada.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-10 space-y-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <FeatureCard 
            icon={<Sparkles />}
            title="Mesa Viva"
            description="Jogue cenas narrativas, realize ações e interaja com NPCs mesmo fora da sessão principal."
          />
          <FeatureCard 
            icon={<MapIcon />}
            title="Mapa Vivo"
            description="Controle a localização do grupo e descubra locais que evoluem conforme a história avança."
          />
          <FeatureCard 
            icon={<Database />}
            title="IA Contextual"
            description="Um narrador auxiliar que respeita o cânone da mesa e as limitações de cada personagem."
          />
          <FeatureCard 
            icon={<ScrollText />}
            title="Crônicas Oficiais"
            description="Transforme suas aventuras em registros históricos aprovados pelo mestre para nunca mais esquecer um detalhe."
          />
        </div>
      </section>

      {/* Master Control */}
      <section id="master" className="py-32 px-10 bg-primary/5 relative overflow-hidden">
        <Sparkles className="absolute -top-20 -right-20 h-96 w-96 text-primary opacity-5 animate-pulse" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <Badge variant="outline" className="border-accent text-accent uppercase tracking-widest">Mestre no Comando</Badge>
            <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight">A IA ajuda. <br/>O mestre comanda.</h2>
            <p className="text-xl text-muted-foreground font-heading italic leading-relaxed">
              O Cronofábula não substitui o mestre. A IA é uma ferramenta para narrar, sugerir e interpretar, mas o controle final sobre recompensas, locais secretos e fatos canônicos é sempre humano.
            </p>
            <ul className="space-y-4">
              <ListItem text="Mestre aprova itens e XP." />
              <ListItem text="Mestre revela locais secretos no mapa." />
              <ListItem text="Mestre corrige ou assume a narração da IA." />
              <ListItem text="Mestre define o que vira crônica oficial." />
            </ul>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-accent/20 literary-shadow bg-card">
            <img src="https://picsum.photos/seed/master-ui/1200/800" alt="Painel do Mestre" className="object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="h-24 w-24 text-accent animate-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* Journal & Map Section */}
      <section className="py-32 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative aspect-square rounded-3xl overflow-hidden border border-primary/20 literary-shadow bg-card">
            <img src="https://picsum.photos/seed/journal/800/800" alt="Diário Narrativo" className="object-cover opacity-50" />
            <div className="absolute inset-0 p-12 flex flex-col justify-end gap-4">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 backdrop-blur-sm flex items-center gap-4">
                <Lock className="h-6 w-6 text-destructive" />
                <p className="text-sm font-ui uppercase font-bold text-destructive tracking-widest">Diário Indisponível</p>
              </div>
              <p className="text-lg font-heading italic text-foreground/80 leading-relaxed bg-background/60 p-6 rounded-2xl backdrop-blur-md">
                "As páginas estão manchadas de lama. Gob percebe que sua bolsa foi cortada. O diário de Arvand se perdeu na fuga das docas..."
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-5xl font-display font-bold">O diário e o mapa são itens reais.</h2>
            <p className="text-xl text-muted-foreground font-heading italic leading-relaxed">
              No Cronofábula, a interface respeita a narrativa. Se seu personagem perde o diário, você perde o acesso às anotações. Se não possui um mapa, o caminho permanece oculto. A imersão é absoluta.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="space-y-2">
                <h4 className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Diário Narrativo</h4>
                <p className="text-sm text-muted-foreground">Registre falas, pistas e descobertas como se estivesse escrevendo em pergaminho.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" /> Cartografia Viva</h4>
                <p className="text-sm text-muted-foreground">O mapa só se expande conforme você explora e possui os meios para registrá-lo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combat Section */}
      <section className="py-32 px-10 bg-[#101018] border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          <div className="p-4 rounded-2xl bg-destructive/20 text-destructive border border-destructive/30">
            <Sword className="h-10 w-10" />
          </div>
          <h2 className="text-5xl md:text-7xl font-display font-bold">Combate Ágil e Cinematográfico</h2>
          <p className="text-xl text-muted-foreground font-heading italic max-w-3xl mx-auto leading-relaxed">
            Sem grids complexos que travam a sessão. O Cronofábula foca em zonas táticas, ações épicas e narração dramática onde a estratégia importa tanto quanto a rolagem.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12">
            <CombatFeature title="Zonas de Engajamento" desc="Movimentação simplificada por áreas táticas." />
            <CombatFeature title="IA Narradora de Ação" desc="Cada golpe e magia ganha vida com narração contextual." />
            <CombatFeature title="Dados Físicos e Virtais" desc="Role no sistema ou na sua mesa real, o sistema aceita ambos." />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 px-10 text-center space-y-12">
        <h2 className="text-6xl md:text-8xl font-display font-bold tracking-tighter">Sua fábula aguarda.</h2>
        <p className="text-2xl text-muted-foreground font-heading italic max-w-2xl mx-auto">
          Crie seu perfil, monte sua mesa e deixe o tempo trabalhar a favor da sua história.
        </p>
        <Button asChild size="lg" className="px-20 py-12 text-3xl font-display rounded-full btn-arcane border-2 border-accent">
          <Link href="/signup">Criar Conta Agora</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-20 px-10 border-t border-white/5 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <Hourglass className="h-6 w-6 text-primary" />
              <span className="text-xl font-display font-black tracking-tighter">Cronofábula</span>
            </div>
            <p className="text-sm text-muted-foreground font-heading italic max-w-sm leading-relaxed">
              Cronofábula é uma plataforma de RPG com IA para campanhas persistentes, criada para manter histórias vivas no tempo de cada jogador.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-primary font-ui">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-ui">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Recursos</Link></li>
              <li><Link href="#master" className="hover:text-foreground transition-colors">Para Mestres</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Sistemas Suportados</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Biblioteca Arcana</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-widest text-primary font-ui">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-ui">
              <li><Link href="#" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Contato</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground/30 font-ui">
          © 2024 Cronofábula — Arcano do Tempo
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-white/5 space-y-6 transition-all hover:border-accent/30 hover:-translate-y-2 group">
      <div className="p-4 bg-primary/20 rounded-2xl w-fit text-accent border border-accent/20 group-hover:scale-110 transition-transform [&_svg]:h-8 [&_svg]:w-8">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-display font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-heading italic">{description}</p>
      </div>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-lg font-heading italic text-foreground/90">
      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      {text}
    </li>
  );
}

function CombatFeature({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
      <h4 className="text-xl font-display font-bold text-accent">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: any }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </div>
  );
}
