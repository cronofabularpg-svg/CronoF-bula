
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
  ChevronRight
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

  // Buscar herói do usuário
  const charQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "characters"), where("ownerId", "==", user.uid))
  }, [db, user, campaignId])
  const { data: chars } = useCollection(charQuery)
  const myChar = chars?.[0]

  // Buscar itens para verificar posse do Diário
  const itemsQuery = React.useMemo(() => {
    if (!db || !myChar || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "items"), where("ownerId", "==", user?.uid))
  }, [db, myChar, campaignId, user])
  const { data: items } = useCollection(itemsQuery)

  // Lógica de verificação de posse do Diário (Real ou Demo)
  const hasDiary = React.useMemo(() => {
    if (isDemo) return true; // No modo demo o jogador começa com o item
    if (!items) return false;
    return items.some(item => 
      item.name.toLowerCase().includes('diário') && 
      item.status === 'carried'
    );
  }, [items, isDemo]);

  // Buscar entradas do diário
  const diaryQuery = React.useMemo(() => {
    if (!db || !myChar || !campaignId || !hasDiary) return null
    return query(collection(db, "campaigns", campaignId, "characters", myChar.id, "diary"), orderBy("createdAt", "desc"))
  }, [db, myChar, campaignId, hasDiary])
  const { data: entries, loading } = useCollection(diaryQuery)

  const displayEntries = (entries && entries.length > 0) ? entries : (isDemo ? [
    { id: 'e1', title: 'O Estranho no Cais', content: 'Vi um homem de capa roxa falando com as gaivotas. Loucura ou magia?', type: 'fact', createdAt: new Date().toISOString() },
    { id: 'e2', title: 'Pista: Chave de Ferro', content: 'O taberneiro disse que o capitão escondeu a chave sob uma tábua solta.', type: 'clue', createdAt: new Date().toISOString() },
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

  // Tela de Bloqueio se não tiver o item
  if (!hasDiary) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 bg-[#080B18] text-[#FFF6E5] text-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="p-8 rounded-full bg-destructive/10 border-2 border-destructive/30 animate-pulse">
            <Lock className="h-16 w-16 text-destructive" />
          </div>
          <Hourglass className="absolute -bottom-2 -right-2 h-8 w-8 text-accent animate-spin-slow" />
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-display font-black tracking-tighter">Memórias Inacessíveis</h1>
          <p className="text-xl font-heading italic text-muted-foreground leading-relaxed">
            "As páginas de sua jornada não estão em suas mãos. Sem o seu Diário físico, os registros do passado permanecem perdidos nas brumas do esquecimento."
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="rounded-full border-white/10 hover:bg-white/5 px-8">
            <Link href={`/campaign/${campaignId}/inventario`}>Verificar Inventário</Link>
          </Button>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 px-8">
            <Link href={`/campaign/${campaignId}/mesa-viva`}>Voltar à Mesa</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3E7CF] text-[#101018] dark:bg-[#080B18] dark:text-[#FFF6E5]">
      <header className="p-8 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#3A1F5D] text-white shadow-arcane">
            <Book className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Diário de Jornada</h1>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-1">Herói: {myChar?.name || 'Aventureiro'}</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="rounded-full bg-[#111936] text-white hover:bg-[#18224A] dark:bg-primary dark:text-primary-foreground px-8 font-bold"
        >
          {isAdding ? 'Fechar Grimório' : <><Plus className="mr-2 h-4 w-4" /> Nova Anotação</>}
        </Button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Editor Lateral */}
        {isAdding && (
          <div className="w-full md:w-[450px] border-r border-black/5 dark:border-white/5 p-10 space-y-8 bg-white/50 dark:bg-black/30 animate-in slide-in-from-left-8 duration-500 overflow-y-auto">
            <h2 className="text-2xl font-display font-bold text-accent">Escrever Destino</h2>
            <div className="space-y-6">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-black tracking-widest">Título da Memória</Label>
                 <Input 
                   value={newEntry.title} 
                   onChange={e => setNewEntry({...newEntry, title: e.target.value})} 
                   placeholder="Ex: O Encontro nas Sombras"
                   className="bg-background/50 font-heading text-lg"
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-black tracking-widest">Natureza do Registro</Label>
                 <div className="flex gap-2">
                    <TypeButton active={newEntry.type === 'fact'} onClick={() => setNewEntry({...newEntry, type: 'fact'})} label="Fato" icon={<Star />} />
                    <TypeButton active={newEntry.type === 'clue'} onClick={() => setNewEntry({...newEntry, type: 'clue'})} label="Pista" icon={<Search />} />
                    <TypeButton active={newEntry.type === 'thought'} onClick={() => setNewEntry({...newEntry, type: 'thought'})} label="Reflexão" icon={<Ghost />} />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-black tracking-widest">Conteúdo</Label>
                 <Textarea 
                   value={newEntry.content} 
                   onChange={e => setNewEntry({...newEntry, content: e.target.value})} 
                   placeholder="As páginas aguardam sua pena..."
                   className="min-h-[250px] bg-background/50 font-heading text-xl leading-relaxed italic"
                 />
               </div>
               <Button onClick={handleAddEntry} className="w-full py-8 text-lg font-display bg-primary text-white hover:bg-primary/90 shadow-arcane">
                 Registrar no Diário
               </Button>
            </div>
          </div>
        )}

        {/* Lista de Entradas Estilo Pergaminho */}
        <ScrollArea className="flex-1 p-10 md:p-20">
          <div className="max-w-4xl mx-auto space-y-12 pb-20">
             {displayEntries.map((entry: any) => (
               <div key={entry.id} className="relative group animate-in fade-in duration-1000">
                  <div className="absolute -left-12 top-0 h-full flex flex-col items-center">
                     <div className="p-2 rounded-full bg-accent/20 text-accent">
                        <Calendar className="h-4 w-4" />
                     </div>
                     <div className="w-px flex-1 bg-accent/10 my-4" />
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                        <Badge className={`uppercase text-[8px] font-black tracking-widest ${
                          entry.type === 'clue' ? 'bg-primary/20 text-primary' : 
                          entry.type === 'thought' ? 'bg-secondary/20 text-secondary' : 
                          'bg-accent/20 text-accent'
                        }`}>
                          {entry.type}
                        </Badge>
                        <span className="text-[10px] font-code opacity-30">{new Date(entry.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h3 className="text-3xl font-display font-bold text-accent/80 tracking-tight">{entry.title || 'Sem Título'}</h3>
                     <p className="text-xl font-heading italic leading-relaxed opacity-80 first-letter:text-4xl first-letter:font-display first-letter:mr-1">
                       {entry.content}
                     </p>
                     <div className="flex gap-4 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-[9px] uppercase font-bold tracking-widest hover:text-primary p-0 h-auto">
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Compartilhar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-[9px] uppercase font-bold tracking-widest hover:text-destructive p-0 h-auto">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Rasgar Página
                        </Button>
                     </div>
                  </div>
               </div>
             ))}

             {displayEntries.length === 0 && (
               <div className="text-center py-40 opacity-20 flex flex-col items-center gap-6">
                 <Book className="h-24 w-24" />
                 <p className="text-3xl font-heading italic">O silêncio do deserto em forma de papel.</p>
               </div>
             )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function TypeButton({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
        active ? 'bg-primary text-white border-primary shadow-arcane' : 'bg-white/5 border-white/10 opacity-50 hover:opacity-100'
      }`}
    >
      {icon}
      <span className="text-[8px] uppercase font-black tracking-widest">{label}</span>
    </button>
  )
}
