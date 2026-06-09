
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  MessageSquare, 
  MapPin, 
  Package, 
  Trophy,
  History,
  Eye,
  Settings,
  Database
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MasterPanel() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      <header className="flex justify-between items-center border-b pb-10 border-white/5">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-5xl font-display font-black tracking-tighter">Portal do Mestre</h1>
            <p className="text-muted-foreground mt-2 font-heading text-lg italic">Validação canônica, gestão de sessões e oráculo arcano.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full px-6">
            <Settings className="mr-2 h-4 w-4" /> Configurar Campanha
          </Button>
        </div>
      </header>

      <Tabs defaultValue="approvals" className="space-y-10">
        <TabsList className="bg-card/50 border border-white/5 p-1.5 rounded-2xl h-14">
          <TabsTrigger value="approvals" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Pendências</TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Sessões</TabsTrigger>
          <TabsTrigger value="ai-config" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Memória da IA</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 font-ui flex items-center">
                <Database className="mr-2 h-4 w-4" /> Solicitações de Jogadores
              </h3>
              <div className="space-y-4">
                <ApprovalCard 
                  icon={<Package className="h-4 w-4" />}
                  type="Item"
                  title="Adaga de Prata"
                  desc="Gob encontrou esta adaga no corpo do mercador durante a jornada solo 'Investigação no Beco'."
                  character="Gob"
                  time="Há 1 hora"
                />
                <ApprovalCard 
                  icon={<Trophy className="h-4 w-4" />}
                  type="Recompensa"
                  title="+200 XP (Marcos)"
                  desc="Pela descoberta da passagem secreta no porão da taverna."
                  character="Gob"
                  time="Há 2 horas"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 font-ui flex items-center">
                <Sparkles className="mr-2 h-4 w-4" /> Sugestões da IA
              </h3>
              <div className="space-y-4">
                <ApprovalCard 
                  icon={<MapPin className="h-4 w-4" />}
                  type="Local"
                  title="Novo Ponto: Covil do Culto"
                  desc="A IA sugere criar este ponto no mapa após o interrogatório bem-sucedido de Halvek."
                  isAI
                  time="Há 10 min"
                />
                <ApprovalCard 
                  icon={<MessageSquare className="h-4 w-4" />}
                  type="Crônica"
                  title="Resumo da Sessão #12"
                  desc="Transformar os eventos de hoje em um registro histórico oficial para todos os jogadores."
                  isAI
                  time="Pendente"
                />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-primary/5 border-primary/20 border-dashed col-span-1 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-primary/10 transition-all">
              <div className="p-4 rounded-full bg-primary/20 text-primary mb-6 group-hover:scale-125 transition-transform">
                <Database className="h-8 w-8" />
              </div>
              <h4 className="font-display font-bold text-xl mb-2">Nova Sessão</h4>
              <p className="text-sm text-muted-foreground font-heading italic">Defina ganchos, cenas e NPCs para o próximo encontro.</p>
              <Button className="mt-8 rounded-full bg-primary hover:bg-primary/90 font-ui text-[11px] font-bold uppercase tracking-widest">Iniciar Planejamento</Button>
            </Card>

            <Card className="col-span-1 xl:col-span-2 bg-card/30 border-white/5">
              <CardHeader>
                <CardTitle className="font-display">Próxima Recapitulação</CardTitle>
                <CardDescription className="font-heading italic">Estado atual do mundo antes da próxima reunião.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 font-heading text-lg leading-relaxed text-foreground/80">
                  "O grupo está no Beco dos Fundos. Halvek foi confrontado, mas a porta de ferro ainda oculta o que está por vir. A chuva continua a cair, lavando os segredos das docas..."
                </div>
                <div className="flex gap-4">
                  <Button size="sm" variant="outline" className="rounded-full font-ui text-[10px] font-bold uppercase tracking-tighter">
                    <History className="mr-2 h-4 w-4" /> Ver Histórico
                  </Button>
                  <Button size="sm" variant="default" className="rounded-full bg-primary hover:bg-primary/90 font-ui text-[10px] font-bold uppercase tracking-tighter">
                    <Sparkles className="mr-2 h-4 w-4" /> Regenerar com IA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalCard({ icon, type, title, desc, character, isAI = false, time }: { icon: React.ReactNode, type: string, title: string, desc: string, character?: string, isAI?: boolean, time: string }) {
  return (
    <Card className={`bg-card/40 border-white/5 hover:border-white/10 transition-all literary-shadow ${isAI ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAI ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
              {icon}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 font-ui">{type}</span>
              <p className="text-[10px] text-muted-foreground font-ui">{time}</p>
            </div>
          </div>
          {isAI && <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/30 text-primary uppercase font-bold tracking-widest">Sugerido por IA</Badge>}
        </div>
        <CardTitle className="text-xl mt-4 font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <p className="text-sm text-muted-foreground leading-relaxed font-ui">{desc}</p>
        {character && (
          <div className="flex items-center gap-2 mt-4">
            <div className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">G</div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-widest font-ui">Requerente: {character}</p>
          </div>
        )}
      </CardContent>
      <div className="p-6 pt-0 grid grid-cols-2 gap-4">
        <Button size="sm" variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl h-10 font-ui text-[11px] font-bold uppercase tracking-widest">
          <X className="mr-2 h-4 w-4" /> Rejeitar
        </Button>
        <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 rounded-xl h-10 font-ui text-[11px] font-bold uppercase tracking-widest literary-shadow">
          <Check className="mr-2 h-4 w-4" /> Aprovar
        </Button>
      </div>
    </Card>
  );
}
