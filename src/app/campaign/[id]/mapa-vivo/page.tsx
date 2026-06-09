
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Search, ChevronRight, Lock, Eye, EyeOff, Info, Sparkles, Plus, Sword, Package, MessageSquare, Dices } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MapaVivo() {
  const { id: campaignId } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeNode, setActiveNode] = React.useState<any>(null)
  const [isTraveling, setIsTraveling] = React.useState(false)
  const [travelEvent, setTravelEvent] = React.useState<{ type: 'peaceful' | 'item' | 'combat' | 'dialogue', title: string, description: string, roll: number } | null>(null)
  const [isDemo, setIsDemo] = React.useState(false)

  React.useEffect(() => {
    setIsDemo(localStorage.getItem('cronofabula_demo_mode') === 'true')
  }, [])

  const locationsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "locations"), orderBy("createdAt", "desc"))
  }, [db, campaignId])

  const { data: locations, loading } = useCollection(locationsQuery)
  
  const displayLocations = (locations && locations.length > 0) ? locations : (isDemo ? [
    { id: '1', name: 'Taverna do Cervo Torto', status: 'known', type: 'city', coords: { x: 400, y: 300 }, description: 'Um lugar quente e barulhento.' },
    { id: '2', name: 'Docas Nebulosas', status: 'active', type: 'danger', coords: { x: 600, y: 500 }, description: 'O cheiro de peixe e crime é forte.' },
    { id: '3', name: 'Beco dos Fundos', status: 'active', type: 'mystery', coords: { x: 350, y: 450 }, description: 'Onde as sombras ganham vida.' },
  ] : [])

  const isMaster = localStorage.getItem('cronofabula_demo_role') === 'master'

  async function handleMoveGroup(locationId: string, locationName: string) {
    setIsTraveling(true)
    
    // Simula uma rolagem de evento (1d20)
    const roll = Math.floor(Math.random() * 20) + 1
    
    setTimeout(() => {
      let event: any = null
      
      if (roll >= 1 && roll <= 8) {
        event = {
          type: 'peaceful',
          title: 'Viagem Tranquila',
          description: `O caminho para ${locationName} foi calmo. O grupo aproveitou para discutir estratégias sob a luz do luar.`,
          roll
        }
      } else if (roll >= 9 && roll <= 13) {
        event = {
          type: 'dialogue',
          title: 'Encontro na Estrada',
          description: `No meio do caminho, um viajante misterioso cruza sua trilha e murmura: "As estrelas não mentem, o destino de ${locationName} já foi selado."`,
          roll
        }
      } else if (roll >= 14 && roll <= 17) {
        event = {
          type: 'item',
          title: 'Objeto Achado',
          description: `Escondido entre as raízes de uma árvore centenária, você encontra um pequeno embrulho de couro contendo uma moeda antiga de Arvand.`,
          roll
        }
      } else {
        event = {
          type: 'combat',
          title: 'Emboscada!',
          description: `Sombras se movem rápido demais nos arbustos. Antes que pudessem reagir, o tinir do aço revela o perigo. Vocês estão sob ataque!`,
          roll
        }
      }
      
      setTravelEvent(event)
      setIsTraveling(false)
      toast({ title: "Destino Alcançado", description: `O grupo chegou a ${locationName}.` })
    }, 2000)
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
        </div>

        {/* Detalhes do Local */}
        {activeNode && !isTraveling && (
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

        {/* Overlay de Viagem */}
        {isTraveling && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
             <div className="p-8 rounded-full bg-primary/20 border border-primary/30 animate-pulse mb-6">
                <MapPin className="h-12 w-12 text-primary" />
             </div>
             <h2 className="text-3xl font-display font-black text-white tracking-tighter">Viagem em Curso...</h2>
             <p className="text-muted-foreground font-heading italic mt-2">O tempo flui enquanto o grupo avança.</p>
          </div>
        )}

        {/* Modal de Encontro */}
        <Dialog open={!!travelEvent} onOpenChange={() => setTravelEvent(null)}>
          <DialogContent className="bg-card border-accent/30 literary-shadow max-w-md">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-2xl ${
                  travelEvent?.type === 'combat' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                  travelEvent?.type === 'item' ? 'bg-primary/20 text-primary border-primary/30' :
                  travelEvent?.type === 'dialogue' ? 'bg-accent/20 text-accent border-accent/30' :
                  'bg-secondary/20 text-secondary border-secondary/30'
                } border-2`}>
                   {travelEvent?.type === 'combat' ? <Sword className="h-8 w-8" /> :
                    travelEvent?.type === 'item' ? <Package className="h-8 w-8" /> :
                    travelEvent?.type === 'dialogue' ? <MessageSquare className="h-8 w-8" /> :
                    <Sparkles className="h-8 w-8" />}
                </div>
              </div>
              <DialogTitle className="text-2xl font-display font-bold text-center text-accent">
                {travelEvent?.title}
              </DialogTitle>
              <div className="flex justify-center items-center gap-2 mt-2">
                 <Badge variant="outline" className="bg-black/20 text-[9px] uppercase font-black tracking-widest border-white/10">
                   <Dices className="mr-1.5 h-3 w-3 text-primary" /> Dado: {travelEvent?.roll}
                 </Badge>
              </div>
              <DialogDescription className="text-lg font-heading italic text-center text-foreground/80 mt-4 leading-relaxed">
                "{travelEvent?.description}"
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-8">
              {travelEvent?.type === 'combat' ? (
                <Button className="w-full bg-destructive hover:bg-destructive/90 rounded-xl" onClick={() => router.push(`/campaign/${campaignId}/combate`)}>
                  Entrar em Combate <Sword className="ml-2 h-4 w-4" />
                </Button>
              ) : travelEvent?.type === 'item' ? (
                <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl" onClick={() => router.push(`/campaign/${campaignId}/inventario`)}>
                  Guardar no Inventário <Package className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl" onClick={() => setTravelEvent(null)}>
                  Continuar Jornada <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
