
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Sword, Heart, Zap, Sparkles, ChevronRight, Dices, Ghost, Maximize2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Gob', hp: 22, maxHp: 30, ac: 16, zone: 'Meio', type: 'player', color: 'primary', photoURL: 'https://picsum.photos/seed/goblin/400/300' },
  { id: '2', name: 'Mira', hp: 45, maxHp: 45, ac: 18, zone: 'Frente', type: 'player', color: 'primary', photoURL: 'https://picsum.photos/seed/warrior/400/300' },
  { id: '3', name: 'Cultista A', hp: 12, maxHp: 25, ac: 14, zone: 'Próximo', type: 'enemy', color: 'destructive', photoURL: 'https://picsum.photos/seed/cultist/400/300' },
  { id: '4', name: 'Líder do Culto', hp: 80, maxHp: 100, ac: 17, zone: 'Distante', type: 'enemy', color: 'destructive', photoURL: 'https://picsum.photos/seed/leader/400/300' },
];

export default function Combate() {
  const [round, setRound] = React.useState(3);
  const [turn, setTurn] = React.useState(0);

  return (
    <div className="h-screen flex flex-col bg-[#101018]">
      <header className="p-6 border-b border-border bg-card/50 backdrop-blur-md flex justify-between items-center px-12 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest font-display">Rodada {round}</Badge>
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-bold tracking-tight text-accent">Embate no Beco</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Local: Beco dos Fundos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground font-ui">Pausar</Button>
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-ui uppercase tracking-tighter">Encerrar Combate</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Initiative Sidebar */}
        <div className="w-72 border-r border-border bg-card/30 p-8 space-y-6 hidden lg:block">
          <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-60">Ordem de Iniciativa</h3>
          <div className="space-y-4">
            {MOCK_PARTICIPANTS.map((p, i) => (
              <div key={p.id} className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${i === turn ? 'bg-primary/20 border-primary shadow-gold' : 'bg-card/20 border-border/50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-code font-black opacity-30">#{i + 1}</span>
                  <span className="text-sm font-display font-bold">{p.name}</span>
                </div>
                {i === turn && <Zap className="h-4 w-4 text-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        {/* Combat Field */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-16 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.03 }}>
            <div className="max-w-6xl mx-auto space-y-24">
              {/* Enemies */}
              <div className="flex justify-center gap-16">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'enemy').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>

              {/* Arena Visualizer (Zones) */}
              <div className="relative py-12">
                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                  <div className="h-px w-full bg-accent" />
                  <div className="h-px w-full bg-accent" />
                  <div className="h-px w-full bg-accent" />
                </div>
                <div className="flex justify-center italic text-[11px] text-accent tracking-[1.5em] uppercase py-2 font-display">
                  Zonas de Engajamento
                </div>
              </div>

              {/* Heroes */}
              <div className="flex justify-center gap-16">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'player').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* AI Narration Bar */}
          <div className="p-6 bg-[#241138]/40 border-y border-[#7B4FB3]/30 flex items-center gap-6 px-12">
            <div className="p-3 rounded-xl bg-[#3A1F5D] border border-[#7B4FB3]/50">
              <Sparkles className="h-5 w-5 text-accent animate-glow" />
            </div>
            <p className="text-lg italic font-heading text-foreground/90 leading-relaxed max-w-5xl">
              "Gob salta por cima de uma cadeira caída com um riso agudo. A adaga curva encontra uma brecha na lateral do cultista, que cambaleia para trás, ferido, mas ainda de pé."
            </p>
          </div>

          {/* Action Footer */}
          <div className="p-10 px-12 border-t border-border bg-card/95 backdrop-blur-md shrink-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex gap-6">
                <ActionButton icon={<Sword />} label="Ataque" active />
                <ActionButton icon={<Zap />} label="Magia" />
                <ActionButton icon={<Shield />} label="Defesa" />
                <ActionButton icon={<Ghost />} label="Truque" />
              </div>

              <div className="flex items-center gap-10">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">Turno de</span>
                  <span className="text-2xl font-display font-bold text-primary">Gob</span>
                </div>
                <Button size="lg" className="rounded-full px-16 py-10 text-xl font-display bg-primary hover:bg-primary/90 literary-shadow border border-accent/30">
                  Encerrar Turno <ChevronRight className="ml-2 h-6 w-6" />
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
  const portrait = participant.photoURL || `https://picsum.photos/seed/${participant.id}/400/300`;

  return (
    <div className={`w-72 rounded-2xl bg-card border-2 ${isEnemy ? 'border-destructive/30' : 'border-accent/30'} literary-shadow overflow-hidden flex flex-col group transition-all duration-500 hover:-translate-y-3`}>
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative h-48 bg-muted cursor-zoom-in overflow-hidden">
            <img 
              src={portrait} 
              alt={participant.name} 
              className={`object-cover w-full h-full transition-all duration-700 group-hover:scale-110 ${healthPercent < 30 ? 'grayscale sepia brightness-50' : healthPercent < 60 ? 'grayscale brightness-75' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <span className="text-xl font-display font-bold text-white tracking-tight">{participant.name}</span>
              <Badge className={`font-ui text-[9px] uppercase tracking-widest ${isEnemy ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                {participant.zone}
              </Badge>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Maximize2 className="h-4 w-4 text-white/50" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
           <img src={portrait} alt={participant.name} className="w-full h-full object-contain" />
        </DialogContent>
      </Dialog>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Vitalidade</span>
            <span className="font-code">{participant.hp}/{participant.maxHp}</span>
          </div>
          <Progress value={healthPercent} className={`h-2 ${isEnemy ? 'bg-destructive/10' : 'bg-primary/10'}`} />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Defesa</span>
            <div className="flex items-center gap-2 font-display font-bold text-lg">
              <Shield className="h-4 w-4 text-accent" />
              <span>{participant.ac}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 border border-white/5">
            <Dices className="h-5 w-5 text-accent" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 min-w-[120px] transition-all duration-300 group ${active ? 'bg-primary/10 border-accent shadow-gold text-accent' : 'bg-card border-border hover:border-accent/50 text-muted-foreground hover:text-foreground'}`}>
      <span className={`transition-transform duration-300 group-hover:scale-125 [&_svg]:h-6 [&_svg]:w-6`}>{icon}</span>
      <span className="text-[11px] font-display font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
