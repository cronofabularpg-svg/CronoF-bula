
"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
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
  Volume2, 
  Ghost,
  Hash,
  Crown,
  Zap,
  Shield,
  ShieldCheck,
  Eye,
  MessageSquare,
  Lock,
  Infinity,
  Hourglass,
  Quote,
  Maximize2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { buildAIContext } from "@/lib/ai-context"

export default function MesaViva() {
  const { id: campaignId } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { toast } = useToast()

  const [inputValue, setInputValue] = React.useState('')
  const [messageType, setMessageType] = React.useState<'speech' | 'action' | 'narration'>('speech')
  const [isSoloMode, setIsSoloMode] = React.useState(false)
  const [isAiThinking, setIsAiThinking] = React.useState(false)
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)
  
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

  const handleSend = async (text?: string, type?: string, rollData?: any) => {
    const finalContent = text || inputValue
    const finalType = type || (isMaster && messageType === 'narration' ? 'narration' : messageType)
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
      } else {
        // Resposta do Oráculo é apenas uma sugestão: não vira cânone automaticamente.
        setAiSuggestion(data.output)
      }
    } catch (e: any) {
      setAiError("A IA não respondeu. Verifique a chave da Groq no servidor ou a configuração da campanha.")
      toast({ variant: "destructive", title: "Erro do Oráculo", description: e.message || "A IA encontrou uma bruma mental." })
    } finally { setIsAiThinking(false) }
  }

  const handlePublishSuggestion = async () => {
    if (!aiSuggestion || !activeSession || !activeScene || !user) return
    const supabase = createClient()
    const { error } = await supabase.from('scene_messages').insert({
      campaign_id: campaignId,
      session_id: activeSession.id,
      scene_id: activeScene.id,
      sender_user_id: user.uid,
      character_id: null,
      message_type: 'narration',
      visibility: 'scene',
      content: aiSuggestion,
      metadata: { source: 'ai-narrator' },
    })

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Publicar", description: error.message })
      return
    }

    setAiSuggestion(null)
    toast({ title: "Narração Publicada", description: "A sugestão do Oráculo agora é cânone da cena." })
  }

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
                {activeSession.title}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                 <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-display tracking-widest px-3 py-0.5">Sessão Ativa</Badge>
                 <span className="text-[9px] text-muted-foreground font-display uppercase tracking-[0.2em] opacity-40">O tempo corre...</span>
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

        <ScrollArea className="flex-1 p-10 px-16 bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, rgba(var(--primary), 0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }}>
          <div className="max-w-5xl mx-auto space-y-16 pb-32">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30 animate-pulse">
                 <Hourglass className="h-12 w-12 text-primary animate-spin-slow" />
                 <p className="font-heading italic text-2xl tracking-widest">Consultando os anais...</p>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <OracleMessage key={msg.id} msg={toDisplayMessage(msg, characters)} currentUserId={user?.uid} />
              ))
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
              <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-700 max-w-4xl">
                <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 p-4 shrink-0 border border-secondary/40 flex items-center justify-center oracle-glow">
                  <Sparkles className="h-7 w-7 text-secondary" />
                </div>
                <div className="space-y-4 pt-1">
                  <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.4em] flex items-center gap-3">
                    O Oráculo Arcano
                    <Badge variant="outline" className="border-secondary/40 text-secondary text-[8px] px-2 h-4 uppercase font-black">Sugestão • não registrada</Badge>
                  </p>
                  <div className="text-xl leading-relaxed text-foreground/80 font-heading italic">
                    {aiSuggestion}
                  </div>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Descartar sugestão
                    </button>
                    {isMaster && (
                      <button
                        onClick={handlePublishSuggestion}
                        className="text-[10px] font-display uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                      >
                        Publicar como narração
                      </button>
                    )}
                  </div>
                </div>
              </div>
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

        {/* Rodapé de Ação */}
        <div className="p-10 px-16 border-t border-primary/10 bg-background/95 backdrop-blur-2xl shrink-0">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <RitualShortcut icon={<Volume2 />} label="Falar" active={messageType === 'speech'} onClick={() => setMessageType('speech')} />
              <RitualShortcut icon={<Ghost />} label="Agir" active={messageType === 'action'} onClick={() => setMessageType('action')} />
              {isMaster && (
                <>
                  <RitualShortcut icon={<Sparkles />} label="Narrar" active={messageType === 'narration'} onClick={() => setMessageType('narration')} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <RitualShortcut
                            icon={<Sparkles />}
                            label={isAiThinking ? "Tecendo..." : "Pedir ao Oráculo"}
                            disabled={!aiAvailable || isAiThinking}
                            onClick={() => handleAiMasterResponse(inputValue.trim() || 'Continue a narrativa a partir da cena atual.', true)}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {campaign && !campaign.ai_enabled
                          ? "A IA está desativada para esta campanha."
                          : !aiCanNarrate
                          ? "A narração por IA está desativada nas configurações da campanha."
                          : "A IA narra o próximo trecho e publica como cena oficial."}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            
            <div className="relative">
              <Input 
                placeholder={messageType === 'narration' ? "Narre o destino..." : `O que você faz?`}
                className="pr-36 py-14 rounded-[2rem] bg-black/40 border-primary/20 font-heading italic focus:ring-primary text-2xl literary-shadow placeholder:text-muted-foreground/30 px-10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <Button onClick={() => handleSend()} className="h-20 w-20 rounded-[1.5rem] btn-ritual shadow-arcane hover:scale-110 active:scale-95 transition-all">
                  <Send className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toDisplayMessage(msg: any, characters: { id: string, name: string, avatar_url: string | null }[]) {
  const character = characters.find((c) => c.id === msg.character_id)
  const isAiNarration = msg.message_type === 'narration' && msg.metadata?.source === 'ai-narrator'

  return {
    id: msg.id,
    type: msg.message_type,
    text: msg.content,
    senderId: msg.sender_user_id,
    senderName: character?.name || (msg.message_type === 'narration' ? (isAiNarration ? 'Oráculo Arcano' : 'Mestre Arcano') : 'Mestre Arcano'),
    senderPhotoURL: character?.avatar_url || '',
    rollData: msg.metadata?.rollData || null,
  }
}

function OracleMessage({ msg, currentUserId }: { msg: any, currentUserId?: string }) {
  const isNarrator = msg.type === 'narration';
  const isMine = msg.senderId === currentUserId;
  const isAction = msg.type === 'action';
  const isDice = msg.type === 'dice';

  if (isNarrator) {
    return (
      <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-1000 max-w-6xl">
        <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/20 p-4 shrink-0 border border-secondary/40 shadow-arcane flex items-center justify-center group relative overflow-hidden">
          <Sparkles className="h-full w-full text-primary relative z-10" />
        </div>
        <div className="space-y-4 pt-1">
          <p className="text-[10px] font-display uppercase font-bold text-primary tracking-[0.4em] flex items-center gap-3">
            O Oráculo Arcano • {msg.senderName}
            <Badge className="bg-primary/10 text-primary border border-primary/30 text-[8px] px-2 h-4 uppercase font-black">Cânone</Badge>
          </p>
          <div className="text-3xl leading-relaxed text-foreground/90 font-heading italic first-letter:text-6xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-primary">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  if (isDice) {
    return (
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
        <p className={`text-[10px] font-display uppercase font-bold tracking-[0.3em] ${isMine ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>
          {msg.senderName} {isAction && <span className="text-secondary ml-3">• Ação</span>}
        </p>
        <div className={`p-8 rounded-[2rem] border-2 text-2xl inline-block max-w-2xl literary-shadow transition-all relative overflow-hidden ${
          isMine 
            ? 'bg-primary/5 border-primary/30 text-foreground' 
            : 'bg-black/40 border-white/5 text-foreground'
        } ${isAction ? 'font-heading italic bg-secondary/5 border-secondary/20' : 'font-body font-light leading-relaxed'}`}>
          {isAction ? <span className="flex items-center gap-3"><Zap className="h-5 w-5 text-secondary opacity-50 shrink-0" /> *{msg.text}*</span> : (
            <span className="flex items-start gap-4">
               {!isAction && <Quote className="h-5 w-5 text-primary/30 rotate-180 shrink-0 mt-1" />}
               <span>"{msg.text}"</span>
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

function RitualShortcut({ icon, label, active, onClick, disabled }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all whitespace-nowrap group h-12 disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'btn-ritual'
          : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-primary/30 hover:text-foreground'
      }`}
    >
      <span className={`transition-transform group-hover:scale-125 duration-500 [&_svg]:h-4 [&_svg]:w-4`}>{icon}</span>
      <span className="text-[10px] font-display uppercase font-black tracking-[0.2em]">{label}</span>
    </button>
  );
}
