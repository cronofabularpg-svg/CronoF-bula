
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  Play,
  Dices,
  Hash,
  Infinity,
  ScrollText,
  Loader2
} from "lucide-react"
import { useUser, useFirestore } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { summarizeSession } from "@/ai/flows/session-summarizer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type PendingCharacter = {
  id: string
  name: string
  race: string | null
  class: string | null
  level: number
}

type CampaignSummary = {
  id: string
  name: string
  tone: string | null
  owner_id: string
}

type SessionRow = {
  id: string
  title: string
  status: string
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export default function MasterPanel() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [newSessionTitle, setNewSessionTitle] = React.useState("")
  const [diceMode, setDiceMode] = React.useState("flexible")
  const [isStartingSession, setIsStartingSession] = React.useState(false)

  // Estados para o Resumo
  const [isSummarizing, setIsSummarizing] = React.useState(false)
  const [summaryResult, setSummaryResult] = React.useState<any>(null)
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false)

  const [campaign, setCampaign] = React.useState<CampaignSummary | null>(null)
  const [pendingCharacters, setPendingCharacters] = React.useState<PendingCharacter[]>([])
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .from('campaigns')
      .select('id, name, tone, owner_id')
      .eq('id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCampaign(data as CampaignSummary | null)
      })

    supabase
      .from('characters')
      .select('id, name, race, class, level')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending_approval')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar Pendências", description: error.message })
        }
        setPendingCharacters((data as PendingCharacter[]) || [])
      })

    supabase
      .from('sessions')
      .select('id, title, status, started_at, ended_at, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar Sessões", description: error.message })
        }
        setSessions((data as SessionRow[]) || [])
        setLoadingSessions(false)
      })

    return () => {
      active = false
    }
  }, [campaignId, toast])

  async function handleApproveCharacter(charId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('characters')
      .update({ status: 'active', approved_by_master: true })
      .eq('id', charId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Aprovar", description: error.message })
      return
    }

    setPendingCharacters((prev) => prev.filter((c) => c.id !== charId))
    toast({ title: "Aprovado!", description: "O personagem agora faz parte da crônica." })
  }

  async function handleStartSession() {
    if (!campaignId || !newSessionTitle.trim() || !user) return
    setIsStartingSession(true)
    const supabase = createClient()

    const { error: settingsError } = await supabase
      .from('campaign_settings')
      .update({
        allow_virtual_dice: true,
        allow_physical_dice: diceMode === 'flexible'
      })
      .eq('campaign_id', campaignId)

    if (settingsError) {
      toast({ variant: "destructive", title: "Erro ao Salvar Política de Dados", description: settingsError.message })
      setIsStartingSession(false)
      return
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        campaign_id: campaignId,
        title: newSessionTitle,
        status: 'active',
        started_at: new Date().toISOString(),
        created_by: user.uid
      })
      .select('id, title, status, started_at, ended_at, created_at')
      .single()

    if (sessionError || !session) {
      toast({ variant: "destructive", title: "Erro ao Iniciar Sessão", description: sessionError?.message })
      setIsStartingSession(false)
      return
    }

    const { error: sceneError } = await supabase
      .from('scenes')
      .insert({
        campaign_id: campaignId,
        session_id: session.id,
        title: 'Cena Inicial',
        status: 'active',
        created_by: user.uid
      })

    if (sceneError) {
      toast({ variant: "destructive", title: "Erro ao Criar Cena Inicial", description: sceneError.message })
    }

    setSessions((prev) => [session as SessionRow, ...prev])
    setNewSessionTitle("")
    setIsStartingSession(false)
    toast({ title: "Sessão Iniciada!" })
  }

  async function handleEndSession(session: SessionRow) {
    if (!campaignId || !campaign) return
    setIsSummarizing(true)
    try {
      const supabase = createClient()

      const { data: messagesData, error } = await supabase
        .from('scene_messages')
        .select('content, message_type, characters(name)')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const sessionLog = (messagesData || []).map((m: any) => {
        const sender = m.characters?.name || (m.message_type === 'narration' ? 'Mestre Arcano' : 'Sistema')
        return `${sender}: ${m.content}`
      })

      if (sessionLog.length === 0) {
        toast({ variant: "destructive", title: "Sessão Vazia", description: "Não há registros suficientes para resumir." })
        setIsSummarizing(false)
        return
      }

      const summary = await summarizeSession({
        campaign: { name: campaign.name, tone: campaign.tone || "fantasia sombria" },
        sessionTitle: session.title,
        sessionLog
      })

      setSummaryResult({ ...summary, sessionId: session.id })
      setIsSummaryOpen(true)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na IA", description: e.message })
    } finally {
      setIsSummarizing(false)
    }
  }

  async function handlePublishChronicle() {
    if (!db || !campaignId || !summaryResult) return
    try {
      // 1. Criar Crônica (Crônicas seguem no Firestore nesta fase)
      await addDoc(collection(db, "campaigns", campaignId, "chronicles"), {
        campaignId,
        sessionId: summaryResult.sessionId,
        ...summaryResult,
        createdAt: serverTimestamp()
      })

      // 2. Encerrar Sessão (Supabase)
      const supabase = createClient()
      const endedAt = new Date().toISOString()
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed', ended_at: endedAt })
        .eq('id', summaryResult.sessionId)

      if (error) throw error

      setSessions((prev) => prev.map((s) => s.id === summaryResult.sessionId ? { ...s, status: 'completed', ended_at: endedAt } : s))
      setIsSummaryOpen(false)
      toast({ title: "Crônica Eternizada", description: "A história foi gravada nos anais do tempo." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Publicar", description: e.message })
    }
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
          <TabsTrigger value="ai-config" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 font-ui flex items-center">
                <Database className="mr-2 h-4 w-4" /> Solicitações de Jogadores
              </h3>
              <div className="space-y-4">
                {pendingCharacters?.map((char: any) => (
                  <ApprovalCard 
                    key={char.id}
                    icon={<UserIcon className="h-4 w-4" />}
                    type="Personagem"
                    title={char.name}
                    desc={`Um(a) ${char.race} ${char.class} nível ${char.level} aguarda sua bênção.`}
                    time="Pendente"
                    onApprove={() => handleApproveCharacter(char.id)}
                  />
                ))}
                {pendingCharacters?.length === 0 && (
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
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="bg-primary/5 border-primary/20 border-dashed col-span-1 p-8 space-y-8">
              <div className="p-4 rounded-full bg-primary/20 text-primary w-fit mx-auto mb-2">
                <Play className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h4 className="font-display font-bold text-xl">Nova Sessão</h4>
                <p className="text-sm text-muted-foreground font-heading italic">Defina as leis da realidade.</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Título da Sessão</Label>
                  <Input 
                    placeholder="Ex: O Encontro nas Docas" 
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-accent">Política de Dados</Label>
                   <RadioGroup value={diceMode} onValueChange={setDiceMode} className="grid grid-cols-1 gap-2">
                      <Label htmlFor="mode-flexible" className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${diceMode === 'flexible' ? 'border-primary bg-primary/10' : 'border-white/5 opacity-50'}`}>
                        <RadioGroupItem value="flexible" id="mode-flexible" className="sr-only" />
                        <Infinity className="h-4 w-4" />
                        <span className="text-[10px] uppercase font-bold">Livre</span>
                      </Label>
                      <Label htmlFor="mode-virtual" className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${diceMode === 'virtual' ? 'border-primary bg-primary/10' : 'border-white/5 opacity-50'}`}>
                        <RadioGroupItem value="virtual" id="mode-virtual" className="sr-only" />
                        <Dices className="h-4 w-4" />
                        <span className="text-[10px] uppercase font-bold">Apenas Virtuais</span>
                      </Label>
                   </RadioGroup>
                </div>

                <Button 
                  onClick={handleStartSession} 
                  disabled={isStartingSession || !newSessionTitle.trim()} 
                  className="w-full rounded-full bg-primary h-14"
                >
                  <Play className="mr-2 h-4 w-4" /> Iniciar Sessão
                </Button>
              </div>
            </Card>

            <Card className="col-span-1 xl:col-span-2 bg-card/30 border-white/5 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-2xl">Histórico de Sessões</h3>
              </div>
              <div className="space-y-4">
                {loadingSessions && sessions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    Consultando os anais...
                  </div>
                )}
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold">{session.title}</h5>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                        Status: {session.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {session.status === 'active' && (
                        <Button 
                          onClick={() => handleEndSession(session)} 
                          disabled={isSummarizing}
                          variant="outline" 
                          size="sm" 
                          className="border-accent/30 text-accent hover:bg-accent/10"
                        >
                          {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ScrollText className="mr-2 h-4 w-4" /> Finalizar & Crônica</>}
                        </Button>
                      )}
                      <Badge className={session.status === 'active' ? 'bg-primary' : 'bg-muted'}>
                        {session.status === 'active' ? 'Em curso' : 'Eternizada'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!loadingSessions && sessions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    Nenhuma sessão registrada ainda.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Revisão da Crônica */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="bg-card border-accent/30 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display text-accent flex items-center gap-3">
              <Sparkles className="h-6 w-6" /> Oráculo do Cronista
            </DialogTitle>
            <DialogDescription className="font-heading italic text-lg">
              Revise o registro histórico gerado pela IA antes de torná-lo canônico.
            </DialogDescription>
          </DialogHeader>
          
          {summaryResult && (
            <div className="space-y-8 py-6">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Título Sugerido</Label>
                <Input 
                  value={summaryResult.title} 
                  onChange={e => setSummaryResult({...summaryResult, title: e.target.value})}
                  className="bg-background/50 text-xl font-display"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">A Crônica (Sumário)</Label>
                <Textarea 
                  value={summaryResult.summary} 
                  onChange={e => setSummaryResult({...summaryResult, summary: e.target.value})}
                  className="min-h-[200px] bg-background/50 font-heading text-lg italic leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Figuras & NPCs</Label>
                    <div className="flex flex-wrap gap-2">
                      {summaryResult.npcsEncountered.map((n: string, i: number) => (
                        <Badge key={i} variant="secondary">{n}</Badge>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Itens Relevantes</Label>
                    <div className="flex flex-wrap gap-2">
                      {summaryResult.itemsGained.map((it: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-accent/30 text-accent">{it}</Badge>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Segredos do Mestre (Não visível aos jogadores)</Label>
                <Textarea 
                  value={summaryResult.masterSecrets} 
                  onChange={e => setSummaryResult({...summaryResult, masterSecrets: e.target.value})}
                  className="bg-primary/5 border-primary/20 text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSummaryOpen(false)}>Descartar Resumo</Button>
            <Button onClick={handlePublishChronicle} className="bg-primary px-10 rounded-full h-12 shadow-arcane">
              Tornar Canônico & Encerrar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApprovalCard({ icon, type, title, desc, onApprove }: { icon: React.ReactNode, type: string, title: string, desc: string, time: string, onApprove?: () => void }) {
  return (
    <Card className="bg-card/40 border-white/5 transition-all">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20 text-accent">{icon}</div>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 font-ui">{type}</span>
        </div>
        <CardTitle className="text-xl mt-4 font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <p className="text-sm text-muted-foreground font-ui">{desc}</p>
      </CardContent>
      <div className="p-6 pt-0">
        <Button onClick={onApprove} className="w-full bg-primary hover:bg-primary/90 h-10 font-ui text-[11px] font-bold uppercase tracking-widest">
          <Check className="mr-2 h-4 w-4" /> Aprovar Entrada
        </Button>
      </div>
    </Card>
  );
}
