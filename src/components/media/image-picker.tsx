"use client"

import * as React from "react"
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { R2ImageUpload, type MediaAsset } from "@/components/uploads/r2-image-upload"

type ImagePickerProps = {
  campaignId?: string | null
  usageType: "campaign_cover" | "location_image" | "character_avatar" | "npc_token" | "item_image" | "battlefield_map" | "handout" | "other"
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  optionalLabel?: string
  visibility?: "private" | "party" | "public" | "master_only"
  suggestedUrl?: string | null
  suggestedLabel?: string
}

export function ImagePicker({
  campaignId,
  usageType,
  value,
  onChange,
  label = "Imagem",
  optionalLabel = "opcional",
  visibility = "party",
  suggestedUrl,
  suggestedLabel = "Usar sugerida",
}: ImagePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [assets, setAssets] = React.useState<MediaAsset[]>([])
  const [loadingAssets, setLoadingAssets] = React.useState(false)
  const canUseCampaignMedia = Boolean(campaignId)

  React.useEffect(() => {
    if (!open || !campaignId) return
    let active = true
    const supabase = createClient()
    setLoadingAssets(true)

    supabase
      .from("media_assets")
      .select("id, public_url, storage_key, usage_type, visibility, file_name, created_at")
      .eq("campaign_id", campaignId)
      .eq("usage_type", usageType)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (!active) return
        setAssets(((data as MediaAsset[]) || []).filter((asset) => Boolean(asset.public_url)))
        setLoadingAssets(false)
      })

    return () => {
      active = false
    }
  }, [campaignId, open, usageType])

  function handleUploaded(mediaAsset: MediaAsset) {
    if (mediaAsset.public_url) {
      onChange(mediaAsset.public_url)
      setAssets((prev) => [mediaAsset, ...prev.filter((asset) => asset.id !== mediaAsset.id)])
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-ui uppercase tracking-widest font-bold flex items-center gap-2">
            <ImageIcon className="h-3 w-3 text-primary" /> {label}
          </p>
          <p className="text-[11px] text-muted-foreground italic">{optionalLabel}</p>
        </div>
        {value && <Badge variant="outline" className="border-primary/30 text-primary">Selecionada</Badge>}
      </div>

      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-primary/60" />
          )}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="border-primary/30">
                Escolher imagem
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/20 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-primary">{label}</DialogTitle>
                <DialogDescription className="font-heading italic">
                  Escolha uma imagem existente da campanha ou envie uma nova para o R2.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Banco de imagens</p>
                    {loadingAssets && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                  <ScrollArea className="h-72 rounded-2xl border border-white/10 bg-black/20 p-3">
                    {!canUseCampaignMedia && (
                      <p className="p-8 text-center text-sm text-muted-foreground font-heading italic">
                        Salve a campanha antes de escolher ou enviar imagens para o banco.
                      </p>
                    )}
                    {canUseCampaignMedia && assets.length === 0 && !loadingAssets && (
                      <p className="p-8 text-center text-sm text-muted-foreground font-heading italic">
                        Nenhuma imagem deste tipo foi enviada ainda.
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {assets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            onChange(asset.public_url)
                            setOpen(false)
                          }}
                          className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 transition-colors"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img src={asset.public_url || ""} alt={String(asset.file_name || "Imagem")} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                          <p className="truncate px-2 py-1 text-[10px] text-muted-foreground">{String(asset.file_name || asset.usage_type)}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {canUseCampaignMedia ? (
                    <R2ImageUpload
                      campaignId={campaignId || ""}
                      usageType={usageType}
                      visibility={visibility}
                      mode="direct"
                      label="Enviar imagem"
                      onUploaded={handleUploaded}
                    />
                  ) : (
                    <Button type="button" variant="outline" size="sm" disabled className="w-full">
                      Enviar imagem
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!suggestedUrl}
                    className="w-full border-accent/30 text-accent"
                    onClick={() => {
                      if (!suggestedUrl) return
                      onChange(suggestedUrl)
                      setOpen(false)
                    }}
                  >
                    {suggestedLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                  >
                    Sem imagem por enquanto
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canUseCampaignMedia ? (
            <R2ImageUpload
              campaignId={campaignId || ""}
              usageType={usageType}
              visibility={visibility}
              mode="direct"
              label="Enviar imagem"
              onUploaded={handleUploaded}
            />
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              Enviar imagem
            </Button>
          )}

          {value && (
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(null)}>
              <Trash2 className="mr-2 h-4 w-4" /> Remover imagem
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
