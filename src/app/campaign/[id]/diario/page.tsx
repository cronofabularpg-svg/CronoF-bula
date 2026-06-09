
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Book, 
  Plus, 
  Search, 
  Calendar, 
  Ghost, 
  MessageSquare, 
  Star, 
  Trash2, 
  Lock,
  Hourglass,
  ChevronRight,
  BookOpen,
  Feather
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export default function Diario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDemo, setIsDemo] = React.useState(false)
  const [isAdding, setIsAdding] = React.useState(false)
  const [newEntry, setNewEntry] = React.useState({ title: '', content: '', type: 'fact' })

  React.useEffect(() => {
    setIsDemo(localStorage.getItem('cronofabula_demo_mode') === 'true')
  }, [])

  const charQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "characters"), where("ownerId", "==", user.uid))
  }, [db, user, campaignId])
  const { data: chars } = useCollection(charQuery)
  const myChar = chars?.[0]

  const itemsQuery = React.useMemo(() => {
    if (!db || !myChar || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "items"), where("ownerId", "==", user?.uid))
  }, [db, myChar, campaignId, user])
  const { data: items } = useCollection(itemsQuery)

  const hasDiary = React.useMemo(() => {
    if (isDemo) return true;
    if (!items) return false;
    return items.some(item => 
      item.name.toLowerCase().includes('diário') && 
      item.status === 'carried'
    );
  }, [items, isDemo]);

  const diaryQuery = React.useMemo(() => {
    if (!db || !myChar || !campaignId || !hasDiary) return null
    return query(collection(db, "campaigns", campaignId, "characters", myChar.id, "diary"), orderBy("createdAt", "desc"))
  }, [db, myChar, campaignId, hasDiary])
  const { data: entries, loading } = useCollection(diaryQuery)

  const displayEntries = (entries && entries.length > 0) ? entries : (isDemo ? [
    { id: 'e1', title: 'O Estranho no Cais', content: 'Vi um homem de capa roxa falando com as gaivotas. Loucura ou magia? O cheiro de salitre era forte demais para ser apenas um delírio.', type: 'fact', createdAt: new Date().toISOString() },
    { id: 'e2', title: 'Pista: Chave de Ferro', content: 'O taberneiro, após três canecas de hidromel, jurou que o capitão escondeu a chave sob uma tábua solta na Taverna do Cervo Torto.', type: 'clue', createdAt: new Date().toISOString() },
  ] : [])

  async function handleAddEntry() {
    if (!db || !myChar || !campaignId || !newEntry.content) return
    try {
      await addDoc(collection(db, "campaigns", campaignId, "characters", myChar.id, "diary"), {
        ...newEntry,
        characterId: myChar.id,
        campaignId,
        createdAt: serverTimestamp()
      })
      setNewEntry({ title: '', content: '', type: 'fact' })
      setIsAdding(false)
      toast({ title: "Crônica Registrada", description: "Sua anotação foi guardada nos anais do tempo." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Escrita", description: e.message })
    }
  }

  if (!hasDiary) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 bg-[#050711] text-[#FFF6E5] text-center space-y-12 animate-in fade-in duration-700">
        <div className="relative">
          <div className="p-12 rounded-full bg-destructive/10 border-2 border-destructive/30 shadow-[0_0_50px_rgba(185,74,72,0.2)]">
            <Lock className="h-24 w-24 text-destructive" />
          </div>
          <Hourglass className="absolute -bottom-4 -right-4 h-12 w-12 text-primary animate-spin-slow" />
        </div>
        <div className="max-w-2xl space-y-6">
          <h1 className="text-6xl font-display font-black tracking-tighter text-primary">Memórias Inacessíveis</h1>
          <p className="text-3xl font-heading italic text-muted-foreground leading-relaxed">
            "As páginas de sua jornada não estão em suas mãos. Sem o seu Diário físico, os registros do passado permanecem perdidos nas brumas do esquecimento."
          </p>
        </div>
        <div className="flex gap-8">
          <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 px-12 h-16 font-display text-[10px] tracking-widest">
            <Link href={`/campaign/${campaignId}/inventario`}>Verificar Inventário</Link>
          </Button>
          <Button asChild className="btn-ritual rounded-full px-16 h-16 literary-shadow">
            <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050711] text-[#FFF6E5]">
      <header className="p-10 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.5rem] bg-primary shadow-arcane">
            <BookOpen className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter text-primary">Diário de Jornada</h1>
            <p className="text-[10px] font-display uppercase font-black tracking-[0.3em] opacity-40 mt-2">Herói: {myChar?.name || 'Aventureiro'}</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={`rounded-full px-12 h-16 text-lg transition-all literary-shadow ${isAdding ? 'bg-destructive/20 text-destructive border-2 border-destructive/40' : 'btn-ritual'}`}
        >
          {isAdding ? 'Fechar Grimório' : <><Feather className="mr-3 h-5 w-5" /> Nova Anotação</>}
        </Button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {isAdding && (
          <div className="w-full md:w-[500px] border-r border-primary/10 p-12 space-y-10 bg-black/40 backdrop-blur-3xl animate-in slide-in-from-left-8 duration-500 overflow-y-auto scrollbar-hide">
            <h2 className="text-4xl font-display font-bold text-primary tracking-tighter">Escrever Destino</h2>
            <div className="space-y-8">
               <div className="space-y-3">
                 <Label className="text-[10px] font-display uppercase font-black tracking-[0.2em] opacity-40">Título da Memória</Label>
                 <Input 
                   value={newEntry.title} 
                   onChange={e => setNewEntry({...newEntry, title: e.target.value})} 
                   placeholder="Ex: O Encontro nas Sombras"
                   className="bg-black/20 border-primary/20 font-heading text-2xl h-16 px-6"
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-display uppercase font-black tracking-[0.2em] opacity-40">Natureza do Registro</Label>
                 <div className="flex gap-4">
                    <EntryTypeButton active={newEntry.type === 'fact'} onClick={() => setNewEntry({...newEntry, type: 'fact'})} label="Fato" icon={<Star />} />
                    <EntryTypeButton active={newEntry.type === 'clue'} onClick={() => setNewEntry({...newEntry, type: 'clue'})} label="Pista" icon={<Search />} />
                    <EntryTypeButton active={newEntry.type === 'thought'} onClick={() => setNewEntry({...newEntry, type: 'thought'})} label="Reflexão" icon={<Ghost />} />
                 </div>
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-display uppercase font-black tracking-[0.2em] opacity-40">Conteúdo Arcano</Label>
                 <Textarea 
                   value={newEntry.content} 
                   onChange={e => setNewEntry({...newEntry, content: e.target.value})} 
                   placeholder="As páginas aguardam sua pena..."
                   className="min-h-[350px] bg-black/20 border-primary/20 font-heading text-2xl leading-relaxed italic p-8"
                 />
               </div>
               <Button onClick={handleAddEntry} className="btn-ritual w-full h-20 text-2xl literary-shadow">
                 Registrar no Diário
               </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-12 md:p-24 relative overflow-hidden">
          {/* Fundo de Pergaminho no ScrollArea */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          
          <div className="max-w-4xl mx-auto space-y-24 pb-40">
             {displayEntries.map((entry: any) => (
               <div key={entry.id} className="relative group animate-in fade-in duration-1000">
                  <div className="absolute -left-16 top-0 h-full flex flex-col items-center">
                     <div className="p-3 rounded-full bg-primary/20 text-primary border border-primary/30 shadow-arcane">
                        <Calendar className="h-5 w-5" />
                     </div>
                     <div className="w-px flex-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent my-6" />
                  </div>
                  <div className="space-y-8 pl-4">
                     <div className="flex items-center gap-6">
                        <Badge className={`uppercase text-[9px] font-display font-black tracking-[0.2em] px-4 py-1 rounded-full border ${
                          entry.type === 'clue' ? 'bg-[#3A1F5D]/20 text-primary border-primary/30' : 
                          entry.type === 'thought' ? 'bg-secondary/20 text-secondary border-secondary/30' : 
                          'bg-primary/20 text-primary border-primary/30'
                        }`}>
                          {entry.type}
                        </Badge>
                        <span className="text-[10px] font-code opacity-30 uppercase tracking-widest">{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <h3 className="text-6xl font-display font-black text-primary tracking-tighter group-hover:text-[#F0D484] transition-colors duration-700">{entry.title || 'Sem Título'}</h3>
                     
                     <div className="parchment p-12 rounded-[2.5rem] literary-shadow relative overflow-hidden group-hover:rotate-1 transition-transform duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                           <Feather className="h-20 w-24 -rotate-45" />
                        </div>
                        <p className="text-3xl font-heading italic leading-[1.6] opacity-90 first-letter:text-8xl first-letter:font-display first-letter:mr-4 first-letter:float-left first-letter:text-primary">
                          {entry.content}
                        </p>
                     </div>

                     <div className="flex gap-8 pt-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <Button variant="ghost" size="sm" className="text-[10px] font-display uppercase font-black tracking-widest hover:text-primary p-0 h-auto gap-2">
                          <MessageSquare className="h-4 w-4" /> Compartilhar Pensamento
                        </Button>
                        <Button variant="ghost" size="sm" className="text-[10px] font-display uppercase font-black tracking-widest hover:text-destructive p-0 h-auto gap-2">
                          <Trash2 className="h-4 w-4" /> Rasgar Página
                        </Button>
                     </div>
                  </div>
               </div>
             ))}

             {displayEntries.length === 0 && (
               <div className="text-center py-60 opacity-10 flex flex-col items-center gap-10">
                 <BookOpen className="h-40 w-40" />
                 <p className="text-5xl font-heading italic">"O silêncio do deserto em forma de papel."</p>
               </div>
             )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function EntryTypeButton({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
        active 
          ? 'bg-primary text-black border-primary shadow-arcane' 
          : 'bg-black/40 border-white/5 opacity-30 hover:opacity-100 hover:border-primary/40'
      }`}
    >
      <span className="scale-125">{icon}</span>
      <span className="text-[10px] font-display uppercase font-black tracking-widest">{label}</span>
    </button>
  )
}
