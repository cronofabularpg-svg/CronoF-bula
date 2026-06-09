
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, Shield, Sword, Sparkles, Book, Trash2, Info, Search, Hammer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Inventario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isDemo, setIsDemo] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)

  React.useEffect(() => {
    setIsDemo(localStorage.getItem('cronofabula_demo_mode') === 'true')
  }, [])

  const itemsQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "items"), where("ownerId", "==", user.uid))
  }, [db, user, campaignId])

  const { data: items, loading } = useCollection(itemsQuery)

  const displayItems = (items && items.length > 0) ? items : (isDemo ? [
    { id: 'i1', name: 'Adaga de Prata', type: 'weapon', appearance: 'Uma lâmina curva com runas gravadas.', status: 'carried', knownProperties: ['Dano Mágico', 'Leve'] },
    { id: 'i2', name: 'Grimório de Couro de Dragão', type: 'magic', appearance: 'Capa escamosa e quente ao toque.', status: 'carried', knownProperties: ['Contém magias de fogo'] },
    { id: 'i4', name: 'Diário de Arvand', type: 'magic', appearance: 'Um livro de capa dura com o símbolo do Cronofábula.', status: 'carried', knownProperties: ['Registros de Jornada'] },
    { id: 'i3', name: 'Poção de Cura (Menor)', type: 'misc', appearance: 'Líquido vermelho efervescente.', status: 'carried', knownProperties: ['Cura 2d4+2 PV'] },
  ] : [])

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-accent flex items-center gap-4">
            <Package className="h-12 w-12" /> Bolsa de Aventureiro
          </h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">Cada objeto guarda uma história. Cada peso tem um propósito.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-card/50 border border-white/5 p-4 px-6 rounded-2xl flex items-center gap-6">
             <div className="text-center">
               <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Carga</span>
               <span className="text-xl font-code font-bold">12 / 60 <span className="text-xs opacity-30">kg</span></span>
             </div>
             <div className="text-center border-l border-white/10 pl-6">
               <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Ouro</span>
               <span className="text-xl font-code font-bold text-primary">450 <span className="text-xs opacity-30">po</span></span>
             </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayItems.map((item: any) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                isActive={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
          
          {displayItems.length === 0 && (
            <div className="p-20 border-2 border-dashed border-white/5 rounded-3xl text-center">
              <p className="text-muted-foreground font-heading italic">Sua bolsa está vazia. O mundo é vasto, saia e encontre algo útil.</p>
            </div>
          )}
        </div>

        {/* Detalhes do Item */}
        <div className="space-y-6">
          {selectedItem ? (
            <Card className="bg-card/30 border-accent/20 literary-shadow sticky top-10">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start">
                   <div className="p-3 rounded-2xl bg-accent/20 text-accent">
                     {selectedItem.type === 'weapon' ? <Sword /> : selectedItem.type === 'magic' ? <Sparkles /> : <Package />}
                   </div>
                   <Badge variant="outline" className="uppercase text-[9px] tracking-widest">{selectedItem.type}</Badge>
                </div>
                <CardTitle className="text-3xl font-display mt-4">{selectedItem.name}</CardTitle>
                <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-50">Item de Aventura</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <section className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Aparência</h4>
                  <p className="text-sm text-muted-foreground font-heading italic leading-relaxed">{selectedItem.appearance}</p>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Propriedades Conhecidas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.knownProperties.map((p: string, i: number) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-[9px]">{p}</Badge>
                    ))}
                  </div>
                </section>

                <div className="pt-6 grid grid-cols-2 gap-4">
                   <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5 h-12 text-[10px] uppercase font-bold tracking-widest">
                     <Hammer className="mr-2 h-4 w-4" /> Usar
                   </Button>
                   <Button variant="outline" className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 h-12 text-[10px] uppercase font-bold tracking-widest">
                     <Trash2 className="mr-2 h-4 w-4" /> Descartar
                   </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-10 text-center opacity-30">
               <Info className="h-12 w-12 mb-4" />
               <p className="font-heading italic">Selecione um item para ver seus segredos e propriedades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
        isActive ? 'bg-accent/5 border-accent shadow-gold' : 'bg-card/40 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted-foreground group-hover:text-foreground'}`}>
          {item.name.toLowerCase().includes('diário') ? <Book className="h-5 w-5" /> : item.type === 'weapon' ? <Sword className="h-5 w-5" /> : item.type === 'magic' ? <Sparkles className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <Badge variant="ghost" className="text-[8px] uppercase tracking-tighter opacity-50">{item.status}</Badge>
      </div>
      <h3 className={`font-display font-bold text-lg mb-1 ${isActive ? 'text-accent' : ''}`}>{item.name}</h3>
      <p className="text-[10px] text-muted-foreground line-clamp-1 italic font-heading">{item.appearance}</p>
    </div>
  )
}
