
"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Sparkles, MapPin, Users, Dices, MessageSquareDashed } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
      {/* Left Context: Participants */}
      <div className="w-64 border-r border-white/5 bg-background/60 backdrop-blur-xl hidden lg:flex flex-col p-6 space-y-8">
        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center">
            <Users className="mr-2 h-3 w-3" /> Na Cena
          </h3>
          <div className="space-y-3">
            <ParticipantItem name="Gob" role="Ladino" status="Furtivo" />
            <ParticipantItem name="Halvek" role="NPC" status="Nervoso" isNPC />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50 flex items-center">
            <MapPin className="mr-2 h-3 w-3" /> Local
          </h3>
          <div className="p-3 rounded-lg bg-card/50 border border-white/5">
            <p className="text-sm font-bold">Beco dos Fundos</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-1">
              Atrás da Taverna do Cervo Torto. Sujo e escuro.
            </p>
          </div>
        </section>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-4 border-b border-white/5 bg-background/80 backdrop-blur-md flex justify-between items-center px-12">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-primary text-primary bg-primary/10">Sessão #12 Ativa</Badge>
            <h2 className="text-sm font-medium text-muted-foreground">Sombras nas Docas</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <MessageSquareDashed className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Dices className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-8 px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 px-12 border-t border-white/5 bg-background/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto relative">
            <Input 
              placeholder="O que Gob faz?" 
              className="pr-24 py-6 rounded-2xl bg-muted/50 border-white/5 font-ui focus:ring-primary"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-primary animate-glow">
                <Sparkles className="h-5 w-5" />
              </Button>
              <Button size="icon" className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
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
      <div className="flex gap-4 animate-in fade-in duration-700">
        <Avatar className="h-8 w-8 rounded-lg bg-primary/20 p-1">
          <Sparkles className="h-full w-full text-primary" />
        </Avatar>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-primary tracking-widest">{msg.sender}</p>
          <div className="text-lg leading-relaxed text-foreground/90 font-light">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'roll') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 flex items-center gap-3 literary-shadow">
          <Dices className="h-4 w-4 text-accent" />
          <span className="text-xs font-code text-accent font-bold tracking-widest uppercase">{msg.sender}:</span>
          <span className="text-xs font-code text-foreground">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 justify-end animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-1 text-right">
        <p className="text-[10px] uppercase font-bold text-accent tracking-widest">{msg.sender}</p>
        <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-md inline-block max-w-lg font-ui">
          {msg.text}
        </div>
      </div>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="bg-accent/20 text-accent font-bold text-xs">G</AvatarFallback>
      </Avatar>
    </div>
  );
}

function ParticipantItem({ name, role, status, isNPC = false }: { name: string, role: string, status: string, isNPC?: boolean }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs ${isNPC ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
        {name[0]}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold group-hover:text-primary transition-colors">{name}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{role}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="text-[9px] text-accent font-medium italic">{status}</span>
        </div>
      </div>
    </div>
  );
}
