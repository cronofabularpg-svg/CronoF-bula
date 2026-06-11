
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, Shield, Sword, Sparkles, Book, Trash2, Info, Search, Hammer, Weight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function Inventario() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [selectedItem, setSelectedItem] = React.useState<any>(null)

  const charQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "characters"), where("ownerId", "==", user.uid))
  }, [db, user, campaignId])
  const { data: chars } = useCollection(charQuery)
  const myChar = chars?.[0] as any

  const itemsQuery = React.useMemo(() => {
    if (!db || !user || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "items"), where("ownerId", "==", user.uid))
  }, [db, user, campaignId])

  const { data: items, loading } = useCollection(itemsQuery)

  const displayItems = items || []

  const totalWeight = React.useMemo(() => {
    return displayItems.reduce((acc, it) => acc + (it.weight || 0), 0)
  }, [displayItems])

  const maxCapacity = (myChar?.stats?.str || 10) * 7.5; // D&D: STR * 15 lbs. Usando 7.5kg para sistema métrico.

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div>
          <h1 className="text-6xl font-display font-black tracking-tighter text-accent flex items-center gap-6">
            <Package className="h-14 w-14" /> Bolsa de Aventureiro
          </h1>
          <p className="text-muted-foreground mt-4 font-heading text-2xl italic opacity-70">"Cada grama conta quando se caminha entre as brumas."</p>
        </div>
        <div className="flex gap-6">
           <div className="bg-card/50 border border-white/10 p-6 px-10 rounded-[2rem] flex items-center gap-10 literary-shadow">
             <div className="space-y-3">
               <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block">Carga de Viagem</span>
               <div className="flex items-center gap-4">
                  <span className="text-3xl font-code font-bold">{totalWeight.toFixed(1)} / {maxCapacity} <span className="text-xs opacity-30">kg</span></span>
                  <Progress value={(totalWeight / maxCapacity) * 100} className={`w-32 h-2 ${totalWeight > maxCapacity ? 'bg-destructive/20 [&>div]:bg-destructive' : 'bg-primary/10'}`} />
               </div>
             </div>
             <div className="h-12 w-px bg-white/10" />
             <div className="text-center">
               <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Riqueza po</span>
               <span className="text-3xl font-code font-bold text-primary">{myChar?.gold || 450}</span>
             </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Lista de Itens */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="p-32 border-2 border-dashed border-white/5 rounded-[3rem] text-center space-y-6 opacity-30">
              <Package className="h-16 w-16 mx-auto" />
              <p className="font-heading italic text-2xl">"Sua bolsa ecoa o vazio do deserto."</p>
            </div>
          )}
        </div>

        {/* Detalhes do Item */}
        <div className="lg:col-span-4 space-y-6">
          {selectedItem ? (
            <Card className="bg-card/40 border-accent/20 backdrop-blur-3xl literary-shadow sticky top-10 rounded-[2.5rem] overflow-hidden">
              <div className="h-1.5 bg-accent/30" />
              <CardHeader className="p-10 pb-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 rounded-2xl bg-accent/20 text-accent shadow-arcane">
                     {selectedItem.type === 'weapon' ? <Sword className="h-8 w-8" /> : selectedItem.type === 'magic' ? <Sparkles className="h-8 w-8" /> : <Package className="h-8 w-8" />}
                   </div>
                   <div className="text-right">
                     <Badge className="uppercase text-[9px] font-black tracking-widest px-3 py-1 mb-2">{selectedItem.type}</Badge>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Weight className="h-3 w-3" />
                        <span className="text-[10px] font-bold">{selectedItem.weight || 0} kg</span>
                     </div>
                   </div>
                </div>
                <CardTitle className="text-4xl font-display mt-8 tracking-tight">{selectedItem.name}</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40 mt-2">Relíquia Registrada</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <section className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-3">
                    <Info className="h-3 w-3" /> Aparência Revelada
                  </h4>
                  <p className="text-lg text-muted-foreground font-heading italic leading-relaxed">{selectedItem.appearance}</p>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-3">
                    <Sparkles className="h-3 w-3" /> Propriedades Canônicas
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedItem.knownProperties.map((p: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-3 py-1">{p}</Badge>
                    ))}
                  </div>
                </section>

                <div className="pt-10 grid grid-cols-2 gap-4">
                   <Button className="btn-ritual h-14 rounded-2xl text-[10px] font-black tracking-widest">
                     <Hammer className="mr-2 h-4 w-4" /> Manifestar
                   </Button>
                   <Button variant="outline" className="h-14 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 text-[10px] font-black tracking-widest">
                     <Trash2 className="mr-2 h-4 w-4" /> Descartar
                   </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] p-10 text-center space-y-8 opacity-20 group hover:opacity-40 transition-opacity">
               <div className="p-8 rounded-full bg-white/5 group-hover:rotate-12 transition-transform">
                  <Info className="h-16 w-16" />
               </div>
               <p className="font-heading italic text-2xl max-w-[200px]">"Sua mente aguarda por um objeto para recordar."</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) {
  const icon = item.name.toLowerCase().includes('diário') ? <Book className="h-6 w-6" /> : 
               item.type === 'weapon' ? <Sword className="h-6 w-6" /> : 
               item.type === 'magic' ? <Sparkles className="h-6 w-6" /> : 
               <Package className="h-6 w-6" />;

  return (
    <div 
      onClick={onClick}
      className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${
        isActive ? 'bg-primary/5 border-primary shadow-arcane' : 'bg-card/40 border-white/5 hover:border-primary/20'
      }`}
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
         <Package className="h-20 w-20" />
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl transition-all shadow-md ${isActive ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground group-hover:text-primary'}`}>
          {icon}
        </div>
        <div className="flex flex-col items-end gap-2">
           <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest opacity-40">{item.status}</Badge>
           <span className="text-[9px] font-code opacity-30">{item.weight || 0}kg</span>
        </div>
      </div>
      <h3 className={`text-2xl font-display font-bold mb-2 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>{item.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-1 italic font-heading opacity-60">{item.appearance}</p>
    </div>
  )
}
