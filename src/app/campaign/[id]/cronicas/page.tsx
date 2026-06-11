
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  Sword,
  ShieldCheck,
  History
} from "lucide-react"

type ChronicleRow = {
  id: string
  campaign_id: string
  session_id: string | null
  title: string
  summary: string | null
  public_content: string | null
  master_notes: string | null
  status: string
  visibility: string
  created_at: string
  approved_at: string | null
}

export default function Cronicas() {
  const { id: campaignId } = useParams() as { id: string }
  const [chronicles, setChronicles] = React.useState<ChronicleRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedChronicle, setSelectedChronicle] = React.useState<ChronicleRow | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    if (!campaignId) return
    let active = true
    const supabase = createClient()

    supabase
      .rpc('get_campaign_chronicles', { target_campaign_id: campaignId })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setLoading(false)
          return
        }
        const rows = (data as ChronicleRow[]) || []
        setChronicles(rows)
        setSelectedChronicle(rows[0] || null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [campaignId])

  return (
    <div className="h-screen flex flex-col bg-[#050711] text-[#FFF6E5]">
      <header className="p-10 border-b border-primary/10 bg-background/60 backdrop-blur-xl flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.5rem] bg-primary shadow-arcane">
            <ScrollText className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter text-primary">Anais de Arvand</h1>
            <p className="text-[10px] font-display uppercase font-black tracking-[0.3em] opacity-40 mt-2">O Registro Imortal da Jornada</p>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-30 text-primary" />
          <input
            placeholder="Buscar verdades canônicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-black/40 border-primary/20 rounded-2xl text-sm font-heading italic focus:ring-primary focus:border-primary/40 outline-none transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Índice de Sessões - Estilo Sumário de Livro */}
        <aside className="w-full md:w-96 border-r border-primary/10 bg-black/20 backdrop-blur-2xl flex flex-col">
          <div className="p-8 border-b border-primary/10 flex items-center justify-between">
             <span className="text-[10px] font-display uppercase font-black tracking-[0.2em] text-primary opacity-60">Linha do Tempo</span>
             <History className="h-4 w-4 text-primary opacity-20" />
          </div>
          <ScrollArea className="flex-1 scrollbar-hide">
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="p-20 text-center italic font-heading text-xl opacity-30 animate-pulse">Lendo os anais...</div>
              ) : chronicles.filter((chron) => chron.title.toLowerCase().includes(searchTerm.trim().toLowerCase())).map((chron) => (
                <button
                  key={chron.id}
                  onClick={() => setSelectedChronicle(chron)}
                  className={`w-full p-6 rounded-2xl text-left transition-all duration-500 group border-2 ${
                    selectedChronicle?.id === chron.id 
                    ? 'bg-primary/10 border-primary shadow-arcane' 
                    : 'bg-black/20 border-white/5 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-code opacity-40 tracking-widest">{new Date(chron.created_at).toLocaleDateString('pt-BR')}</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[7px] uppercase font-black px-2 py-0.5">{chron.status}</Badge>
                  </div>
                  <h4 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">{chron.title}</h4>
                </button>
              ))}
              {!loading && chronicles.length === 0 && (
                <div className="p-12 text-center text-muted-foreground italic font-heading text-xl opacity-40">
                  "A história ainda não foi escrita nas estrelas."
                </div>
              )}
              {!loading && chronicles.length > 0 && chronicles.filter((chron) => chron.title.toLowerCase().includes(searchTerm.trim().toLowerCase())).length === 0 && (
                <div className="p-12 text-center text-muted-foreground italic font-heading text-xl opacity-40">
                  Nenhuma crônica corresponde à busca.
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Conteúdo da Crônica - Estilo Arquivo Histórico */}
        <main className="flex-1 relative overflow-hidden bg-fixed" style={{ backgroundImage: 'radial-gradient(circle, rgba(200, 162, 74, 0.03) 1px, transparent 1px)', backgroundSize: '100px 100px' }}>
          <ScrollArea className="h-full scrollbar-hide">
             {selectedChronicle ? (
               <div className="max-w-5xl mx-auto p-12 md:p-32 space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <header className="space-y-10 text-center">
                    <div className="canon-seal w-fit mx-auto">Verdade Canônica</div>
                    <h2 className="text-7xl md:text-9xl font-display font-black tracking-tighter text-primary drop-shadow-[0_0_20px_rgba(200,162,74,0.2)]">
                      {selectedChronicle.title}
                    </h2>
                    <div className="flex justify-center items-center gap-10 opacity-40">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest">{new Date(selectedChronicle.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-primary/40 shadow-gold" />
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest italic">Pelo Oráculo & Mestre</span>
                      </div>
                    </div>
                  </header>

                  <section className="parchment p-16 md:p-24 rounded-[3rem] literary-shadow relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                     <div className="text-3xl md:text-4xl leading-[1.8] font-heading italic opacity-90 first-letter:text-9xl first-letter:font-display first-letter:mr-5 first-letter:float-left first-letter:text-primary first-letter:drop-shadow-lg">
                        {selectedChronicle.public_content || selectedChronicle.summary}
                     </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-10 border-t border-primary/10">
                    <div className="space-y-10">
                       <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                         <Sword className="h-5 w-5" /> Decisões Críticas
                       </h3>
                       <ul className="space-y-8">
                         {(selectedChronicle.summary ? [selectedChronicle.summary] : []).map((d: string, i: number) => (
                           <li key={i} className="flex gap-6 items-start group">
                             <div className="mt-2 h-2 w-2 rounded-full bg-primary shadow-gold group-hover:scale-150 transition-transform shrink-0" />
                             <p className="text-xl font-heading italic opacity-70 group-hover:opacity-100 transition-opacity leading-relaxed">{d}</p>
                           </li>
                         ))}
                       </ul>
                    </div>
                    <div className="space-y-16">
                       <div className="space-y-8">
                          <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                            <Users className="h-5 w-5" /> Figuras Notáveis
                          </h3>
                          <div className="flex flex-wrap gap-4">
                             {(selectedChronicle.public_content ? selectedChronicle.public_content.split(" ").slice(0, 4) : []).map((n: string, i: number) => (
                               <Badge key={i} className="bg-primary/5 text-primary border-primary/20 font-display text-[10px] tracking-widest px-4 py-2 hover:bg-primary/20 transition-all cursor-default">{n}</Badge>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-8">
                         <h3 className="text-[10px] font-display uppercase font-black tracking-[0.4em] text-primary flex items-center gap-4">
                            <Package className="h-5 w-5" /> Notas Públicas
                          </h3>
                          <div className="flex flex-wrap gap-4">
                            <Badge variant="outline" className="border-primary/30 text-primary font-display text-[10px] tracking-widest px-4 py-2 hover:bg-primary/5 transition-all cursor-default">
                              {selectedChronicle.status}
                            </Badge>
                          </div>
                       </div>
                    </div>
                  </div>

                  {selectedChronicle.master_notes && (
                    <div className="p-12 rounded-[2.5rem] bg-[#3A1F5D]/10 border border-[#7B4FB3]/30 space-y-6 relative overflow-hidden oracle-glow">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <ShieldCheck className="h-24 w-24" />
                       </div>
                       <h4 className="text-[10px] font-display uppercase font-black tracking-[0.3em] text-primary flex items-center gap-3">
                         <Sparkles className="h-5 w-5" /> Oráculo do Mestre (Segredos)
                       </h4>
                       <p className="text-xl font-heading italic opacity-60 leading-relaxed max-w-3xl">
                         {selectedChronicle.master_notes}
                       </p>
                    </div>
                  )}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-20 text-center gap-12 opacity-10">
                  <BookOpen className="h-48 w-48 text-primary animate-pulse" />
                  <div className="space-y-4">
                    <h2 className="text-6xl font-display font-black tracking-tighter">O Grande Arquivo</h2>
                    <p className="text-3xl font-heading italic max-w-lg">Selecione uma crônica à esquerda para ler os registros oficiais da sua jornada.</p>
                  </div>
               </div>
             )}
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
