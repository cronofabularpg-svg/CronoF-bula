
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ShieldCheck, Sparkles, MessageSquare, MapPin, Package, Trophy } from "lucide-react"

export default function MasterPanel() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex justify-between items-center border-b pb-8 border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/20 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Portal do Mestre</h1>
            <p className="text-muted-foreground mt-2">Validação canônica e gestora de crônicas.</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="approvals" className="space-y-8">
        <TabsList className="bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="approvals" className="rounded-lg px-8">Pendências</TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-lg px-8">Sessões</TabsTrigger>
          <TabsTrigger value="ai-config" className="rounded-lg px-8">Memória da IA</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">Solicitações de Jogadores</h3>
              <ApprovalCard 
                icon={<Package className="h-4 w-4" />}
                type="Item"
                title="Adaga de Prata"
                desc="Gob encontrou esta adaga no corpo do mercador."
                character="Gob"
              />
              <ApprovalCard 
                icon={<Trophy className="h-4 w-4" />}
                type="Recompensa"
                title="+200 XP (Marcos)"
                desc="Pela descoberta da passagem secreta no beco."
                character="Gob"
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-50">Sugestões da IA (Narrativa)</h3>
              <ApprovalCard 
                icon={<MapPin className="h-4 w-4" />}
                type="Local"
                title="Novo Ponto: Covil do Culto"
                desc="A IA sugere criar este ponto no mapa após o interrogatório."
                isAI
              />
              <ApprovalCard 
                icon={<MessageSquare className="h-4 w-4" />}
                type="Crônica"
                title="Resumo da Sessão #12"
                desc="Transformar os eventos de hoje em um registro canônico."
                isAI
              />
            </section>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card className="arcane-border bg-card/50">
            <CardHeader>
              <CardTitle>Planejador de Sessão</CardTitle>
              <CardDescription>Crie ganchos e cenas para a próxima reunião.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="rounded-full bg-primary hover:bg-primary/90">
                <Sparkles className="mr-2 h-4 w-4" /> Gerar Próxima Sessão com IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalCard({ icon, type, title, desc, character, isAI = false }: { icon: React.ReactNode, type: string, title: string, desc: string, character?: string, isAI?: boolean }) {
  return (
    <Card className={`bg-card/50 border-white/5 hover:border-white/10 transition-colors ${isAI ? 'border-primary/20' : ''}`}>
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isAI ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
              {icon}
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest opacity-50">{type}</span>
          </div>
          {isAI && <Badge variant="outline" className="text-[8px] bg-primary/10 border-primary/20 text-primary">Sugerido por IA</Badge>}
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        {character && <p className="text-[10px] text-accent mt-3 font-bold uppercase tracking-widest">Atribuído a: {character}</p>}
      </CardContent>
      <div className="p-5 pt-0 grid grid-cols-2 gap-3">
        <Button size="sm" variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-full h-8">
          <X className="mr-1 h-3 w-3" /> Rejeitar
        </Button>
        <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 rounded-full h-8">
          <Check className="mr-1 h-3 w-3" /> Aprovar
        </Button>
      </div>
    </Card>
  );
}
