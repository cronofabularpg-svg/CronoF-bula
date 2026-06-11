
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Sword, Heart, Zap, Sparkles, ChevronRight, Dices, Ghost, Maximize2, Skull, Wine, Star, Wind, Construction } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Valerius', hp: 22, maxHp: 30, mana: 15, maxMana: 20, ac: 13, zone: 'Trás', type: 'player', hasInspiration: true, exhaustion: 1, photoURL: 'https://picsum.photos/seed/valerius/400/300', conditions: ['Bêbado'] },
  { id: '2', name: 'Mira', hp: 45, maxHp: 45, mana: 0, maxMana: 0, ac: 18, zone: 'Frente', type: 'player', hasInspiration: false, photoURL: 'https://picsum.photos/seed/warrior/400/300', conditions: [] },
  { id: '3', name: 'Cultista A', hp: 12, maxHp: 25, ac: 14, zone: 'Próximo', type: 'enemy', photoURL: 'https://picsum.photos/seed/cultist/400/300', conditions: ['Envenenado'] },
  { id: '4', name: 'Líder do Culto', hp: 80, maxHp: 100, mana: 25, maxMana: 40, ac: 17, zone: 'Distante', type: 'enemy', photoURL: 'https://picsum.photos/seed/leader/400/300', conditions: [] },
];

