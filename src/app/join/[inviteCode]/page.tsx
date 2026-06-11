"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Hourglass, Loader2, ShieldCheck, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"

type InvitePreview = {
  campaign_id: string
  campaign_name: string
  campaign_description: string | null
}

type JoinResult = {
  campaign_id: string
  campaign_name: string
  membership_status: string
}

function statusMessage(status: string) {
  if (status === "active") return "Você já participa desta campanha."
  if (status === "pending") return "Solicitação enviada. Aguarde aprovação do mestre."
  if (status === "rejected") return "Sua solicitação foi rejeitada pelo mestre."
  if (status === "inactive") return "Sua participação está inativa nesta campanha."
  return "Solicitação registrada."
}

export default function JoinCampaignPage() {
  const { inviteCode } = useParams() as { inviteCode: string }
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [preview, setPreview] = React.useState<InvitePreview | null>(null)
  const [joinResult, setJoinResult] = React.useState<JoinResult | null>(null)
  const [loadingPreview, setLoadingPreview] = React.useState(true)
  const [joining, setJoining] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const nextUrl = `/join/${inviteCode}`

  React.useEffect(() => {
    if (!inviteCode) return
    let active = true
    const supabase = createClient()

    setLoadingPreview(true)
    supabase
      .rpc('get_campaign_invite_preview', { target_invite_code: inviteCode })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError(error.message)
          setPreview(null)
        } else {
          const row = Array.isArray(data) ? data[0] : data
          setPreview((row as InvitePreview) || null)
          setError(row ? null : "Convite inválido ou expirado.")
        }
        setLoadingPreview(false)
      })

    return () => {
      active = false
    }
  }, [inviteCode])

  async function handleJoin() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`)
      return
    }

    setJoining(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('request_join_campaign', { target_invite_code: inviteCode })
      if (error) throw error

      const row = Array.isArray(data) ? data[0] : data
      setJoinResult(row as JoinResult)
      toast({ title: "Convite registrado", description: statusMessage(row?.membership_status || "pending") })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no Convite", description: err.message })
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  const currentStatus = joinResult?.membership_status

  return (
    <div className="min-h-screen flex items-center justify-center p-6 mesa-viva-bg bg-fixed">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <Card className="relative z-10 w-full max-w-2xl bg-card/85 border-primary/20 literary-shadow">
        <CardHeader className="text-center space-y-5">
          <div className="mx-auto p-4 rounded-2xl bg-primary shadow-arcane w-fit">
            <Hourglass className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-4xl font-display text-primary">Convite de Campanha</CardTitle>
            <CardDescription className="font-heading italic text-lg mt-2">
              Um mestre abriu os portões de uma crônica para você.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loadingPreview && (
            <div className="p-10 rounded-2xl bg-white/5 border border-white/5 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
              Verificando selo do convite...
            </div>
          )}

          {!loadingPreview && error && (
            <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/10 text-center">
              <p className="font-display text-2xl text-destructive">Convite inválido</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          )}

          {!loadingPreview && preview && (
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest">
                Convite de jogador
              </Badge>
              <h2 className="font-display text-4xl font-bold">{preview.campaign_name}</h2>
              <p className="font-heading italic text-muted-foreground text-lg">
                {preview.campaign_description || "Você foi convidado para participar desta campanha."}
              </p>
              <p className="text-sm text-muted-foreground">
                A entrada padrão é como jogador. O mestre precisa aprovar sua solicitação antes da Mesa Viva.
              </p>
            </div>
          )}

          {currentStatus && (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm">{statusMessage(currentStatus)}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col md:flex-row gap-3 border-t border-white/5 p-6">
          {!user ? (
            <>
              <Button asChild className="w-full rounded-full bg-primary h-12">
                <Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>Entrar ou Criar Conta</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full h-12 border-primary/30">
                <Link href={`/signup?next=${encodeURIComponent(nextUrl)}`}>Cadastrar</Link>
              </Button>
            </>
          ) : currentStatus === "active" ? (
            <Button asChild className="w-full rounded-full bg-primary h-12">
              <Link href={`/campaign/${joinResult?.campaign_id}/mesa-viva`}>Entrar na Mesa Viva</Link>
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joining || Boolean(currentStatus) || !preview}
              className="w-full rounded-full bg-primary h-12"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {currentStatus ? "Solicitação Registrada" : "Solicitar Entrada"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
