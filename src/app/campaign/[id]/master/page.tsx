
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Settings,
  Database,
  User as UserIcon,
  Play
} from "lucide-react"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function MasterPanel() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [newSessionTitle, setNewSessionTitle] = React.useState("")
  const [isStartingSession, setIsStartingSession] = React.useState(false)

  // Busca personagens pendentes na campanha
  const pendingCharsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(
      collection(db, "campaigns", campaignId, "characters"),
      where("status", "==", "pending")
    )
  }, [db, campaignId])

  const { data: pendingCharacters, loading: loadingChars } = useCollection(pendingCharsQuery)

  // Busca sessões da campanha
  const sessionsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(
      collection(db, "campaigns", campaignId, "sessions"),
      orderBy("createdAt", "desc")
    )
  }, [db, campaignId])

  const { data: sessions, loading: loadingSessions } = useCollection(sessionsQuery)

  async function handleApproveCharacter(charId: string) {
    if (!db || !campaignId) return
    const charRef = doc(db, "campaigns", campaignId, "characters", charId)
    updateDoc(charRef, { status: "active" })
      .then(() => toast({ title: "Aprovado!", description: "O personagem agora faz parte da crônica." }))
  }

  async function handleRejectCharacter(charId: string) {
    if (!db || !campaignId) return
    const charRef = doc(db, "campaigns", campaignId, "characters", charId)
    updateDoc(charRef, { status: "rejected" })
      .then(() => toast({ title: "Rejeitado", description: "O herói foi arquivado." }))
  }

  async function handleStartSession() {
    if (!db || !campaignId || !newSessionTitle.trim()) return
    setIsStartingSession(true)
    
    addDoc(collection(db, "campaigns", campaignId, "sessions"), {
      campaignId,
      title: newSessionTitle,
      status: "active",
      createdAt: serverTimestamp()
    }).then(() => {
      setNewSessionTitle("")
      setIsStartingSession(false)
      toast({ title: "Sessão Iniciada!", description: `"${newSessionTitle}" já está no ar na Mesa Viva.` })
    })
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
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
      </header>

      <Tabs defaultValue="approvals" className="space-y-10">
        <TabsList className="bg-card/50 border border-white/5 p-1.5 rounded-2xl h-14">
          <TabsTrigger value="approvals" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Pendências</TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Sessões</TabsTrigger>
          <TabsTrigger value="ai-config" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Memória da IA</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 font-ui flex items-center">
                <Database className="mr-2 h-4 w-4" /> Solicitações de Jogadores
              </h3>
              <div className="space-y-4">
                {loadingChars ? (
                  <div className="p-8 text-center italic opacity-50">Consultando pergaminhos...</div>
                ) : pendingCharacters && pendingCharacters.length > 0 ? (
                  pendingCharacters.map((char: any) => (
                    <ApprovalCard 
                      key={char.id}
                      icon={<UserIcon className="h-4 w-4" />}
                      type="Personagem"
                      title={char.name}
                      desc={`Um(a) ${char.race} ${char.class} nível ${char.level} aguarda sua bênção.`}
                      character={char.ownerId.substring(0, 6)}
                      time="Pendente"
                      onApprove={() => handleApproveCharacter(char.id)}
                      onReject={() => handleRejectCharacter(char.id)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    Nenhum herói aguardando no portão.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 font-ui flex items-center">
                <Sparkles className="mr-2 h-4 w-4" /> Sugestões da IA
              </h3>
              <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                A IA Mestre ainda está observando a narrativa.
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-primary/5 border-primary/20 border-dashed col-span-1 p-8 space-y-6">
              <div className="p-4 rounded-full bg-primary/20 text-primary w-fit mx-auto mb-2">
                <Database className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h4 className="font-display font-bold text-xl">Nova Sessão</h4>
                <p className="text-sm text-muted-foreground font-heading italic">Inicie um novo capítulo da sua crônica.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-title" className="text-[10px] uppercase font-bold tracking-widest">Título da Sessão</Label>
                  <Input 
                    id="session-title" 
                    placeholder="Ex: O Encontro nas Docas" 
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <Button 
                  onClick={handleStartSession} 
                  disabled={isStartingSession || !newSessionTitle.trim()} 
                  className="w-full rounded-full bg-primary hover:bg-primary/90 font-ui text-[11px] font-bold uppercase tracking-widest"
                >
                  <Play className="mr-2 h-4 w-4" /> Iniciar Sessão
                </Button>
              </div>
            </Card>

            <Card className="col-span-1 xl:col-span-2 bg-card/30 border-white/5 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-2xl">Histórico de Sessões</h3>
                <Badge variant="outline">{sessions?.length || 0} Registradas</Badge>
              </div>
              <div className="space-y-4">
                {loadingSessions ? (
                  <div className="p-8 text-center italic opacity-50">Abrindo os anais...</div>
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((session: any) => (
                    <div key={session.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-all">
                      <div>
                        <h5 className="font-bold">{session.title}</h5>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Status: {session.status}</p>
                      </div>
                      <Badge className={session.status === 'active' ? 'bg-primary' : 'bg-muted'}>
                        {session.status === 'active' ? 'Ativa' : 'Encerrada'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    Nenhuma sessão realizada nesta campanha.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalCard({ 
  icon, 
  type, 
  title, 
  desc, 
  character, 
  isAI = false, 
  time,
  onApprove,
  onReject
}: { 
  icon: React.ReactNode, 
  type: string, 
  title: string, 
  desc: string, 
  character?: string, 
  isAI?: boolean, 
  time: string,
  onApprove?: () => void,
  onReject?: () => void
}) {
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
      </CardContent>
      <div className="p-6 pt-0 grid grid-cols-2 gap-4">
        <Button size="sm" variant="outline" onClick={onReject} className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl h-10 font-ui text-[11px] font-bold uppercase tracking-widest">
          <X className="mr-2 h-4 w-4" /> Rejeitar
        </Button>
        <Button size="sm" variant="default" onClick={onApprove} className="bg-primary hover:bg-primary/90 rounded-xl h-10 font-ui text-[11px] font-bold uppercase tracking-widest literary-shadow">
          <Check className="mr-2 h-4 w-4" /> Aprovar
        </Button>
      </div>
    </Card>
  );
}
