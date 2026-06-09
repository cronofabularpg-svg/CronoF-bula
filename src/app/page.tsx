
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
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050711]">
      {/* Header Estilo Tomo */}
      <header className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-primary/20 px-10 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-primary shadow-arcane group-hover:scale-110 transition-transform">
            <Hourglass className="h-6 w-6 text-[#101018]" />
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-primary">Cronofábula</span>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-[10px] font-display uppercase tracking-[0.2em] hover:text-primary transition-colors">O Oráculo</Link>
          <Link href="#master" className="text-[10px] font-display uppercase tracking-[0.2em] hover:text-primary transition-colors">O Mestre</Link>
          <Link href="#how-it-works" className="text-[10px] font-display uppercase tracking-[0.2em] hover:text-primary transition-colors">As Crônicas</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="rounded-full text-[10px] uppercase tracking-widest font-bold">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="btn-ritual rounded-full px-8 h-12">
            <Link href="/signup">Iniciar Jornada</Link>
          </Button>
        </div>
      </header>

      {/* Hero Portal Arcano */}
      <section className="relative pt-48 pb-40 px-10 flex flex-col items-center text-center mesa-viva-bg bg-fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <div className="relative z-10 space-y-10 max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-3 canon-seal">
            <Sparkles className="h-3 w-3" />
            A Fábula que Atravessa o Tempo
          </div>
          <h1 className="text-8xl md:text-[10rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#F0D484] to-primary tracking-tighter drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            Cronofábula
          </h1>
          <p className="text-3xl md:text-4xl text-muted-foreground font-heading italic max-w-3xl mx-auto leading-relaxed opacity-80">
            "Quando o tempo separa a mesa, a fábula continua viva no coração do grimório."
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10">
            <Button asChild size="lg" className="btn-ritual px-20 py-12 text-3xl font-display rounded-full border-2 border-[#F0D484]/50">
              <Link href="/signup">Consagrar Minha Mesa</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-14 py-12 text-xl font-heading italic rounded-full border-white/10 hover:bg-white/5 backdrop-blur-sm">
              <Link href="#features">Ver como o Oráculo funciona</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problema Narrativo */}
      <section className="py-40 px-10 bg-muted/5 border-y border-white/5 relative">
         <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")' }} />
         <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-tight">
            Campanhas não morrem por falta de história. <br/><span className="text-muted-foreground italic">Morrem por falta de tempo.</span>
          </h2>
          <p className="text-2xl text-muted-foreground font-heading italic leading-relaxed max-w-2xl mx-auto">
            Agendas que não batem, sessões que atrasam meses e detalhes que se perdem no esquecimento. O Cronofábula mantém o mundo vivo mesmo quando a mesa está separada.
          </p>
        </div>
      </section>

      {/* Features como Cartas Mágicas */}
      <section id="features" className="py-40 px-10 space-y-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <FeatureCard 
            icon={<Sparkles />}
            title="Mesa Viva"
            description="Jogue cenas narrativas, realize ações e interaja com NPCs mesmo fora da sessão principal."
          />
          <FeatureCard 
            icon={<MapIcon />}
            title="Mapa Vivo"
            description="O mundo evolui conforme você explora. Descubra locais que só se revelam após investigação."
          />
          <FeatureCard 
            icon={<Database />}
            title="IA Contextual"
            description="Um oráculo auxiliar que respeita o cânone da mesa e a memória dos personagens."
          />
          <FeatureCard 
            icon={<ScrollText />}
            title="Arquivo Canônico"
            description="Transforme suas jornadas em crônicas históricas aprovadas pelo mestre para a eternidade."
          />
        </div>
      </section>

      {/* Master Control - O Selo de Autoridade */}
      <section id="master" className="py-40 px-10 bg-primary/5 relative overflow-hidden">
        <Sparkles className="absolute -top-40 -right-40 h-[40rem] w-[40rem] text-primary opacity-5 animate-pulse" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <Badge variant="outline" className="border-primary/40 text-primary uppercase tracking-[0.3em] font-display px-6 py-2">Mestre no Comando</Badge>
            <h2 className="text-6xl md:text-8xl font-display font-bold leading-tight">O Oráculo ajuda. <br/><span className="text-accent">O mestre governa.</span></h2>
            <p className="text-2xl text-muted-foreground font-heading italic leading-relaxed">
              O Cronofábula não substitui o mestre humano. A IA é uma serva para narrar, sugerir e interpretar, mas o controle final sobre recompensas, locais secretos e fatos canônicos é sempre seu.
            </p>
            <ul className="space-y-6">
              <ListItem text="Mestre aprova itens, heróis e XP." />
              <ListItem text="Mestre revela os mistérios do Mapa Vivo." />
              <ListItem text="Mestre cristaliza o que vira crônica oficial." />
            </ul>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-primary/20 shadow-arcane bg-card group">
            <img src="https://picsum.photos/seed/master-ui/1200/800" alt="Painel do Mestre" className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="h-32 w-32 text-primary animate-glow drop-shadow-[0_0_30px_rgba(200,162,74,0.4)]" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final como Juramento */}
      <section className="py-60 px-10 text-center space-y-16 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <h2 className="text-7xl md:text-9xl font-display font-bold tracking-tighter text-primary relative z-10">Sua fábula aguarda.</h2>
        <p className="text-3xl text-muted-foreground font-heading italic max-w-3xl mx-auto opacity-70 relative z-10">
          "Pelo tempo, pelo aço e pela magia: sua história será escrita nas estrelas."
        </p>
        <div className="relative z-10">
          <Button asChild size="lg" className="btn-ritual px-24 py-14 text-4xl font-display rounded-full border-2 border-primary/50 hover:scale-105">
            <Link href="/signup">Juramentar Campanha</Link>
          </Button>
        </div>
      </section>

      {/* Footer Estilo Antigo */}
      <footer className="py-32 px-10 border-t border-white/5 bg-[#03040A]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <Hourglass className="h-8 w-8 text-primary" />
              <span className="text-2xl font-display font-black tracking-tighter text-primary">Cronofábula</span>
            </div>
            <p className="text-lg text-muted-foreground font-heading italic max-w-sm leading-relaxed opacity-60">
              Cronofábula é o arquivo arcano para campanhas persistentes, criado para manter histórias vivas no tempo de cada aventureiro.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary">Biblioteca</h4>
            <ul className="space-y-4 text-sm font-body opacity-50">
              <li><Link href="#features" className="hover:text-primary transition-colors">O Oráculo</Link></li>
              <li><Link href="#master" className="hover:text-primary transition-colors">Portal do Mestre</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Sistemas Suportados</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary">Leis Arcanas</h4>
            <ul className="space-y-4 text-sm font-body opacity-50">
              <li><Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 text-center text-[10px] font-display uppercase tracking-[0.4em] text-muted-foreground/20">
          © 2024 Cronofábula — Oráculo do Tempo
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="grimoire-card p-10 space-y-8 group hover:-translate-y-4 transition-all duration-500">
      <div className="p-5 bg-primary/10 rounded-2xl w-fit text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all [&_svg]:h-10 [&_svg]:w-10 shadow-[0_0_20px_rgba(200,162,74,0.1)]">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-3xl font-display font-bold text-primary group-hover:text-[#F0D484] transition-colors">{title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed font-heading italic opacity-70 group-hover:opacity-100">{description}</p>
      </div>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-4 text-2xl font-heading italic text-foreground/80 group">
      <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(200,162,74,0.8)] group-hover:scale-150 transition-transform" />
      {text}
    </li>
  );
}
