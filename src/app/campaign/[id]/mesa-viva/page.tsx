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
  MessageSquare,
  Lock,
  Infinity,
  Hourglass,
  Quote
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
  
  const [diceFormula, setDiceFormula] = React.useState('1d20')
  const [rollReason, setRollReason] = React.useState('')
  const [physicalResult, setPhysicalResult] = React.useState('')
  const [isDiceDialogOpen, setIsDiceDialogOpen] = React.useState(false)
  const [activeDiceTab, setActiveDiceTab] = React.useState<string>("virtual")

  const userRef = React.useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc<any>(userRef)

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

  React.useEffect(() => {
    if (isDiceDialogOpen) {
      if (session?.diceMode === 'virtual') setActiveDiceTab('virtual')
      else if (session?.diceMode === 'physical') setActiveDiceTab('physical')
      else {
        if (profile?.dicePreference && profile.dicePreference !== 'ask') setActiveDiceTab(profile.dicePreference)
        else setActiveDiceTab('virtual')
      }
    }
  }, [isDiceDialogOpen, session, profile])

  const npcsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "npcs"), where("status", "==", "alive"))
  }, [db, campaignId])
  const { data: npcs } = useCollection(npcsQuery)

  const charactersQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "characters"), where("status", "==", "active"))
  }, [db, campaignId])
  const { data: characters } = useCollection(charactersQuery)
  const myCharacter = characters?.find(c => c.ownerId === user?.uid)

  const messagesQuery = React.useMemo(() => {
    if (!db || !campaignId || !session) return null
    return query(
      collection(db, "campaigns", campaignId, "sessions", session.id, "messages"),
      orderBy("createdAt", "asc")
    )
  }, [db, campaignId, session])
  const { data: messages, loading: loadingMessages } = useCollection(messagesQuery)

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
      if (isSoloMode && !isMaster && (finalType === 'action' || finalType === 'speech')) {
        handleAiMasterResponse(finalContent, finalType)
      }
    } catch (e) { console.error(e) }
  }

  const handleAiMasterResponse = async (playerInput: string, type: 'action' | 'speech') => {
    if (!session || !campaign || !myCharacter) return
    setIsAiThinking(true)
    try {
      const input = {
        mode: 'narrator' as const,
        campaign: { id: campaign.id, name: campaign.name, tone: campaign.tone || "fantasia sombria", rule_system: campaign.system || "dnd_srd" },
        session: { id: session.id, title: session.title, status: "active" },
        scene: { id: "current-scene", title: "Cena em Andamento", visibility: "public", location: "Desconhecida" },
        active_character: { id: myCharacter.id, name: myCharacter.name, race: myCharacter.race, class: myCharacter.class, known_information: ["Está explorando uma área nova."] },
        player_action: playerInput,
        visible_objects: ["Uma névoa persistente"],
        present_npcs: npcs?.map(n => ({ name: n.name })) || []
      }
      const aiResponse = await aiNarratorAndNpcDialogue(input as any)
      await addDoc(collection(db, "campaigns", campaignId, "sessions", session.id, "messages"), {
        sessionId: session.id,
        senderId: 'ai-narrator',
        senderName: 'Oráculo Arcano',
        text: aiResponse,
        type: 'narration',
        createdAt: serverTimestamp()
      })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro do Oráculo", description: "A IA encontrou uma bruma mental." })
    } finally { setIsAiThinking(false) }
  }

  const handleRollDice = (isPhysical: boolean = false) => {
    if (!session || !user) return
    let result = 0
    let formula = diceFormula
    if (isPhysical) {
      result = parseInt(physicalResult)
      if (isNaN(result)) {
        toast({ variant: "destructive", title: "Resultado Inválido", description: "Informe um número." })
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
          dieSize = parseInt(subParts[0]); modifier = parseInt(subParts[1])
        } else if (remaining.includes('-')) {
          const subParts = remaining.split('-'); dieSize = parseInt(subParts[0]); modifier = -parseInt(subParts[1])
        } else dieSize = parseInt(remaining)
        for (let i = 0; i < numDice; i++) result += Math.floor(Math.random() * dieSize) + 1
        result += modifier
      } catch (e) {
        toast({ variant: "destructive", title: "Fórmula Inválida", description: "Use XdY+Z" })
        return
      }
    }
    const rollMsg = `Rolou ${formula}${rollReason ? ` para ${rollReason}` : ''}: **${result}**`
    handleSend(rollMsg, 'dice', { formula, result, isPhysical, reason: rollReason })
    setIsDiceDialogOpen(false); setRollReason(''); setPhysicalResult('')
  }

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-heading italic text-3xl opacity-40">Sincronizando com o Arcano...</div>
  if (!session) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-10 text-center p-10 bg-[#050711]">
      <div className="p-8 rounded-full bg-primary/5 border border-primary/10 text-primary opacity-30"><MessageSquareDashed className="h-24 w-24" /></div>
      <div className="space-y-4">
        <h2 className="text-5xl font-display font-black text-primary">Portal Fechado</h2>
        <p className="text-2xl font-heading italic text-muted-foreground max-w-md">"O tempo parou nesta crônica. Nenhuma sessão está em curso."</p>
      </div>
      {isMaster && (
        <Button asChild className="btn-ritual rounded-full px-12 h-16 text-xl shadow-arcane">
          <a href={`/campaign/${campaignId}/master`}>Iniciar Sessão Oficial</a>
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex h-screen mesa-viva-bg bg-fixed overflow-hidden">
      {/* Sidebar de Presença */}
      <div className="w-85 border-r border-primary/20 bg-sidebar/80 backdrop-blur-3xl hidden xl:flex flex-col p-8 space-y-12 shadow-2xl">
        <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary opacity-60 flex items-center">
              <Users className="mr-3 h-4 w-4" /> Em Torno da Mesa
            </h3>
            <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
        </div>

        <section className="space-y-6">
          <div className="space-y-6">
             <ParticipantItem name={user?.displayName || "Você"} role={isMaster ? "Mestre Arcano" : (myCharacter?.class || "Aventureiro")} status="Ativo" />
             {isSoloMode && <ParticipantItem name="O Oráculo" role="Narrador IA" status={isAiThinking ? "Tecendo Destino..." : "Observando"} isAI />}
             {npcs?.map(npc => (
               <ParticipantItem key={npc.id} name={npc.name} role={npc.role} status="Presente" isNPC />
             ))}
          </div>
        </section>

        <section className="space-y-6 pt-10 border-t border-white/5">
          <h3 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary opacity-60 flex items-center">
            <Lock className="mr-3 h-4 w-4" /> Leis da Sessão
          </h3>
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 oracle-glow">
             <div className="flex items-center gap-3">
                <Dices className="h-5 w-5 text-primary" />
                <p className="text-xs font-display font-bold uppercase tracking-widest text-primary">Política de Dados</p>
             </div>
             <p className="text-[11px] font-heading italic text-muted-foreground leading-relaxed opacity-70">
               {session.diceMode === 'virtual' ? "Apenas dados virtuais permitidos." : 
                session.diceMode === 'physical' ? "Apenas resultados físicos permitidos." : 
                "Política flexível: física ou virtual."}
             </p>
          </div>
        </section>

        {!isMaster && (
          <section className="mt-auto pt-10 border-t border-white/5">
            <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-5">
              <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.2em] text-center">Jornada Solo</p>
              <p className="text-[11px] text-muted-foreground italic text-center font-heading">"O Oráculo narrará seus atos."</p>
              <Button 
                onClick={() => setIsSoloMode(!isSoloMode)} 
                className={`w-full rounded-2xl h-12 transition-all font-display text-[10px] tracking-widest ${isSoloMode ? 'btn-arcane' : 'border-secondary text-secondary hover:bg-secondary/10 border-2'}`}
              >
                {isSoloMode ? "Dissipar Oráculo" : "Invocar Oráculo"}
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Área Principal de Jogo */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-8 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex justify-between items-center px-12 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-3xl font-display font-black text-primary flex items-center gap-3 tracking-tighter">
                {isMaster && <ShieldCheck className="h-6 w-6 text-primary" />}
                {session.title}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                 <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-display tracking-widest px-3 py-0.5">Sessão Ativa</Badge>
                 <span className="text-[9px] text-muted-foreground font-display uppercase tracking-[0.2em] opacity-40">O tempo corre...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
             <Dialog open={isDiceDialogOpen} onOpenChange={setIsDiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-ritual rounded-2xl h-14 w-14 literary-shadow group">
                  <Dices className="h-7 w-7 group-hover:rotate-45 transition-transform duration-500" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30 literary-shadow max-w-md p-10 rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl text-primary text-center">Lançar Sorte</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeDiceTab} onValueChange={setActiveDiceTab} className="w-full mt-8">
                  <TabsList className="grid w-full grid-cols-2 bg-black/40 h-14 p-1.5 rounded-2xl">
                    <TabsTrigger value="virtual" disabled={session.diceMode === 'physical'} className="text-[10px] font-display uppercase tracking-widest flex gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl h-full transition-all">
                      <Zap className="h-4 w-4" /> Virtual
                    </TabsTrigger>
                    <TabsTrigger value="physical" disabled={session.diceMode === 'virtual'} className="text-[10px] font-display uppercase tracking-widest flex gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl h-full transition-all">
                      <Hash className="h-4 w-4" /> Físico
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="virtual" className="space-y-8 pt-8 animate-in slide-in-from-left-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-display uppercase tracking-widest text-primary opacity-60">Fórmula Arcana</Label>
                        <div className="flex gap-3">
                          <Input value={diceFormula} onChange={e => setDiceFormula(e.target.value)} placeholder="1d20+5" className="font-code text-2xl h-16 bg-black/20 border-primary/20 text-center" />
                          <Button onClick={() => handleRollDice(false)} className="btn-ritual h-16 px-10">Rolar</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="physical" className="space-y-8 pt-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-display uppercase tracking-widest text-primary opacity-60">Resultado Real</Label>
                        <div className="flex gap-3">
                          <Input value={physicalResult} onChange={e => setPhysicalResult(e.target.value)} placeholder="Total" type="number" className="font-code text-3xl h-16 bg-black/20 border-primary/20 text-center" />
                          <Button onClick={() => handleRollDice(true)} className="btn-ritual h-16 px-10">Registrar</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
             </Dialog>
          </div>
        </header>

        <ScrollArea className="flex-1 p-10 px-16 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, rgba(var(--primary), 0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }}>
          <div className="max-w-5xl mx-auto space-y-16 pb-32">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30 animate-pulse">
                 <Hourglass className="h-12 w-12 text-primary animate-spin-slow" />
                 <p className="font-heading italic text-2xl tracking-widest">Consultando os anais...</p>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <OracleMessage key={msg.id} msg={msg} currentUserId={user?.uid} />
              ))
            ) : (
              <div className="text-center py-40 space-y-8 opacity-40">
                <Sparkles className="h-16 w-16 text-primary/50 mx-auto" />
                <p className="text-3xl font-heading italic max-w-md mx-auto leading-relaxed">"O tempo parou. As páginas estão em branco. O que você faz?"</p>
              </div>
            )}
            {isAiThinking && (
              <div className="flex gap-10 animate-pulse max-w-4xl">
                <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 border border-secondary/30 flex items-center justify-center oracle-glow">
                  <Sparkles className="h-7 w-7 text-secondary animate-spin-slow" />
                </div>
                <div className="space-y-4 py-2">
                  <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.3em]">Tecendo o destino...</p>
                  <div className="h-5 w-[30rem] bg-secondary/10 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Rodapé de Ação */}
        <div className="p-10 px-16 border-t border-primary/10 bg-background/95 backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <RitualShortcut icon={<Volume2 />} label="Falar" active={messageType === 'speech'} onClick={() => setMessageType('speech')} />
              <RitualShortcut icon={<Ghost />} label="Agir" active={messageType === 'action'} onClick={() => setMessageType('action')} />
              {isMaster && (
                <RitualShortcut icon={<Sparkles />} label="Narrar" active={messageType === 'narration'} onClick={() => setMessageType('narration')} />
              )}
            </div>
            
            <div className="relative">
              <Input 
                placeholder={messageType === 'narration' ? "Narre o destino..." : `O que você faz?`}
                className="pr-36 py-14 rounded-[2rem] bg-black/40 border-primary/20 font-heading italic focus:ring-primary text-2xl literary-shadow placeholder:text-muted-foreground/30 px-10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <Button onClick={() => handleSend()} className="h-20 w-20 rounded-[1.5rem] btn-ritual shadow-arcane hover:scale-110 active:scale-95 transition-all">
                  <Send className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OracleMessage({ msg, currentUserId }: { msg: any, currentUserId?: string }) {
  const isNarrator = msg.type === 'narration' || msg.senderId === 'ai-narrator';
  const isMine = msg.senderId === currentUserId;
  const isAction = msg.type === 'action';
  const isDice = msg.type === 'dice';

  if (isNarrator) {
    return (
      <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-1000 max-w-6xl">
        <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/20 p-4 shrink-0 border border-secondary/40 shadow-arcane flex items-center justify-center group relative overflow-hidden">
          <Sparkles className="h-full w-full text-primary relative z-10" />
        </div>
        <div className="space-y-4 pt-1">
          <p className="text-[10px] font-display uppercase font-bold text-primary tracking-[0.4em] flex items-center gap-3">
            O Oráculo Arcano • {msg.senderName}
            <Badge className="bg-primary/10 text-primary border border-primary/30 text-[8px] px-2 h-4 uppercase font-black">Cânone</Badge>
          </p>
          <div className="text-3xl leading-relaxed text-foreground/90 font-heading italic first-letter:text-6xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-primary">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (isDice) {
    return (
      <div className={`flex gap-8 animate-in duration-700 zoom-in-95 ${isMine ? 'justify-end' : ''}`}>
        <div className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-10 literary-shadow transition-all hover:scale-105 ${
          msg.rollData?.isPhysical ? 'bg-primary/5 border-primary/40 shadow-gold' : 'bg-secondary/5 border-secondary/40 shadow-arcane'
        }`}>
          <div className={`p-5 rounded-[1.5rem] ${msg.rollData?.isPhysical ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
            {msg.rollData?.isPhysical ? <Hash className="h-10 w-10" /> : <Dices className="h-10 w-10" />}
          </div>
          <div>
            <p className="text-[10px] font-display uppercase font-bold tracking-[0.2em] opacity-40 mb-2">{msg.senderName} conjurou {msg.rollData?.formula}</p>
            <p className="text-6xl font-display font-black tracking-tighter text-foreground">{msg.rollData?.result}</p>
            {msg.rollData?.reason && <p className="text-sm font-heading italic text-muted-foreground mt-3 border-l-2 border-primary/20 pl-4">"{msg.rollData?.reason}"</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-8 animate-in duration-500 ${isMine ? 'justify-end slide-in-from-right-8' : 'slide-in-from-left-8'}`}>
      {!isMine && (
        <Avatar className="h-16 w-16 rounded-[1.5rem] shrink-0 border-2 border-white/5 bg-black/40 shadow-lg">
          <AvatarFallback className="text-xl font-display font-bold">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`space-y-4 ${isMine ? 'text-right' : 'text-left'}`}>
        <p className={`text-[10px] font-display uppercase font-bold tracking-[0.3em] ${isMine ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>
          {msg.senderName} {isAction && <span className="text-secondary ml-3">• Ação</span>}
        </p>
        <div className={`p-8 rounded-[2rem] border-2 text-2xl inline-block max-w-2xl literary-shadow transition-all relative overflow-hidden ${
          isMine 
            ? 'bg-primary/5 border-primary/30 text-foreground' 
            : 'bg-black/40 border-white/5 text-foreground'
        } ${isAction ? 'font-heading italic bg-secondary/5 border-secondary/20' : 'font-body font-light leading-relaxed'}`}>
          {isAction ? <span className="flex items-center gap-3"><Zap className="h-5 w-5 text-secondary opacity-50 shrink-0" /> *{msg.text}*</span> : (
            <span className="flex items-start gap-4">
               {!isAction && <Quote className="h-5 w-5 text-primary/30 rotate-180 shrink-0 mt-1" />}
               <span>"{msg.text}"</span>
            </span>
          )}
        </div>
      </div>
      {isMine && (
        <Avatar className="h-16 w-16 rounded-[1.5rem] shrink-0 border-2 border-primary/40 bg-primary/10 shadow-gold">
          <AvatarFallback className="text-primary font-display font-black text-xl">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ParticipantItem({ name, role, status, isAI = false, isNPC = false }: { name: string, role: string, status: string, isAI?: boolean, isNPC?: boolean }) {
  return (
    <div className="flex items-center gap-5 group cursor-default p-3 rounded-2xl hover:bg-white/5 transition-all">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg transition-all group-hover:scale-110 border-2 ${
        isAI ? 'bg-secondary/20 text-secondary border-secondary/40 shadow-arcane' : 
        isNPC ? 'bg-accent/20 text-accent border-accent/40 shadow-gold' :
        'bg-primary/20 text-primary border-primary/40 shadow-arcane'
      }`}>
        {isAI ? <Sparkles className="h-6 w-6" /> : name[0]}
      </div>
      <div className="flex flex-col">
        <span className={`text-lg font-display font-bold group-hover:text-primary transition-colors ${isAI ? 'text-secondary' : isNPC ? 'text-accent' : 'text-primary'}`}>{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-display font-bold opacity-40">{role}</span>
          <span className="h-1 w-1 rounded-full bg-primary/30" />
          <span className={`text-[10px] font-heading italic font-bold ${status.includes('...') ? 'animate-pulse text-secondary' : 'text-muted-foreground opacity-30'}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

function RitualShortcut({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all whitespace-nowrap group h-12 ${
        active 
          ? 'btn-ritual' 
          : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-primary/30 hover:text-foreground'
      }`}
    >
      <span className={`transition-transform group-hover:scale-125 duration-500 [&_svg]:h-4 [&_svg]:w-4`}>{icon}</span>
      <span className="text-[10px] font-display uppercase font-black tracking-[0.2em]">{label}</span>
    </button>
  );
}