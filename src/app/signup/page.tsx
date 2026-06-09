
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const { auth } = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!auth || !db) return

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro nas senhas",
        description: "As senhas não coincidem."
      })
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      await updateProfile(user, { displayName: formData.name })

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.name,
        createdAt: serverTimestamp()
      })

      router.push("/onboarding")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
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

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Google",
        description: error.message
      })
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
          <CardHeader>
            <CardTitle className="text-2xl font-display">Cadastrar</CardTitle>
            <CardDescription className="font-heading italic text-base">Inicie sua jornada no Arcano do Tempo.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome de Exibição</Label>
                <Input 
                  id="name" 
                  required
                  placeholder="Como quer ser chamado?" 
                  className="bg-background/50 border-white/10" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-ui uppercase text-[10px] tracking-widest font-bold">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required
                  placeholder="aventureiro@cronofabula.com" 
                  className="bg-background/50 border-white/10" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-ui uppercase text-[10px] tracking-widest font-bold">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  className="bg-background/50 border-white/10" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-ui uppercase text-[10px] tracking-widest font-bold">Confirmar Senha</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required
                  className="bg-background/50 border-white/10" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg font-display tracking-tight mt-6">
                {loading ? "Invocando Perfil..." : "Criar Minha Conta"}
              </Button>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span className="bg-card px-3">Ou cadastre com</span>
                </div>
              </div>
              
              <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="w-full border-white/10 hover:bg-white/5 h-12">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="mr-2 h-4 w-4" />
                Google
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex justify-center border-t border-white/5 p-6 text-center">
            <p className="text-sm text-muted-foreground font-ui">
              Já tem uma conta? <Link href="/login" className="text-primary font-bold hover:underline">Fazer login</Link>
            </p>
          </CardFooter>
        </Card>

        <div className="text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 opacity-50 px-8">
          Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade arcana.
        </div>
      </div>
    </div>
  )
}
