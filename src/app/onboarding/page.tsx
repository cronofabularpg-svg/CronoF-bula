
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  ShieldCheck, 
  User, 
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUser, useFirestore } from "@/firebase"
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState<'master' | 'player' | null>(null);
  const [loading, setLoading] = React.useState(false)

  const [campaignData, setCampaignData] = React.useState({
    name: "",
    system: "dnd5e",
    tone: "dark",
    aiEnabled: true
  })

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  async function handleCreateCampaign() {
    if (!db || !user) return
    setLoading(true)
    try {
      const campaignId = doc(collection(db, 'campaigns')).id
      await setDoc(doc(db, 'campaigns', campaignId), {
        id: campaignId,
        masterId: user.uid,
        name: campaignData.name,
        system: campaignData.system,
        tone: campaignData.tone,
        isAiNarratorEnabled: campaignData.aiEnabled,
        status: "active",
        createdAt: serverTimestamp()
      })
      toast({ title: "Campanha Criada!", description: `${campaignData.name} aguarda seus jogadores.` })
      nextStep()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar lenda", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-in-out" 
          style={{ width: `${(step / 4) * 100}%` }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12">
        {step === 1 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 1 de 4</div>
              <h1 className="text-5xl font-display font-black tracking-tighter">Bem-vindo ao Cronofábula</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Qual será seu papel inicial nesta jornada?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RoleCard 
                icon={<ShieldCheck className="h-10 w-10" />}
                title="Sou Mestre"
                desc="Quero criar um mundo, gerenciar campanhas e narrar histórias para meus jogadores."
                active={role === 'master'}
                onClick={() => { setRole('master'); nextStep(); }}
              />
              <RoleCard 
                icon={<User className="h-10 w-10" />}
                title="Sou Jogador"
                desc="Recebi um convite ou quero criar um herói para participar de uma crônica viva."
                active={role === 'player'}
                onClick={() => { setRole('player'); nextStep(); }}
              />
            </div>
          </div>
        )}

        {step === 2 && role === 'master' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 2 de 4</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Inicie sua Crônica</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Defina os pilares do seu novo mundo.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome da Campanha</Label>
                      <Input 
                        placeholder="Ex: O Retorno dos Antigos" 
                        value={campaignData.name}
                        onChange={e => setCampaignData({...campaignData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Sistema de Regras</Label>
                      <Select value={campaignData.system} onValueChange={v => setCampaignData({...campaignData, system: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dnd5e">D&D 5e (SRD)</SelectItem>
                          <SelectItem value="custom">Sistema Customizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Tom Narrativo</Label>
                      <Select value={campaignData.tone} onValueChange={v => setCampaignData({...campaignData, tone: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Fantasia Sombria</SelectItem>
                          <SelectItem value="epic">Épico e Heroico</SelectItem>
                          <SelectItem value="urban">Mistério Urbano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">IA Narradora Ativa</Label>
                        <p className="text-xs text-muted-foreground italic">Permitir auxílio narrativo da IA Mestre.</p>
                      </div>
                      <Switch 
                        checked={campaignData.aiEnabled} 
                        onCheckedChange={v => setCampaignData({...campaignData, aiEnabled: v})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button disabled={loading || !campaignData.name} onClick={handleCreateCampaign} className="bg-primary hover:bg-primary/90 rounded-full px-10">
                {loading ? "Invocando Mundo..." : "Continuar"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && role === 'player' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 2 de 4</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Encontre sua Mesa</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Insira o código enviado pelo seu mestre.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md max-w-lg mx-auto">
              <CardContent className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Código de Convite</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="CRONO-1234-ABCD" className="pl-10" />
                    </div>
                  </div>
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-12">Validar Convite</Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button variant="outline" onClick={nextStep} className="rounded-full">Pular por enquanto <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 3 de 4</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Sua Identidade</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Crie seu herói para começar.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome do Personagem</Label>
                      <Input placeholder="Ex: Eldric, o Audaz" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Raça</Label>
                        <Select defaultValue="human">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="human">Humano</SelectItem>
                            <SelectItem value="elf">Elfo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Classe</Label>
                        <Select defaultValue="fighter">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fighter">Guerreiro</SelectItem>
                            <SelectItem value="wizard">Mago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full h-14 border-dashed border-primary/30 text-primary">
                      <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Retrato (Opcional)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={nextStep} className="bg-primary hover:bg-primary/90 rounded-full px-10">Concluir <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
              <h1 className="text-6xl font-display font-black tracking-tighter">Sua Fábula Começou</h1>
              <p className="text-2xl font-heading italic text-muted-foreground max-w-2xl mx-auto">
                Tudo está pronto. O tempo agora corre a seu favor.
              </p>
            </div>
            <Button asChild size="lg" className="px-16 py-10 text-2xl font-display rounded-full btn-arcane border-2 border-accent">
              <Link href="/dashboard">Entrar na Mesa Viva</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleCard({ icon, title, desc, active, onClick }: { icon: React.ReactNode, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-10 rounded-3xl border-2 cursor-pointer transition-all duration-300 group ${active ? 'bg-primary/10 border-primary shadow-arcane' : 'bg-card/30 border-white/5 hover:border-primary/40'}`}
    >
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-colors ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground font-heading italic leading-relaxed">{desc}</p>
    </div>
  )
}
