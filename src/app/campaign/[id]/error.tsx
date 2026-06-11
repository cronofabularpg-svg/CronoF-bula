"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function CampaignSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  React.useEffect(() => {
    console.error("Erro na seção da campanha:", error)
  }, [error])

  return (
    <div className="p-20 flex flex-col items-center justify-center gap-8 text-center min-h-[60vh]">
      <div className="p-6 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
        <AlertTriangle className="h-12 w-12" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-display font-black text-destructive">Algo deu errado nesta página</h2>
        <p className="text-muted-foreground italic font-heading text-xl max-w-md mx-auto">
          Um erro inesperado interrompeu o carregamento. Você pode tentar novamente ou voltar ao painel da campanha.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => reset()} className="rounded-full px-8">
          Tentar novamente
        </Button>
        <Button onClick={() => router.push("/dashboard")} className="bg-primary px-8 rounded-full">
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  )
}
