
"use client"

import * as React from "react"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Dices, Hash, Settings as SettingsIcon, Save } from "lucide-react"

export default function GlobalSettings() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const userRef = React.useMemo(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: profile, loading } = useDoc<any>(userRef)
  const [dicePref, setDicePref] = React.useState<string>("ask")

  React.useEffect(() => {
    if (profile?.dicePreference) {
      setDicePref(profile.dicePreference)
    }
  }, [profile])

  async function handleSave() {
    if (!userRef) return
    try {
      await updateDoc(userRef, { dicePreference: dicePref })
      toast({ title: "Preferências Salvas", description: "Seu modo de jogo foi atualizado nos anais." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: e.message })
    }
  }

  if (loading) return <div className="p-20 text-center italic">Lendo pergaminhos de configuração...</div>

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="border-b pb-10 border-white/5">
        <h1 className="text-5xl font-display font-black tracking-tighter text-accent flex items-center gap-4">
          <SettingsIcon className="h-12 w-12" /> Configurações Arcanas
        </h1>
        <p className="text-muted-foreground mt-3 font-heading text-xl italic">Ajuste a interface ao seu estilo de jogo.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <Card className="bg-card/30 border-white/5 literary-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-display flex items-center gap-3">
              <Dices className="h-6 w-6 text-primary" /> Preferência de Dados
            </CardTitle>
            <CardDescription className="font-heading italic">Como você deseja realizar suas rolagens na Mesa Viva?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <RadioGroup value={dicePref} onValueChange={setDicePref} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Label
                htmlFor="pref-virtual"
                className={`flex flex-col items-center justify-between rounded-xl border-2 p-6 bg-card/50 hover:bg-accent/5 cursor-pointer transition-all ${
                  dicePref === 'virtual' ? 'border-primary shadow-arcane' : 'border-white/5 opacity-60'
                }`}
              >
                <RadioGroupItem value="virtual" id="pref-virtual" className="sr-only" />
                <Dices className="h-8 w-8 mb-4 text-primary" />
                <span className="font-bold uppercase text-[10px] tracking-widest text-center">Dados Virtuais</span>
                <span className="text-[9px] text-muted-foreground mt-2 text-center">Rolar no sistema automaticamente.</span>
              </Label>

              <Label
                htmlFor="pref-physical"
                className={`flex flex-col items-center justify-between rounded-xl border-2 p-6 bg-card/50 hover:bg-accent/5 cursor-pointer transition-all ${
                  dicePref === 'physical' ? 'border-accent shadow-gold' : 'border-white/5 opacity-60'
                }`}
              >
                <RadioGroupItem value="physical" id="pref-physical" className="sr-only" />
                <Hash className="h-8 w-8 mb-4 text-accent" />
                <span className="font-bold uppercase text-[10px] tracking-widest text-center">Dados Físicos</span>
                <span className="text-[9px] text-muted-foreground mt-2 text-center">Informar resultado manual da mesa real.</span>
              </Label>

              <Label
                htmlFor="pref-ask"
                className={`flex flex-col items-center justify-between rounded-xl border-2 p-6 bg-card/50 hover:bg-accent/5 cursor-pointer transition-all ${
                  dicePref === 'ask' ? 'border-secondary shadow-arcane' : 'border-white/5 opacity-60'
                }`}
              >
                <RadioGroupItem value="ask" id="pref-ask" className="sr-only" />
                <SettingsIcon className="h-8 w-8 mb-4 text-secondary" />
                <span className="font-bold uppercase text-[10px] tracking-widest text-center">Perguntar Sempre</span>
                <span className="text-[9px] text-muted-foreground mt-2 text-center">Escolher o modo a cada rolagem.</span>
              </Label>
            </RadioGroup>

            <div className="pt-6 flex justify-end">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 rounded-full px-10 literary-shadow">
                <Save className="mr-2 h-4 w-4" /> Consagrar Escolha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
