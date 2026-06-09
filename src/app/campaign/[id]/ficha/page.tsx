
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Star, 
  Sparkles,
  Info,
  Camera,
  Search,
  Maximize2
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function FichaPersonagem() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isEditingPhoto, setIsEditingPhoto] = React.useState(false)
  const [photoUrlInput, setPhotoUrlUrlInput] = React.useState("")

  const charactersQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(
      collection(db, "campaigns", campaignId, "characters"),
      where("ownerId", "==", user.uid)
    )
  }, [db, user, campaignId])

  const { data: characters, loading } = useCollection(charactersQuery)
  const character = characters?.[0] as any

  if (loading) return <div className="p-20 text-center italic font-heading text-2xl opacity-40">Consultando os anais...</div>
  if (!character) return <div className="p-20 text-center text-muted-foreground italic font-heading text-2xl opacity-40">Nenhum herói encontrado nesta campanha.</div>

  const calculateModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  const stats = character.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const proficiency = Math.floor((character.level - 1) / 4) + 2;

  const charPhoto = character.photoURL || `https://picsum.photos/seed/${character.id}/500/500`;

  async function handleUpdatePhoto() {
    if (!db || !campaignId || !character) return
    try {
      await updateDoc(doc(db, "campaigns", campaignId, "characters", character.id), {
        photoURL: photoUrlInput
      })
      toast({ title: "Retrato Atualizado", description: "Sua nova aparência foi gravada nos anais." })
      setIsEditingPhoto(false)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Invocação", description: e.message })
    }
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative h-40 w-40 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-arcane cursor-zoom-in group">
                  <img 
                    src={charPhoto} 
                    alt={character.name} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-primary/20 max-w-4xl p-0 overflow-hidden">
                <img src={charPhoto} alt={character.name} className="w-full h-full object-contain max-h-[85vh]" />
                <div className="p-6 bg-gradient-to-t from-black to-transparent absolute bottom-0 w-full">
                  <h2 className="text-3xl font-display font-black text-primary">{character.name}</h2>
                  <p className="text-muted-foreground font-heading italic">{character.race} {character.class}</p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="absolute -bottom-2 -right-2 bg-background border border-primary/30 rounded-full h-10 w-10 shadow-arcane">
                  <Camera className="h-4 w-4 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-accent/30">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display">Consagrar Novo Retrato</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest">Link da Imagem</Label>
                    <Input 
                      placeholder="https://..." 
                      value={photoUrlInput} 
                      onChange={e => setPhotoUrlUrlInput(e.target.value)} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Use um link público de imagem (Unsplash, Pinterest, etc).</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsEditingPhoto(false)}>Cancelar</Button>
                  <Button onClick={handleUpdatePhoto} className="bg-primary px-8">Manifestar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-display font-black tracking-tighter text-primary">{character.name}</h1>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                Nvl {character.level}
              </Badge>
            </div>
            <p className="text-xl font-heading italic text-muted-foreground mt-2 capitalize">
              {character.race} {character.class} • Status: {character.status === 'pending' ? 'Aguardando Aprovação' : 'Ativo'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Experiência (XP)</span>
            <div className="flex items-center gap-3">
              <Progress value={((character.xp || 0) % 1000) / 10} className="w-32 h-2" />
              <span className="text-xs font-code font-bold text-primary">{character.xp || 0}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Atributos e Defesas */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-50 flex items-center font-display">
              <Star className="mr-2 h-4 w-4 text-primary" /> Atributos SRD
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="FOR" value={stats.str} mod={calculateModifier(stats.str)} />
              <StatCard label="DES" value={stats.dex} mod={calculateModifier(stats.dex)} />
              <StatCard label="CON" value={stats.con} mod={calculateModifier(stats.con)} />
              <StatCard label="INT" value={stats.int} mod={calculateModifier(stats.int)} />
              <StatCard label="SAB" value={stats.wis} mod={calculateModifier(stats.wis)} />
              <StatCard label="CAR" value={stats.cha} mod={calculateModifier(stats.cha)} />
            </div>
          </section>

          <Card className="bg-card/30 border-white/5 backdrop-blur-xl">
            <CardContent className="p-6 grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <Shield className="h-6 w-6 text-primary mb-2" />
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest text-center leading-tight">Classe de Armadura</span>
                <span className="text-3xl font-display font-bold text-primary">{character.ac || 10}</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/5">
                <Zap className="h-6 w-6 text-accent mb-2" />
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest text-center leading-tight">Iniciativa</span>
                <span className="text-3xl font-display font-bold text-accent">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex gap-4 oracle-glow">
             <Info className="h-5 w-5 text-primary shrink-0" />
             <p className="text-[10px] text-muted-foreground italic leading-relaxed">
               Bônus de Proficiência atual: <span className="text-primary font-bold">+{proficiency}</span>. Adicione aos testes das perícias que você domina.
             </p>
          </div>
        </div>

        {/* Vitalidade e Combate */}
        <div className="md:col-span-2 space-y-10">
          <Card className="bg-[#2B1218]/20 border-destructive/20 literary-shadow overflow-hidden">
            <div className="h-1 bg-destructive/30" />
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/20 text-destructive shadow-arcane">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-destructive">Vitalidade (PV)</h4>
                    <p className="text-xs text-muted-foreground font-heading italic">Sua força vital no tecido da crônica.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-display font-bold text-destructive">{character.hp || 10} / {character.maxHp || 10}</span>
                </div>
              </div>
              <Progress value={((character.hp || 0) / (character.maxHp || 1)) * 100} className="h-3 bg-destructive/10" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 flex items-center font-display">
                <Sword className="mr-2 h-4 w-4 text-primary" /> Ataques Físicos
              </h3>
              <div className="space-y-3">
                <ActionCard name="Golpe de Aço" detail={`+${Number(calculateModifier(stats.str)) + proficiency} para atingir | Dano: 1d8 ${calculateModifier(stats.str)}`} />
                <ActionCard name="Arremesso" detail={`+${Number(calculateModifier(stats.dex)) + proficiency} para atingir | Dano: 1d4 ${calculateModifier(stats.dex)}`} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-50 flex items-center font-display">
                <Sparkles className="mr-2 h-4 w-4 text-primary" /> Habilidades Arcanas
              </h3>
              <div className="space-y-3">
                <ActionCard name="Conconjuração" detail={`CD Resistência: ${8 + proficiency + Number(calculateModifier(stats.int))} | +${proficiency + Number(calculateModifier(stats.int))} p/ atingir`} />
                <ActionCard name="Truque Místico" detail="Uso Ilimitado" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, mod }: { label: string, value: number, mod: string }) {
  return (
    <div className="p-4 rounded-xl bg-card/40 border border-white/5 flex flex-col items-center group hover:border-primary/40 transition-all cursor-default">
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{label}</span>
      <span className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{value}</span>
      <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-black font-code">{mod}</Badge>
    </div>
  )
}

function ActionCard({ name, detail }: { name: string, detail: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer">
      <div>
        <h5 className="text-sm font-bold group-hover:text-primary transition-colors">{name}</h5>
        <p className="text-[10px] text-muted-foreground font-heading italic uppercase tracking-tighter mt-1">{detail}</p>
      </div>
      <Badge variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary text-[8px] uppercase font-black">
        Rolar 1d20
      </Badge>
    </div>
  )
}
