"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Hourglass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro de Acesso",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 mesa-viva-bg bg-fixed">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-2xl bg-primary shadow-arcane">
            <Hourglass className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter text-accent">Cronofábula</h1>
          <p className="text-xl font-heading italic text-muted-foreground">O tempo é sua maior ferramenta.</p>
        </div>

        <Card className="bg-card/80 border-white/10 backdrop-blur-xl literary-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Entrar</CardTitle>
            <CardDescription className="font-heading italic text-base">Acesse seu grimório de campanhas.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-ui uppercase text-[10px] tracking-widest font-bold">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="aventureiro@cronofabula.com" 
                  className="bg-background/50 border-white/10" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-ui uppercase text-[10px] tracking-widest font-bold">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-background/50 border-white/10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-display tracking-tight mt-4">
                Entrar na Jornada
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex justify-center border-t border-white/5 p-6">
            <p className="text-sm text-muted-foreground font-ui">
              Novo por aqui? <Link href="/signup" className="text-accent font-bold hover:underline">Crie sua conta</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
