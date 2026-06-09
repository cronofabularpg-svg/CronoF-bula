
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Search, ChevronRight, Lock, Eye, EyeOff, Info } from "lucide-react"

const MOCK_NODES = [
  { id: '1', name: 'Taverna do Cervo Torto', status: 'visited', type: 'social', coords: { x: 400, y: 300 } },
  { id: '2', name: 'Docas Nebulosas', status: 'known', type: 'danger', coords: { x: 600, y: 500 } },
  { id: '3', name: 'Beco dos Fundos', status: 'active', type: 'stealth', coords: { x: 350, y: 450 } },
  { id: '4', name: 'Armazém 7', status: 'locked', type: 'dungeon', coords: { x: 650, y: 650 } },
  { id: '5', name: 'Farol Quebrado', status: 'unknown', type: 'mystery', coords: { x: 800, y: 400 } },
];

const MOCK_EDGES = [
  { from: '1', to: '3' },
  { from: '3', to: '2' },
  { from: '2', to: '4' },
];

export default function MapaVivo() {
  const [activeNode, setActiveNode] = React.useState(MOCK_NODES[2]);

  return (
    <div className="h-screen flex flex-col">
      <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-primary" /> Costa de Arvand
          </h1>
          <p className="text-xs text-muted-foreground font-ui">Sessão Ativa: Sombras nas Docas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            <Search className="mr-2 h-4 w-4" /> Investigar Área
          </Button>
          <Button variant="default" size="sm" className="rounded-full bg-primary hover:bg-primary/90">
            Mover Grupo
          </Button>
        </div>
      </header>

      <div className="flex-1 relative bg-background overflow-hidden">
        {/* SVG Grid / Map Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #7B42BC 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {MOCK_EDGES.map((edge, i) => {
            const fromNode = MOCK_NODES.find(n => n.id === edge.from);
            const toNode = MOCK_NODES.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <line 
                key={i} 
                x1={fromNode.coords.x} y1={fromNode.coords.y} 
                x2={toNode.coords.x} y2={toNode.coords.y} 
                stroke="hsl(var(--primary))" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
                opacity="0.3"
              />
            );
          })}
        </svg>

        {MOCK_NODES.map((node) => (
          <MapNode 
            key={node.id} 
            node={node} 
            isActive={activeNode.id === node.id} 
            onClick={() => setActiveNode(node)}
          />
        ))}

        {/* Legend / Stats overlay */}
        <div className="absolute bottom-8 left-8 p-4 rounded-xl bg-card/80 backdrop-blur-md border border-white/10 literary-shadow space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Local Atual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Descoberto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Oculto</span>
          </div>
        </div>

        {/* Node Detail Sidebar */}
        <div className="absolute top-8 right-8 w-80 max-h-[calc(100%-4rem)] rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 literary-shadow flex flex-col p-6 overflow-hidden">
          <ScrollArea>
            <div className="space-y-6">
              <div className="relative h-40 w-full rounded-xl overflow-hidden bg-muted mb-4">
                <img 
                  src={`https://picsum.photos/seed/${activeNode.id}/400/200`} 
                  alt={activeNode.name} 
                  className="object-cover w-full h-full opacity-60" 
                />
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[8px] tracking-widest">
                    {activeNode.type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">{activeNode.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed font-ui">
                  {activeNode.status === 'locked' 
                    ? 'Este local requer uma chave ou condição específica para ser explorado.' 
                    : 'Um local envolto em neblina, as docas são o coração comercial e o rim podre da cidade de Arvand.'}
                </p>
              </div>

              {activeNode.status === 'locked' ? (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-destructive shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-destructive uppercase tracking-widest">Acesso Negado</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Requer: Chave de Ferro Enferrujada ou Teste de Atletismo (CD 20).</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">Pontos de Interesse</h3>
                  <div className="space-y-2">
                    <InterestItem name="Portão das Almas" desc="Um portão de ferro sempre fechado." />
                    <InterestItem name="O Velho Pescador" desc="Um NPC solitário que observa as águas." />
                  </div>
                </div>
              )}

              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4" disabled={activeNode.status === 'locked'}>
                Viajar para cá <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function MapNode({ node, isActive, onClick }: { node: any, isActive: boolean, onClick: () => void }) {
  const isUnknown = node.status === 'unknown';
  const isLocked = node.status === 'locked';

  return (
    <div 
      className={`absolute cursor-pointer transition-all duration-500 flex flex-col items-center group
        ${isActive ? 'z-20 scale-110' : 'z-10 hover:scale-105'}
        ${isUnknown ? 'opacity-30' : 'opacity-100'}
      `}
      style={{ left: node.coords.x, top: node.coords.y, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`relative p-3 rounded-2xl border-2 transition-colors duration-300 literary-shadow
        ${isActive ? 'bg-primary border-primary-foreground/50 animate-pulse' : 'bg-card border-white/5 group-hover:border-primary/50'}
        ${isUnknown ? 'bg-muted border-transparent grayscale' : ''}
        ${isLocked ? 'border-destructive/30' : ''}
      `}>
        {isUnknown ? <EyeOff className="h-6 w-6 text-muted-foreground" /> : <MapPin className={`h-6 w-6 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />}
        {isLocked && <Lock className="absolute -top-2 -right-2 h-4 w-4 text-destructive bg-background rounded-full p-0.5 border border-destructive/20" />}
      </div>
      <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded transition-colors
        ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}
      `}>
        {isUnknown ? '???' : node.name}
      </span>
    </div>
  );
}

function InterestItem({ name, desc }: { name: string, desc: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">{name}</span>
        <Info className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}
