"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Hourglass, ShieldCheck, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { auth } = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!auth) return
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      localStorage.removeItem("cronofabula_demo_mode")
      router.push("/dashboard")
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

  function handleDemoLogin(role: 'master' | 'player') {
    localStorage.setItem("cronofabula_demo_mode", "true")
    localStorage.setItem("cronofabula_demo_role", role)
    toast({
      title: `Modo de Teste: ${role === 'master' ? 'Mestre' : 'Jogador'}`,
      description: `Entrando no portal como ${role === 'master' ? 'autoridade da mesa' : 'herói da jornada'}.`
    })
    router.push("/dashboard")
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
                <Label htmlFor="password" title="Qualquer senha funciona no modo demo" className="font-ui uppercase text-[10px] tracking-widest font-bold">Senha</Label>
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
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground"><span className="bg-card px-3">Ou Teste Agora</span></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" onClick={() => handleDemoLogin('master')} variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 h-14 flex flex-col gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[9px] uppercase font-bold tracking-tighter">Sou Mestre</span>
                </Button>
                <Button type="button" onClick={() => handleDemoLogin('player')} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 h-14 flex flex-col gap-1">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-[9px] uppercase font-bold tracking-tighter">Sou Jogador</span>
                </Button>
              </div>
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
