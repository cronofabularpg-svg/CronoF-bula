
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ScrollText, 
  Calendar, 
  Users, 
  Package, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  Search,
  Sword
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Cronicas() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()

  const chroniclesQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "chronicles"), orderBy("createdAt", "desc"))
  }, [db, campaignId])

  const { data: chronicles, loading } = useCollection(chroniclesQuery)

  const [selectedChronicle, setSelectedChronicle] = React.useState<any>(null)

  return (
    <div className="h-screen flex flex-col bg-[#F3E7CF] text-[#101018] dark:bg-[#080B18] dark:text-[#FFF6E5]">
      <header className="p-8 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary text-white shadow-arcane">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-accent">Crônicas de Arvand</h1>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-1">O Registro Imortal da Jornada</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
          <input 
            placeholder="Buscar fatos..." 
            className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 rounded-full border-none text-xs font-ui"
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Índice de Sessões */}
        <aside className="w-full md:w-80 border-r border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex flex-col">
          <div className="p-6 border-b border-black/5 dark:border-white/5">
             <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Linha do Tempo</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="p-8 text-center italic opacity-30">Lendo os anais...</div>
              ) : chronicles?.map((chron: any) => (
                <button
                  key={chron.id}
                  onClick={() => setSelectedChronicle(chron)}
                  className={`w-full p-4 rounded-xl text-left transition-all group ${
                    selectedChronicle?.id === chron.id 
                    ? 'bg-accent/20 border-accent/30 shadow-gold' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-code opacity-40">{new Date(chron.createdAt).toLocaleDateString()}</span>
                    <Badge variant="ghost" className="h-4 text-[8px] border-accent/20">Sessão</Badge>
                  </div>
                  <h4 className="font-display font-bold text-sm line-clamp-1">{chron.title}</h4>
                </button>
              ))}
              {chronicles?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground italic text-xs">
                  A história ainda não foi escrita.
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Conteúdo da Crônica */}
        <main className="flex-1 relative overflow-hidden bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, #C8A24A 1px, transparent 1px)', backgroundSize: '80px 80px', opacity: 1 }}>
          <ScrollArea className="h-full">
             {selectedChronicle ? (
               <div className="max-w-4xl mx-auto p-12 md:p-24 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <header className="space-y-6 text-center">
                    <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-[0.2em] font-ui px-4 py-1">Capítulo Canônico</Badge>
                    <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-accent">{selectedChronicle.title}</h2>
                    <div className="flex justify-center items-center gap-6 opacity-40">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-code">{new Date(selectedChronicle.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-current" />
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-heading italic">Narrada por IA & Mestre</span>
                      </div>
                    </div>
                  </header>

                  <section className="space-y-8">
                     <div className="text-2xl md:text-3xl leading-relaxed font-heading italic opacity-90 first-letter:text-7xl first-letter:font-display first-letter:mr-2 first-letter:float-left first-letter:text-primary">
                        {selectedChronicle.summary}
                     </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-black/10 dark:border-white/10">
                    <div className="space-y-6">
                       <h3 className="text-xs uppercase font-black tracking-[0.3em] text-accent flex items-center gap-3">
                         <Sword className="h-4 w-4" /> Decisões Críticas
                       </h3>
                       <ul className="space-y-4">
                         {selectedChronicle.importantDecisions?.map((d: string, i: number) => (
                           <li key={i} className="flex gap-4 items-start">
                             <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                             <p className="text-sm italic opacity-70">{d}</p>
                           </li>
                         ))}
                       </ul>
                    </div>
                    <div className="space-y-10">
                       <div className="space-y-6">
                          <h3 className="text-xs uppercase font-black tracking-[0.3em] text-accent flex items-center gap-3">
                            <Users className="h-4 w-4" /> Figuras Notáveis
                          </h3>
                          <div className="flex flex-wrap gap-2">
                             {selectedChronicle.npcsEncountered?.map((n: string, i: number) => (
                               <Badge key={i} className="bg-primary/10 text-primary border-primary/20">{n}</Badge>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <h3 className="text-xs uppercase font-black tracking-[0.3em] text-accent flex items-center gap-3">
                            <Package className="h-4 w-4" /> Espólios & Relíquias
                          </h3>
                          <div className="flex flex-wrap gap-2">
                             {selectedChronicle.itemsGained?.map((it: string, i: number) => (
                               <Badge key={i} variant="outline" className="border-accent/30 text-accent">{it}</Badge>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  {selectedChronicle.masterSecrets && (
                    <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
                       <h4 className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-2">
                         <Sparkles className="h-4 w-4" /> Oráculo do Mestre (Segredos)
                       </h4>
                       <p className="text-sm italic opacity-60 leading-relaxed">
                         {selectedChronicle.masterSecrets}
                       </p>
                    </div>
                  )}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center gap-8">
                  <BookOpen className="h-24 w-24" />
                  <div className="space-y-2">
                    <h2 className="text-4xl font-display font-bold">O Grande Arquivo</h2>
                    <p className="text-xl font-heading italic max-w-md">Selecione uma crônica à esquerda para ler os registros oficiais da sua jornada.</p>
                  </div>
               </div>
             )}
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
