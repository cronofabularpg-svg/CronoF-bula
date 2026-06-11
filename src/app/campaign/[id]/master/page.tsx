
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
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
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

type ApprovalRequest = {
  id: string
  request_type: string
  status: string
  title: string
  description: string | null
  requested_by: string | null
  created_at: string
  payload: Record<string, any> | null
}

type SessionMessageRow = {
  id: string
  scene_id: string | null
  message_type: string
  content: string
  characters: { name: string }[] | { name: string } | null
}

type ChronicleDraft = {
  id: string
  sessionId: string
  title: string
  summary: string
  public_content: string
  master_notes: string
  npcsEncountered: string[]
  highlights: string[]
  itemsGained: string[]
  visibility: "party" | "public"
  status: "draft" | "pending" | "approved"
  sceneId: string | null
}

function buildChronicleDraft(session: SessionRow, messages: SessionMessageRow[], campaign: CampaignSummary): ChronicleDraft {
  const speakerNames = Array.from(new Set(
    messages.map((m) => Array.isArray(m.characters) ? m.characters[0]?.name : m.characters?.name).filter(Boolean) as string[]
  ))
  const notableLines = messages
    .filter((m) => m.content.trim().length > 0)
    .slice(0, 5)
    .map((m) => m.content.trim())

  const summaryBase = notableLines.length > 0
    ? notableLines.join(" ")
    : `A sessão ${session.title} transcorreu sem registros suficientes para um resumo detalhado.`

  const title = `${session.title} - ${campaign.name}`
  const publicContent = summaryBase
  const masterNotes = `Rascunho local gerado a partir de ${messages.length} mensagens.`
  const highlightWords = messages
    .flatMap((m) => m.content.split(/\s+/))
    .filter((word) => /item|rel[ií]quia|segredo|portal|mapa/i.test(word))
    .slice(0, 6)

  return {
    id: "",
    sessionId: session.id,
    title,
    summary: summaryBase,
    public_content: publicContent,
    master_notes: masterNotes,
    npcsEncountered: speakerNames,
    highlights: notableLines,
    itemsGained: highlightWords,
    visibility: "party",
    status: "draft",
    sceneId: messages[0]?.scene_id ?? null,
  }
}

