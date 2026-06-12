
"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  Users,
  Dices,
  MessageSquareDashed,
  Hash,
  Zap,
  ShieldCheck,
  Hourglass,
  Quote,
  Lock,
  BookOpen,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { buildAIContext } from "@/lib/ai-context"
import {
  ExpandableText,
  MessageBadges,
  PlayerActionPanel,
  MasterActionPanel,
  PlayerSuggestionNotice,
  SuggestionCard,
  getMessageMeta,
  type AiSuggestion,
  type PlayerActionMode,
  type MasterActionMode,
} from "./_components/mesa-viva-ui"
import { JournalEntryDialog } from "@/components/journal/journal-entry-dialog"

export default function MesaViva() {
  const { id: campaignId } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { toast } = useToast()

  const [inputValue, setInputValue] = React.useState('')
  const [actionMode, setActionMode] = React.useState<PlayerActionMode | MasterActionMode>('speech')
  const [isSoloMode, setIsSoloMode] = React.useState(false)
  const [isAiThinking, setIsAiThinking] = React.useState(false)
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [pendingSuggestions, setPendingSuggestions] = React.useState<AiSuggestion[]>([])
  const [selectedNpcId, setSelectedNpcId] = React.useState<string | null>(null)
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = React.useState(false)

  const [diceFormula, setDiceFormula] = React.useState('1d20')
  const [rollReason, setRollReason] = React.useState('')
  const [physicalResult, setPhysicalResult] = React.useState('')
  const [isDiceDialogOpen, setIsDiceDialogOpen] = React.useState(false)
  const [activeDiceTab, setActiveDiceTab] = React.useState<string>("virtual")

  const [npcs, setNpcs] = React.useState<any[]>([])

  // Campanha e personagens ativos agora vivem no Supabase Postgres.
  const [campaign, setCampaign] = React.useState<{
    id: string
    name: string
    tone: string | null
    system_key: string | null
    owner_id: string
    ai_enabled: boolean
  } | null>(null)
  const [characters, setCharacters] = React.useState<{
    id: string
    name: string
    race: string | null
    class: string | null
    owner_user_id: string
    avatar_url: string | null
  }[]>([])

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .from('campaigns')
      .select('id, name, tone, system_key, owner_id, ai_enabled')
      .eq('id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCampaign(data)
      })

    supabase
      .from('characters')
      .select('id, name, race, class, owner_user_id, avatar_url')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .then(({ data }) => {
        if (active) setCharacters(data || [])
      })

    supabase
      .from('campaign_settings')
      .select('allow_physical_dice, allow_virtual_dice, require_roll_reason, ai_can_narrate')
      .eq('campaign_id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setDiceSettings(data)
      })

    return () => {
      active = false
    }
  }, [campaignId])

  const myCharacter = characters.find(c => c.owner_user_id === user?.uid)

  // Diário: presente apenas se o personagem possuir o item Diário no Inventário.
  const [hasJournalItem, setHasJournalItem] = React.useState(false)
  const [isJournalDialogOpen, setIsJournalDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (!myCharacter) {
      setHasJournalItem(false)
      return
    }

    let active = true
    const supabase = createClient()

    supabase
      .from('character_items')
      .select('items(name, item_type)')
      .eq('character_id', myCharacter.id)
      .then(({ data }) => {
        if (!active) return
        const found = (data || []).some((row: any) => {
          const item = Array.isArray(row.items) ? row.items[0] : row.items
          if (!item) return false
          const type = (item.item_type || '').toLowerCase()
          const name = (item.name || '').toLowerCase()
          return type === 'journal' || /di[áa]rio/.test(name)
        })
        setHasJournalItem(found)
      })

    return () => {
      active = false
    }
  }, [myCharacter?.id])

  // Sessão e cena ativas (Supabase Postgres)
  const [activeSession, setActiveSession] = React.useState<{
    id: string
    title: string
    status: string
  } | null>(null)
  const [activeScene, setActiveScene] = React.useState<{
    id: string
    session_id: string
    title: string
    location_name: string | null
    visibility: string
    status: string
  } | null>(null)
  const [diceSettings, setDiceSettings] = React.useState<{
    allow_physical_dice: boolean
    allow_virtual_dice: boolean
    require_roll_reason: boolean
    ai_can_narrate: boolean
  } | null>(null)
  const [loadingSession, setLoadingSession] = React.useState(true)

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    async function loadSessionAndScene() {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, title, status')
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!active) return
      setActiveSession(sessionData)

      if (sessionData) {
        const { data: sceneData } = await supabase
          .from('scenes')
          .select('id, session_id, title, location_name, visibility, status')
          .eq('session_id', sessionData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (active) setActiveScene(sceneData)
      } else {
        setActiveScene(null)
      }

      if (active) setLoadingSession(false)
    }

    loadSessionAndScene()

    return () => {
      active = false
    }
  }, [campaignId])

  // Mensagens da cena ativa (Supabase Realtime)
  const [messages, setMessages] = React.useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = React.useState(true)

  React.useEffect(() => {
    if (!activeScene) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let active = true
    setLoadingMessages(true)
    const supabase = createClient()

    supabase
      .from('scene_messages')
      .select('id, sender_user_id, character_id, message_type, visibility, content, metadata, created_at')
      .eq('scene_id', activeScene.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active) return
        setMessages(data || [])
        setLoadingMessages(false)
      })

    const channel = supabase
      .channel(`scene_messages_${activeScene.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scene_messages', filter: `scene_id=eq.${activeScene.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [activeScene])

  // Participantes da cena ativa (Supabase Postgres)
  const [sceneParticipants, setSceneParticipants] = React.useState<{
    id: string
    name: string
    race: string | null
    class: string | null
    avatar_url: string | null
  }[]>([])

  React.useEffect(() => {
    if (!activeScene) {
      setSceneParticipants([])
      setNpcs([])
      return
    }

    let active = true
    const supabase = createClient()

    supabase
      .from('scene_participants')
      .select('character_id, characters(id, name, race, class, avatar_url)')
      .eq('scene_id', activeScene.id)
      .eq('status', 'active')
      .then(({ data }) => {
        if (!active) return
        const list = (data || [])
          .map((row: any) => row.characters)
          .filter((c: any): c is NonNullable<typeof c> => !!c)
        setSceneParticipants(list)
      })

    return () => {
      active = false
    }
  }, [activeScene])

  React.useEffect(() => {
    if (!campaignId || !activeScene) {
      setNpcs([])
      return
    }

    let active = true
    buildAIContext({ campaignId, sceneId: activeScene.id })
      .then(({ presentNpcs }) => {
        if (!active) return
        setNpcs(presentNpcs)
      })
      .catch((error) => {
        if (!active) return
        toast({ variant: "destructive", title: "Erro ao Carregar NPCs da Cena", description: error.message })
      })

    return () => {
      active = false
    }
  }, [campaignId, activeScene, toast])

  const isMaster = campaign?.owner_id === user?.uid;
  const aiCanNarrate = diceSettings ? diceSettings.ai_can_narrate : true;
  const aiAvailable = Boolean(campaign?.ai_enabled) && aiCanNarrate;

  // Entrada vinda da Jornada Solo (dashboard) com ?solo=1: ativa o Oráculo automaticamente.
  React.useEffect(() => {
    if (searchParams?.get('solo') === '1' && aiAvailable && !isMaster) {
      setIsSoloMode(true)
    }
  }, [searchParams, aiAvailable, isMaster])

  // Sugestões pendentes da IA (apenas o mestre lê ai_generated_suggestions, via RLS).
  // Sem realtime nessa tabela: usamos refetch após ações de IA + polling leve.
  const fetchPendingSuggestions = React.useCallback(async () => {
    if (!isMaster || !activeScene) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_generated_suggestions')
      .select('id, session_id, scene_id, suggestion_type, title, content, payload, created_at')
      .eq('campaign_id', campaignId)
      .eq('scene_id', activeScene.id)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar Sugestões da IA", description: error.message })
      return
    }
    setPendingSuggestions((data as AiSuggestion[]) || [])
  }, [isMaster, activeScene, campaignId, toast])

  React.useEffect(() => {
    if (!isMaster || !activeScene) {
      setPendingSuggestions([])
      return
    }
    fetchPendingSuggestions()
    const interval = setInterval(fetchPendingSuggestions, 10000)
    return () => clearInterval(interval)
  }, [isMaster, activeScene, fetchPendingSuggestions])

  const handleSend = async (text?: string, type?: string, rollData?: any) => {
    const finalContent = text || inputValue
    const finalType = type || actionMode
    if (!finalContent.trim() || !activeSession || !activeScene || !user) return

    const supabase = createClient()
    const { error } = await supabase.from('scene_messages').insert({
      campaign_id: campaignId,
      session_id: activeSession.id,
      scene_id: activeScene.id,
      sender_user_id: user.uid,
      character_id: myCharacter?.id ?? null,
      message_type: finalType,
      visibility: 'scene',
      content: finalContent,
      metadata: rollData ? { rollData } : {}
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Enviar", description: error.message })
      return
    }

    if (!text) setInputValue('')
    if (aiAvailable && (finalType === 'action' || finalType === 'speech')) {
      handleAiMasterResponse(finalContent)
    }
  }

  const handleAiMasterResponse = async (playerAction: string, publish: boolean = false) => {
    if (!activeSession || !activeScene || !user) return
    setIsAiThinking(true)
    setAiSuggestion(null)
    setAiError(null)
    try {
      const response = await fetch('/api/ai/narrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          sessionId: activeSession.id,
          sceneId: activeScene.id,
          characterId: myCharacter?.id ?? null,
          playerAction,
          publish,
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao consultar o Oráculo.')

      if (data.published) {
        toast({ title: "Narração Publicada", description: "O Oráculo escreveu o próximo trecho da crônica." })
      } else if (isMaster) {
        // Sugestão registrada em ai_generated_suggestions: o mestre revisa na linha do tempo.
        await fetchPendingSuggestions()
        toast({ title: "Sugestão do Oráculo Recebida", description: "Revise na linha do tempo para publicar como cânone." })
      } else {
        // Resposta do Oráculo é apenas uma sugestão: não vira cânone automaticamente.
        setAiSuggestion(data.output)
      }
    } catch (e: any) {
      setAiError("A IA não respondeu. Verifique a chave da Groq no servidor ou a configuração da campanha.")
      toast({ variant: "destructive", title: "Erro do Oráculo", description: e.message || "A IA encontrou uma bruma mental." })
    } finally { setIsAiThinking(false) }
  }

  // Reaproveita o fluxo de revisão do mestre: aprova (publica como cânone) ou descarta uma sugestão da IA.
  const handleResolveSuggestion = async (suggestion: AiSuggestion, status: 'approved' | 'rejected', editedContent?: string) => {
    if (!campaignId || !user) return
    const supabase = createClient()
    const reviewedAt = new Date().toISOString()

    if (status === 'approved') {
      if (!suggestion.scene_id || !suggestion.session_id) {
        toast({ variant: "destructive", title: "Erro ao Publicar", description: "Sugestão sem cena ou sessão associada." })
        return
      }

      const messageType = suggestion.suggestion_type === 'npc_dialogue' ? 'speech' : 'narration'
      const content = editedContent ?? suggestion.content ?? ''
      const metadata: Record<string, any> = { source: 'groq', approved_suggestion_id: suggestion.id }
      if (editedContent !== undefined) metadata.edited = true
      if (suggestion.suggestion_type === 'npc_dialogue') {
        metadata.npc_id = suggestion.payload?.npc_id
        metadata.npc_name = suggestion.payload?.npc_name
      }

      const { error: messageError } = await supabase.from('scene_messages').insert({
        campaign_id: campaignId,
        session_id: suggestion.session_id,
        scene_id: suggestion.scene_id,
        sender_user_id: user.uid,
        character_id: null,
        message_type: messageType,
        visibility: 'scene',
        content,
        metadata,
      })

      if (messageError) {
        toast({ variant: "destructive", title: "Erro ao Publicar", description: messageError.message })
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

    setPendingSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    toast({
      title: status === 'approved' ? "Publicado como Cânone" : "Sugestão Descartada",
      description: status === 'approved' ? "A sugestão do Oráculo agora é cânone da cena." : "A sugestão foi marcada como descartada.",
    })
  }

  // Mestre pede a um NPC presente que responda diretamente (auto-publica, conforme /api/ai/npc-dialogue).
  const handleNpcDialogue = async () => {
    const text = inputValue.trim()
    if (!selectedNpcId) {
      toast({ variant: "destructive", title: "Selecione um NPC", description: "Escolha o NPC que vai responder." })
      return
    }
    if (!text || !activeSession || !activeScene || !user) return

    setIsAiThinking(true)
    try {
      const response = await fetch('/api/ai/npc-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          sessionId: activeSession.id,
          sceneId: activeScene.id,
          npcId: selectedNpcId,
          characterId: myCharacter?.id ?? null,
          message: text,
          publish: true,
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao consultar o Oráculo.')

      if (data.published) {
        toast({ title: "Fala do NPC Publicada", description: `${data.npcName} respondeu na cena.` })
      } else {
        await fetchPendingSuggestions()
        toast({ title: "Sugestão Gerada", description: "A fala do NPC ficou pendente de revisão." })
      }
      setInputValue('')
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro do Oráculo", description: e.message || "O NPC não respondeu." })
    } finally { setIsAiThinking(false) }
  }

  // Mestre registra um evento de cena (scene_events) e o exibe na linha do tempo como mensagem de Sistema.
  const handleRegisterEvent = async () => {
    const text = inputValue.trim()
    if (!text || !activeSession || !activeScene || !user) return

    const supabase = createClient()
    const { error: eventError } = await supabase.from('scene_events').insert({
      campaign_id: campaignId,
      session_id: activeSession.id,
      scene_id: activeScene.id,
      event_type: 'note',
      content: text,
      metadata: {},
      created_by: user.uid,
    })

    if (eventError) {
      toast({ variant: "destructive", title: "Erro ao Registrar Evento", description: eventError.message })
      return
    }

    const { error: messageError } = await supabase.from('scene_messages').insert({
      campaign_id: campaignId,
      session_id: activeSession.id,
      scene_id: activeScene.id,
      sender_user_id: user.uid,
      character_id: null,
      message_type: 'system',
      visibility: 'scene',
      content: text,
      metadata: { source: 'system', event: true },
    })

    if (messageError) {
      toast({ variant: "destructive", title: "Erro ao Exibir Evento", description: messageError.message })
      return
    }

    setInputValue('')
    toast({ title: "Evento Registrado", description: "O evento foi adicionado ao registro da cena." })
  }

  const handleSubmitAction = async () => {
    switch (actionMode) {
      case 'speech':
      case 'action':
      case 'narration':
        if (!inputValue.trim()) return
        await handleSend(undefined, actionMode)
        break
      case 'oracle': {
        const text = inputValue.trim()
        if (!text) return
        setInputValue('')
        await handleAiMasterResponse(text, false)
        break
      }
      case 'npc_dialogue':
        await handleNpcDialogue()
        break
      case 'event':
        await handleRegisterEvent()
        break
    }
  }

  const handleOpenDice = () => {
    if (diceSettings && !diceSettings.allow_physical_dice && !diceSettings.allow_virtual_dice) {
      toast({ variant: "destructive", title: "Rolagem Indisponível", description: "A rolagem de dados está desativada para esta campanha." })
      return
    }
    setIsDiceDialogOpen(true)
  }

  const aiDisabledReason = !campaign?.ai_enabled
    ? "A IA está desativada para esta campanha."
    : !aiCanNarrate
    ? "A narração por IA está desativada nas configurações da campanha."
    : ""

  const handlePublishSuggestionShortcut = () => {
    if (pendingSuggestions.length === 0) {
      toast({ title: "Nenhuma Sugestão Pendente", description: "O Oráculo ainda não enviou sugestões para revisão." })
      return
    }
    document.getElementById(`suggestion-${pendingSuggestions[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Linha do Tempo da Cena: combina mensagens canônicas (scene_messages) com
  // sugestões pendentes da IA visíveis apenas ao mestre (ai_generated_suggestions).
  type TimelineEntry =
    | { kind: 'message'; id: string; createdAt: string; data: any }
    | { kind: 'suggestion'; id: string; createdAt: string; data: AiSuggestion }

  const timelineEntries = React.useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = messages.map((m: any) => ({
      kind: 'message' as const, id: m.id, createdAt: m.created_at, data: m,
    }))
    if (isMaster) {
      for (const s of pendingSuggestions) {
        entries.push({ kind: 'suggestion' as const, id: s.id, createdAt: s.created_at, data: s })
      }
    }
    return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, pendingSuggestions, isMaster])

  const handleRollDice = async (isPhysical: boolean = false) => {
    if (!activeSession || !activeScene || !user) return
    let result = 0
    let formula = diceFormula
    if (isPhysical) {
      result = parseInt(physicalResult)
      if (isNaN(result)) {
        toast({ variant: "destructive", title: "Resultado Inválido", description: "Informe um número." })
        return
      }
    } else {
      try {
        const parts = formula.toLowerCase().split('d')
        const numDice = parseInt(parts[0]) || 1
        const remaining = parts[1]
        let dieSize = 20
        let modifier = 0
        if (remaining.includes('+')) {
          const subParts = remaining.split('+')
          dieSize = parseInt(subParts[0]); modifier = parseInt(subParts[1])
        } else if (remaining.includes('-')) {
          const subParts = remaining.split('-'); dieSize = parseInt(subParts[0]); modifier = -parseInt(subParts[1])
        } else dieSize = parseInt(remaining)
        for (let i = 0; i < numDice; i++) result += Math.floor(Math.random() * dieSize) + 1
        result += modifier
      } catch (e) {
        toast({ variant: "destructive", title: "Fórmula Inválida", description: "Use XdY+Z" })
        return
      }
    }

    const rollMsg = `Rolou ${formula}${rollReason ? ` para ${rollReason}` : ''}: **${result}**`

    const supabase = createClient()
    const { error: rollError } = await supabase.from('dice_rolls').insert({
      campaign_id: campaignId,
      session_id: activeSession.id,
      scene_id: activeScene.id,
      character_id: myCharacter?.id ?? null,
      user_id: user.uid,
      roll_type: isPhysical ? 'physical' : 'virtual',
      formula,
      raw_result: result,
      modifier: 0,
      total: result,
      reason: rollReason || null,
      visibility: 'scene'
    })

    if (rollError) {
      toast({ variant: "destructive", title: "Erro ao Registrar Rolagem", description: rollError.message })
      return
    }

    await handleSend(rollMsg, 'dice', { formula, result, isPhysical, reason: rollReason })

    setIsDiceDialogOpen(false)
    setPhysicalResult('')
    setRollReason('')
  }

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-heading italic text-3xl opacity-40">Sincronizando com o Arcano...</div>
  if (!activeSession || !activeScene) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-10 text-center p-10 bg-[#050711]">
      <div className="p-8 rounded-full bg-primary/5 border border-primary/10 text-primary opacity-30"><MessageSquareDashed className="h-24 w-24" /></div>
      <div className="space-y-4">
        <h2 className="text-5xl font-display font-black text-primary">Portal Fechado</h2>
        <p className="text-2xl font-heading italic text-muted-foreground max-w-md">"O tempo parou nesta crônica. Nenhuma sessão está em curso."</p>
      </div>
      {isMaster && (
        <Button asChild className="btn-ritual rounded-full px-12 h-16 text-xl shadow-arcane">
          <a href={`/campaign/${campaignId}/master`}>Iniciar Sessão Oficial</a>
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex h-screen mesa-viva-bg bg-fixed overflow-hidden">
      {/* Sidebar de Presença */}
      <div className="w-85 border-r border-primary/20 bg-sidebar/80 backdrop-blur-3xl hidden xl:flex flex-col p-8 space-y-12 shadow-2xl">
        <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary opacity-60 flex items-center">
              <Users className="mr-3 h-4 w-4" /> Em Torno da Mesa
            </h3>
            <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
        </div>

        <section className="space-y-6">
          <div className="space-y-6">
             <ParticipantItem name={user?.displayName || "Você"} photo={myCharacter?.avatar_url ?? undefined} role={isMaster ? "Mestre Arcano" : (myCharacter?.class || "Aventureiro")} status="Ativo" />
             {sceneParticipants.filter(c => c.id !== myCharacter?.id).map(c => (
               <ParticipantItem key={c.id} name={c.name} photo={c.avatar_url ?? undefined} role={c.class || "Aventureiro"} status="Em cena" />
             ))}
             {isSoloMode && <ParticipantItem name="O Oráculo" role="Narrador IA" status={isAiThinking ? "Tecendo Destino..." : "Observando"} isAI />}
             {npcs.map(npc => (
               <ParticipantItem key={npc.id} name={npc.name} photo={npc.imageURL} role={npc.role} status="Presente" isNPC />
             ))}
          </div>
        </section>

        <section className="space-y-6 pt-10 border-t border-white/5">
          <h3 className="text-[10px] font-display uppercase tracking-[0.3em] text-primary opacity-60 flex items-center">
            <Lock className="mr-3 h-4 w-4" /> Leis da Sessão
          </h3>
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 oracle-glow">
             <div className="flex items-center gap-3">
                <Dices className="h-5 w-5 text-primary" />
                <p className="text-xs font-display font-bold uppercase tracking-widest text-primary">Política de Dados</p>
             </div>
             <p className="text-[11px] font-heading italic text-muted-foreground leading-relaxed opacity-70">
               {diceSettings && !diceSettings.allow_physical_dice ? "Apenas dados virtuais permitidos." :
                diceSettings && !diceSettings.allow_virtual_dice ? "Apenas resultados físicos permitidos." :
                "Política flexível: física ou virtual."}
             </p>
          </div>
        </section>

        {!isMaster && (
          <section className="mt-auto pt-10 border-t border-white/5">
            <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20 space-y-5">
              <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.2em] text-center">Jornada Solo</p>
              <p className="text-[11px] text-muted-foreground italic text-center font-heading">
                {!aiAvailable ? "A IA está desativada para esta campanha." : "\"O Oráculo narrará seus atos.\""}
              </p>
              <Button
                onClick={() => setIsSoloMode(!isSoloMode)}
                disabled={!aiAvailable}
                className={`w-full rounded-2xl h-12 transition-all font-display text-[10px] tracking-widest disabled:opacity-30 disabled:cursor-not-allowed ${isSoloMode ? 'btn-arcane' : 'border-secondary text-secondary hover:bg-secondary/10 border-2'}`}
              >
                {isSoloMode ? "Dissipar Oráculo" : "Invocar Oráculo"}
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Área Principal de Jogo */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-8 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex justify-between items-center px-12 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-3xl font-display font-black text-primary flex items-center gap-3 tracking-tighter">
                {isMaster && <ShieldCheck className="h-6 w-6 text-primary" />}
                Mesa Viva
              </h2>
              <p className="text-sm text-muted-foreground font-heading italic mt-1">Sessão interativa com apoio da IA.</p>
              <div className="flex items-center gap-4 mt-2">
                 <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-display tracking-widest px-3 py-0.5">Sessão Ativa</Badge>
                 <span className="text-[9px] text-muted-foreground font-display uppercase tracking-[0.2em] opacity-40">{activeSession.title}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
             <Dialog open={isDiceDialogOpen} onOpenChange={setIsDiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-ritual rounded-2xl h-14 w-14 literary-shadow group">
                  <Dices className="h-7 w-7 group-hover:rotate-45 transition-transform duration-500" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30 literary-shadow max-w-md p-10 rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl text-primary text-center">Lançar Sorte</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeDiceTab} onValueChange={setActiveDiceTab} className="w-full mt-8">
                  <TabsList className="grid w-full grid-cols-2 bg-black/40 h-14 p-1.5 rounded-2xl">
                    <TabsTrigger value="virtual" disabled={diceSettings ? !diceSettings.allow_virtual_dice : false} className="text-[10px] font-display uppercase tracking-widest flex gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl h-full transition-all">
                      <Zap className="h-4 w-4" /> Virtual
                    </TabsTrigger>
                    <TabsTrigger value="physical" disabled={diceSettings ? !diceSettings.allow_physical_dice : false} className="text-[10px] font-display uppercase tracking-widest flex gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl h-full transition-all">
                      <Hash className="h-4 w-4" /> Físico
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="virtual" className="space-y-8 pt-8 animate-in slide-in-from-left-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-display uppercase tracking-widest text-primary opacity-60">Fórmula Arcana</Label>
                        <div className="flex gap-3">
                          <Input value={diceFormula} onChange={e => setDiceFormula(e.target.value)} placeholder="1d20+5" className="font-code text-2xl h-16 bg-black/20 border-primary/20 text-center" />
                          <Button onClick={() => handleRollDice(false)} className="btn-ritual h-16 px-10">Rolar</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="physical" className="space-y-8 pt-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-display uppercase tracking-widest text-primary opacity-60">Resultado Real</Label>
                        <div className="flex gap-3">
                          <Input value={physicalResult} onChange={e => setPhysicalResult(e.target.value)} placeholder="Total" type="number" className="font-code text-3xl h-16 bg-black/20 border-primary/20 text-center" />
                          <Button onClick={() => handleRollDice(true)} className="btn-ritual h-16 px-10">Registrar</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
             </Dialog>
          </div>
        </header>

        <div className="mx-12 mt-6 rounded-2xl border border-secondary/20 bg-secondary/5 px-5 py-3 text-[11px] text-muted-foreground font-heading italic">
          A Mesa Viva é o modo de jogo assistido pela IA. O mestre continua aprovando o que vira cânone.
        </div>

        <ScrollArea className="flex-1 p-10 px-16 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, rgba(var(--primary), 0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }}>
          <div className="max-w-5xl mx-auto space-y-16 pb-32">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30 animate-pulse">
                 <Hourglass className="h-12 w-12 text-primary animate-spin-slow" />
                 <p className="font-heading italic text-2xl tracking-widest">Consultando os anais...</p>
              </div>
            ) : timelineEntries.length > 0 ? (
              timelineEntries.map((entry) =>
                entry.kind === 'message' ? (
                  <OracleMessage
                    key={entry.id}
                    msg={toDisplayMessage(entry.data, characters, campaign?.owner_id)}
                    currentUserId={user?.uid}
                  />
                ) : (
                  <div key={entry.id} id={`suggestion-${entry.id}`}>
                    <SuggestionCard
                      suggestion={entry.data}
                      onPublish={() => handleResolveSuggestion(entry.data, 'approved')}
                      onDiscard={() => handleResolveSuggestion(entry.data, 'rejected')}
                      onEditPublish={(content) => handleResolveSuggestion(entry.data, 'approved', content)}
                    />
                  </div>
                )
              )
            ) : (
              <div className="text-center py-40 space-y-8 opacity-40">
                <Sparkles className="h-16 w-16 text-primary/50 mx-auto" />
                <p className="text-3xl font-heading italic max-w-md mx-auto leading-relaxed">"O tempo parou. As páginas estão em branco. O que você faz?"</p>
              </div>
            )}
            {isAiThinking && (
              <div className="flex gap-10 animate-pulse max-w-4xl">
                <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 border border-secondary/30 flex items-center justify-center oracle-glow">
                  <Sparkles className="h-7 w-7 text-secondary animate-spin-slow" />
                </div>
                <div className="space-y-4 py-2">
                  <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.3em]">Tecendo o destino...</p>
                  <div className="h-5 w-[30rem] bg-secondary/10 rounded-full" />
                </div>
              </div>
            )}
            {aiSuggestion && (
              <PlayerSuggestionNotice content={aiSuggestion} onDismiss={() => setAiSuggestion(null)} />
            )}
            {aiError && (
              <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-700 max-w-4xl">
                <div className="h-16 w-16 rounded-[1.5rem] bg-destructive/10 p-4 shrink-0 border border-destructive/40 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-destructive" />
                </div>
                <div className="space-y-4 pt-1">
                  <p className="text-[10px] font-display uppercase font-bold text-destructive tracking-[0.4em]">
                    O Oráculo está em silêncio
                  </p>
                  <div className="text-xl leading-relaxed text-foreground/80 font-heading italic">
                    {aiError}
                  </div>
                  <button
                    onClick={() => setAiError(null)}
                    className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dispensar aviso
                  </button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Rodapé de Ação: jogador e mestre, sempre acessível */}
        <div className="p-10 px-16 border-t border-primary/10 bg-background/95 backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto space-y-5">
            <PlayerActionPanel
              actionMode={actionMode}
              onSelectMode={(mode) => setActionMode(mode)}
              onOpenDice={handleOpenDice}
              aiAvailable={aiAvailable}
              isAiThinking={isAiThinking}
              aiDisabledReason={aiDisabledReason}
            />

            {hasJournalItem && myCharacter && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsJournalDialogOpen(true)}
                  className="gap-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Registrar no Diário
                </Button>
              </div>
            )}

            {isMaster && (
              <MasterActionPanel
                actionMode={actionMode}
                onSelectMode={(mode) => setActionMode(mode)}
                onPublishSuggestion={handlePublishSuggestionShortcut}
                onFinalizeSession={() => setIsFinalizeDialogOpen(true)}
                pendingCount={pendingSuggestions.length}
              />
            )}

            {isMaster && actionMode === 'npc_dialogue' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-display uppercase tracking-widest text-primary opacity-60">NPC que vai responder</Label>
                <Select value={selectedNpcId ?? undefined} onValueChange={setSelectedNpcId}>
                  <SelectTrigger className="bg-black/30 border-primary/20 h-12 rounded-2xl font-heading">
                    <SelectValue placeholder="Selecione um NPC presente na cena" />
                  </SelectTrigger>
                  <SelectContent>
                    {npcs.map((npc: any) => (
                      <SelectItem key={npc.id} value={npc.id}>{npc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {npcs.length === 0 && (
                  <p className="text-[11px] font-heading italic text-muted-foreground opacity-60">Nenhum NPC presente nesta cena.</p>
                )}
              </div>
            )}

            <div className="relative">
              <Textarea
                placeholder={getActionPlaceholder(actionMode)}
                className="pr-28 py-8 min-h-[7rem] max-h-64 rounded-[2rem] bg-black/40 border-primary/20 font-heading italic focus-visible:ring-primary text-2xl literary-shadow placeholder:text-muted-foreground/30 px-10 resize-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitAction()
                  }
                }}
              />
              <div className="absolute right-6 bottom-6">
                <Button
                  onClick={handleSubmitAction}
                  disabled={isAiThinking}
                  className="h-16 w-16 rounded-[1.5rem] btn-ritual shadow-arcane hover:scale-110 active:scale-95 transition-all disabled:opacity-40"
                >
                  <Send className="h-7 w-7" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finalizar Sessão: confirmação leve, fluxo completo de encerramento vive no Painel do Mestre */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent className="bg-card border-primary/30 literary-shadow max-w-md p-10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">Finalizar e Gerar Rascunho de Crônica</DialogTitle>
            <DialogDescription className="font-heading italic text-muted-foreground pt-2">
              A Mesa Viva não publica crônica oficial automaticamente. O Painel do Mestre encerra a sessão e gera um rascunho para revisão.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-3">
            <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)} className="rounded-2xl">Voltar à Mesa</Button>
            <Button asChild className="btn-ritual rounded-2xl">
              <a href={`/campaign/${campaignId}/master`}>Gerar Rascunho no Painel</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar no Diário: entrada privada por padrão, vinculada à sessão/cena ativa */}
      {myCharacter && (
        <JournalEntryDialog
          open={isJournalDialogOpen}
          onOpenChange={setIsJournalDialogOpen}
          campaignId={campaignId}
          characterId={myCharacter.id}
          sessionId={activeSession?.id}
          sceneId={activeScene?.id}
        />
      )}
    </div>
  );
}

const ACTION_PLACEHOLDERS: Record<string, string> = {
  speech: "O que você diz?",
  action: "O que você faz?",
  oracle: "O que você quer perguntar ao Oráculo?",
  narration: "Narre o destino...",
  npc_dialogue: "O que o jogador disse? A IA responderá no papel do NPC selecionado...",
  event: "Descreva o evento a registrar na crônica...",
}

function getActionPlaceholder(actionMode: string) {
  return ACTION_PLACEHOLDERS[actionMode] || "O que você faz?"
}

function toDisplayMessage(msg: any, characters: { id: string, name: string, avatar_url: string | null }[], ownerId?: string) {
  const character = characters.find((c) => c.id === msg.character_id)
  const isAiNarration = msg.message_type === 'narration' && msg.metadata?.source === 'groq'
  const isMasterSender = msg.sender_user_id === ownerId
  const meta = getMessageMeta(msg.message_type, msg.metadata, isMasterSender)

  let senderName = character?.name
  if (!senderName) {
    if (msg.message_type === 'narration') senderName = isAiNarration ? 'Oráculo Arcano' : 'Mestre Arcano'
    else if (msg.message_type === 'speech' && msg.metadata?.source === 'groq') senderName = msg.metadata?.npc_name || 'NPC'
    else if (msg.message_type === 'system') senderName = 'Sistema'
    else senderName = 'Mestre Arcano'
  }

  return {
    id: msg.id,
    type: msg.message_type,
    text: msg.content,
    senderId: msg.sender_user_id,
    senderName,
    senderPhotoURL: character?.avatar_url || '',
    rollData: msg.metadata?.rollData || null,
    meta,
  }
}

function OracleMessage({ msg, currentUserId }: { msg: any, currentUserId?: string }) {
  const isNarrator = msg.type === 'narration';
  const isMine = msg.senderId === currentUserId;
  const isAction = msg.type === 'action';
  const isDice = msg.type === 'dice';
  const isSystem = msg.type === 'system';

  if (isNarrator) {
    return (
      <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-1000 max-w-6xl">
        <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/20 p-4 shrink-0 border border-secondary/40 shadow-arcane flex items-center justify-center group relative overflow-hidden">
          <Sparkles className="h-full w-full text-primary relative z-10" />
        </div>
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[10px] font-display uppercase font-bold text-primary tracking-[0.4em]">
              {msg.senderName}
            </p>
            <MessageBadges meta={msg.meta} status="Cânone" />
          </div>
          <ExpandableText
            text={msg.text}
            threshold={600}
            className="text-3xl leading-relaxed text-foreground/90 font-heading italic first-letter:text-6xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-primary"
          />
        </div>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 space-y-2 max-w-2xl w-full text-center">
          <div className="flex justify-center">
            <MessageBadges meta={msg.meta} status="Cânone" />
          </div>
          <ExpandableText text={msg.text} threshold={400} className="text-base font-heading italic text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (isDice) {
    return (
      <div className={`flex flex-col gap-3 ${isMine ? 'items-end' : 'items-start'}`}>
        <MessageBadges meta={msg.meta} status="Cânone" />
        <div className={`flex gap-8 animate-in duration-700 zoom-in-95 ${isMine ? 'justify-end' : ''}`}>
          <div className={`p-8 rounded-[2.5rem] border-2 flex items-center gap-10 literary-shadow transition-all hover:scale-105 ${
            msg.rollData?.isPhysical ? 'bg-primary/5 border-primary/40 shadow-gold' : 'bg-secondary/5 border-secondary/40 shadow-arcane'
          }`}>
            <div className={`p-5 rounded-[1.5rem] ${msg.rollData?.isPhysical ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
              {msg.rollData?.isPhysical ? <Hash className="h-10 w-10" /> : <Dices className="h-10 w-10" />}
            </div>
            <div>
              <p className="text-[10px] font-display uppercase font-bold tracking-[0.2em] opacity-40 mb-2">{msg.senderName} conjurou {msg.rollData?.formula}</p>
              <p className="text-6xl font-display font-black tracking-tighter text-foreground">{msg.rollData?.result}</p>
              {msg.rollData?.reason && <p className="text-sm font-heading italic text-muted-foreground mt-3 border-l-2 border-primary/20 pl-4">"{msg.rollData?.reason}"</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const senderPhoto = msg.senderPhotoURL || `https://picsum.photos/seed/${msg.senderId}/200/200`;

  return (
    <div className={`flex gap-8 animate-in duration-500 ${isMine ? 'justify-end slide-in-from-right-8' : 'slide-in-from-left-8'}`}>
      {!isMine && (
        <Dialog>
          <DialogTrigger asChild>
            <Avatar className="h-16 w-16 rounded-[1.5rem] shrink-0 border-2 border-white/5 bg-black/40 shadow-lg cursor-zoom-in hover:scale-105 transition-transform">
              <AvatarImage src={senderPhoto} className="object-cover" />
              <AvatarFallback className="text-xl font-display font-bold">{msg.senderName[0]}</AvatarFallback>
            </Avatar>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
             <img src={senderPhoto} alt={msg.senderName} className="w-full h-full object-contain" />
          </DialogContent>
        </Dialog>
      )}
      <div className={`space-y-4 ${isMine ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-center gap-3 flex-wrap ${isMine ? 'justify-end' : ''}`}>
          <p className={`text-[10px] font-display uppercase font-bold tracking-[0.3em] ${isMine ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>
            {msg.senderName}
          </p>
          <MessageBadges meta={msg.meta} status="Cânone" />
        </div>
        <div className={`p-8 rounded-[2rem] border-2 text-2xl inline-block max-w-2xl literary-shadow transition-all relative overflow-hidden ${
          isMine
            ? 'bg-primary/5 border-primary/30 text-foreground'
            : 'bg-black/40 border-white/5 text-foreground'
        } ${isAction ? 'font-heading italic bg-secondary/5 border-secondary/20' : 'font-body font-light leading-relaxed'}`}>
          {isAction ? (
            <span className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-secondary opacity-50 shrink-0 mt-1" />
              <ExpandableText text={`*${msg.text}*`} className="text-left" />
            </span>
          ) : (
            <span className="flex items-start gap-4">
               <Quote className="h-5 w-5 text-primary/30 rotate-180 shrink-0 mt-1" />
               <ExpandableText text={`"${msg.text}"`} className="text-left" />
            </span>
          )}
        </div>
      </div>
      {isMine && (
        <Dialog>
          <DialogTrigger asChild>
            <Avatar className="h-16 w-16 rounded-[1.5rem] shrink-0 border-2 border-primary/40 bg-primary/10 shadow-gold cursor-zoom-in hover:scale-105 transition-transform">
              <AvatarImage src={senderPhoto} className="object-cover" />
              <AvatarFallback className="text-primary font-display font-black text-xl">{msg.senderName[0]}</AvatarFallback>
            </Avatar>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
             <img src={senderPhoto} alt={msg.senderName} className="w-full h-full object-contain" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ParticipantItem({ name, photo, role, status, isAI = false, isNPC = false }: { name: string, photo?: string, role: string, status: string, isAI?: boolean, isNPC?: boolean }) {
  const displayPhoto = photo || `https://picsum.photos/seed/${name}/100/100`;
  
  return (
    <div className="flex items-center gap-5 group cursor-default p-3 rounded-2xl hover:bg-white/5 transition-all">
      <Dialog>
        <DialogTrigger asChild>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg transition-all group-hover:scale-110 border-2 overflow-hidden cursor-zoom-in ${
            isAI ? 'bg-secondary/20 text-secondary border-secondary/40 shadow-arcane' : 
            isNPC ? 'bg-accent/20 text-accent border-accent/40 shadow-gold' :
            'bg-primary/20 text-primary border-primary/40 shadow-arcane'
          }`}>
            {isAI ? <Sparkles className="h-6 w-6" /> : <img src={displayPhoto} className="w-full h-full object-cover" />}
          </div>
        </DialogTrigger>
        <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
           <img src={isAI ? '/ai-orb.png' : displayPhoto} alt={name} className="w-full h-full object-contain" />
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col">
        <span className={`text-lg font-display font-bold group-hover:text-primary transition-colors ${isAI ? 'text-secondary' : isNPC ? 'text-accent' : 'text-primary'}`}>{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-display font-bold opacity-40">{role}</span>
          <span className="h-1 w-1 rounded-full bg-primary/30" />
          <span className={`text-[10px] font-heading italic font-bold ${status.includes('...') ? 'animate-pulse text-secondary' : 'text-muted-foreground opacity-30'}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}
