
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Hourglass, FlaskConical } from "lucide-react"
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

  async function handleGoogleSignIn() {
    if (!auth || !db) return
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      }, { merge: true })

      localStorage.removeItem("cronofabula_demo_mode")
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Google",
        description: error.message
      })
    }
  }

  // Função para login fictício de teste
  function handleDemoLogin() {
    localStorage.setItem("cronofabula_demo_mode", "true")
    toast({
      title: "Modo de Teste Ativado",
      description: "Entrando como Mestre Arcano (Fictício)."
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
          <p className="text-xl font-heading italic text-muted-foreground">Volte para a sua mesa. A crônica continua de onde parou.</p>
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
                  required
                  placeholder="aventureiro@cronofabula.com" 
                  className="bg-background/50 border-white/10" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-ui uppercase text-[10px] tracking-widest font-bold">Senha</Label>
                  <Link href="#" className="text-[10px] uppercase font-bold text-accent hover:underline">Esqueci a senha</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  className="bg-background/50 border-white/10" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-display tracking-tight mt-6">
                {loading ? "Abrindo Portais..." : "Entrar na Jornada"}
              </Button>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span className="bg-card px-3">Ou use um atalho</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="border-white/10 hover:bg-white/5 h-12">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button type="button" onClick={handleDemoLogin} variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 h-12 font-bold uppercase tracking-tighter text-[10px]">
                  <FlaskConical className="mr-2 h-4 w-4" /> Acesso de Teste
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
