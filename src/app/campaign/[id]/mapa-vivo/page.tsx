
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Search, ChevronRight, Lock, Eye, EyeOff, Info, Sparkles, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MapaVivo() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeNode, setActiveNode] = React.useState<any>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDemo, setIsDemo] = React.useState(false)

  React.useEffect(() => {
    setIsDemo(localStorage.getItem('cronofabula_demo_mode') === 'true')
  }, [])

  const locationsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "locations"), orderBy("createdAt", "desc"))
  }, [db, campaignId])

  const { data: locations, loading } = useCollection(locationsQuery)
  
  // No modo demo, se não houver locais, usamos mock
  const displayLocations = (locations && locations.length > 0) ? locations : (isDemo ? [
    { id: '1', name: 'Taverna do Cervo Torto', status: 'known', type: 'city', coords: { x: 400, y: 300 }, description: 'Um lugar quente e barulhento.' },
    { id: '2', name: 'Docas Nebulosas', status: 'active', type: 'danger', coords: { x: 600, y: 500 }, description: 'O cheiro de peixe e crime é forte.' },
    { id: '3', name: 'Beco dos Fundos', status: 'active', type: 'mystery', coords: { x: 350, y: 450 }, description: 'Onde as sombras ganham vida.' },
  ] : [])

  const isMaster = localStorage.getItem('cronofabula_demo_role') === 'master'

  async function handleMoveGroup(locationId: string, locationName: string) {
    toast({ title: "Movimentação Arcaica", description: `O grupo está se deslocando para ${locationName}.` })
    // Aqui atualizaríamos o estado da campanha no Firestore
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center tracking-tight">
            <MapPin className="mr-3 h-6 w-6 text-primary animate-pulse" /> Cartografia da Crônica
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-1">Região: Costa de Arvand</p>
        </div>
        <div className="flex gap-3">
          {isMaster && (
            <Button variant="outline" size="sm" className="rounded-full border-primary/30 text-primary hover:bg-primary/10">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Ponto
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10">
            <Search className="mr-2 h-4 w-4" /> Investigar Área
          </Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-[#0A0A0F]">
        {/* SVG Grid Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Renderização dos Nós */}
        <div className="absolute inset-0">
          {displayLocations.map((node: any) => (
            <MapNode 
              key={node.id} 
              node={node} 
              isActive={activeNode?.id === node.id} 
              onClick={() => setActiveNode(node)}
            />
          ))}
        </div>

        {/* Legenda */}
        <div className="absolute bottom-8 left-8 p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 literary-shadow space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-arcane" />
            <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Localização Atual</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Ponto Conhecido</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-muted border border-white/20" />
            <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Território Incógnito</span>
          </div>
        </div>

        {/* Detalhes do Local */}
        {activeNode && (
          <div className="absolute top-8 right-8 w-80 max-h-[calc(100%-4rem)] rounded-3xl bg-card/90 backdrop-blur-2xl border border-accent/20 literary-shadow flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500">
             <div className="relative h-44 shrink-0">
               <img src={`https://picsum.photos/seed/${activeNode.id}/400/200`} alt={activeNode.name} className="object-cover w-full h-full opacity-40" />
               <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
               <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/50" onClick={() => setActiveNode(null)}>
                 <ChevronRight className="h-4 w-4" />
               </Button>
               <div className="absolute bottom-4 left-4">
                 <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[8px] tracking-[0.2em] font-black">
                   {activeNode.type}
                 </Badge>
               </div>
             </div>

             <ScrollArea className="flex-1">
               <div className="p-6 space-y-6">
                 <div>
                   <h2 className="text-2xl font-display font-bold text-accent tracking-tight">{activeNode.name}</h2>
                   <p className="text-xs text-muted-foreground leading-relaxed mt-2 font-heading italic">
                     {activeNode.description || 'Um local envolto em névoas e mistérios da crônica.'}
                   </p>
                 </div>

                 {activeNode.status === 'locked' ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                      <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">Acesso Restrito</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Este local exige uma chave física ou uma ação narrativa específica para ser explorado.</p>
                      </div>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-40">Pontos de Interesse</h3>
                       <div className="space-y-2">
                         <div className="p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                           <span className="text-[11px] font-bold block">Marcas na Parede</span>
                           <p className="text-[9px] text-muted-foreground mt-1 italic">Símbolos antigos que parecem reagir à luz de velas.</p>
                         </div>
                       </div>
                    </div>
                 )}

                 <Button 
                   className="w-full rounded-xl bg-primary hover:bg-primary/90 literary-shadow py-6 text-[11px] font-bold uppercase tracking-widest"
                   disabled={activeNode.status === 'locked'}
                   onClick={() => handleMoveGroup(activeNode.id, activeNode.name)}
                 >
                   Viajar para este Local <ChevronRight className="ml-2 h-4 w-4" />
                 </Button>
               </div>
             </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}

function MapNode({ node, isActive, onClick }: { node: any, isActive: boolean, onClick: () => void }) {
  const isUnknown = node.status === 'unknown'
  const isLocked = node.status === 'locked'

  return (
    <div 
      className={`absolute cursor-pointer transition-all duration-700 flex flex-col items-center group
        ${isActive ? 'z-20 scale-125' : 'z-10 hover:scale-110'}
        ${isUnknown ? 'opacity-20' : 'opacity-100'}
      `}
      style={{ left: `${node.coords.x}px`, top: `${node.coords.y}px`, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 shadow-arcane
        ${isActive ? 'bg-primary border-accent animate-glow' : 'bg-card border-white/10 group-hover:border-primary/50'}
        ${isUnknown ? 'bg-muted border-transparent grayscale' : ''}
      `}>
        {isUnknown ? <EyeOff className="h-6 w-6 text-muted-foreground" /> : <MapPin className={`h-6 w-6 ${isActive ? 'text-white' : 'text-primary'}`} />}
        {isLocked && <Lock className="absolute -top-2 -right-2 h-4 w-4 text-destructive bg-background rounded-full p-0.5 border border-destructive/20" />}
      </div>
      <span className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap px-3 py-1 rounded-full transition-all
        ${isActive ? 'bg-primary text-white scale-110' : 'text-muted-foreground group-hover:text-foreground bg-card/50 backdrop-blur-sm border border-white/5'}
      `}>
        {isUnknown ? '???' : node.name}
      </span>
    </div>
  )
}
