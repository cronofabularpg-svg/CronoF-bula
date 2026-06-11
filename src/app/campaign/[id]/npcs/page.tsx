
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Skull
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function NPCManager() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [loadingNpcs, setLoadingNpcs] = React.useState(true)
  const [npcs, setNpcs] = React.useState<any[]>([])
  const [isMaster, setIsMaster] = React.useState(false)

  const [npcData, setNpcData] = React.useState({
    name: "",
    role: "",
    personality: "",
    goals: "",
    knows: "",
    secrets: "",
    visibility: "master_only",
    status: "alive" as "alive" | "dead" | "missing"
  })

  React.useEffect(() => {
    if (!campaignId || !user) return
    let active = true
    const userId = user.uid
    const supabase = createClient()

    async function load() {
      setLoadingNpcs(true)

      const [{ data: member }, { data, error }] = await Promise.all([
        supabase
          .from('campaign_members')
          .select('role')
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .rpc('get_campaign_npcs', { target_campaign_id: campaignId })
      ])

      if (!active) return
      setIsMaster(['owner', 'master', 'assistant_master'].includes(member?.role || ''))
      if (error) {
        toast({ variant: "destructive", title: "Erro ao Carregar NPCs", description: error.message })
      }
      setNpcs(data || [])
      setLoadingNpcs(false)
    }

    load()

    return () => {
      active = false
    }
  }, [campaignId, user, toast])

  const filteredNpcs = npcs.filter(npc => 
    (npc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (npc.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleCreateNPC() {
    if (!campaignId || !user || !npcData.name) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('npcs')
        .insert({
          campaign_id: campaignId,
          name: npcData.name,
          role: npcData.role || null,
          personality: npcData.personality || null,
          goals: npcData.goals || null,
          secrets: npcData.secrets || null,
          knowledge: npcData.knows.split(",").map(k => k.trim()).filter(Boolean),
          visibility: npcData.visibility,
          status: npcData.status,
          created_by: user.uid
        })
        .select('id, name, role, description, personality, goals, knowledge, relationship_status, current_location_id, current_scene_id, visibility, status')
        .single()

      if (error) throw error
      toast({ title: "NPC Criado", description: `${npcData.name} agora habita Arvand.` })
      setNpcs((prev) => [...prev, { ...data, secrets: isMaster ? npcData.secrets : null }].sort((a, b) => a.name.localeCompare(b.name)))
      setIsCreateOpen(false)
      setNpcData({ name: "", role: "", personality: "", goals: "", knows: "", secrets: "", visibility: "master_only", status: "alive" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao criar", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleKillNPC(npcId: string, npcName: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('npcs')
      .update({ status: "dead" })
      .eq('id', npcId)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar NPC", description: error.message })
      return
    }

    setNpcs((prev) => prev.map((npc) => npc.id === npcId ? { ...npc, status: "dead" } : npc))
    toast({ title: "Fábula Sombria", description: `${npcName} encontrou seu fim.` })
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-accent flex items-center gap-4">
            <Users className="h-12 w-12" /> População da Crônica
          </h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">Aliados, inimigos e almas perdidas que cruzam o caminho dos heróis.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou papel..." 
              className="pl-10 bg-card/50" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isMaster && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 literary-shadow rounded-full px-8">
                  <UserPlus className="mr-2 h-4 w-4" /> Novo NPC
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-accent/30 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display text-accent">Evocar Personagem</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Nome do NPC</Label>
                      <Input value={npcData.name} onChange={e => setNpcData({...npcData, name: e.target.value})} placeholder="Ex: Mestre Thaddeus" />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Papel/Ocupação</Label>
                      <Input value={npcData.role} onChange={e => setNpcData({...npcData, role: e.target.value})} placeholder="Ex: Guardião da Biblioteca" />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Personalidade</Label>
                      <Textarea value={npcData.personality} onChange={e => setNpcData({...npcData, personality: e.target.value})} placeholder="Ex: Ranzinza, mas protetor dos livros." />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Objetivos</Label>
                      <Textarea value={npcData.goals} onChange={e => setNpcData({...npcData, goals: e.target.value})} placeholder="Ex: Preservar o segredo do portal." />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Conhecimentos (separados por vírgula)</Label>
                      <Input value={npcData.knows} onChange={e => setNpcData({...npcData, knows: e.target.value})} placeholder="Ex: Local do Templo, Senha da Torre" />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Segredos do Mestre</Label>
                      <Textarea value={npcData.secrets} onChange={e => setNpcData({...npcData, secrets: e.target.value})} placeholder="Não aparece para jogadores." />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Visibilidade</Label>
                      <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={npcData.visibility} onChange={e => setNpcData({...npcData, visibility: e.target.value})}>
                        <option value="master_only">Apenas Mestre</option>
                        <option value="visible">Visível aos Jogadores</option>
                        <option value="scene">Presente em Cena</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button disabled={loading || !npcData.name} onClick={handleCreateNPC} className="bg-primary px-10">
                    {loading ? "Evocando..." : "Finalizar Criação"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loadingNpcs ? (
          <div className="col-span-full p-20 text-center italic opacity-50">Consultando o oráculo populacional...</div>
        ) : filteredNpcs.length > 0 ? (
          filteredNpcs.map((npc: any) => (
            <Card key={npc.id} className={`bg-card/30 border-white/5 hover:border-accent/30 transition-all group overflow-hidden ${npc.status === 'dead' ? 'grayscale opacity-60' : ''}`}>
              <div className="relative h-48 bg-muted">
                <img 
                  src={`https://picsum.photos/seed/${npc.id}/400/300`} 
                  alt={npc.name} 
                  className="object-cover w-full h-full opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={`uppercase tracking-widest text-[9px] ${npc.status === 'alive' ? 'bg-primary' : 'bg-destructive'}`}>
                    {npc.status === 'alive' ? 'Vivo' : 'Morto'}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-background/50 uppercase tracking-widest">{npc.role}</Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-display flex justify-between items-center">
                  {npc.name}
                  {npc.status === 'dead' && <Skull className="h-5 w-5 text-destructive" />}
                </CardTitle>
                <CardDescription className="font-heading italic min-h-[40px]">
                  "{npc.personality}"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Objetivos</span>
                  <p className="text-xs line-clamp-2">{npc.goals}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                   {(npc.knowledge || []).map((k: string, i: number) => (
                     <Badge key={i} variant="secondary" className="text-[8px] opacity-70">{k}</Badge>
                   ))}
                </div>
                {isMaster && npc.secrets && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Segredos</span>
                    <p className="text-xs line-clamp-2 text-primary/80">{npc.secrets}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 p-6">
                <Button variant="ghost" size="sm" className="w-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed" disabled title="Em desenvolvimento">
                  <Edit2 className="mr-2 h-4 w-4" /> Editar
                </Button>
                {isMaster && npc.status === 'alive' && (
                  <Button variant="outline" size="sm" className="w-full border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => handleKillNPC(npc.id, npc.name)}>
                    <Skull className="mr-2 h-4 w-4" /> Matar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
            <p className="text-muted-foreground font-heading italic text-lg">O silêncio ecoa nas ruas de Arvand. Nenhum NPC encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
