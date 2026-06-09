
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
  Search, 
  Volume2, 
  UserPlus, 
  Share2,
  Lock,
  Ghost
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function MesaViva() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [inputValue, setInputValue] = React.useState('')
  const [messageType, setMessageType] = React.useState<'speech' | 'action' | 'narration'>('speech')

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
  const isMaster = campaignData?.[0]?.masterId === user?.uid

  const handleSend = () => {
    if (!inputValue.trim() || !session || !user) return

    const type = isMaster && messageType === 'narration' ? 'narration' : messageType

    addDoc(collection(db, "campaigns", campaignId, "sessions", session.id, "messages"), {
      sessionId: session.id,
      senderId: user.uid,
      senderName: user.displayName || "Aventureiro",
      text: inputValue,
      type: type,
      createdAt: serverTimestamp()
    }).then(() => {
      setInputValue('')
    })
  }

  if (loadingSession) return <div className="h-screen flex items-center justify-center italic">Localizando a mesa...</div>
  if (!session) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 text-center p-10">
      <div className="p-6 rounded-full bg-muted/20 text-muted-foreground">
        <MessageSquareDashed className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-display font-bold">Nenhuma Sessão Ativa</h2>
      <p className="text-muted-foreground font-heading italic max-w-md">O mestre ainda não abriu os portais da Mesa Viva para este capítulo da crônica.</p>
      {isMaster && (
        <Button asChild className="rounded-full bg-primary px-8">
          <a href={`/campaign/${campaignId}/master`}>Iniciar Nova Sessão</a>
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex h-screen mesa-viva-bg bg-fixed">
      {/* Left Context: Participants & Location */}
      <div className="w-72 border-r border-white/5 bg-background/60 backdrop-blur-xl hidden lg:flex flex-col p-6 space-y-10">
        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <Users className="mr-2 h-3 w-3" /> Na Cena Atual
          </h3>
          <div className="space-y-4">
             <ParticipantItem name={user?.displayName || "Você"} role="Jogador" status="Ativo" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <MapPin className="mr-2 h-3 w-3" /> Localização
          </h3>
          <div className="p-4 rounded-xl bg-card/50 border border-white/5 space-y-3">
            <div>
              <p className="text-sm font-bold text-accent">Desconhecida</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                A neblina oculta os detalhes. O Mapa Vivo ainda está em branco.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center px-12">
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1 font-ui uppercase tracking-widest text-[10px]">Sessão: {session.title}</Badge>
            <div className="flex flex-col">
              <h2 className="text-lg font-display font-bold text-accent leading-none">Mesa Viva Ativa</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter mt-1">
                {isMaster ? "Você é o Mestre" : "Participando como Aventureiro"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Dices className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rolar Dados</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        <ScrollArea className="flex-1 p-8 px-12">
          <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {loadingMessages ? (
              <div className="text-center italic opacity-50">Lendo os pergaminhos...</div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <ChatMessage key={msg.id} msg={msg} currentUserId={user?.uid} />
              ))
            ) : (
              <div className="text-center italic text-muted-foreground p-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                O silêncio impera na cena. O que vocês fazem?
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Bar */}
        <div className="p-6 px-12 border-t border-white/5 bg-background/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <ActionShortcut 
                icon={<Volume2 />} 
                label="Falar" 
                active={messageType === 'speech'} 
                onClick={() => setMessageType('speech')} 
              />
              <ActionShortcut 
                icon={<Ghost />} 
                label="Agir" 
                active={messageType === 'action'} 
                onClick={() => setMessageType('action')} 
              />
              {isMaster && (
                <ActionShortcut 
                  icon={<Sparkles />} 
                  label="Narrar" 
                  active={messageType === 'narration'} 
                  onClick={() => setMessageType('narration')} 
                />
              )}
            </div>
            
            <div className="relative">
              <Input 
                placeholder={messageType === 'narration' ? "Narre a cena..." : `O que ${user?.displayName || "você"} faz?`}
                className="pr-32 py-8 rounded-2xl bg-muted/50 border-white/10 font-ui focus:ring-primary text-lg"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Button size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 literary-shadow" onClick={handleSend}>
                  <Send className="h-5 w-5" />
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
  const isNarrator = msg.type === 'narration';
  const isMine = msg.senderId === currentUserId;
  const isAction = msg.type === 'action';

  if (isNarrator) {
    return (
      <div className="flex gap-6 animate-in fade-in slide-in-from-left-2 duration-700">
        <Avatar className="h-10 w-10 rounded-xl bg-primary/20 p-2 shrink-0 border border-primary/30">
          <Sparkles className="h-full w-full text-primary" />
        </Avatar>
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-primary tracking-[0.2em] font-ui">Narrador • {msg.senderName}</p>
          <div className="text-xl leading-relaxed text-foreground/90 font-heading italic">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 animate-in duration-500 ${isMine ? 'justify-end slide-in-from-right-4' : 'slide-in-from-left-4'}`}>
      {!isMine && (
        <Avatar className="h-10 w-10 rounded-xl shrink-0 border border-white/10 bg-muted/20">
          <AvatarFallback className="text-[10px] font-bold">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`space-y-2 ${isMine ? 'text-right' : 'text-left'}`}>
        <p className={`text-[10px] uppercase font-bold tracking-[0.2em] font-ui ${isMine ? 'text-accent' : 'text-muted-foreground'}`}>
          {msg.senderName} {isAction && "• Ação"}
        </p>
        <div className={`p-5 rounded-2xl border text-lg inline-block max-w-xl literary-shadow transition-all ${
          isMine 
            ? 'bg-accent/10 border-accent/20 text-foreground' 
            : 'bg-card/40 border-white/5 text-foreground'
        } ${isAction ? 'italic font-heading' : 'font-ui'}`}>
          {isAction ? `*${msg.text}*` : `"${msg.text}"`}
        </div>
      </div>
      {isMine && (
        <Avatar className="h-10 w-10 rounded-xl shrink-0 border border-accent/30 bg-accent/20">
          <AvatarFallback className="text-accent font-bold text-sm">{msg.senderName[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ParticipantItem({ name, role, status }: { name: string, role: string, status: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all group-hover:scale-110 bg-primary/20 text-primary border border-primary/30">
        {name[0]}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold group-hover:text-primary transition-colors">{name}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-ui">{role}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="text-[9px] text-accent font-medium italic font-heading">{status}</span>
        </div>
      </div>
    </div>
  );
}

function ActionShortcut({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
        active 
          ? 'bg-accent/20 border-accent text-accent' 
          : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      <span className="text-[10px] uppercase font-bold tracking-widest font-ui">{label}</span>
    </button>
  );
}