export default function MasterPanel() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [newSessionTitle, setNewSessionTitle] = React.useState("")
  const [diceMode, setDiceMode] = React.useState("flexible")
  const [isStartingSession, setIsStartingSession] = React.useState(false)

  // Estados para o Resumo
  const [isSummarizing, setIsSummarizing] = React.useState(false)
  const [isSummarizingAI, setIsSummarizingAI] = React.useState(false)
  const [summaryResult, setSummaryResult] = React.useState<any>(null)
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false)

  const [campaign, setCampaign] = React.useState<CampaignSummary | null>(null)
  const [pendingCharacters, setPendingCharacters] = React.useState<PendingCharacter[]>([])
  const [approvalRequests, setApprovalRequests] = React.useState<ApprovalRequest[]>([])
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)
  const [draftChronicleId, setDraftChronicleId] = React.useState<string | null>(null)

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
      .from('approval_requests')
      .select('id, request_type, status, title, description, requested_by, created_at, payload')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar Solicitações", description: error.message })
        }
        setApprovalRequests((data as ApprovalRequest[]) || [])
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

  async function handleResolveApproval(requestId: string, status: 'approved' | 'rejected') {
    const supabase = createClient()
    const { error } = await supabase
      .from('approval_requests')
      .update({
        status,
        resolution_note: status === 'approved' ? 'Aprovado pelo mestre.' : 'Rejeitado pelo mestre.'
      })
      .eq('id', requestId)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Resolver Solicitação", description: error.message })
      return
    }

    setApprovalRequests((prev) => prev.filter((request) => request.id !== requestId))
    toast({
      title: status === 'approved' ? "Solicitação Aprovada" : "Solicitação Rejeitada",
      description: "A decisão foi registrada no cânone da campanha."
    })
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
        .select('id, scene_id, content, message_type, characters(name)')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!messagesData || messagesData.length === 0) {
        toast({ variant: "destructive", title: "Sessão Vazia", description: "Não há registros suficientes para resumir." })
        setIsSummarizing(false)
        return
      }

      const draft = buildChronicleDraft(session, messagesData as SessionMessageRow[], campaign)
      const { data: chronicle, error: chronicleError } = await supabase
        .from('chronicles')
        .insert({
          campaign_id: campaignId,
          session_id: session.id,
          title: draft.title,
          summary: draft.summary,
          public_content: draft.public_content,
          master_notes: draft.master_notes,
          status: 'draft',
          visibility: draft.visibility,
          created_by: user?.uid
        })
        .select('id')
        .single()

      if (chronicleError || !chronicle) throw chronicleError || new Error("Falha ao criar rascunho da crônica.")

      setDraftChronicleId(chronicle.id)
      setSummaryResult({
        ...draft,
        id: chronicle.id,
        sessionId: session.id,
        title: draft.title,
        summary: draft.summary,
        public_content: draft.public_content,
        master_notes: draft.master_notes,
      })
      setIsSummaryOpen(true)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Gerar Rascunho", description: e.message })
    } finally {
      setIsSummarizing(false)
    }
  }

  async function handleEndSessionWithAI(session: SessionRow) {
    if (!campaignId) return
    setIsSummarizingAI(true)
    try {
      const response = await fetch('/api/ai/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, sessionId: session.id })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar resumo com IA.')

      setDraftChronicleId(data.draft.id)
      setSummaryResult(data.draft)
      setIsSummaryOpen(true)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro do Cronista (IA)", description: e.message })
    } finally {
      setIsSummarizingAI(false)
    }
  }

  async function handlePublishChronicle() {
    if (!campaignId || !summaryResult || !user) return
    try {
      const supabase = createClient()
      const endedAt = new Date().toISOString()

      const chronicleId = draftChronicleId || summaryResult.id
      const { error: chronicleError } = await supabase
        .from('chronicles')
        .update({
          title: summaryResult.title,
          summary: summaryResult.summary,
          public_content: summaryResult.public_content,
          master_notes: summaryResult.master_notes,
          status: 'approved',
          visibility: summaryResult.visibility || 'party',
          approved_by: user.uid,
          approved_at: endedAt,
        })
        .eq('id', chronicleId)
        .eq('campaign_id', campaignId)

      if (chronicleError) throw chronicleError

      const { data: canonEvent, error: canonEventError } = await supabase
        .from('canon_events')
        .insert({
          campaign_id: campaignId,
          session_id: summaryResult.sessionId,
          chronicle_id: chronicleId,
          scene_id: summaryResult.sceneId ?? null,
          event_type: 'session_chronicle',
          title: summaryResult.title,
          content: summaryResult.public_content,
          visibility: summaryResult.visibility || 'party',
          importance: 'normal',
          created_by: user.uid,
          approved_by: user.uid,
          approved_at: endedAt
        })
        .select('id')
        .single()

      if (canonEventError || !canonEvent) throw canonEventError || new Error("Falha ao criar evento canônico.")

      const { error: memoryError } = await supabase
        .from('campaign_memory')
        .insert({
          campaign_id: campaignId,
          source_type: 'canon_event',
          source_id: canonEvent.id,
          memory_type: 'chronicle_memory',
          title: summaryResult.title,
          content: summaryResult.public_content,
          visibility: summaryResult.visibility || 'party',
          importance: 'normal',
          related_entity_type: 'chronicle',
          related_entity_id: chronicleId,
          created_by: user.uid,
          approved_by: user.uid,
          approved_at: endedAt
        })

      if (memoryError) throw memoryError

      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed', ended_at: endedAt })
        .eq('id', summaryResult.sessionId)

      if (error) throw error

      setSessions((prev) => prev.map((s) => s.id === summaryResult.sessionId ? { ...s, status: 'completed', ended_at: endedAt } : s))
      setIsSummaryOpen(false)
      setDraftChronicleId(null)
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
                {approvalRequests.map((request) => (
                  <ApprovalCard
                    key={request.id}
                    icon={<Sparkles className="h-4 w-4" />}
                    type={request.request_type}
                    title={request.title}
                    desc={request.description || "Solicitação canônica aguardando decisão do mestre."}
                    time="Pendente"
                    onApprove={() => handleResolveApproval(request.id, 'approved')}
                    onReject={() => handleResolveApproval(request.id, 'rejected')}
                  />
                ))}
                {pendingCharacters?.length === 0 && approvalRequests.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    Nenhuma solicitação aguardando no portão.
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
                        <>
                          <Button
                            onClick={() => handleEndSessionWithAI(session)}
                            disabled={isSummarizingAI || isSummarizing}
                            variant="outline"
                            size="sm"
                            className="border-secondary/30 text-secondary hover:bg-secondary/10"
                          >
                            {isSummarizingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Resumo com IA</>}
                          </Button>
                          <Button
                            onClick={() => handleEndSession(session)}
                            disabled={isSummarizing || isSummarizingAI}
                            variant="outline"
                            size="sm"
                            className="border-accent/30 text-accent hover:bg-accent/10"
                          >
                            {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ScrollText className="mr-2 h-4 w-4" /> Finalizar & Crônica</>}
                          </Button>
                        </>
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
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Resumo Público</Label>
                <Textarea 
                value={summaryResult.summary} 
                  onChange={e => setSummaryResult({...summaryResult, summary: e.target.value, public_content: e.target.value})}
                  className="min-h-[200px] bg-background/50 font-heading text-lg italic leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Conteúdo Público</Label>
                <Textarea 
                  value={summaryResult.public_content} 
                  onChange={e => setSummaryResult({...summaryResult, public_content: e.target.value})}
                  className="min-h-[160px] bg-background/50 font-heading text-base leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Figuras & NPCs</Label>
                    <div className="flex flex-wrap gap-2">
                      {summaryResult.npcsEncountered?.map((n: string, i: number) => (
                        <Badge key={i} variant="secondary">{n}</Badge>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Marcos da Sessão</Label>
                    <div className="flex flex-wrap gap-2">
                      {summaryResult.highlights?.map((it: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-accent/30 text-accent">{it}</Badge>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-primary">Notas do Mestre (Não visível aos jogadores)</Label>
                <Textarea 
                  value={summaryResult.master_notes} 
                  onChange={e => setSummaryResult({...summaryResult, master_notes: e.target.value})}
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

function ApprovalCard({ icon, type, title, desc, onApprove, onReject }: { icon: React.ReactNode, type: string, title: string, desc: string, time: string, onApprove?: () => void, onReject?: () => void }) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={onApprove} className="w-full bg-primary hover:bg-primary/90 h-10 font-ui text-[11px] font-bold uppercase tracking-widest">
            <Check className="mr-2 h-4 w-4" /> Aprovar
          </Button>
          {onReject && (
            <Button onClick={onReject} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 h-10 font-ui text-[11px] font-bold uppercase tracking-widest">
              <X className="mr-2 h-4 w-4" /> Rejeitar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
