"use client"

import * as React from "react"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export type JournalVisibility = "private" | "master" | "party" | "public"

export const JOURNAL_VISIBILITY_LABEL: Record<JournalVisibility, string> = {
  private: "Só eu",
  master: "Mestre",
  party: "Grupo",
  public: "Público",
}

export type JournalEntryRecord = {
  id: string
  title: string | null
  content: string
  mood: string | null
  tags: string[] | null
  visibility: JournalVisibility
}

export function JournalEntryDialog({
  open,
  onOpenChange,
  campaignId,
  characterId,
  sessionId,
  sceneId,
  entry,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  characterId: string
  sessionId?: string | null
  sceneId?: string | null
  entry?: JournalEntryRecord | null
  onSaved?: () => void
}) {
  const { user } = useUser()
  const { toast } = useToast()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [mood, setMood] = React.useState("")
  const [tags, setTags] = React.useState("")
  const [visibility, setVisibility] = React.useState<JournalVisibility>("private")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setTitle(entry?.title || "")
    setContent(entry?.content || "")
    setMood(entry?.mood || "")
    setTags((entry?.tags || []).join(", "))
    setVisibility(entry?.visibility || "private")
  }, [open, entry])

  async function handleSave() {
    if (!user) return
    if (!content.trim()) {
      toast({ variant: "destructive", title: "Escreva algo no Diário", description: "O conteúdo da entrada não pode ficar em branco." })
      return
    }

    setSaving(true)
    const supabase = createClient()
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (entry) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: title.trim() || null,
          content: content.trim(),
          mood: mood.trim() || null,
          tags: parsedTags,
          visibility,
        })
        .eq("id", entry.id)

      if (error) {
        toast({ variant: "destructive", title: "Erro ao Salvar Entrada", description: error.message })
        setSaving(false)
        return
      }
    } else {
      let journalId: string | null = null

      const { data: existingJournal, error: journalError } = await supabase
        .from("journals")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("character_id", characterId)
        .maybeSingle()

      if (journalError) {
        toast({ variant: "destructive", title: "Erro ao Acessar Diário", description: journalError.message })
        setSaving(false)
        return
      }

      if (existingJournal) {
        journalId = existingJournal.id
      } else {
        const { data: createdJournal, error: createError } = await supabase
          .from("journals")
          .insert({
            campaign_id: campaignId,
            character_id: characterId,
            owner_user_id: user.uid,
          })
          .select("id")
          .single()

        if (createError) {
          toast({ variant: "destructive", title: "Erro ao Criar Diário", description: createError.message })
          setSaving(false)
          return
        }
        journalId = createdJournal.id
      }

      const { error: insertError } = await supabase.from("journal_entries").insert({
        journal_id: journalId,
        campaign_id: campaignId,
        character_id: characterId,
        session_id: sessionId || null,
        scene_id: sceneId || null,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood.trim() || null,
        tags: parsedTags,
        visibility,
        created_by: user.uid,
      })

      if (insertError) {
        toast({ variant: "destructive", title: "Erro ao Registrar Entrada", description: insertError.message })
        setSaving(false)
        return
      }
    }

    toast({ title: entry ? "Entrada atualizada" : "Memória registrada" })
    setSaving(false)
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 border-white/10 text-[#FFF6E5] max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{entry ? "Editar Entrada" : "Nova Entrada do Diário"}</DialogTitle>
          <DialogDescription className="font-heading italic">
            Registre as memórias e impressões de {entry ? "esta entrada" : "seu personagem"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Título (opcional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: A noite na taverna"
              className="bg-black/30 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que aconteceu? O que você sentiu?"
              className="bg-black/30 border-white/10 min-h-32 font-heading italic"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Humor (opcional)</Label>
              <Input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Ex: esperançoso, temeroso..."
                className="bg-black/30 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tags (separadas por vírgula)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: missão, npc, segredo"
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Visibilidade</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as JournalVisibility)}>
              <SelectTrigger className="bg-black/30 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(JOURNAL_VISIBILITY_LABEL) as JournalVisibility[]).map((value) => (
                  <SelectItem key={value} value={value}>{JOURNAL_VISIBILITY_LABEL[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-white/10">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="btn-ritual rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
