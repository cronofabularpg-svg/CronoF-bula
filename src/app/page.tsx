
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hourglass, BookOpen, Users, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-12 mesa-viva-bg">
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Hourglass className="h-24 w-24 text-primary animate-glow" />
            <Sparkles className="absolute -top-4 -right-4 h-10 w-10 text-accent opacity-50" />
          </div>
        </div>
        <h1 className="text-7xl md:text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary tracking-tighter drop-shadow-lg">
          Cronofábula
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground font-heading font-light max-w-2xl mx-auto italic">
          "A fábula que atravessa o tempo."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard 
          icon={<BookOpen className="h-7 w-7" />}
          title="Campanhas Persistentes"
          description="Onde o tempo separa a mesa, a fábula continua. Tudo salvo, sempre preservado em seu grimório digital."
        />
        <FeatureCard 
          icon={<Sparkles className="h-7 w-7" />}
          title="Narrador com IA"
          description="Uma IA mestre que entende o contexto, interpreta NPCs e narra combates épicos com autoridade arcana."
        />
        <FeatureCard 
          icon={<Users className="h-7 w-7" />}
          title="Mesa Viva"
          description="Aprovação do mestre, dados físicos ou virtuais, e um mapa que evolui organicamente com cada decisão."
        />
      </div>

      <div className="pt-8">
        <Button asChild size="lg" className="px-16 py-10 text-2xl font-display rounded-full btn-arcane border-2 border-accent">
          <Link href="/dashboard">Entrar na Jornada</Link>
        </Button>
      </div>

      <footer className="pt-12 text-sm font-ui text-muted-foreground opacity-50 uppercase tracking-[0.2em]">
        © 2024 Cronofábula — Arcano do Tempo
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 space-y-4 text-left transition-all hover:border-accent/50 hover:-translate-y-1">
      <div className="p-4 bg-primary/20 rounded-xl w-fit text-accent border border-accent/20">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed font-body">{description}</p>
    </div>
  );
}
