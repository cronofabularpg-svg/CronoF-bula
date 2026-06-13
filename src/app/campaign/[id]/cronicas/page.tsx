
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ScrollText,
  Calendar,
  Users,
  Package,
  Sparkles,
  ChevronRight,
  BookOpen,
  Search,
  Sword,
  ShieldCheck,
  History,
  Wand2,
  FileClock,
  Landmark,
  PenLine,
  Loader2,
} from "lucide-react"

type ChronicleRow = {
  id: string
  campaign_id: string
  session_id: string | null
  title: string
  summary: string | null
  public_content: string | null
  master_notes: string | null
  status: string
  visibility: string
  source_type: string | null
  source_label: string | null
  raw_notes: string | null
  metadata: Record<string, any> | null
  created_at: string
  approved_at: string | null
}

type CanonEventRow = {
  id: string
  event_type: string
  title: string
  content: string | null
  importance: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Crônica Oficial",
}

const SOURCE_OPTIONS = [
  { value: "in_person_table", label: "Mesa Presencial" },
  { value: "online_table", label: "Mesa Online" },
  { value: "live_table_ai", label: "Mesa Viva IA" },
  { value: "combat", label: "Combate" },
  { value: "manual", label: "Evento Manual" },
  { value: "imported", label: "Importação do Mestre" },
]

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(SOURCE_OPTIONS.map((option) => [option.value, option.label]))

