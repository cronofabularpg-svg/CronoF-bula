
"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Hourglass, 
  Sparkles, 
  ShieldCheck, 
  User, 
  BookOpen, 
  Compass, 
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function OnboardingPage() {
  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState<'master' | 'player' | null>(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-in-out" 
          style={{ width: `${(step / 4) * 100}%` }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12">
        {/* Step 1: Welcome & Role */}
        {step === 1 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-[0.3em] font-ui">Passo 1 de 4</Badge>
              <h1 className="text-5xl font-display font-black tracking-tighter">Bem-vindo ao Cronofábula</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Aqui sua campanha continua mesmo quando a mesa se separa. Qual será seu papel inicial?</p>
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
            
            <div className="flex justify-center">
              <Button variant="ghost" onClick={nextStep} className="font-ui uppercase tracking-widest text-[10px] font-bold text-muted-foreground">
                Quero explorar o sistema primeiro <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Role Specific Actions */}
        {step === 2 && role === 'master' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-[0.3em] font-ui">Passo 2 de 4</Badge>
              <h1 className="text-4xl font-display font-black tracking-tighter">Inicie sua Crônica</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Defina os pilares do seu novo mundo.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="camp-name" className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome da Campanha</Label>
                      <Input id="camp-name" placeholder="Ex: O Retorno dos Antigos" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Sistema de Regras</Label>
                      <Select defaultValue="dnd5e">
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o sistema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dnd5e">D&D 5e (SRD)</SelectItem>
                          <SelectItem value="custom">Sistema Customizado</SelectItem>
                          <SelectItem value="other">Outros (Em breve)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Tom Narrativo</Label>
                      <Select defaultValue="dark">
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o tom" />
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
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={nextStep} className="bg-primary hover:bg-primary/90 rounded-full px-10">Continuar <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 2 && role === 'player' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-[0.3em] font-ui">Passo 2 de 4</Badge>
              <h1 className="text-4xl font-display font-black tracking-tighter">Encontre sua Mesa</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Insira o código enviado pelo seu mestre para entrar na campanha.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md max-w-lg mx-auto">
              <CardContent className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="font-ui uppercase text-[10px] tracking-widest font-bold">Código de Convite</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="code" placeholder="CRONO-1234-ABCD" className="pl-10" />
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

        {/* Step 3: Character / Final Prep */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-[0.3em] font-ui">Passo 3 de 4</Badge>
              <h1 className="text-4xl font-display font-black tracking-tighter">Sua Identidade</h1>
              <p className="text-xl font-heading italic text-muted-foreground">Crie seu primeiro personagem ou herói para começar.</p>
            </div>
            
            <Card className="bg-card/30 border-white/5 backdrop-blur-md">
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="char-name" className="font-ui uppercase text-[10px] tracking-widest font-bold">Nome do Personagem</Label>
                      <Input id="char-name" placeholder="Ex: Eldric, o Audaz" />
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
                            <SelectItem value="dwarf">Anão</SelectItem>
                            <SelectItem value="halfling">Halfling</SelectItem>
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
                            <SelectItem value="rogue">Ladino</SelectItem>
                            <SelectItem value="cleric">Clérigo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-ui uppercase text-[10px] tracking-widest font-bold">Tema Visual</Label>
                      <Select defaultValue="classic">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Clássico (Pergaminho)</SelectItem>
                          <SelectItem value="arcane">Arcano (Púrpura)</SelectItem>
                          <SelectItem value="dark">Sombrio (Noite)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="w-full h-14 border-dashed border-primary/30 text-primary">
                      <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Retrato (Opcional)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={nextStep} className="bg-primary hover:bg-primary/90 rounded-full px-10">Gerar Identidade <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {step === 4 && (
          <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-8 rounded-full bg-primary/20 text-primary border-2 border-primary animate-glow">
                  <Sparkles className="h-16 w-16" />
                </div>
              </div>
              <h1 className="text-6xl font-display font-black tracking-tighter">Sua Fábula Começou</h1>
              <p className="text-2xl font-heading italic text-muted-foreground max-w-2xl mx-auto">
                Tudo está pronto. O tempo agora corre a seu favor. Abra sua Mesa Viva e escreva o primeiro capítulo.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
              <Button asChild size="lg" className="px-16 py-10 text-2xl font-display rounded-full btn-arcane border-2 border-accent">
                <Link href="/dashboard">Entrar na Mesa Viva</Link>
              </Button>
            </div>
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

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: any }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-4 py-1 text-[10px] font-bold transition-colors ${className}`}>
      {children}
    </div>
  );
}
