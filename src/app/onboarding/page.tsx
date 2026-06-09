
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
  Hash,
  Camera
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

const DND_RACES = [
  { id: "human", name: "Humano" },
  { id: "elf", name: "Elfo" },
  { id: "dwarf", name: "Anão" },
  { id: "halfling", name: "Halfling" },
  { id: "dragonborn", name: "Draconato" },
  { id: "tiefling", name: "Tiefling" },
  { id: "gnome", name: "Gnomo" },
  { id: "half-orc", name: "Meio-Orc" },
  { id: "half-elf", name: "Meio-Elfo" },
  { id: "goblin", name: "Goblin (Toca)" }
];

const DND_CLASSES = [
  { id: "fighter", name: "Guerreiro" },
  { id: "wizard", name: "Mago" },
  { id: "rogue", name: "Ladino" },
  { id: "cleric", name: "Clérigo" },
  { id: "paladin", name: "Paladino" },
  { id: "ranger", name: "Patrulheiro" },
  { id: "bard", name: "Bardo" },
  { id: "druid", name: "Druida" },
  { id: "barbarian", name: "Bárbaro" },
  { id: "sorcerer", name: "Feiticeiro" },
  { id: "warlock", name: "Bruxo" },
  { id: "monk", name: "Monge" }
];

export default function OnboardingPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState<'master' | 'player' | null>(null);
  const [loading, setLoading] = React.useState(false)

  const [campaignId, setCampaignId] = React.useState<string>("");
  const [campaignData, setCampaignData] = React.useState({
    name: "",
    system: "dnd5e",
    tone: "dark",
    aiEnabled: true
  })

  const [characterData, setCharacterData] = React.useState({
    name: "",
    race: "human",
    class: "fighter",
    level: 1,
    photoURL: ""
  })

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  async function handleCreateCampaign() {
    if (!db || !user) return
    setLoading(true)
    try {
      const newCampaignId = doc(collection(db, 'campaigns')).id
      await setDoc(doc(db, 'campaigns', newCampaignId), {
        id: newCampaignId,
        masterId: user.uid,
        name: campaignData.name,
        system: campaignData.system,
        tone: campaignData.tone,
        isAiNarratorEnabled: campaignData.aiEnabled,
        status: "active",
        createdAt: serverTimestamp()
      })
      setCampaignId(newCampaignId)
      toast({ title: "Campanha Criada!", description: `${campaignData.name} aguarda seus jogadores.` })
      nextStep()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar lenda", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCharacter() {
    if (!db || !user) return
    setLoading(true)
    try {
      const targetCampaignId = campaignId || "global"; 
      const charId = doc(collection(db, 'campaigns', targetCampaignId, 'characters')).id
      
      await setDoc(doc(db, 'campaigns', targetCampaignId, 'characters', charId), {
        id: charId,
        campaignId: targetCampaignId,
        ownerId: user.uid,
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        level: characterData.level,
        photoURL: characterData.photoURL,
        status: role === 'master' ? 'active' : 'pending',
        createdAt: serverTimestamp(),
        xp: 0,
        hp: 10,
        maxHp: 10,
        ac: 10,
        initiative: 0,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
      })

      toast({ title: "Personagem Criado!", description: `${characterData.name} está pronto para a aventura.` })
      nextStep()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar herói", description: error.message })
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
                desc="Quero criar um mundo, gerenciar campanhas e narrar histórias baseadas em D&D 5e."
                active={role === 'master'}
                onClick={() => { setRole('master'); nextStep(); }}
              />
              <RoleCard 
                icon={<User className="h-10 w-10" />}
                title="Sou Jogador"
                desc="Quero criar um herói oficial do SRD e participar de uma crônica viva."
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
                          <SelectItem value="dnd5e">D&D 5e (SRD Oficial)</SelectItem>
                          <SelectItem value="custom">Sistema Customizado (D20)</SelectItem>
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
                        <Label className="text-sm font-bold">Oráculo D&D Ativo</Label>
                        <p className="text-xs text-muted-foreground italic">IA auxiliar com conhecimento estrito do manual.</p>
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

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/30 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 3 de 4</div>
              <h1 className="text-4xl font-display font-black tracking-tighter">Sua Identidade</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Escolha sua raça, classe e imagem oficial.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome do Personagem</Label>
                      <Input 
                        placeholder="Ex: Eldric, o Audaz" 
                        value={characterData.name}
                        onChange={e => setCharacterData({...characterData, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Raça</Label>
                        <Select value={characterData.race} onValueChange={v => setCharacterData({...characterData, race: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_RACES.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Classe</Label>
                        <Select value={characterData.class} onValueChange={v => setCharacterData({...characterData, class: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DND_CLASSES.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">URL do Retrato</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Link da imagem..." 
                          value={characterData.photoURL}
                          onChange={e => setCharacterData({...characterData, photoURL: e.target.value})}
                        />
                        <div className="h-10 w-10 shrink-0 bg-primary/20 border border-primary/30 rounded-md flex items-center justify-center overflow-hidden">
                          {characterData.photoURL ? (
                            <img src={characterData.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                       <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Resumo das Regras</h4>
                       <p className="text-xs text-muted-foreground italic leading-relaxed">
                         Como um(a) {DND_RACES.find(r => r.id === characterData.race)?.name} {DND_CLASSES.find(c => c.id === characterData.class)?.name}, você começa no Nível 1 com as habilidades básicas do SRD. O Oráculo guiará suas rolagens de atributos em breve.
                       </p>
                    </div>
                    <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl text-center">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Dica Arcana</p>
                       <p className="text-xs italic text-muted-foreground">"Um herói sem rosto é uma lenda esquecida. Adicione uma imagem para ser reconhecido na Mesa Viva."</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button 
                disabled={loading || !characterData.name} 
                onClick={handleCreateCharacter} 
                className="bg-primary hover:bg-primary/90 rounded-full px-10"
              >
                {loading ? "Invocando Herói..." : "Concluir"} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
              <h1 className="text-6xl font-display font-black tracking-tighter">Sua Fábula Começou</h1>
              <p className="text-2xl font-heading italic text-muted-foreground max-w-2xl mx-auto">
                As leis de D&D 5e foram gravadas no pergaminho. O tempo agora corre a seu favor.
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
