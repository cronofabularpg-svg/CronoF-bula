
"use client"

import * as React from "react"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("/onboarding")

  React.useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next")
    if (next?.startsWith("/")) setNextUrl(next)
  }, [])

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${nextUrl}`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Entrar com Google",
        description: error.message,
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 mesa-viva-bg bg-fixed">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-2xl bg-accent shadow-gold">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter text-accent">Cronofábula</h1>
          <p className="text-xl font-heading italic text-muted-foreground">Crie seu perfil e comece sua primeira campanha.</p>
        </div>

        <Card className="bg-card/80 border-white/10 backdrop-blur-xl literary-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Criar conta com Google</CardTitle>
            <CardDescription className="font-heading italic text-base">
              Use sua conta Google para iniciar sua jornada no Arcano do Tempo. Sem senhas, sem formulários.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-white/90 h-12 text-base font-display tracking-tight"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="" className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-white/5 p-6 text-center">
            <p className="text-sm text-muted-foreground font-ui">
              Já tem uma conta? <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className="text-primary font-bold hover:underline">Fazer login</Link>
            </p>
          </CardFooter>
        </Card>

        <div className="text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 opacity-50 px-8">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade arcana.
        </div>
      </div>
    </div>
  )
}
