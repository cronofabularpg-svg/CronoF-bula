"use client"

import * as React from "react"
import {
  Sparkles,
  Volume2,
  Ghost,
  Dices,
  MessageSquare,
  ScrollText,
  Megaphone,
  FlagOff,
  Crown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

// ---------------------------------------------------------------------------
// Badges e tipos compartilhados da Linha do Tempo
// ---------------------------------------------------------------------------

export type AuthorBadge = "Jogador" | "Mestre" | "NPC" | "Oráculo" | "Sistema"
export type StatusBadge = "Cânone" | "Sugestão" | "Pendente"
export type MessageSource = "player" | "master" | "groq" | "system"

export type MessageMeta = {
  authorBadge: AuthorBadge
  typeLabel: string
  source: MessageSource
}

const AUTHOR_BADGE_STYLES: Record<AuthorBadge, string> = {
  Jogador: "bg-primary/10 text-primary border-primary/30",
  Mestre: "bg-accent/10 text-accent border-accent/30",
  NPC: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  Oráculo: "bg-secondary/10 text-secondary border-secondary/30",
  Sistema: "bg-white/5 text-muted-foreground border-white/10",
}

const STATUS_BADGE_STYLES: Record<StatusBadge, string> = {
  Cânone: "bg-primary/15 text-primary border-primary/40",
  Sugestão: "bg-secondary/15 text-secondary border-secondary/40",
  Pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
}

/** Deriva os selos (autor, tipo, fonte) de uma mensagem da cena (scene_messages). */
export function getMessageMeta(
  messageType: string,
  metadata: any,
  isMasterSender: boolean
): MessageMeta {
  switch (messageType) {
    case "system":
      return { authorBadge: "Sistema", typeLabel: "sistema", source: "system" }
    case "narration":
      return metadata?.source === "groq"
        ? { authorBadge: "Oráculo", typeLabel: "narração", source: "groq" }
        : { authorBadge: "Mestre", typeLabel: "narração", source: "master" }
    case "speech":
      return metadata?.source === "groq"
        ? { authorBadge: "NPC", typeLabel: "npc_dialogue", source: "groq" }
        : {
            authorBadge: isMasterSender ? "Mestre" : "Jogador",
            typeLabel: "fala",
            source: isMasterSender ? "master" : "player",
          }
    case "action":
      return {
        authorBadge: isMasterSender ? "Mestre" : "Jogador",
        typeLabel: "ação",
        source: isMasterSender ? "master" : "player",
      }
    case "dice":
      return {
        authorBadge: isMasterSender ? "Mestre" : "Jogador",
        typeLabel: "rolagem",
        source: isMasterSender ? "master" : "player",
      }
    default:
      return { authorBadge: "Sistema", typeLabel: messageType, source: "system" }
  }
}

export function MessageBadges({
  meta,
  status,
  extra,
}: {
  meta: MessageMeta
  status: StatusBadge | StatusBadge[]
  extra?: string
}) {
  const statuses = Array.isArray(status) ? status : [status]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={`text-[8px] px-2 h-4 uppercase font-black tracking-widest ${AUTHOR_BADGE_STYLES[meta.authorBadge]}`}
      >
        {meta.authorBadge}
        {extra ? ` • ${extra}` : ""}
      </Badge>
      <Badge variant="outline" className="text-[8px] px-2 h-4 uppercase font-bold tracking-widest border-white/10 text-muted-foreground bg-white/5">
        {meta.typeLabel}
      </Badge>
      {statuses.map((s) => (
        <Badge key={s} variant="outline" className={`text-[8px] px-2 h-4 uppercase font-black tracking-widest ${STATUS_BADGE_STYLES[s]}`}>
          {s}
        </Badge>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Texto longo com "Ler mais"
// ---------------------------------------------------------------------------

export function ExpandableText({
  text,
  className,
  threshold = 360,
}: {
  text: string
  className?: string
  threshold?: number
}) {
  const [open, setOpen] = React.useState(false)

  if (!text || text.length <= threshold) {
    return <div className={className}>{text}</div>
  }

  return (
    <div>
      <div className={className}>{open ? text : `${text.slice(0, threshold).trimEnd()}…`}</div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 text-[10px] font-display uppercase tracking-widest text-primary/70 hover:text-primary transition-colors"
      >
        {open ? "Ler menos" : "Ler mais"}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sugestão do Oráculo (visão do mestre, ligada a ai_generated_suggestions)
// ---------------------------------------------------------------------------

export type AiSuggestion = {
  id: string
  session_id: string | null
  scene_id: string | null
  suggestion_type: string
  title: string | null
  content: string | null
  payload: Record<string, any> | null
  created_at: string
}

export function SuggestionCard({
  suggestion,
  onPublish,
  onDiscard,
  onEditPublish,
}: {
  suggestion: AiSuggestion
  onPublish: () => void
  onDiscard: () => void
  onEditPublish: (content: string) => void
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState(suggestion.content || "")

  const npcName = suggestion.payload?.npc_name as string | undefined
  const meta: MessageMeta =
    suggestion.suggestion_type === "npc_dialogue"
      ? { authorBadge: "NPC", typeLabel: "npc_dialogue", source: "groq" }
      : { authorBadge: "Oráculo", typeLabel: "narração", source: "groq" }

  return (
    <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-700 max-w-4xl">
      <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 p-4 shrink-0 border border-secondary/40 flex items-center justify-center oracle-glow">
        <Sparkles className="h-7 w-7 text-secondary" />
      </div>
      <div className="space-y-4 pt-1 flex-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.4em]">
            Sugestão do Oráculo {npcName ? `• ${npcName}` : ""}
          </p>
          <MessageBadges meta={meta} status={["Sugestão", "Pendente"]} extra={npcName} />
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="bg-black/30 border-secondary/30 font-heading italic text-lg min-h-32"
            />
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  onEditPublish(editedContent)
                  setIsEditing(false)
                }}
                className="text-[10px] font-display uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
              >
                Salvar e Publicar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <ExpandableText text={suggestion.content || ""} className="text-xl leading-relaxed text-foreground/80 font-heading italic" />
            <div className="flex items-center gap-6 flex-wrap">
              <button
                onClick={onPublish}
                className="text-[10px] font-display uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
              >
                Publicar como Cânone
              </button>
              <button
                onClick={() => {
                  setEditedContent(suggestion.content || "")
                  setIsEditing(true)
                }}
                className="text-[10px] font-display uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
              >
                Editar e Publicar
              </button>
              <button
                onClick={onDiscard}
                className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              >
                Descartar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aviso de sugestão para o jogador (efêmero, local)
// ---------------------------------------------------------------------------

export function PlayerSuggestionNotice({ content, onDismiss }: { content: string; onDismiss: () => void }) {
  return (
    <div className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-700 max-w-4xl">
      <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 p-4 shrink-0 border border-secondary/40 flex items-center justify-center oracle-glow">
        <Sparkles className="h-7 w-7 text-secondary" />
      </div>
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[10px] font-display uppercase font-bold text-secondary tracking-[0.4em]">O Oráculo Arcano</p>
          <Badge variant="outline" className="border-secondary/40 text-secondary text-[8px] px-2 h-4 uppercase font-black">Sugestão</Badge>
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[8px] px-2 h-4 uppercase font-black">Pendente</Badge>
        </div>
        <ExpandableText text={content} className="text-xl leading-relaxed text-foreground/80 font-heading italic" />
        <div className="flex items-center gap-6 flex-wrap">
          <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            Sugestão enviada ao mestre. O mestre decide o que vira cânone.
          </p>
          <button
            onClick={onDismiss}
            className="text-[10px] font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Botão de modo de ação (jogador/mestre)
// ---------------------------------------------------------------------------

export function ModeButton({
  icon,
  label,
  active,
  onClick,
  disabled,
  variant = "primary",
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary"
}) {
  const activeClass = variant === "secondary" ? "btn-arcane" : "btn-ritual"
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all whitespace-nowrap group h-12 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
        active ? activeClass : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-primary/30 hover:text-foreground"
      }`}
    >
      <span className="transition-transform group-hover:scale-125 duration-500 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="text-[10px] font-display uppercase font-black tracking-[0.2em]">{label}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Painel de Ação do Jogador
// ---------------------------------------------------------------------------

export type PlayerActionMode = "speech" | "action" | "oracle"

export function PlayerActionPanel({
  actionMode,
  onSelectMode,
  onOpenDice,
  aiAvailable,
  isAiThinking,
  aiDisabledReason,
}: {
  actionMode: string
  onSelectMode: (mode: PlayerActionMode) => void
  onOpenDice: () => void
  aiAvailable: boolean
  isAiThinking: boolean
  aiDisabledReason: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] font-display uppercase tracking-[0.3em] text-muted-foreground opacity-50">Ação do Jogador</p>
      <div className="flex flex-wrap items-center gap-4">
        <ModeButton icon={<Volume2 />} label="Falar" active={actionMode === "speech"} onClick={() => onSelectMode("speech")} />
        <ModeButton icon={<Ghost />} label="Agir" active={actionMode === "action"} onClick={() => onSelectMode("action")} />
        <ModeButton icon={<Dices />} label="Rolar" onClick={onOpenDice} />
        <div className="h-8 w-px bg-white/10 mx-1 shrink-0" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ModeButton
                  icon={<Sparkles />}
                  label={isAiThinking ? "Tecendo..." : "Pedir ao Oráculo"}
                  active={actionMode === "oracle"}
                  disabled={!aiAvailable || isAiThinking}
                  onClick={() => onSelectMode("oracle")}
                  variant="secondary"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {aiAvailable
                ? "Pedir ao Oráculo gera uma sugestão narrativa. O mestre decide o que vira cânone."
                : aiDisabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {actionMode === "oracle" && (
        <p className="text-[10px] font-heading italic text-secondary/70 px-1">
          Pedir ao Oráculo gera uma sugestão narrativa. O mestre decide o que vira cânone.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Painel de Ação do Mestre
// ---------------------------------------------------------------------------

export type MasterActionMode = "narration" | "npc_dialogue" | "event"

export function MasterActionPanel({
  actionMode,
  onSelectMode,
  onPublishSuggestion,
  onFinalizeSession,
  pendingCount,
}: {
  actionMode: string
  onSelectMode: (mode: MasterActionMode) => void
  onPublishSuggestion: () => void
  onFinalizeSession: () => void
  pendingCount: number
}) {
  return (
    <div className="space-y-3 pt-5 border-t border-accent/10">
      <p className="text-[9px] font-display uppercase tracking-[0.3em] text-accent opacity-60 flex items-center gap-2">
        <Crown className="h-3 w-3" /> Ação do Mestre
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ModeButton icon={<Sparkles />} label="Narrar Cena" active={actionMode === "narration"} onClick={() => onSelectMode("narration")} />
        <ModeButton icon={<MessageSquare />} label="Responder como NPC" active={actionMode === "npc_dialogue"} onClick={() => onSelectMode("npc_dialogue")} />
        <ModeButton icon={<ScrollText />} label="Registrar Evento" active={actionMode === "event"} onClick={() => onSelectMode("event")} />
        <div className="hidden md:block h-8 w-px bg-white/10 mx-1 shrink-0" />
        <ModeButton
          icon={<Megaphone />}
          label={pendingCount > 0 ? `Publicar Sugestão (${pendingCount})` : "Publicar Sugestão"}
          onClick={onPublishSuggestion}
        />
        <ModeButton icon={<FlagOff />} label="Finalizar e Gerar Rascunho de Crônica" onClick={onFinalizeSession} />
      </div>
    </div>
  )
}
