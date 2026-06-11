
"use client"

import * as React from "react"
import Link from "next/link"
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
  Loader2,
  Wand2,
  CircleCheck,
  CircleX,
  BookMarked
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
  ai_enabled: boolean
}

type CampaignSettingsRow = {
  ai_can_narrate: boolean
  ai_default_mode: string | null
}

type AiSuggestion = {
  id: string
  session_id: string | null
  scene_id: string | null
  suggestion_type: string
  title: string | null
  content: string | null
  payload: Record<string, any> | null
  created_at: string
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

type WorldVisibility = "party" | "public" | "master_only"

type WorldImportProposal = {
  world_summary: string
  lore_entries: Array<{ title: string; content: string; visibility: WorldVisibility }>
  locations: Array<{ name: string; type: string; description: string; region: string; visibility: WorldVisibility; image_url: string }>
  npcs: Array<{ name: string; role: string; description: string; personality: string; goals: string; secrets: string; visibility: WorldVisibility; image_url: string }>
  factions: Array<{ name: string; description: string; goals: string; secrets: string; relationship_status: string; visibility: WorldVisibility }>
  items: Array<{ name: string; item_type: string; description: string; rarity: string; visibility: WorldVisibility; image_url: string }>
  quests: Array<{ title: string; description: string; reward_notes: string; visibility: WorldVisibility }>
  threats: Array<{ title: string; content: string; visibility: WorldVisibility }>
  master_secrets: Array<{ title: string; content: string }>
  opening_scene: string
}

type ManualWorldType = "lore" | "npc" | "location" | "item" | "faction" | "quest" | "threat" | "secret"

type ImportReportEntry = {
  key: string
  label: string
  table: string
  count: number
  status: "success" | "skipped" | "error"
  message?: string
}

type WorldImportReport = {
  createdAt: string
  entries: ImportReportEntry[]
  sceneId?: string
  sessionId?: string
}

type WorldPrepSummary = {
  memory: Array<{ id: string; title: string; memory_type: string; visibility: string; created_at: string }>
  items: Array<{ id: string; name: string; visibility: string; created_at: string }>
  factions: Array<{ id: string; name: string; visibility: string; created_at: string }>
  quests: Array<{ id: string; title: string; visibility: string; created_at: string }>
}

function toNpcVisibility(visibility: WorldVisibility): string {
  return visibility === 'master_only' ? 'master_only' : visibility === 'public' ? 'public' : 'visible'
}

function toLocationVisibility(visibility: WorldVisibility): string {
  return visibility === 'master_only' ? 'master_only' : visibility === 'public' ? 'public' : 'visible'
}

function toWorldbuildingVisibility(visibility: WorldVisibility): WorldVisibility {
  return visibility === 'public' ? 'public' : visibility === 'party' ? 'party' : 'master_only'
}

function summarizeImport(entries: ImportReportEntry[]) {
  const successes = entries.filter((entry) => entry.status === "success" && entry.count > 0)
  const errors = entries.filter((entry) => entry.status === "error")
  const saved = successes.reduce((sum, entry) => sum + entry.count, 0)
  return { successes, errors, saved }
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
  const [campaignSettings, setCampaignSettings] = React.useState<CampaignSettingsRow | null>(null)
  const [pendingCharacters, setPendingCharacters] = React.useState<PendingCharacter[]>([])
  const [approvalRequests, setApprovalRequests] = React.useState<ApprovalRequest[]>([])
  const [aiSuggestions, setAiSuggestions] = React.useState<AiSuggestion[]>([])
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)
  const [draftChronicleId, setDraftChronicleId] = React.useState<string | null>(null)
  const [groqConfigured, setGroqConfigured] = React.useState<boolean | null>(null)
  const [isTestingAI, setIsTestingAI] = React.useState(false)
  const [aiTestResult, setAiTestResult] = React.useState<{ ok: boolean; message: string } | null>(null)
  const [manualType, setManualType] = React.useState<ManualWorldType>("lore")
  const [manualForm, setManualForm] = React.useState({
    title: "",
    description: "",
    secondary: "",
    visibility: "master_only" as WorldVisibility,
    image_url: "",
  })
  const [worldImportForm, setWorldImportForm] = React.useState({
    worldName: "",
    tone: "",
    ruleSystem: "dnd_srd",
    instructions: "",
    sourceText: "",
  })
  const [worldProposal, setWorldProposal] = React.useState<WorldImportProposal | null>(null)
  const [selectedImports, setSelectedImports] = React.useState<Record<string, boolean>>({})
  const [isAnalyzingWorld, setIsAnalyzingWorld] = React.useState(false)
  const [isImportingWorld, setIsImportingWorld] = React.useState(false)
  const [worldImportReport, setWorldImportReport] = React.useState<WorldImportReport | null>(null)
  const [worldPrepSummary, setWorldPrepSummary] = React.useState<WorldPrepSummary>({
    memory: [],
    items: [],
    factions: [],
    quests: [],
  })

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .from('campaigns')
      .select('id, name, tone, owner_id, ai_enabled')
      .eq('id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCampaign(data as CampaignSummary | null)
      })

    supabase
      .from('campaign_settings')
      .select('ai_can_narrate, ai_default_mode')
      .eq('campaign_id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCampaignSettings(data as CampaignSettingsRow | null)
      })

    supabase
      .from('ai_generated_suggestions')
      .select('id, session_id, scene_id, suggestion_type, title, content, payload, created_at')
      .eq('campaign_id', campaignId)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ variant: "destructive", title: "Erro ao Carregar Sugestões da IA", description: error.message })
        }
        setAiSuggestions((data as AiSuggestion[]) || [])
      })

    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (active) setGroqConfigured(Boolean(data?.groqConfigured))
      })
      .catch(() => {
        if (active) setGroqConfigured(false)
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

    Promise.all([
      supabase
        .from('campaign_memory')
        .select('id, title, memory_type, visibility, created_at')
        .eq('campaign_id', campaignId)
        .in('source_type', ['world_import', 'world_preparation'])
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('items')
        .select('id, name, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('factions')
        .select('id, name, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('quests')
        .select('id, title, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]).then(([memory, items, factions, quests]) => {
      if (!active) return
      setWorldPrepSummary({
        memory: (memory.data as WorldPrepSummary['memory']) || [],
        items: (items.data as WorldPrepSummary['items']) || [],
        factions: (factions.data as WorldPrepSummary['factions']) || [],
        quests: (quests.data as WorldPrepSummary['quests']) || [],
      })
    })

    return () => {
      active = false
    }
  }, [campaignId, toast])

  async function refreshWorldPrepSummary() {
    if (!campaignId) return
    const supabase = createClient()
    const [memory, items, factions, quests] = await Promise.all([
      supabase
        .from('campaign_memory')
        .select('id, title, memory_type, visibility, created_at')
        .eq('campaign_id', campaignId)
        .in('source_type', ['world_import', 'world_preparation'])
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('items')
        .select('id, name, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('factions')
        .select('id, name, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('quests')
        .select('id, title, visibility, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    setWorldPrepSummary({
      memory: (memory.data as WorldPrepSummary['memory']) || [],
      items: (items.data as WorldPrepSummary['items']) || [],
      factions: (factions.data as WorldPrepSummary['factions']) || [],
      quests: (quests.data as WorldPrepSummary['quests']) || [],
    })
  }

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

  async function handleResolveAiSuggestion(suggestion: AiSuggestion, status: 'approved' | 'rejected') {
    if (!campaignId || !user) return
    const supabase = createClient()
    const reviewedAt = new Date().toISOString()

    if (status === 'approved') {
      if (!suggestion.scene_id || !suggestion.session_id) {
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Sugestão sem cena ou sessão associada." })
        return
      }

      const messageType = suggestion.suggestion_type === 'npc_dialogue' ? 'speech' : 'narration'
      const { error: messageError } = await supabase
        .from('scene_messages')
        .insert({
          campaign_id: campaignId,
          session_id: suggestion.session_id,
          scene_id: suggestion.scene_id,
          sender_user_id: user.uid,
          character_id: null,
          message_type: messageType,
          visibility: 'scene',
          content: suggestion.content,
          metadata: { source: 'groq', approved_suggestion_id: suggestion.id },
        })

      if (messageError) {
        toast({ variant: "destructive", title: "Erro ao Publicar Sugestão", description: messageError.message })
        return
      }
    }

    const { error } = await supabase
      .from('ai_generated_suggestions')
      .update({ approval_status: status, reviewed_by: user.uid, reviewed_at: reviewedAt })
      .eq('id', suggestion.id)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Sugestão", description: error.message })
      return
    }

    setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    toast({
      title: status === 'approved' ? "Sugestão Publicada" : "Sugestão Rejeitada",
      description: status === 'approved' ? "A narração da IA foi enviada à cena." : "A sugestão foi descartada."
    })
  }

  async function handleTestAI() {
    if (!campaignId) return
    setIsTestingAI(true)
    setAiTestResult(null)
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao testar a IA.')
      setAiTestResult({ ok: true, message: data.output || 'Conexão estabelecida.' })
    } catch (e: any) {
      setAiTestResult({ ok: false, message: e.message || 'Falha ao testar a IA.' })
    } finally {
      setIsTestingAI(false)
    }
  }

  async function handleManualWorldCreate() {
    if (!campaignId || !user || !manualForm.title.trim()) return

    const supabase = createClient()
    const now = new Date().toISOString()

    try {
      if (manualType === "npc") {
        const { error } = await supabase.from('npcs').insert({
          campaign_id: campaignId,
          name: manualForm.title,
          role: manualForm.secondary || null,
          description: manualForm.description || null,
          visibility: toNpcVisibility(manualForm.visibility),
          created_by: user.uid,
        })
        if (error) throw error
      } else if (manualType === "location") {
        const { error } = await supabase.from('locations').insert({
          campaign_id: campaignId,
          name: manualForm.title,
          type: manualForm.secondary || null,
          description: manualForm.description || null,
          image_url: manualForm.image_url || null,
          visibility: toLocationVisibility(manualForm.visibility),
          created_by: user.uid,
        })
        if (error) throw error
      } else if (manualType === "item") {
        const { error } = await supabase.from('items').insert({
          campaign_id: campaignId,
          name: manualForm.title,
          item_type: manualForm.secondary || null,
          description: manualForm.description || null,
          image_url: manualForm.image_url || null,
          visibility: manualForm.visibility,
          created_by: user.uid,
        })
        if (error) throw error
      } else if (manualType === "faction") {
        const { error } = await supabase.from('factions').insert({
          campaign_id: campaignId,
          name: manualForm.title,
          description: manualForm.description || null,
          goals: manualForm.secondary || null,
          visibility: manualForm.visibility,
          created_by: user.uid,
        })
        if (error) throw error
      } else if (manualType === "quest") {
        const { error } = await supabase.from('quests').insert({
          campaign_id: campaignId,
          title: manualForm.title,
          description: manualForm.description || null,
          reward_notes: manualForm.secondary || null,
          visibility: manualForm.visibility,
          created_by: user.uid,
        })
        if (error) throw error
      } else {
        const memoryType = manualType === "secret" ? "master_secret" : manualType === "threat" ? "threat" : "lore"
        const { error } = await supabase.from('campaign_memory').insert({
          campaign_id: campaignId,
          source_type: 'world_preparation',
          memory_type: memoryType,
          title: manualForm.title,
          content: manualForm.description || manualForm.secondary || "Sem descrição.",
          visibility: manualType === "secret" ? "master_only" : manualForm.visibility,
          importance: manualType === "secret" || manualType === "threat" ? "high" : "normal",
          created_by: user.uid,
          approved_by: user.uid,
          approved_at: now,
        })
        if (error) throw error
      }

      toast({ title: "Preparação registrada", description: "O conteúdo foi salvo no mundo da campanha." })
      setManualForm({ title: "", description: "", secondary: "", visibility: "master_only", image_url: "" })
      await refreshWorldPrepSummary()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Salvar Preparação", description: e.message })
    }
  }

  async function handleAnalyzeWorldImport() {
    if (!worldImportForm.sourceText.trim()) {
      toast({ variant: "destructive", title: "Texto obrigatório", description: "Cole o texto do mundo antes de analisar." })
      return
    }

    setIsAnalyzingWorld(true)
    try {
      const response = await fetch('/api/ai/world-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, ...worldImportForm })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao estruturar o mundo.')

      const proposal = data.proposal as WorldImportProposal
      const nextSelected: Record<string, boolean> = {
        world_summary: Boolean(proposal.world_summary),
        opening_scene: Boolean(proposal.opening_scene),
      }
      ;(['lore_entries', 'locations', 'npcs', 'factions', 'items', 'quests', 'threats', 'master_secrets'] as const).forEach((section) => {
        proposal[section].forEach((_, index) => {
          nextSelected[`${section}.${index}`] = true
        })
      })

      setWorldProposal(proposal)
      setSelectedImports(nextSelected)
      setWorldImportReport(null)
      toast({ title: "Mundo estruturado", description: "Revise a proposta antes de importar." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Importação", description: e.message })
    } finally {
      setIsAnalyzingWorld(false)
    }
  }

  function updateProposal(section: keyof WorldImportProposal, index: number, field: string, value: string) {
    setWorldProposal((prev) => {
      if (!prev) return prev
      const current = prev[section]
      if (!Array.isArray(current)) return prev
      return {
        ...prev,
        [section]: current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
      }
    })
  }

  async function handleImportSelectedWorld() {
    if (!campaignId || !user || !worldProposal) return
    const currentUser = user
    const proposal = worldProposal
    setIsImportingWorld(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const entries: ImportReportEntry[] = []
    let createdSession: SessionRow | null = null
    let createdSessionId: string | undefined
    let createdSceneId: string | undefined

    const addSkipped = (key: string, label: string, table: string) => {
      entries.push({ key, label, table, count: 0, status: "skipped", message: "Nenhum cartão selecionado." })
    }

    const recordError = (key: string, label: string, table: string, error: any) => {
      const message = error?.message || "Falha ao salvar esta categoria."
      console.error('[world-import] erro por categoria', { campaignId, hasUser: Boolean(currentUser), key, table, message })
      entries.push({ key, label, table, count: 0, status: "error", message })
    }

    async function insertRows(key: string, label: string, table: string, rows: Array<Record<string, any>>) {
      if (rows.length === 0) {
        addSkipped(key, label, table)
        return
      }

      try {
        const { data, error } = await supabase.from(table).insert(rows as any).select('id')
        if (error) throw error
        entries.push({
          key,
          label,
          table,
          count: data?.length || rows.length,
          status: "success",
          message: `${data?.length || rows.length} registro(s) salvo(s).`,
        })
      } catch (error: any) {
        recordError(key, label, table, error)
      }
    }

    async function createOpeningScene() {
      if (!selectedImports.opening_scene || !proposal.opening_scene?.trim()) {
        addSkipped("opening_scene", "Cena inicial", "sessions/scenes/scene_messages")
        return
      }

      try {
        let targetSession = sessions.find((session) => session.status === 'active') || null
        if (!targetSession) {
          const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
              campaign_id: campaignId,
              title: worldImportForm.worldName ? `Sessão Inicial - ${worldImportForm.worldName}` : 'Sessão Inicial',
              status: 'active',
              started_at: now,
              created_by: currentUser.uid,
            })
            .select('id, title, status, started_at, ended_at, created_at')
            .single()

          if (sessionError || !session) throw sessionError || new Error("A sessão inicial não foi criada.")
          targetSession = session as SessionRow
          createdSession = targetSession
          createdSessionId = targetSession.id
        }

        const { data: scene, error: sceneError } = await supabase
          .from('scenes')
          .insert({
            campaign_id: campaignId,
            session_id: targetSession.id,
            title: 'Cena Inicial',
            visibility: 'participants',
            status: 'active',
            created_by: currentUser.uid,
          })
          .select('id')
          .single()

        if (sceneError || !scene) throw sceneError || new Error("A cena inicial não foi criada.")
        createdSceneId = scene.id

        const { error: messageError } = await supabase
          .from('scene_messages')
          .insert({
            campaign_id: campaignId,
            session_id: targetSession.id,
            scene_id: scene.id,
            sender_user_id: currentUser.uid,
            character_id: null,
            message_type: 'narration',
            visibility: 'scene',
            content: proposal.opening_scene,
            metadata: { source: 'world_import', imported_at: now },
          })

        if (messageError) throw messageError

        entries.push({
          key: "opening_scene",
          label: "Cena inicial",
          table: "sessions/scenes/scene_messages",
          count: 1,
          status: "success",
          message: targetSession === createdSession
            ? "Sessão, cena e mensagem inicial criadas."
            : "Cena e mensagem inicial criadas na sessão ativa.",
        })
      } catch (error: any) {
        recordError("opening_scene", "Cena inicial", "sessions/scenes/scene_messages", error)
      }
    }

    try {
      const { data: membership } = await supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', campaignId)
        .eq('user_id', currentUser.uid)
        .eq('status', 'active')
        .maybeSingle()

      const isMaster = campaign?.owner_id === currentUser.uid || ['owner', 'master', 'assistant_master'].includes(membership?.role || '')
      console.info('[world-import] import iniciado', {
        campaignId,
        hasUser: Boolean(currentUser),
        isMaster,
        selectedCounts: {
          worldSummary: selectedImports.world_summary ? 1 : 0,
          lore: proposal.lore_entries.filter((_, index) => selectedImports[`lore_entries.${index}`]).length,
          locations: proposal.locations.filter((_, index) => selectedImports[`locations.${index}`]).length,
          npcs: proposal.npcs.filter((_, index) => selectedImports[`npcs.${index}`]).length,
          factions: proposal.factions.filter((_, index) => selectedImports[`factions.${index}`]).length,
          items: proposal.items.filter((_, index) => selectedImports[`items.${index}`]).length,
          quests: proposal.quests.filter((_, index) => selectedImports[`quests.${index}`]).length,
          threats: proposal.threats.filter((_, index) => selectedImports[`threats.${index}`]).length,
          masterSecrets: proposal.master_secrets.filter((_, index) => selectedImports[`master_secrets.${index}`]).length,
          openingScene: selectedImports.opening_scene ? 1 : 0,
        },
      })

      const summaryEntries = selectedImports.world_summary && proposal.world_summary.trim()
        ? [{
          campaign_id: campaignId,
          source_type: 'world_import',
          memory_type: 'world_summary',
          title: 'Visão Geral do Mundo',
          content: proposal.world_summary,
          visibility: 'party',
          importance: 'high',
          created_by: currentUser.uid,
          approved_by: currentUser.uid,
          approved_at: now,
        }]
        : []
      await insertRows("world_summary", "Visão geral do mundo", "campaign_memory", summaryEntries)

      const loreEntries = proposal.lore_entries
        .filter((_, index) => selectedImports[`lore_entries.${index}`])
        .map((entry) => ({
          campaign_id: campaignId,
          source_type: 'world_import',
          memory_type: 'lore',
          title: entry.title,
          content: entry.content,
          visibility: toWorldbuildingVisibility(entry.visibility),
          importance: 'normal',
          created_by: currentUser.uid,
          approved_by: currentUser.uid,
          approved_at: now,
        }))
      await insertRows("lore_entries", "Lore", "campaign_memory", loreEntries)

      const threatEntries = proposal.threats
        .filter((_, index) => selectedImports[`threats.${index}`])
        .map((threat) => ({
          campaign_id: campaignId,
          source_type: 'world_import',
          memory_type: 'threat',
          title: threat.title,
          content: threat.content,
          visibility: toWorldbuildingVisibility(threat.visibility),
          importance: 'high',
          created_by: currentUser.uid,
          approved_by: currentUser.uid,
          approved_at: now,
        }))
      await insertRows("threats", "Ameaças", "campaign_memory", threatEntries)

      const secretEntries = proposal.master_secrets
        .filter((_, index) => selectedImports[`master_secrets.${index}`])
        .map((secret) => ({
          campaign_id: campaignId,
          source_type: 'world_import',
          memory_type: 'master_secret',
          title: secret.title,
          content: secret.content,
          visibility: 'master_only',
          importance: 'high',
          created_by: currentUser.uid,
          approved_by: currentUser.uid,
          approved_at: now,
        }))
      await insertRows("master_secrets", "Segredos do Mestre", "campaign_memory", secretEntries)

      const selectedNpcs = proposal.npcs.filter((_, index) => selectedImports[`npcs.${index}`])
      await insertRows("npcs", "NPCs", "npcs", selectedNpcs.map((npc) => ({
          campaign_id: campaignId,
          name: npc.name,
          role: npc.role || null,
          description: npc.description || null,
          personality: npc.personality || null,
          goals: npc.goals || null,
          secrets: npc.secrets || null,
          visibility: toNpcVisibility(npc.visibility),
          created_by: currentUser.uid,
        })))

      const selectedLocations = proposal.locations.filter((_, index) => selectedImports[`locations.${index}`])
      await insertRows("locations", "Locais", "locations", selectedLocations.map((location) => ({
          campaign_id: campaignId,
          name: location.name,
          type: location.type || null,
          description: location.description || null,
          region: location.region || null,
          visibility: toLocationVisibility(location.visibility),
          created_by: currentUser.uid,
        })))

      const selectedFactions = proposal.factions.filter((_, index) => selectedImports[`factions.${index}`])
      await insertRows("factions", "Facções", "factions", selectedFactions.map((faction) => ({
          campaign_id: campaignId,
          name: faction.name,
          description: faction.description || null,
          goals: faction.goals || null,
          secrets: faction.secrets || null,
          relationship_status: faction.relationship_status || null,
          visibility: toWorldbuildingVisibility(faction.visibility),
          created_by: currentUser.uid,
        })))

      const selectedItems = proposal.items.filter((_, index) => selectedImports[`items.${index}`])
      await insertRows("items", "Itens", "items", selectedItems.map((item) => ({
          campaign_id: campaignId,
          name: item.name,
          item_type: item.item_type || null,
          description: item.description || null,
          rarity: item.rarity || 'common',
          visibility: toWorldbuildingVisibility(item.visibility),
          created_by: currentUser.uid,
        })))

      const selectedQuests = proposal.quests.filter((_, index) => selectedImports[`quests.${index}`])
      await insertRows("quests", "Missões", "quests", selectedQuests.map((quest) => ({
          campaign_id: campaignId,
          title: quest.title,
          description: quest.description || null,
          status: quest.visibility === 'master_only' ? 'draft' : 'active',
          reward_notes: quest.reward_notes || null,
          visibility: toWorldbuildingVisibility(quest.visibility),
          created_by: currentUser.uid,
        })))

      await createOpeningScene()

      const report: WorldImportReport = {
        createdAt: now,
        entries,
        sessionId: createdSessionId,
        sceneId: createdSceneId,
      }
      setWorldImportReport(report)
      if (createdSession) setSessions((prev) => [createdSession as SessionRow, ...prev])
      await refreshWorldPrepSummary()

      const { successes, errors, saved } = summarizeImport(entries)
      console.info('[world-import] import finalizado', {
        campaignId,
        hasUser: Boolean(currentUser),
        successCategories: successes.length,
        errorCategories: errors.length,
        saved,
      })

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Importação parcial",
          description: `${saved} registro(s) salvos. Falha em: ${errors.map((entry) => entry.label).join(', ')}.`,
        })
      } else {
        toast({
          title: "Importação concluída",
          description: `${saved} registro(s) foram salvos no Supabase.`,
        })
      }
    } catch (e: any) {
      console.error('[world-import] erro inesperado', { campaignId, hasUser: Boolean(currentUser), message: e.message })
      toast({ variant: "destructive", title: "Erro ao Importar Mundo", description: e.message })
    } finally {
      setIsImportingWorld(false)
    }
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
          <TabsTrigger value="world-prep" className="rounded-xl px-10 h-full font-ui uppercase tracking-widest text-[11px] font-bold">Preparação</TabsTrigger>
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
              <div className="space-y-4">
                {aiSuggestions.map((suggestion) => (
                  <ApprovalCard
                    key={suggestion.id}
                    icon={<Wand2 className="h-4 w-4" />}
                    type={
                      suggestion.suggestion_type === 'narration' ? 'Narração'
                        : suggestion.suggestion_type === 'npc_dialogue' ? 'Fala de NPC'
                        : 'Resumo de Sessão'
                    }
                    title={suggestion.title || "Sugestão da IA"}
                    desc={suggestion.content || "Sem conteúdo."}
                    time="Pendente"
                    onApprove={() => handleResolveAiSuggestion(suggestion, 'approved')}
                    onReject={() => handleResolveAiSuggestion(suggestion, 'rejected')}
                  />
                ))}
                {aiSuggestions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground italic bg-white/5 rounded-xl border border-dashed border-white/10">
                    A IA Mestre ainda está observando a narrativa.
                  </div>
                )}
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

        <TabsContent value="world-prep" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-1 bg-card/30 border-white/5 p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                  <BookMarked className="h-6 w-6 text-primary" /> Criar Manualmente
                </h3>
                <p className="text-sm text-muted-foreground font-heading italic">
                  NPCs, locais, itens, facções, ameaças e lore entram no mundo somente quando o mestre salva.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["lore", "npc", "location", "item", "faction", "quest", "threat", "secret"] as ManualWorldType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={manualType === type ? "default" : "outline"}
                    className="h-10 text-[10px] uppercase tracking-widest"
                    onClick={() => setManualType(type)}
                  >
                    {type === "location" ? "Local" : type === "faction" ? "Facção" : type === "quest" ? "Missão" : type === "threat" ? "Ameaça" : type === "secret" ? "Segredo" : type}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Nome / Título</Label>
                  <Input value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} placeholder="Ex: Ordem do Eclipse" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Tipo / Papel / Recompensa</Label>
                  <Input value={manualForm.secondary} onChange={e => setManualForm({...manualForm, secondary: e.target.value})} placeholder="Campo auxiliar opcional" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Descrição</Label>
                  <Textarea value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} className="min-h-[130px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Image URL manual</Label>
                  <Input value={manualForm.image_url} onChange={e => setManualForm({...manualForm, image_url: e.target.value})} placeholder="Upload de imagens será ativado na fase de mídia." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Visibilidade</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={manualForm.visibility} onChange={e => setManualForm({...manualForm, visibility: e.target.value as WorldVisibility})}>
                    <option value="master_only">Apenas Mestre</option>
                    <option value="party">Grupo</option>
                    <option value="public">Público</option>
                  </select>
                </div>
                <Button onClick={handleManualWorldCreate} className="w-full rounded-full h-12 bg-primary">
                  Salvar no Mundo
                </Button>
              </div>
            </Card>

            <Card className="xl:col-span-2 bg-card/30 border-white/5 p-8 space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                    <Wand2 className="h-6 w-6 text-primary" /> Importar Mundo com IA
                  </h3>
                  <p className="text-sm text-muted-foreground font-heading italic mt-2">
                    A IA estrutura uma proposta. Nada é salvo como oficial antes da revisão do mestre.
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">Sem upload/R2 nesta fase</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Nome do mundo" value={worldImportForm.worldName} onChange={e => setWorldImportForm({...worldImportForm, worldName: e.target.value})} />
                <Input placeholder="Tom" value={worldImportForm.tone} onChange={e => setWorldImportForm({...worldImportForm, tone: e.target.value})} />
                <Input placeholder="Sistema" value={worldImportForm.ruleSystem} onChange={e => setWorldImportForm({...worldImportForm, ruleSystem: e.target.value})} />
              </div>
              <Input placeholder="Instrução para IA" value={worldImportForm.instructions} onChange={e => setWorldImportForm({...worldImportForm, instructions: e.target.value})} />
              <Textarea
                value={worldImportForm.sourceText}
                onChange={e => setWorldImportForm({...worldImportForm, sourceText: e.target.value})}
                placeholder="Cole aqui texto de mundo, anotações, lore, listas de NPCs, lugares, facções e missões..."
                className="min-h-[260px] font-heading text-base"
              />
              <Button onClick={handleAnalyzeWorldImport} disabled={isAnalyzingWorld || !worldImportForm.sourceText.trim()} className="rounded-full h-12 bg-primary px-10">
                {isAnalyzingWorld ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Analisar e Estruturar Mundo
              </Button>
            </Card>
          </div>

          {worldImportReport && (
            <WorldImportReportPanel report={worldImportReport} campaignId={campaignId} />
          )}

          <WorldPrepSummaryPanel summary={worldPrepSummary} campaignId={campaignId} />

          {worldProposal && (
            <Card className="bg-card/30 border-primary/20 p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-2xl text-primary">
                    {worldImportReport ? "Conteúdo importado com sucesso" : "Revisar Sugestões da IA"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-heading italic mt-2">
                    {worldImportReport
                      ? "A importação foi registrada. Você pode gerar uma nova proposta ou revisar o relatório acima."
                      : "Esta proposta ainda não está salva. Marque os cartões e clique em Importar Selecionados."}
                  </p>
                </div>
                <Button onClick={handleImportSelectedWorld} disabled={isImportingWorld} className="rounded-full h-12 bg-primary px-10">
                  {isImportingWorld ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Importar Selecionados
                </Button>
              </div>

              <WorldSingleReview
                id="world_summary"
                title="Visão Geral do Mundo"
                value={worldProposal.world_summary}
                selected={!!selectedImports.world_summary}
                onSelected={(checked) => setSelectedImports({...selectedImports, world_summary: checked})}
                onChange={(value) => setWorldProposal({...worldProposal, world_summary: value})}
              />

              <WorldReviewSection title="Lore" section="lore_entries" items={worldProposal.lore_entries} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Locais" section="locations" items={worldProposal.locations} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="NPCs" section="npcs" items={worldProposal.npcs} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Facções" section="factions" items={worldProposal.factions} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Itens" section="items" items={worldProposal.items} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Missões iniciais" section="quests" items={worldProposal.quests} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Ameaças" section="threats" items={worldProposal.threats} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />
              <WorldReviewSection title="Segredos do Mestre" section="master_secrets" items={worldProposal.master_secrets.map(secret => ({ ...secret, visibility: 'master_only' as WorldVisibility }))} selectedImports={selectedImports} setSelectedImports={setSelectedImports} updateProposal={updateProposal} />

              <WorldSingleReview
                id="opening_scene"
                title="Criar Cena Inicial"
                value={worldProposal.opening_scene}
                selected={!!selectedImports.opening_scene}
                onSelected={(checked) => setSelectedImports({...selectedImports, opening_scene: checked})}
                onChange={(value) => setWorldProposal({...worldProposal, opening_scene: value})}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card/30 border-white/5 p-8 space-y-6">
              <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" /> Estado da IA
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="font-bold text-sm">IA ativa na campanha</p>
                    <p className="text-xs text-muted-foreground font-heading italic mt-1">campaigns.ai_enabled</p>
                  </div>
                  {campaign?.ai_enabled ? (
                    <Badge className="bg-primary/20 text-primary border border-primary/30"><CircleCheck className="mr-2 h-3.5 w-3.5" /> Ativa</Badge>
                  ) : (
                    <Badge variant="outline" className="border-destructive/30 text-destructive"><CircleX className="mr-2 h-3.5 w-3.5" /> Desativada</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="font-bold text-sm">Narração por IA permitida</p>
                    <p className="text-xs text-muted-foreground font-heading italic mt-1">campaign_settings.ai_can_narrate</p>
                  </div>
                  {campaignSettings?.ai_can_narrate ? (
                    <Badge className="bg-primary/20 text-primary border border-primary/30"><CircleCheck className="mr-2 h-3.5 w-3.5" /> Permitida</Badge>
                  ) : (
                    <Badge variant="outline" className="border-destructive/30 text-destructive"><CircleX className="mr-2 h-3.5 w-3.5" /> Bloqueada</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="font-bold text-sm">Provedor Groq configurado</p>
                    <p className="text-xs text-muted-foreground font-heading italic mt-1">Verificado no servidor, sem expor a chave.</p>
                  </div>
                  {groqConfigured === null ? (
                    <Badge variant="outline" className="border-white/10 text-muted-foreground">Verificando...</Badge>
                  ) : groqConfigured ? (
                    <Badge className="bg-primary/20 text-primary border border-primary/30"><CircleCheck className="mr-2 h-3.5 w-3.5" /> Configurado</Badge>
                  ) : (
                    <Badge variant="outline" className="border-destructive/30 text-destructive"><CircleX className="mr-2 h-3.5 w-3.5" /> Ausente</Badge>
                  )}
                </div>

                {campaignSettings?.ai_default_mode && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="font-bold text-sm">Modo padrão da IA</p>
                      <p className="text-xs text-muted-foreground font-heading italic mt-1">campaign_settings.ai_default_mode</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{campaignSettings.ai_default_mode}</Badge>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-card/30 border-white/5 p-8 space-y-6">
              <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                <Wand2 className="h-6 w-6 text-primary" /> Testar IA da Campanha
              </h3>
              <p className="text-sm text-muted-foreground font-heading italic">
                Envia uma mensagem de teste ao Oráculo (Groq) para confirmar que a integração está respondendo.
              </p>
              <Button
                onClick={handleTestAI}
                disabled={isTestingAI}
                className="w-full rounded-full bg-primary h-14"
              >
                {isTestingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Testar IA da Campanha
              </Button>

              {aiTestResult && (
                <div className={`p-4 rounded-xl border text-sm ${aiTestResult.ok ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                  {aiTestResult.ok ? <Check className="inline h-4 w-4 mr-2" /> : <X className="inline h-4 w-4 mr-2" />}
                  {aiTestResult.message}
                </div>
              )}
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

type WorldArraySection = 'lore_entries' | 'locations' | 'npcs' | 'factions' | 'items' | 'quests' | 'threats' | 'master_secrets'

function WorldImportReportPanel({ report, campaignId }: { report: WorldImportReport; campaignId: string }) {
  const { successes, errors, saved } = summarizeImport(report.entries)

  return (
    <Card className="bg-primary/10 border-primary/30 p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-2xl text-primary flex items-center gap-3">
            <CircleCheck className="h-6 w-6" /> Relatório de Importação
          </h3>
          <p className="text-sm text-muted-foreground font-heading italic mt-1">
            {errors.length > 0
              ? `${saved} registro(s) salvos com ${errors.length} categoria(s) exigindo revisão.`
              : `Importação concluída: ${saved} registro(s) salvos.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full border-primary/30">
            <Link href={`/campaign/${campaignId}/npcs`}>Ver NPCs</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-primary/30">
            <Link href={`/campaign/${campaignId}/locais`}>Ver Locais</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-primary/30">
            <a href="#world-prep-registry">Ver Itens e Facções</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {report.entries.map((entry) => (
          <div key={entry.key} className="rounded-xl border border-white/10 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold font-ui">{entry.label}</p>
              <Badge
                variant={entry.status === "error" ? "destructive" : "outline"}
                className={entry.status === "success" ? "border-primary/30 text-primary" : ""}
              >
                {entry.status === "success" ? `${entry.count} salvo(s)` : entry.status === "error" ? "Erro" : "Ignorado"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-mono">{entry.table}</p>
            {entry.message && <p className="mt-2 text-xs text-muted-foreground">{entry.message}</p>}
          </div>
        ))}
      </div>

      {successes.length > 0 && (
        <p className="text-xs uppercase tracking-widest text-primary/80 font-bold">
          Conteúdo importado com sucesso.
        </p>
      )}
    </Card>
  )
}

function WorldPrepSummaryPanel({ summary, campaignId }: { summary: WorldPrepSummary; campaignId: string }) {
  const hasContent = summary.memory.length > 0 || summary.items.length > 0 || summary.factions.length > 0 || summary.quests.length > 0

  return (
    <Card id="world-prep-registry" className="bg-card/30 border-white/5 p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-2xl flex items-center gap-3">
            <BookMarked className="h-6 w-6 text-accent" /> Registro da Preparação
          </h3>
          <p className="text-sm text-muted-foreground font-heading italic mt-1">
            Últimos conteúdos de mundo salvos fora das Crônicas oficiais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href={`/campaign/${campaignId}/npcs`}>NPCs</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link href={`/campaign/${campaignId}/locais`}>Locais</Link>
          </Button>
        </div>
      </div>

      {!hasContent && (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">
          Nenhum conteúdo de preparação salvo ainda.
        </div>
      )}

      {hasContent && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <WorldPrepList title="Memória" items={summary.memory.map((item) => ({ id: item.id, title: item.title, meta: `${item.memory_type} - ${item.visibility}` }))} />
          <WorldPrepList title="Itens" items={summary.items.map((item) => ({ id: item.id, title: item.name, meta: item.visibility }))} />
          <WorldPrepList title="Facções" items={summary.factions.map((item) => ({ id: item.id, title: item.name, meta: item.visibility }))} />
          <WorldPrepList title="Missões" items={summary.quests.map((item) => ({ id: item.id, title: item.title, meta: item.visibility }))} />
        </div>
      )}
    </Card>
  )
}

function WorldPrepList({ title, items }: { title: string; items: Array<{ id: string; title: string; meta: string }> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] uppercase font-bold tracking-[0.25em] text-muted-foreground">{title}</h4>
      {items.length === 0 && <p className="text-xs text-muted-foreground">Sem registros.</p>}
      {items.map((item) => (
        <div key={item.id} className="rounded-xl bg-white/5 border border-white/5 p-3">
          <p className="text-sm font-bold truncate">{item.title}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">{item.meta}</p>
        </div>
      ))}
    </div>
  )
}

function WorldSingleReview({
  id,
  title,
  value,
  selected,
  onSelected,
  onChange,
}: {
  id: string
  title: string
  value: string
  selected: boolean
  onSelected: (checked: boolean) => void
  onChange: (value: string) => void
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className="text-[10px] uppercase tracking-widest font-bold text-primary">{title}</Label>
        <input id={id} type="checkbox" checked={selected} onChange={(event) => onSelected(event.target.checked)} />
      </div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[110px] bg-background/50" />
    </div>
  )
}

function WorldReviewSection({
  title,
  section,
  items,
  selectedImports,
  setSelectedImports,
  updateProposal,
}: {
  title: string
  section: WorldArraySection
  items: any[]
  selectedImports: Record<string, boolean>
  setSelectedImports: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  updateProposal: (section: keyof WorldImportProposal, index: number, field: string, value: string) => void
}) {
  if (items.length === 0) return null

  return (
    <section className="space-y-4">
      <h4 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-60">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => {
          const key = `${section}.${index}`
          const primaryField = 'title' in item ? 'title' : 'name'
          const bodyField = 'content' in item ? 'content' : 'description'

          return (
            <div key={key} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={key} className="text-[10px] uppercase tracking-widest font-bold text-primary">{title}</Label>
                <input
                  id={key}
                  type="checkbox"
                  checked={!!selectedImports[key]}
                  onChange={(event) => setSelectedImports((prev) => ({ ...prev, [key]: event.target.checked }))}
                />
              </div>
              <Input value={item[primaryField] || ''} onChange={(event) => updateProposal(section, index, primaryField, event.target.value)} />
              <Textarea value={item[bodyField] || ''} onChange={(event) => updateProposal(section, index, bodyField, event.target.value)} className="min-h-[110px] bg-background/50" />
              {'visibility' in item && (
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={item.visibility || 'master_only'}
                  onChange={(event) => updateProposal(section, index, 'visibility', event.target.value)}
                >
                  <option value="master_only">Apenas Mestre</option>
                  <option value="party">Grupo</option>
                  <option value="public">Público</option>
                </select>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
