
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Sparkles, 
  MapPin, 
  Users, 
  Dices, 
  MessageSquareDashed, 
  Volume2, 
  Ghost,
  Hash,
  Crown,
  Zap,
  Shield,
  Eye,
  MessageSquare
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { aiNarratorAndNpcDialogue } from "@/ai/flows/narrator-npc-dialogue"

export default function MesaViva() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [inputValue, setInputValue] = React.useState('')
  const [messageType, setMessageType] = React.useState<'speech' | 'action' | 'narration'>('speech')
  const [isSoloMode, setIsSoloMode] = React.useState(false)
  const [isAiThinking, setIsAiThinking] = React.useState(false)
  
  // Estados para o Rolador de Dados
  const [diceFormula, setDiceFormula] = React.useState('1d20')
  const [rollReason, setRollReason] = React.useState('')
  const [physicalResult, setPhysicalResult] = React.useState('')
  const [isDiceDialogOpen, setIsDiceDialogOpen] = React.useState(false)
  const [activeDiceTab, setActiveDiceTab] = React.useState<string>("virtual")

  // Busca perfil do usuário para saber preferência de dados
  const userRef = React.useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc<any>(userRef)

  React.useEffect(() => {
    if (isDiceDialogOpen && profile?.dicePreference) {
      if (profile.dicePreference !== 'ask') {
        setActiveDiceTab(profile.dicePreference)
      }
    }
  }, [isDiceDialogOpen, profile])

  // Busca a última sessão ativa
  const activeSessionQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(
      collection(db, "campaigns", campaignId, "sessions"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(1)
    )
  }, [db, campaignId])

  const { data: activeSessions, loading: loadingSession } = useCollection(activeSessionQuery)
  const session = activeSessions?.[0]

  // Busca NPCs da campanha
  const npcsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "npcs"), where("status", "==", "alive"))
  }, [db, campaignId])

  const { data: npcs } = useCollection(npcsQuery)

  // Busca personagens ativos
  const charactersQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "characters"), where("status", "==", "active"))
  }, [db, campaignId])
  const { data: characters } = useCollection(charactersQuery)
  const myCharacter = characters?.find(c => c.ownerId === user?.uid)

  // Busca mensagens da sessão ativa
  const messagesQuery = React.useMemo(() => {
    if (!db || !campaignId || !session) return null
    return query(
      collection(db, "campaigns", campaignId, "sessions", session.id, "messages"),
      orderBy("createdAt", "asc")
    )
  }, [db, campaignId, session])

  const { data: messages, loading: loadingMessages } = useCollection(messagesQuery)

  // Busca dados da campanha para saber quem é o mestre
  const campaignQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns"), where("id", "==", campaignId))
  }, [db, campaignId])
  
  const { data: campaignData } = useCollection(campaignQuery)
  const campaign = campaignData?.[0]
  const isMaster = campaign?.masterId === user?.uid || localStorage.getItem('cronofabula_demo_role') === 'master';

  const handleSend = async (text?: string, type?: string, rollData?: any) => {
    const finalContent = text || inputValue
    const finalType = type || (isMaster && messageType === 'narration' ? 'narration' : messageType)

    if (!finalContent.trim() || !session || !user) return

    const messageData = {
      sessionId: session.id,
      senderId: user.uid,
      senderName: user.displayName || "Aventureiro",
      text: finalContent,
      type: finalType,
      rollData: rollData || null,
      createdAt: serverTimestamp()
    }

    try {
      await addDoc(collection(db, "campaigns", campaignId, "sessions", session.id, "messages"), messageData)
      if (!text) setInputValue('')
      
      // Lógica de IA Mestre Avançada
      if (isSoloMode && !isMaster && (finalType === 'action' || finalType === 'speech')) {
        handleAiMasterResponse(finalContent, finalType)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAiMasterResponse = async (playerInput: string, type: 'action' | 'speech') => {
    if (!session || !campaign || !myCharacter) return
    
    setIsAiThinking(true)
    
    try {
      const input = {
        mode: 'narrator' as const,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          tone: campaign.tone || "fantasia sombria",
          rule_system: campaign.system || "dnd_srd"
        },
        session: {
          id: session.id,
          title: session.title,
          status: "active"
        },
        scene: {
          id: "current-scene",
          title: "Cena em Andamento",
          visibility: "public",
          location: "Desconhecida"
        },
        active_character: {
          id: myCharacter.id,
          name: myCharacter.name,
          race: myCharacter.race,
          class: myCharacter.class,
          known_information: ["Está explorando uma área nova."]
        },
        player_action: playerInput,
        visible_objects: ["Uma névoa persistente"],
        present_npcs: npcs?.map(n => ({ name: n.name })) || []
      }

      const aiResponse = await aiNarratorAndNpcDialogue(input as any)

      await addDoc(collection(db, "campaigns", campaignId, "sessions", session.id, "messages"), {
        sessionId: session.id,
        senderId: 'ai-narrator',
        senderName: 'IA Mestre',
        text: aiResponse,
        type: 'narration',
        createdAt: serverTimestamp()
      })
    } catch (e) {
      console.error("Erro na IA:", e)
      toast({ variant: "destructive", title: "Erro do Oráculo", description: "A IA encontrou uma bruma mental. Tente novamente." })
    } finally {
      setIsAiThinking(false)
    }
  }

  const handleRollDice = (isPhysical: boolean = false) => {
    if (!session || !user) return

    let result = 0
    let formula = diceFormula

    if (isPhysical) {
      result = parseInt(physicalResult)
      if (isNaN(result)) {
        toast({ variant: "destructive", title: "Resultado Inválido", description: "Informe um número para o dado físico." })
        return
      }
    } else {
      try {
        const parts = formula.toLowerCase().split('d')
        const numDice = parseInt(parts[0]) || 1
        const remaining = parts[1]
        
        let dieSize = 20
        let modifier = 0

        if (remaining.includes('+')) {
          const subParts = remaining.split('+')
          dieSize = parseInt(subParts[0])
          modifier = parseInt(subParts[1])
        } else if (remaining.includes('-')) {
          const subParts = remaining.split('-')
          dieSize = parseInt(subParts[0])
          modifier = -parseInt(subParts[1])
        } else {
          dieSize = parseInt(remaining)
        }

        for (let i = 0; i < numDice; i++) {
          result += Math.floor(Math.random() * dieSize) + 1
        }
        result += modifier
      } catch (e) {
        toast({ variant: "destructive", title: "Fórmula Inválida", description: "Use o formato XdY+Z (ex: 1d20+5)" })
        return
      }
    }

    const rollMsg = `Rolou ${formula}${rollReason ? ` para ${rollReason}` : ''}: **${result}**`
    handleSend(rollMsg, 'dice', {
      formula,
      result,
      isPhysical,
      reason: rollReason
    })

    setIsDiceDialogOpen(false)
    setRollReason('')
    setPhysicalResult('')
  }

  if (loadingSession) return <div className="h-screen flex items-center justify-center italic">Sincronizando com o Arcano...</div>
  
  if (!session) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 text-center p-10">
      <div className="p-6 rounded-full bg-muted/20 text-muted-foreground"><MessageSquareDashed className="h-16 w-16" /></div>
      <h2 className="text-2xl font-display font-bold">Portal Fechado</h2>
      <p className="text-muted-foreground font-heading italic max-w-md">Não há uma sessão ativa para esta crônica.</p>
      {isMaster && (
        <Button asChild className="rounded-full bg-primary px-8">
          <a href={`/campaign/${campaignId}/master`}>Iniciar Sessão Oficial</a>
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex h-screen mesa-viva-bg bg-fixed overflow-hidden">
      <div className="w-80 border-r border-white/5 bg-background/60 backdrop-blur-xl hidden xl:flex flex-col p-6 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
              <Users className="mr-2 h-3 w-3" /> Na Cena
            </h3>
            {isSoloMode && <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-[8px] uppercase tracking-tighter">Solo Ativo</Badge>}
          </div>
          <div className="space-y-4">
             <ParticipantItem name={user?.displayName || "Você"} role={isMaster ? "Mestre" : (myCharacter?.class || "Aventureiro")} status="Ativo" />
             {isSoloMode && <ParticipantItem name="IA Mestre" role="Narrador" status={isAiThinking ? "Pensando..." : "Observando"} isAI />}
             {npcs?.map(npc => (
               <ParticipantItem key={npc.id} name={npc.name} role={npc.role} status="Presente" isNPC />
             ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <MapPin className="mr-2 h-3 w-3" /> Localização
          </h3>
          <div className="p-5 rounded-2xl bg-card/50 border border-white/5 space-y-3">
             <p className="text-sm font-bold text-accent">Desconhecida</p>
             <p className="text-[11px] text-muted-foreground leading-relaxed">As brumas do tempo escondem os detalhes deste local.</p>
             <Button variant="outline" size="sm" className="w-full text-[9px] uppercase font-bold tracking-widest h-8">Investigar</Button>
          </div>
        </section>

        {!isMaster && (
          <section className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-4">
              <p className="text-[10px] uppercase font-bold text-secondary tracking-widest text-center">Jornada Solo</p>
              <p className="text-[11px] text-muted-foreground italic text-center">A IA assumirá a narração e os NPCs para você.</p>
              <Button 
                onClick={() => setIsSoloMode(!isSoloMode)} 
                variant={isSoloMode ? "default" : "outline"} 
                className={`w-full rounded-xl transition-all ${isSoloMode ? 'bg-secondary' : 'border-secondary text-secondary hover:bg-secondary/10'}`}
              >
                {isSoloMode ? "Encerrar Solo" : "Ativar IA Mestre"}
              </Button>
            </div>
          </section>
        )}
      </div>

      <div className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center px-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-display font-black text-accent flex items-center gap-2">
                {isMaster && <Crown className="h-4 w-4 text-primary" />}
                {session.title}
              </h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {isMaster ? "Você está no comando da narrativa" : "Sua lenda está sendo escrita"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                     <Users className="h-5 w-5" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>Membros da Campanha</TooltipContent>
               </Tooltip>
             </TooltipProvider>

             <Dialog open={isDiceDialogOpen} onOpenChange={setIsDiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent transition-colors">
                  <Dices className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-accent/30 literary-shadow max-w-sm">
                <DialogHeader><DialogTitle className="font-display text-2xl text-accent">Lançar Dados</DialogTitle></DialogHeader>
                
                <Tabs value={activeDiceTab} onValueChange={setActiveDiceTab} className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20">
                    <TabsTrigger value="virtual" className="text-[10px] uppercase font-bold tracking-widest flex gap-2">
                      <Dices className="h-3 w-3" /> Virtual
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="text-[10px] uppercase font-bold tracking-widest flex gap-2">
                      <Hash className="h-3 w-3" /> Físico
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="virtual" className="space-y-6 pt-4 animate-in slide-in-from-left-4 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest">Fórmula do Dado</Label>
                        <div className="flex gap-2">
                          <Input value={diceFormula} onChange={e => setDiceFormula(e.target.value)} placeholder="Ex: 1d20+5" className="font-code text-lg" />
                          <Button onClick={() => handleRollDice(false)} className="bg-primary hover:bg-primary/90 px-6">Rolar</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest">Motivo (Opcional)</Label>
                        <Input value={rollReason} onChange={e => setRollReason(e.target.value)} placeholder="Ex: Atacar o Orc" className="bg-background/50" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="physical" className="space-y-6 pt-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest">Resultado Real</Label>
                        <div className="flex gap-2">
                          <Input value={physicalResult} onChange={e => setPhysicalResult(e.target.value)} placeholder="Total" type="number" className="font-code text-lg" />
                          <Button variant="outline" onClick={() => handleRollDice(true)} className="border-accent/30 text-accent px-6">Registrar</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest">Motivo (Opcional)</Label>
                        <Input value={rollReason} onChange={e => setRollReason(e.target.value)} placeholder="Ex: Teste de Percepção" className="bg-background/50" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
             </Dialog>
          </div>
        </header>

        <ScrollArea className="flex-1 p-8 px-12 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, #7B42BC 1px, transparent 1px)', backgroundSize: '100px 100px', opacity: 1 }}>
          <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {loadingMessages ? (
              <div className="text-center italic opacity-50 animate-pulse">Consultando os anais...</div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <ChatMessage key={msg.id} msg={msg} currentUserId={user?.uid} />
              ))
            ) : (
              <div className="text-center italic text-muted-foreground p-12 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center gap-4">
                <Sparkles className="h-10 w-10 text-primary/30" />
                <p className="max-w-xs leading-relaxed">O tempo parou. Não há nada registrado nesta cena. O que vocês fazem?</p>
              </div>
            )}
            {isAiThinking && (
              <div className="flex gap-8 animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-secondary animate-spin-slow" />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-secondary tracking-widest">IA Mestre está tecendo o destino...</p>
                  <div className="h-4 w-64 bg-secondary/10 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-8 px-12 border-t border-white/5 bg-background/95 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <ActionShortcut icon={<Volume2 />} label="Falar" active={messageType === 'speech'} onClick={() => setMessageType('speech')} />
              <ActionShortcut icon={<Ghost />} label="Agir" active={messageType === 'action'} onClick={() => setMessageType('action')} />
              {isMaster && (
                <ActionShortcut icon={<Sparkles />} label="Narrar" active={messageType === 'narration'} onClick={() => setMessageType('narration')} />
              )}
              <div className="ml-auto flex gap-2">
                 <Button variant="ghost" size="sm" className="h-8 text-[9px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary"><Zap className="mr-1.5 h-3.5 w-3.5" /> Magia</Button>
                 <Button variant="ghost" size="sm" className="h-8 text-[9px] uppercase font-bold tracking-widest text-muted-foreground hover:text-accent"><Shield className="mr-1.5 h-3.5 w-3.5" /> Defesa</Button>
              </div>
            </div>
            
            <div className="relative">
              <Input 
                placeholder={messageType === 'narration' ? "Narre o desenrolar do destino..." : `O que ${user?.displayName?.split(' ')[0]} faz?`}
                className="pr-32 py-10 rounded-2xl bg-muted/30 border-white/10 font-ui focus:ring-primary text-xl literary-shadow"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Button size="icon" className="h-14 w-14 rounded-xl bg-primary hover:bg-primary/90 shadow-arcane transition-all hover:scale-105" onClick={() => handleSend()}>
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, currentUserId }: { msg: any, currentUserId?: string }) {
  const isNarrator = msg.type === 'narration' || msg.senderId === 'ai-narrator';
  const isMine = msg.senderId === currentUserId;
  const isAction = msg.type === 'action';
  const isDice = msg.type === 'dice';

  if (isNarrator) {
    return (
      <div className="flex gap-8 animate-in fade-in slide-in-from-left-4 duration-700 max-w-5xl">
        <Avatar className="h-12 w-12 rounded-2xl bg-primary/20 p-2.5 shrink-0 border border-primary/30 shadow-arcane">
          <Sparkles className="h-full w-full text-primary" />
        </Avatar>
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold text-primary tracking-[0.3em] font-ui flex items-center gap-2">
            Narrador Arcano • {msg.senderName}
            {msg.senderId === 'ai-narrator' && <Badge className="h-4 bg-primary/10 text-[8px] border-primary/20">IA</Badge>}
          </p>
          <div className="text-2xl leading-relaxed text-foreground/90 font-heading italic first-letter:text-5xl first-letter:font-display first-letter:mr-1 first-letter:float-left first-letter:text-accent">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (isDice) {
    return (
      <div className={`flex gap-6 animate-in duration-500 ${isMine ? 'justify-end' : ''}`}>
        <div className={`p-6 rounded-3xl border-2 flex items-center gap-6 literary-shadow transition-all hover:scale-105 ${
          msg.rollData?.isPhysical ? 'bg-accent/5 border-accent/30 shadow-gold' : 'bg-secondary/5 border-secondary/30 shadow-arcane'
        }`}>
          <div className={`p-3 rounded-xl ${msg.rollData?.isPhysical ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
            {msg.rollData?.isPhysical ? <Hash className="h-6 w-6" /> : <Dices className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1">{msg.senderName} conjura {msg.rollData?.formula}</p>
            <p className="text-4xl font-display font-black tracking-tight text-foreground">{msg.rollData?.result}</p>
            {msg.rollData?.reason && <p className="text-[11px] italic text-muted-foreground mt-2 border-l border-white/10 pl-2">para {msg.rollData?.reason}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-6 animate-in duration-500 ${isMine ? 'justify-end slide-in-from-right-8' : 'slide-in-from-left-8'}`}>
      {!isMine && (
        <Avatar className="h-12 w-12 rounded-2xl shrink-0 border border-white/10 bg-muted/20">
          <AvatarFallback className="text-sm font-black">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`space-y-3 ${isMine ? 'text-right' : 'text-left'}`}>
        <p className={`text-[10px] uppercase font-bold tracking-[0.2em] font-ui ${isMine ? 'text-accent' : 'text-muted-foreground'}`}>
          {msg.senderName} {isAction && <span className="opacity-50 ml-2">• Ação</span>}
        </p>
        <div className={`p-6 rounded-3xl border text-xl inline-block max-w-xl literary-shadow transition-all ${
          isMine 
            ? 'bg-accent/10 border-accent/30 text-foreground' 
            : 'bg-card/40 border-white/10 text-foreground'
        } ${isAction ? 'italic font-heading bg-primary/5' : 'font-ui'}`}>
          {isAction ? `*${msg.text}*` : `"${msg.text}"`}
        </div>
      </div>
      {isMine && (
        <Avatar className="h-12 w-12 rounded-2xl shrink-0 border border-accent/40 bg-accent/20 shadow-gold">
          <AvatarFallback className="text-accent font-black text-sm">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ParticipantItem({ name, role, status, isAI = false, isNPC = false }: { name: string, role: string, status: string, isAI?: boolean, isNPC?: boolean }) {
  return (
    <div className="flex items-center gap-4 group cursor-default">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all group-hover:scale-110 border ${
        isAI ? 'bg-secondary/20 text-secondary border-secondary/30' : 
        isNPC ? 'bg-accent/20 text-accent border-accent/30' :
        'bg-primary/20 text-primary border-primary/30'
      }`}>
        {isAI ? <Sparkles className="h-5 w-5" /> : name[0]}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-bold group-hover:text-primary transition-colors ${isAI ? 'text-secondary' : isNPC ? 'text-accent' : ''}`}>{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-ui">{role}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className={`text-[9px] font-medium italic font-heading ${status === 'Pensando...' ? 'animate-pulse text-accent' : 'text-muted-foreground'}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

function ActionShortcut({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all whitespace-nowrap group ${
        active 
          ? 'bg-primary text-white border-primary shadow-arcane' 
          : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:text-foreground'
      }`}
    >
      <span className={`transition-transform group-hover:scale-110 [&_svg]:h-4 [&_svg]:w-4`}>{icon}</span>
      <span className="text-[10px] uppercase font-bold tracking-widest font-ui">{label}</span>
    </button>
  );
}