export default function Combate() {
  const [round, setRound] = React.useState(3);
  const [turn, setTurn] = React.useState(0);

  return (
    <div className="h-screen flex flex-col bg-[#050711]">
      <header className="p-8 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex justify-between items-center px-12 shrink-0 z-10">
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-display uppercase font-black tracking-[0.3em] text-primary opacity-40">Ordem de Batalha</span>
             <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-[0.2em] font-display text-lg px-6 py-1 mt-2 shadow-arcane">Rodada {round}</Badge>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="flex flex-col">
            <h1 className="text-4xl font-display font-black tracking-tighter text-accent">Embate nas Docas</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 italic">A Fábula exige sangue e glória.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button disabled title="Em desenvolvimento" variant="ghost" size="sm" className="text-muted-foreground font-ui uppercase tracking-widest text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed">Interromper</Button>
          <Button disabled title="Em desenvolvimento" variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 font-ui uppercase tracking-widest text-[10px] font-bold px-8 disabled:opacity-30 disabled:cursor-not-allowed">Encerrar Conflito</Button>
        </div>
      </header>

      <div className="px-12 py-3 bg-accent/5 border-b border-accent/10 flex items-center gap-3 text-accent/70 shrink-0">
        <Construction className="h-4 w-4" />
        <p className="text-[10px] font-display uppercase font-black tracking-[0.2em]">
          Sistema de Combate em desenvolvimento — exibindo dados de exemplo. Ações ainda não estão conectadas.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Iniciativa - Estilo Estandarte */}
        <aside className="w-85 border-r border-primary/10 bg-black/20 p-10 space-y-10 hidden xl:block shadow-2xl">
          <h3 className="text-[10px] uppercase font-black tracking-[0.4em] text-primary opacity-60">Linha do Tempo</h3>
          <div className="space-y-6">
            {MOCK_PARTICIPANTS.map((p, i) => (
              <div key={p.id} className={`p-5 rounded-2xl border-2 transition-all duration-700 flex items-center justify-between group ${i === turn ? 'bg-primary/10 border-primary shadow-gold scale-105' : 'bg-card border-white/5 opacity-40 hover:opacity-60'}`}>
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center font-code font-black text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-lg font-display font-bold group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{p.type === 'player' ? 'Herói' : 'Ameaça'}</p>
                  </div>
                </div>
                {i === turn && <Zap className="h-5 w-5 text-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </aside>

        {/* Campo de Batalha */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
           {/* Fundo Arcano */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          
          <ScrollArea className="flex-1 p-16">
            <div className="max-w-6xl mx-auto space-y-32">
              {/* Inimigos */}
              <div className="flex justify-center gap-12">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'enemy').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>

              {/* Arena Tática (Zones) */}
              <div className="relative py-16">
                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                </div>
                <div className="flex justify-center italic text-[10px] text-primary/40 tracking-[2em] uppercase py-2 font-display font-black">
                  Limiares de Engajamento
                </div>
              </div>

              {/* Heróis */}
              <div className="flex justify-center gap-12">
                {MOCK_PARTICIPANTS.filter(p => p.type === 'player').map(p => (
                  <CombatantCard key={p.id} participant={p} />
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Narração do Oráculo */}
          <div className="p-8 bg-secondary/10 border-y border-secondary/30 flex items-center gap-10 px-16 oracle-glow mx-10 rounded-[2rem] mb-6 backdrop-blur-3xl">
            <div className="p-4 rounded-2xl bg-secondary/20 border border-secondary/40 shadow-arcane">
              <Sparkles className="h-7 w-7 text-primary animate-glow" />
            </div>
            <p className="text-2xl italic font-heading text-foreground/90 leading-relaxed max-w-5xl">
              "Valerius ergue seu cajado, mas a influência do hidromel pesa em seus gestos. Mira, a Muralha, se posiciona para interceptar o avanço do Líder Cultista."
            </p>
          </div>

          {/* Ações de Combate */}
          <footer className="p-10 px-16 border-t border-primary/10 bg-background/95 backdrop-blur-3xl shrink-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                <ActionButton icon={<Sword />} label="Ataque" active disabled />
                <ActionButton icon={<Zap />} label="Magia" disabled />
                <ActionButton icon={<Shield />} label="Defesa" disabled />
                <ActionButton icon={<Ghost />} label="Truque" disabled />
              </div>

              <div className="flex items-center gap-12">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em] opacity-40">Iniciativa de</span>
                  <span className="text-4xl font-display font-black text-primary tracking-tighter">Valerius</span>
                </div>
                <Button disabled title="Em desenvolvimento" className="btn-ritual rounded-full px-20 h-20 text-2xl font-display literary-shadow group disabled:opacity-30 disabled:cursor-not-allowed">
                  Finalizar Turno <ChevronRight className="ml-3 h-8 w-8 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function CombatantCard({ participant }: { participant: any }) {
  const isEnemy = participant.type === 'enemy';
  const healthPercent = (participant.hp / participant.maxHp) * 100;
  const manaPercent = participant.maxMana > 0 ? (participant.mana / participant.maxMana) * 100 : 0;
  const portrait = participant.photoURL || `https://picsum.photos/seed/${participant.id}/400/300`;

  return (
    <div className={`w-72 rounded-[2.5rem] bg-card border-2 transition-all duration-700 hover:-translate-y-4 overflow-hidden flex flex-col group literary-shadow ${
      isEnemy ? 'border-destructive/20 hover:border-destructive/40' : 'border-primary/20 hover:border-primary/40'
    } ${participant.hasInspiration ? 'ring-4 ring-primary/20 shadow-gold' : ''}`}>
      
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative h-56 bg-muted cursor-zoom-in overflow-hidden">
            <img 
              src={portrait} 
              alt={participant.name} 
              className={`object-cover w-full h-full transition-all duration-1000 group-hover:scale-110 ${healthPercent < 30 ? 'grayscale sepia brightness-50' : healthPercent < 60 ? 'grayscale brightness-75' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
              <span className="text-2xl font-display font-black text-white tracking-tighter drop-shadow-md">{participant.name}</span>
              <Badge className={`font-display text-[8px] uppercase tracking-widest px-3 py-1 shadow-lg ${isEnemy ? 'bg-destructive/80 text-white' : 'bg-primary text-black'}`}>
                {participant.zone}
              </Badge>
            </div>
            
            {/* Status e Inspiração Overlay */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
               {participant.conditions?.map((c: string, idx: number) => (
                 <ConditionMiniBadge key={idx} condition={c} />
               ))}
               {participant.exhaustion > 0 && (
                 <div className="p-2 rounded-xl bg-black/60 border border-orange-500/50 text-orange-500 shadow-lg" title={`Exaustão Nvl ${participant.exhaustion}`}>
                    <Wind className="h-4 w-4" />
                 </div>
               )}
            </div>
            
            {participant.hasInspiration && (
              <div className="absolute top-6 right-6 p-2 rounded-full bg-primary shadow-gold animate-bounce">
                <Star className="h-5 w-5 text-black" />
              </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
           <img src={portrait} alt={participant.name} className="w-full h-full object-contain" />
        </DialogContent>
      </Dialog>
      
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-black tracking-widest opacity-40">
            <span className="flex items-center gap-2"><Heart className="h-3 w-3 text-destructive" /> Vitalidade</span>
            <span className="font-code">{participant.hp}/{participant.maxHp}</span>
          </div>
          <Progress value={healthPercent} className={`h-1.5 ${isEnemy ? 'bg-destructive/10' : 'bg-primary/10'}`} />
        </div>

        {participant.maxMana > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest opacity-40">
              <span className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-accent" /> Mana</span>
              <span className="font-code">{participant.mana}/{participant.maxMana}</span>
            </div>
            <Progress value={manaPercent} className="h-1.5 bg-accent/10" />
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-40 leading-none mb-2">Defesa</span>
            <div className="flex items-center gap-3 font-display font-black text-2xl text-primary">
              <Shield className="h-5 w-5 opacity-40" />
              <span>{participant.ac}</span>
            </div>
          </div>
          <Button disabled title="Em desenvolvimento" variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 border border-white/5 h-12 w-12 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <Dices className="h-6 w-6 text-primary group-hover:rotate-45 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConditionMiniBadge({ condition }: { condition: string }) {
  const isBad = ['envenenado', 'caído', 'atordoado', 'bêbado'].includes(condition.toLowerCase());
  return (
    <div className={`p-2 rounded-xl bg-black/70 border shadow-lg backdrop-blur-md transition-transform hover:scale-110 ${isBad ? 'border-destructive text-destructive' : 'border-primary text-primary'}`} title={condition}>
       {condition.toLowerCase().includes('envenenado') ? <Skull className="h-4 w-4" /> : 
        condition.toLowerCase().includes('bêbado') ? <Wine className="h-4 w-4" /> :
        <Ghost className="h-4 w-4" />}
    </div>
  );
}

function ActionButton({ icon, label, active = false, disabled = false }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      title={disabled ? "Em desenvolvimento" : undefined}
      className={`p-8 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 min-w-[140px] transition-all duration-500 group relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed ${active ? 'bg-primary/10 border-primary shadow-gold text-primary' : 'bg-card border-white/5 hover:border-primary/30 text-muted-foreground hover:text-foreground'}`}
    >
      <span className={`transition-transform duration-700 group-hover:scale-125 [&_svg]:h-8 [&_svg]:w-8`}>{icon}</span>
      <span className="text-[10px] font-display font-black uppercase tracking-[0.3em]">{label}</span>
      {active && <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-gold" />}
    </button>
  );
}
