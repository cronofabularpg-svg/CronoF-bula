
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hourglass, BookOpen, Users, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-12 mesa-viva-bg">
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Hourglass className="h-20 w-20 text-primary animate-glow" />
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-accent opacity-50" />
          </div>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-tighter">
          Cronofábula
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto italic">
          "A fábula que atravessa o tempo."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <FeatureCard 
          icon={<BookOpen className="h-6 w-6" />}
          title="Campanhas Persistentes"
          description="Onde o tempo separa a mesa, a fábula continua. Tudo salvo, sempre disponível."
        />
        <FeatureCard 
          icon={<Sparkles className="h-6 w-6" />}
          title="Narrador com IA"
          description="Uma IA mestre que entende o contexto, interpreta NPCs e narra combates épicos."
        />
        <FeatureCard 
          icon={<Users className="h-6 w-6" />}
          title="Mesa Viva"
          description="Aprovação do mestre, dados físicos ou virtuais, e um mapa que evolui com você."
        />
      </div>

      <div className="pt-8">
        <Button asChild size="lg" className="px-12 py-8 text-xl rounded-full literary-shadow bg-primary hover:bg-primary/90">
          <Link href="/dashboard">Entrar na Jornada</Link>
        </Button>
      </div>

      <footer className="pt-12 text-sm text-muted-foreground opacity-50">
        © 2024 Cronofábula. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-md border border-white/5 space-y-3 text-left">
      <div className="p-3 bg-primary/20 rounded-lg w-fit text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
