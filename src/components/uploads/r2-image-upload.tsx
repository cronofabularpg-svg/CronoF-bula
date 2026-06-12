"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, ShieldAlert } from "lucide-react"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export type MediaAsset = {
  id: string
  public_url: string | null
  storage_key: string
  usage_type: string
  visibility: string
  [key: string]: unknown
}

type Props = {
  campaignId: string
  usageType:
    | "campaign_cover"
    | "location_image"
    | "battlefield_map"
    | "character_avatar"
    | "npc_token"
    | "item_image"
    | "handout"
    | "other"
  visibility?: "private" | "party" | "public" | "master_only"
  label?: string
  onUploaded: (mediaAsset: MediaAsset) => void
  // "presigned": só tenta o PUT direto ao R2 com URL assinada.
  // "direct": envia o arquivo pelo servidor (multipart), sem URL assinada.
  // "auto" (padrão): tenta o presigned e, se o PUT falhar (CORS/403/rede),
  // oferece um botão para repetir via upload direto pelo servidor.
  mode?: "presigned" | "direct" | "auto"
  // Quando informados, o upload direto pelo servidor também atualiza a
  // entidade correspondente (npcs.image_url, characters.avatar_url, etc.).
  entityType?: "npc" | "character" | "location" | "combat"
  entityId?: string
}

export function R2ImageUpload({
  campaignId,
  usageType,
  visibility = "party",
  label,
  onUploaded,
  mode = "auto",
  entityType,
  entityId,
}: Props) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fallbackFile, setFallbackFile] = useState<File | null>(null)

  async function uploadDirect(file: File) {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("campaignId", campaignId)
      formData.append("usageType", usageType)
      formData.append("visibility", visibility)
      if (entityType && entityId) {
        formData.append("entityType", entityType)
        formData.append("entityId", entityId)
      }

      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        throw new Error(data?.error || "Falha ao enviar arquivo pelo servidor.")
      }

      setPreview(data.mediaAsset.public_url)
      setFallbackFile(null)
      onUploaded(data.mediaAsset)
      toast({ title: "Imagem enviada", description: "O upload foi concluído com sucesso." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: error?.message || "Falha ao enviar arquivo pelo servidor." })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function uploadPresigned(file: File) {
    setLoading(true)
    // Identifica em qual etapa o upload falhou, para dar uma mensagem de
    // erro específica e acionável (presign / PUT no R2 / registro do asset).
    let stage: "presign" | "put" | "complete" = "presign"
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          usageType,
          visibility,
        }),
      })

      const presignData = await presignRes.json().catch(() => null)
      if (!presignRes.ok || !presignData) {
        throw new Error(presignData?.error || "Falha ao preparar upload.")
      }

      const { uploadUrl, storageKey, publicUrl, headers } = presignData
      const contentType = headers?.["Content-Type"] ?? file.type

      stage = "put"
      // Upload direto para a URL assinada do R2: sem Authorization, sem
      // cookies (credentials: "omit"), sem headers extras, e Content-Type
      // igual ao mimeType usado para gerar a assinatura no presign.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType,
        },
        credentials: "omit",
      })

      if (!putRes.ok) {
        throw new Error(`Falha ao enviar arquivo para o R2 (status ${putRes.status}).`)
      }

      stage = "complete"
      const completeRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          storageKey,
          publicUrl,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          usageType,
          visibility,
        }),
      })

      const completeData = await completeRes.json().catch(() => null)
      if (!completeRes.ok || !completeData) {
        throw new Error(completeData?.error || "Falha ao registrar arquivo.")
      }

      setPreview(publicUrl)
      setFallbackFile(null)
      onUploaded(completeData.mediaAsset)
      toast({ title: "Imagem enviada", description: "O upload foi concluído com sucesso." })
    } catch (error: any) {
      if (stage === "put" && mode === "auto") {
        // PUT direto ao R2 falhou (CORS, 403, checksum, rede). No modo
        // "auto" oferecemos o fallback de envio pelo servidor em vez de
        // travar o usuário.
        setFallbackFile(file)
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: "Falha ao enviar arquivo para o R2. Verifique CORS do bucket. Você pode tentar o envio seguro pelo servidor.",
        })
      } else {
        const description =
          stage === "put"
            ? "Falha ao enviar arquivo para o R2. Verifique CORS do bucket."
            : stage === "complete"
              ? "Arquivo enviado, mas falhou ao registrar mídia."
              : error?.message || "Falha ao preparar upload."
        toast({ variant: "destructive", title: "Erro no upload", description })
      }
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Tipo de arquivo não permitido", description: "Use PNG, JPEG ou WebP." })
      event.target.value = ""
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "O limite é 10 MB por imagem." })
      event.target.value = ""
      return
    }

    setFallbackFile(null)

    if (mode === "direct") {
      await uploadDirect(file)
    } else {
      await uploadPresigned(file)
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label || "Enviar imagem"}
      </Button>
      {fallbackFile && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => uploadDirect(fallbackFile)}
          className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          Tentar envio seguro pelo servidor
        </Button>
      )}
      <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP — máximo 10 MB.</p>
      {preview && (
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-primary/20">
          <Image src={preview} alt="Pré-visualização" fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  )
}
