
"use client"

import * as React from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"

export default function MesaViva() {
  const [messages, setMessages] = React.useState([
    { id: '1', type: 'narrator', text: 'A chuva escorre pelas telhas tortas da taverna e pinga sobre os caixotes empilhados. O beco parece vazio à primeira vista, mas há marcas recentes na lama perto da porta dos fundos.', sender: 'Narrador' },
    { id: '2', type: 'player', text: 'Eu tento me esconder nas sombras e observar se Halvek está por perto.', sender: 'Gob' },
    { id: '3', type: 'roll', text: 'Resultado: 18 (1d20 + 7)', sender: 'Gob - Furtividade' },
    { id: '4', type: 'narrator', text: 'Você se funde às sombras com facilidade. Do final do corredor, você ouve um sussurro nervoso e vê Halvek mexendo nas chaves.', sender: 'Narrador' },
  ]);
  const [inputValue, setInputValue] = React.useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), type: 'player', text: inputValue, sender: 'Gob' }]);
    setInputValue('');
  };

  return (
    <div className="flex h-screen mesa-viva-bg bg-fixed">
      {/* Left Context: Participants & Location */}
      <div className="w-72 border-r border-white/5 bg-background/60 backdrop-blur-xl hidden lg:flex flex-col p-6 space-y-10">
        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <Users className="mr-2 h-3 w-3" /> Na Cena Atual
          </h3>
          <div className="space-y-4">
            <ParticipantItem name="Gob" role="Ladino" status="Furtivo" />
            <ParticipantItem name="Halvek" role="NPC" status="Nervoso" isNPC />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <MapPin className="mr-2 h-3 w-3" /> Localização
          </h3>
          <div className="p-4 rounded-xl bg-card/50 border border-white/5 space-y-3">
            <div>
              <p className="text-sm font-bold text-accent">Beco dos Fundos</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                Atrás da Taverna do Cervo Torto. Sujo, escuro e com cheiro de peixe podre.
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-[10px] h-7 uppercase font-bold tracking-tighter border-white/10 hover:bg-white/5">
              <Search className="mr-1 h-3 w-3" /> Investigar Área
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center font-ui">
            <Ghost className="mr-2 h-3 w-3" /> Objetos Visíveis
          </h3>
          <div className="space-y-2">
            <div className="text-[10px] p-2 bg-white/5 border border-white/5 rounded italic text-muted-foreground">Caixotes de madeira (empilhados)</div>
            <div className="text-[10px] p-2 bg-white/5 border border-white/5 rounded italic text-muted-foreground">Porta de ferro (entreaberta)</div>
          </div>
        </section>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center px-12">
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1 font-ui uppercase tracking-widest text-[10px]">Sessão #12 Ativa</Badge>
            <div className="flex flex-col">
              <h2 className="text-lg font-display font-bold text-accent leading-none">Sombras nas Docas</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter mt-1">Narrador Ativo: IA Mestre</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <MessageSquareDashed className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat Off-Game</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
          </div>
        </ScrollArea>

        {/* Action Bar */}
        <div className="p-6 px-12 border-t border-white/5 bg-background/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <ActionShortcut icon={<Volume2 />} label="Falar" />
              <ActionShortcut icon={<Ghost />} label="Agir" />
              <ActionShortcut icon={<Search />} label="Observar" />
              <ActionShortcut icon={<UserPlus />} label="Interagir" />
              <ActionShortcut icon={<Share2 />} label="Relatar" />
              <ActionShortcut icon={<Lock />} label="Ação Secreta" />
            </div>
            
            <div className="relative">
              <Input 
                placeholder="O que Gob faz agora?" 
                className="pr-32 py-8 rounded-2xl bg-muted/50 border-white/10 font-ui focus:ring-primary text-lg"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-primary hover:text-accent animate-glow">
                  <Sparkles className="h-6 w-6" />
                </Button>
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

function ChatMessage({ msg }: { msg: any }) {
  if (msg.type === 'narrator') {
    return (
      <div className="flex gap-6 animate-in fade-in slide-in-from-left-2 duration-700">
        <Avatar className="h-10 w-10 rounded-xl bg-primary/20 p-2 shrink-0 border border-primary/30">
          <Sparkles className="h-full w-full text-primary" />
        </Avatar>
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-primary tracking-[0.2em] font-ui">{msg.sender}</p>
          <div className="text-xl leading-relaxed text-foreground/90 font-heading italic">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'roll') {
    return (
      <div className="flex justify-center my-6">
        <div className="px-6 py-3 rounded-full bg-accent/10 border border-accent/20 flex items-center gap-4 literary-shadow">
          <div className="p-1.5 rounded-lg bg-accent/20">
            <Dices className="h-4 w-4 text-accent" />
          </div>
          <span className="text-xs font-code text-accent font-bold tracking-widest uppercase">{msg.sender}:</span>
          <span className="text-sm font-code text-foreground font-black">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 justify-end animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-2 text-right">
        <p className="text-[10px] uppercase font-bold text-accent tracking-[0.2em] font-ui">{msg.sender}</p>
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 text-lg inline-block max-w-xl font-ui literary-shadow text-foreground">
          {msg.text}
        </div>
      </div>
      <Avatar className="h-10 w-10 rounded-xl shrink-0 border border-accent/30 bg-accent/20">
        <AvatarFallback className="text-accent font-bold text-sm">G</AvatarFallback>
      </Avatar>
    </div>
  );
}

function ParticipantItem({ name, role, status, isNPC = false }: { name: string, role: string, status: string, isNPC?: boolean }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all group-hover:scale-110 ${isNPC ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
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

function ActionShortcut({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent/30 transition-all text-muted-foreground hover:text-accent whitespace-nowrap">
      <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      <span className="text-[10px] uppercase font-bold tracking-widest font-ui">{label}</span>
    </button>
  );
}
