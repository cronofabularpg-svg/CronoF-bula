
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Search, ChevronRight, Lock, Eye, EyeOff, Info, Sparkles, Plus, Sword, Package, MessageSquare, Dices, ShieldCheck, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"

export default function MapaVivo() {
  const { id: campaignId } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [activeNode, setActiveNode] = React.useState<any>(null)
  const [isTraveling, setIsTraveling] = React.useState(false)
  const [travelEvent, setTravelEvent] = React.useState<{ 
    type: 'peaceful' | 'item' | 'combat' | 'dialogue', 
    title: string, 
    description: string, 
    roll: number,
    targetLocationId: string,
    targetLocationName: string
  } | null>(null)
  
  const isDemo = localStorage.getItem('cronofabula_demo_mode') === 'true'
  const isMaster = localStorage.getItem('cronofabula_demo_role') === 'master'

  // Busca sessão ativa para registrar a rolagem
  const sessionQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "sessions"), where("status", "==", "active"), limit(1))
  }, [db, campaignId])
  const { data: sessions } = useCollection(sessionQuery)
  const activeSession = sessions?.[0]

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

  async function handleMoveGroup(locationId: string, locationName: string) {
    setIsTraveling(true)
    
    // Rolagem 1d20 oficial
    const roll = Math.floor(Math.random() * 20) + 1
    
    // Registro da rolagem no banco (Fase 5/8)
    if (db && activeSession && user) {
      await addDoc(collection(db, "campaigns", campaignId, "sessions", activeSession.id, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || "Sistema",
        text: `Rolou 1d20 para Viagem para ${locationName}: **${roll}**`,
        type: 'dice',
        rollData: { formula: '1d20', result: roll, reason: `Viagem para ${locationName}` },
        createdAt: serverTimestamp()
      })
    }

    setTimeout(() => {
      let event: any = null
      
      if (roll <= 8) {
        event = { type: 'peaceful', title: 'Caminho Desimpedido', description: `A estrada para ${locationName} revela-se clemente. O grupo avança sob o silêncio das estrelas.`, roll }
      } else if (roll <= 13) {
        event = { type: 'dialogue', title: 'Vulto na Estrada', description: `Uma figura encapuzada observa vocês de longe. "A crônica de ${locationName} ainda tem páginas em branco", murmura antes de sumir.`, roll }
      } else if (roll <= 17) {
        event = { type: 'item', title: 'Relíquia Esquecida', description: `Luzes arcanas refletem em algo enterrado. Parece ser um fragmento de pergaminho antigo ou um amuleto quebrado.`, roll }
      } else {
        event = { type: 'combat', title: 'Presságio de Sangue', description: `O vento traz o cheiro de aço e fumaça. Sombras hostis bloqueiam o caminho para ${locationName}.`, roll }
      }
      
      setTravelEvent({ ...event, targetLocationId: locationId, targetLocationName: locationName })
      setIsTraveling(false)
    }, 1500)
  }

  async function finalizeTravel(approved: boolean = true) {
    if (approved && travelEvent) {
      // No MVP, a mudança de posição é imediata após aprovação/conclusão
      toast({ title: "Jornada Concluída", description: `O grupo chegou a ${travelEvent.targetLocationName}.` })
      // Aqui haveria o updateDoc da posição do grupo
    }
    setTravelEvent(null)
  }

  async function sendToApprovals(type: string) {
    if (!db || !campaignId || !travelEvent) return
    
    await addDoc(collection(db, "campaigns", campaignId, "approval_requests"), {
      type,
      title: `Encontro de Viagem: ${travelEvent.title}`,
      description: travelEvent.description,
      status: 'pending',
      requesterId: user?.uid,
      createdAt: serverTimestamp(),
      metadata: { roll: travelEvent.roll, location: travelEvent.targetLocationName }
    })

    toast({ title: "Enviado ao Mestre", description: "O evento aguarda validação canônica." })
    setTravelEvent(null)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center tracking-tight">
            <MapPin className="mr-3 h-6 w-6 text-primary animate-pulse" /> Cartografia da Crônica
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-1">Costa de Arvand</p>
        </div>
        <div className="flex gap-3">
          {isMaster && (
            <Button variant="outline" size="sm" className="rounded-full border-primary/30 text-primary hover:bg-primary/10">
              <Plus className="mr-2 h-4 w-4" /> Novo Ponto
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10">
            <Search className="mr-2 h-4 w-4" /> Investigar
          </Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-[#0A0A0F]">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
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

        {activeNode && !isTraveling && (
          <div className="absolute top-8 right-8 w-80 rounded-3xl bg-card/90 backdrop-blur-2xl border border-accent/20 literary-shadow animate-in slide-in-from-right-8 duration-500 overflow-hidden">
             <div className="relative h-40">
               <img src={`https://picsum.photos/seed/${activeNode.id}/400/200`} alt={activeNode.name} className="object-cover w-full h-full opacity-40" />
               <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
               <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/50" onClick={() => setActiveNode(null)}>
                 <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
             <div className="p-6 space-y-6">
               <h2 className="text-2xl font-display font-bold text-accent">{activeNode.name}</h2>
               <p className="text-xs text-muted-foreground font-heading italic leading-relaxed">
                 {activeNode.description || 'Um local envolto em névoas e mistérios.'}
               </p>
               <Button 
                 className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[11px]"
                 onClick={() => handleMoveGroup(activeNode.id, activeNode.name)}
               >
                 Viajar para cá <ChevronRight className="ml-2 h-4 w-4" />
               </Button>
             </div>
          </div>
        )}

        {isTraveling && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
             <div className="p-8 rounded-full bg-primary/20 border border-primary/30 animate-pulse mb-6">
                <MapPin className="h-12 w-12 text-primary" />
             </div>
             <h2 className="text-3xl font-display font-black text-white">Cruzando a Fronteira...</h2>
             <p className="text-muted-foreground font-heading italic mt-2">O destino está sendo traçado pelos dados.</p>
          </div>
        )}

        <Dialog open={!!travelEvent} onOpenChange={() => finalizeTravel(false)}>
          <DialogContent className="bg-card border-accent/30 literary-shadow max-w-lg">
            <DialogHeader>
              <div className="flex justify-center mb-6">
                <div className={`p-5 rounded-2xl border-2 ${
                  travelEvent?.type === 'combat' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                  travelEvent?.type === 'item' ? 'bg-primary/20 text-primary border-primary/30' :
                  'bg-accent/20 text-accent border-accent/30'
                }`}>
                   {travelEvent?.type === 'combat' ? <Sword className="h-10 w-10" /> :
                    travelEvent?.type === 'item' ? <Package className="h-10 w-10" /> :
                    <Sparkles className="h-10 w-10" />}
                </div>
              </div>
              <DialogTitle className="text-3xl font-display text-center text-accent">{travelEvent?.title}</DialogTitle>
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="bg-black/20 text-[10px] uppercase font-black tracking-widest">
                  <Dices className="mr-2 h-3 w-3 text-primary" /> Resultado: {travelEvent?.roll}
                </Badge>
              </div>
              <DialogDescription className="text-xl font-heading italic text-center text-foreground/90 mt-6 leading-relaxed">
                "{travelEvent?.description}"
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {isMaster ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-primary h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => finalizeTravel(true)}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Concluir Viagem
                    </Button>
                    <Button variant="outline" className="h-12 rounded-xl border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-widest" onClick={() => finalizeTravel(false)}>
                      <XCircle className="mr-2 h-4 w-4" /> Ignorar Encontro
                    </Button>
                  </div>
                  {travelEvent?.type === 'combat' && (
                    <Button className="bg-destructive hover:bg-destructive/90 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push(`/campaign/${campaignId}/combate`)}>
                      Iniciar Combate Agora
                    </Button>
                  )}
                  {travelEvent?.type === 'dialogue' && (
                    <Button variant="secondary" className="h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push(`/campaign/${campaignId}/mesa-viva`)}>
                      Transformar em Cena
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest bg-white/5 p-3 rounded-lg border border-white/5">
                    Este evento requer validação do Mestre para se tornar canônico.
                  </p>
                  <Button className="w-full bg-accent text-accent-foreground h-12 rounded-xl font-bold" onClick={() => sendToApprovals(travelEvent?.type || 'travel')}>
                    Notificar Mestre e Aguardar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function MapNode({ node, isActive, onClick }: { node: any, isActive: boolean, onClick: () => void }) {
  const isUnknown = node.status === 'unknown'
  return (
    <div 
      className={`absolute cursor-pointer transition-all duration-700 flex flex-col items-center group
        ${isActive ? 'z-20 scale-125' : 'z-10 hover:scale-110'}
        ${isUnknown ? 'opacity-20' : 'opacity-100'}
      `}
      style={{ left: `${node.coords.x}px`, top: `${node.coords.y}px`, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`p-4 rounded-2xl border-2 transition-all shadow-arcane
        ${isActive ? 'bg-primary border-accent animate-glow' : 'bg-card border-white/10 group-hover:border-primary/50'}
      `}>
        {isUnknown ? <EyeOff className="h-6 w-6 text-muted-foreground" /> : <MapPin className={`h-6 w-6 ${isActive ? 'text-white' : 'text-primary'}`} />}
      </div>
      <span className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-white/5 ${isActive ? 'text-white bg-primary' : 'text-muted-foreground'}`}>
        {isUnknown ? '???' : node.name}
      </span>
    </div>
  )
}