export default function Cronicas() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()
  const [chronicles, setChronicles] = React.useState<ChronicleRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedChronicle, setSelectedChronicle] = React.useState<ChronicleRow | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isMaster, setIsMaster] = React.useState(false)
  const [canonEvents, setCanonEvents] = React.useState<CanonEventRow[]>([])
  const [loadingCanonEvents, setLoadingCanonEvents] = React.useState(false)
  const [manualDialogOpen, setManualDialogOpen] = React.useState(false)
  const [isSavingManual, setIsSavingManual] = React.useState(false)
  const [manualForm, setManualForm] = React.useState({
    title: "",
    sourceType: "in_person_table",
    rawNotes: "",
    visibility: "party",
    askAi: true,
  })

  const loadChronicles = React.useCallback(async () => {
    if (!campaignId || !user) return
    const userId = user.uid
    const supabase = createClient()
    setLoading(true)

    const [{ data: campaign }, { data: member }, { data, error }] = await Promise.all([
      supabase.from('campaigns').select('owner_id').eq('id', campaignId).maybeSingle(),
      supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle(),
      supabase.rpc('get_campaign_chronicles', { target_campaign_id: campaignId }),
    ])

    setIsMaster(campaign?.owner_id === userId || ['owner', 'master', 'assistant_master'].includes(member?.role || ''))

    if (error) {
      setLoading(false)
      toast({ variant: "destructive", title: "Erro ao carregar crônicas", description: error.message })
      return
    }

    const rows = (data as ChronicleRow[]) || []
    setChronicles(rows)
    setSelectedChronicle((current) => {
      if (current && rows.some((row) => row.id === current.id)) return rows.find((row) => row.id === current.id) || current
      return rows.find((c) => c.status === 'approved') || rows[0] || null
    })
    setLoading(false)
  }, [campaignId, toast, user])

  React.useEffect(() => {
    let active = true
    if (active) loadChronicles()

    return () => {
      active = false
    }
  }, [loadChronicles])

  React.useEffect(() => {
    if (!selectedChronicle) {
      setCanonEvents([])
      return
    }
    let active = true
    const supabase = createClient()
    setLoadingCanonEvents(true)

    supabase
      .from('canon_events')
      .select('id, event_type, title, content, importance, created_at')
      .eq('chronicle_id', selectedChronicle.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        setCanonEvents(error ? [] : (data as CanonEventRow[]) || [])
        setLoadingCanonEvents(false)
      })

    return () => {
      active = false
    }
  }, [selectedChronicle])

  const approvedChronicles = chronicles.filter((c) => c.status === 'approved')
  const draftChronicles = chronicles.filter((c) => c.status !== 'approved')
  const filteredApprovedChronicles = approvedChronicles.filter((chron) => chron.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  const filteredDraftChronicles = draftChronicles.filter((chron) => chron.title.toLowerCase().includes(searchTerm.trim().toLowerCase()))

  async function handleSaveManualChronicle(useAi: boolean) {
    if (!campaignId || !user || !manualForm.title.trim() || !manualForm.rawNotes.trim()) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Informe título e anotações da sessão." })
      return
    }

    setIsSavingManual(true)
    try {
      if (useAi) {
        const response = await fetch('/api/ai/manual-chronicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            title: manualForm.title,
            sourceType: manualForm.sourceType,
            rawNotes: manualForm.rawNotes,
            visibility: manualForm.visibility,
          }),
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Falha ao gerar rascunho.')
        toast({ title: "Rascunho gerado", description: "A IA organizou as notas, mas nada foi publicado." })
      } else {
        const supabase = createClient()
        const { error } = await supabase.from('chronicles').insert({
          campaign_id: campaignId,
          title: manualForm.title.trim(),
          summary: manualForm.rawNotes.trim(),
          public_content: manualForm.rawNotes.trim(),
          master_notes: manualForm.rawNotes.trim(),
          status: 'draft',
          visibility: manualForm.visibility,
          source_type: manualForm.sourceType,
          source_label: SOURCE_LABELS[manualForm.sourceType] || 'Evento Manual',
          raw_notes: manualForm.rawNotes.trim(),
          metadata: {
            manual_registration: true,
            ai_requested: false,
          },
          created_by: user.uid,
        })
        if (error) throw error
        toast({ title: "Rascunho salvo", description: "O registro manual aguarda aprovação do mestre." })
      }

      setManualDialogOpen(false)
      setManualForm({ title: "", sourceType: "in_person_table", rawNotes: "", visibility: "party", askAi: true })
      await loadChronicles()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao registrar sessão", description: error.message })
    } finally {
      setIsSavingManual(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#050711] text-[#FFF6E5]">
      <header className="p-4 sm:p-6 lg:p-10 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 shrink-0 z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 rounded-[1.5rem] bg-primary shadow-arcane shrink-0">
            <ScrollText className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tighter text-primary">Crônicas</h1>
            <p className="text-[10px] font-display uppercase font-black tracking-[0.3em] opacity-40 mt-2">O registro oficial da campanha.</p>
            <p className="text-sm text-muted-foreground font-heading italic mt-3 max-w-3xl">
              As Crônicas guardam os acontecimentos aprovados pelo mestre, vindos de mesas presenciais, online, Mesa Viva, combates ou registros manuais.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-30 text-primary" />
            <input
              placeholder="Buscar verdades canônicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 sm:py-4 bg-black/40 border-primary/20 rounded-2xl text-sm font-heading italic focus:ring-primary focus:border-primary/40 outline-none transition-all"
            />
          </div>
          {isMaster && (
            <Button onClick={() => setManualDialogOpen(true)} className="bg-primary text-black hover:bg-primary/90 rounded-2xl h-12 sm:h-14 px-6 font-display gap-2 shrink-0 w-full sm:w-auto">
              <PenLine className="h-4 w-4" /> Registrar Sessão Manual
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-10 py-3 sm:py-4 border-b border-primary/10 bg-black/20 flex flex-wrap gap-x-4 sm:gap-x-10 gap-y-2 text-[10px] font-heading italic opacity-50 shrink-0">
        <span><strong className="text-primary not-italic">Crônica:</strong> registro oficial, aprovado pelo mestre.</span>
        <span><strong className="text-primary not-italic">Mesa Viva:</strong> sessão interativa com IA.</span>
        <span><strong className="text-primary not-italic">Diário:</strong> memória pessoal do personagem.</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Índice de Sessões - Estilo Sumário de Livro */}
        <aside className="w-full h-[40vh] md:h-auto md:w-96 shrink-0 border-r border-primary/10 bg-black/20 backdrop-blur-2xl flex flex-col">
          <div className="p-4 sm:p-6 md:p-8 border-b border-primary/10 flex items-center justify-between">
             <span className="text-[10px] font-display uppercase font-black tracking-[0.2em] text-primary opacity-60">Crônicas Oficiais</span>
             <History className="h-4 w-4 text-primary opacity-20" />
          </div>
          <ScrollArea className="flex-1 scrollbar-hide">
            <div className="p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="p-8 sm:p-12 lg:p-20 text-center italic font-heading text-base sm:text-xl opacity-30 animate-pulse">Lendo os anais...</div>
              ) : (
                <>
                  {filteredApprovedChronicles.map((chron) => (
                    <button
                      key={chron.id}
                      onClick={() => setSelectedChronicle(chron)}
                      className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-500 group border-2 ${
                        selectedChronicle?.id === chron.id
                        ? 'bg-primary/10 border-primary shadow-arcane'
                        : 'bg-black/20 border-white/5 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-code opacity-40 tracking-widest">{new Date(chron.created_at).toLocaleDateString('pt-BR')}</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[7px] uppercase font-black px-2 py-0.5">{STATUS_LABELS[chron.status] || chron.status}</Badge>
                      </div>
                      <h4 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">{chron.title}</h4>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-3">
                        {chron.source_label || SOURCE_LABELS[chron.source_type || 'manual'] || 'Registro Manual'}
                      </p>
                    </button>
                  ))}

                  {approvedChronicles.length === 0 && (
                    <div className="p-6 sm:p-12 text-center text-muted-foreground italic font-heading text-base sm:text-xl opacity-40 space-y-6">
                      <p>"Nenhuma crônica oficial foi aprovada ainda."</p>
                      {isMaster && (
                        <Button asChild className="bg-primary text-black hover:bg-primary/90 rounded-2xl gap-2">
                          <Link href={`/campaign/${campaignId}/master`}>
                            <Wand2 className="h-4 w-4" /> Gerar primeira crônica
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {approvedChronicles.length > 0 && filteredApprovedChronicles.length === 0 && (
                    <div className="p-6 sm:p-12 text-center text-muted-foreground italic font-heading text-base sm:text-xl opacity-40">
                      Nenhuma crônica corresponde à busca.
                    </div>
                  )}

                  {isMaster && draftChronicles.length > 0 && (
                    <div className="pt-6 space-y-4">
                      <div className="flex items-center gap-3 px-2 opacity-50">
                        <FileClock className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] font-display uppercase font-black tracking-[0.2em] text-amber-400">Rascunhos aguardando aprovação do mestre</span>
                      </div>
                      {filteredDraftChronicles.map((chron) => (
                        <button
                          key={chron.id}
                          onClick={() => setSelectedChronicle(chron)}
                          className={`w-full p-4 sm:p-6 rounded-2xl text-left transition-all duration-500 group border-2 ${
                            selectedChronicle?.id === chron.id
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-black/20 border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/5'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-code opacity-40 tracking-widest">{new Date(chron.created_at).toLocaleDateString('pt-BR')}</span>
                            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[7px] uppercase font-black px-2 py-0.5">{STATUS_LABELS[chron.status] || chron.status}</Badge>
                          </div>
                          <h4 className="font-display font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors">{chron.title}</h4>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-3">
                            {chron.source_label || SOURCE_LABELS[chron.source_type || 'manual'] || 'Registro Manual'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {isMaster && draftChronicles.length === 0 && (
                    <div className="pt-6 space-y-4">
                      <div className="flex items-center gap-3 px-2 opacity-50">
                        <FileClock className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] font-display uppercase font-black tracking-[0.2em] text-amber-400">Rascunhos aguardando aprovação do mestre</span>
                      </div>
                      <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                        Nenhum rascunho pendente.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Conteúdo da Crônica - Estilo Arquivo Histórico */}
        <main className="flex-1 min-h-0 relative overflow-hidden bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, rgba(200, 162, 74, 0.03) 1px, transparent 1px)', backgroundSize: '100px 100px' }}>
          <ScrollArea className="h-full scrollbar-hide">
             {selectedChronicle ? (
               <div className="max-w-5xl mx-auto p-4 sm:p-8 md:p-16 lg:p-32 space-y-8 sm:space-y-12 lg:space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <header className="space-y-6 sm:space-y-10 text-center">
                    <div className="canon-seal w-fit mx-auto">{selectedChronicle.status === 'approved' ? 'Verdade Canônica' : `${STATUS_LABELS[selectedChronicle.status] || selectedChronicle.status} — aguardando aprovação`}</div>
                    <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-display font-black tracking-tighter text-primary drop-shadow-[0_0_20px_rgba(200,162,74,0.2)]">
                      {selectedChronicle.title}
                    </h2>
                    <div className="flex justify-center gap-3 flex-wrap">
                      <Badge variant="outline" className="border-primary/30 text-primary font-display text-[10px] tracking-widest px-4 py-2">
                        {selectedChronicle.source_label || SOURCE_LABELS[selectedChronicle.source_type || 'manual'] || 'Registro Manual'}
                      </Badge>
                      <Badge variant="outline" className="border-primary/30 text-primary font-display text-[10px] tracking-widest px-4 py-2">
                        {STATUS_LABELS[selectedChronicle.status] || selectedChronicle.status}
                      </Badge>
                    </div>
                    {selectedChronicle.status !== 'approved' && isMaster && (
                      <p className="text-sm font-heading italic opacity-50">
                        Este rascunho ainda não foi publicado.{' '}
                        <Link href={`/campaign/${campaignId}/master`} className="text-primary underline">
                          Revisar no Portal do Mestre
                        </Link>
                      </p>
                    )}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-10 opacity-40">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest">{new Date(selectedChronicle.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-primary/40 shadow-gold" />
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest italic">Pelo Oráculo & Mestre</span>
                      </div>
                    </div>
                  </header>

                  <section className="parchment p-6 sm:p-10 md:p-16 lg:p-24 rounded-[3rem] literary-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                     <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl leading-[1.8] font-heading italic opacity-90 first-letter:text-5xl sm:first-letter:text-7xl lg:first-letter:text-9xl first-letter:font-display first-letter:mr-5 first-letter:float-left first-letter:text-primary first-letter:drop-shadow-lg">
                        {selectedChronicle.public_content || selectedChronicle.summary}
                     </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 pt-6 sm:pt-10 border-t border-primary/10">
                    <div className="space-y-10">
                       <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                         <Sword className="h-5 w-5" /> Decisões Críticas
                       </h3>
                       <ul className="space-y-8">
                         {(selectedChronicle.summary ? [selectedChronicle.summary] : []).map((d: string, i: number) => (
                           <li key={i} className="flex gap-6 items-start group">
                             <div className="mt-2 h-2 w-2 rounded-full bg-primary shadow-gold group-hover:scale-150 transition-transform shrink-0" />
                             <p className="text-xl font-heading italic opacity-70 group-hover:opacity-100 transition-opacity leading-relaxed">{d}</p>
                           </li>
                         ))}
                       </ul>
                    </div>
                    <div className="space-y-16">
                       <div className="space-y-8">
                          <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                            <Users className="h-5 w-5" /> Figuras Notáveis
                          </h3>
                          <div className="flex flex-wrap gap-4">
                             {(selectedChronicle.public_content ? selectedChronicle.public_content.split(" ").slice(0, 4) : []).map((n: string, i: number) => (
                               <Badge key={i} className="bg-primary/5 text-primary border-primary/20 font-display text-[10px] tracking-widest px-4 py-2 hover:bg-primary/20 transition-all cursor-default">{n}</Badge>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-8">
                         <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                            <Package className="h-5 w-5" /> Notas Públicas
                          </h3>
                          <div className="flex flex-wrap gap-4">
                            <Badge variant="outline" className="border-primary/30 text-primary font-display text-[10px] tracking-widest px-4 py-2 hover:bg-primary/5 transition-all cursor-default">
                              {STATUS_LABELS[selectedChronicle.status] || selectedChronicle.status}
                            </Badge>
                          </div>
                       </div>
                    </div>
                  </div>

                  {canonEvents.length > 0 && (
                    <div className="space-y-6 sm:space-y-10 pt-6 sm:pt-10 border-t border-primary/10">
                       <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                         <Landmark className="h-5 w-5" /> Eventos Canônicos Relacionados
                       </h3>
                       <ul className="space-y-6 sm:space-y-8">
                         {canonEvents.map((event) => (
                           <li key={event.id} className="flex gap-4 sm:gap-6 items-start group">
                             <div className="mt-2 h-2 w-2 rounded-full bg-primary shadow-gold group-hover:scale-150 transition-transform shrink-0" />
                             <div>
                               <p className="text-base sm:text-lg lg:text-xl font-heading italic opacity-70 group-hover:opacity-100 transition-opacity leading-relaxed">{event.title}</p>
                               {event.content && <p className="text-sm sm:text-base font-heading opacity-50 mt-2 leading-relaxed">{event.content}</p>}
                             </div>
                           </li>
                         ))}
                       </ul>
                    </div>
                  )}

                  {selectedChronicle.master_notes && (
                    <div className="p-6 sm:p-8 lg:p-12 rounded-[2.5rem] bg-[#3A1F5D]/10 border border-[#7B4FB3]/30 space-y-4 sm:space-y-6 relative overflow-hidden oracle-glow">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <ShieldCheck className="h-24 w-24" />
                       </div>
                       <h4 className="text-[10px] font-display uppercase font-black tracking-[0.3em] text-primary flex items-center gap-3">
                         <Sparkles className="h-5 w-5" /> Oráculo do Mestre (Segredos)
                       </h4>
                       <p className="text-base sm:text-lg lg:text-xl font-heading italic opacity-60 leading-relaxed max-w-3xl">
                         {selectedChronicle.master_notes}
                       </p>
                    </div>
                  )}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 text-center gap-6 sm:gap-12 opacity-10">
                  <BookOpen className="h-20 w-20 sm:h-32 sm:w-32 lg:h-48 lg:w-48 text-primary animate-pulse" />
                  <div className="space-y-4">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tighter">O Grande Arquivo</h2>
                    <p className="text-base sm:text-xl lg:text-3xl font-heading italic max-w-lg">Selecione uma crônica à esquerda para ler os registros oficiais da sua jornada.</p>
                  </div>
               </div>
             )}
          </ScrollArea>
        </main>
      </div>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="bg-card border-primary/20 literary-shadow max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary flex items-center gap-3">
              <PenLine className="h-6 w-6" /> Registrar Sessão Manual
            </DialogTitle>
            <DialogDescription className="font-heading italic">
              Crie um rascunho a partir de mesa presencial, online, combate, importação ou evento manual. Nada será publicado sem aprovação do mestre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Título da sessão</Label>
              <Input
                value={manualForm.title}
                onChange={(e) => setManualForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: A queda do portão norte"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={manualForm.sourceType} onValueChange={(value) => setManualForm((prev) => ({ ...prev, sourceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select value={manualForm.visibility} onValueChange={(value) => setManualForm((prev) => ({ ...prev, visibility: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">public</SelectItem>
                    <SelectItem value="party">party</SelectItem>
                    <SelectItem value="master_only">master_only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resumo bruto / anotações do mestre</Label>
              <Textarea
                value={manualForm.rawNotes}
                onChange={(e) => setManualForm((prev) => ({ ...prev, rawNotes: e.target.value }))}
                className="min-h-44"
                placeholder="Cole aqui suas notas da sessão. A IA pode organizar o texto, mas o mestre ainda aprova o que vira oficial."
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={manualForm.askAi}
                onChange={(e) => setManualForm((prev) => ({ ...prev, askAi: e.target.checked }))}
                className="mt-1"
              />
              <span className="text-sm font-heading italic text-muted-foreground">
                Pedir para a IA organizar como crônica. A IA apenas sugere um rascunho; canonização continua manual.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => setManualDialogOpen(false)} disabled={isSavingManual}>Cancelar</Button>
            <Button
              variant="outline"
              onClick={() => handleSaveManualChronicle(false)}
              disabled={isSavingManual}
              className="border-primary/30"
            >
              {isSavingManual && !manualForm.askAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Rascunho sem IA
            </Button>
            <Button
              onClick={() => handleSaveManualChronicle(manualForm.askAi)}
              disabled={isSavingManual || !manualForm.askAi}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {isSavingManual && manualForm.askAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Gerar Rascunho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
