
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Sword, Heart, Zap, Sparkles, ChevronRight, Dices, Ghost } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Gob', hp: 22, maxHp: 30, ac: 16, zone: 'Meio', type: 'player', color: 'primary' },
  { id: '2', name: 'Mira', hp: 45, maxHp: 45, ac: 18, zone: 'Frente', type: 'player', color: 'primary' },
  { id: '3', name: 'Cultista A', hp: 12, maxHp: 25, ac: 14, zone: 'Próximo', type: 'enemy', color: 'destructive' },
  { id: '4', name: 'Líder do Culto', hp: 80, maxHp: 100, ac: 17, zone: 'Distante', type: 'enemy', color: 'destructive' },
];

export default function Combate() {
  const [round, setRound] = React.useState(3);
  const [turn, setTurn] = React.useState(0);

  return (
    <div className="h-screen flex flex-col bg-background/95">
      <header className="p-4 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center px-12 shrink-0">
        <div className="flex items-center gap-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest">Rodada {round}</Badge>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">Embate no Beco</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Local: Beco dos Fundos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">Pausar</Button>
          <Button variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/10">Encerrar Combate</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Initiative Sidebar */}
        <div className="w-64 border-r border-white/5 bg-background/60 p-6 space-y-4 hidden lg:block">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">Iniciativa</h3>
          <div className="space-y-3">
            {MOCK_PARTICIPANTS.map((p, i) => (
              <div key={p.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${i === turn ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(123,66,188,0.3)]' : 'bg-card/50 border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black opacity-30">#{i + 1}</span>
                  <span className="text-sm font-bold">{p.name}</span>
                </div>
                {i === turn && <Zap className="h-3 w-3 text-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        {/* Combat Field */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-12 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, #7B42BC 1px, transparent 1px)', backgroundSize: '80px 80px', opacity: 0.05 }}>
            <div className="max-w-6xl mx-auto space-y-16">
              {/* Enemies */}
              <div className="flex justify-center gap-12">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'enemy').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>

              {/* Arena Visualizer (Zones) */}
              <div className="relative py-8">
                <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                  <div className="h-px w-full bg-white" />
                  <div className="h-px w-full bg-white" />
                  <div className="h-px w-full bg-white" />
                </div>
                <div className="flex justify-center italic text-[10px] text-muted-foreground tracking-[1em] uppercase py-2">
                  Zonas de Engajamento
                </div>
              </div>

              {/* Heroes */}
              <div className="flex justify-center gap-12">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'player').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* AI Narration Bar */}
          <div className="p-4 bg-primary/10 border-y border-primary/20 flex items-center gap-4 px-12">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-glow" />
            </div>
            <p className="text-sm italic font-light text-foreground/80 leading-relaxed">
              "Gob salta por cima de uma cadeira caída com um riso agudo. A adaga curva encontra uma brecha na lateral do cultista, que cambaleia para trás, ferido, mas ainda de pé."
            </p>
          </div>

          {/* Action Footer */}
          <div className="p-8 px-12 border-t border-white/5 bg-card/95 backdrop-blur-md shrink-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex gap-4">
                <ActionButton icon={<Sword />} label="Ataque" color="primary" />
                <ActionButton icon={<Zap />} label="Magia" color="secondary" />
                <ActionButton icon={<Shield />} label="Habilidade" />
                <ActionButton icon={<Ghost />} label="Furtividade" />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Vez de</span>
                  <span className="text-lg font-bold text-primary">Gob</span>
                </div>
                <Button size="lg" className="rounded-full px-12 py-8 text-lg bg-primary hover:bg-primary/90 literary-shadow">
                  Encerrar Turno <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CombatantCard({ participant }: { participant: any }) {
  const isEnemy = participant.type === 'enemy';
  const healthPercent = (participant.hp / participant.maxHp) * 100;

  return (
    <div className={`w-64 rounded-2xl bg-card border ${isEnemy ? 'border-destructive/20' : 'border-primary/20'} literary-shadow overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300`}>
      <div className="relative h-40 bg-muted">
        <img 
          src={`https://picsum.photos/seed/${participant.id}/400/300`} 
          alt={participant.name} 
          className={`object-cover w-full h-full ${healthPercent < 30 ? 'grayscale sepia' : healthPercent < 60 ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <span className="text-lg font-bold text-white tracking-tight">{participant.name}</span>
          <Badge className={isEnemy ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}>
            {participant.zone}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> HP</span>
            <span>{participant.hp}/{participant.maxHp}</span>
          </div>
          <Progress value={healthPercent} className={`h-1.5 ${isEnemy ? 'bg-destructive/10' : 'bg-primary/10'}`} />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Defesa</span>
            <div className="flex items-center gap-1 font-bold">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span>{participant.ac}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
            <Dices className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, color = 'muted' }: { icon: React.ReactNode, label: string, color?: string }) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20',
    muted: 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
  };

  return (
    <button className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 min-w-[100px] transition-all duration-200 ${colorClasses[color]}`}>
      <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
