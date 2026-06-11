
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
import { Plus, Eye, EyeOff, Compass, Navigation } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LocalManager() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const { toast } = useToast()

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [loadingLocs, setLoadingLocs] = React.useState(true)
  const [locations, setLocations] = React.useState<any[]>([])
  const [isMaster, setIsMaster] = React.useState(false)
  const [localData, setLocalData] = React.useState({
    name: "",
    type: "city",
    description: "",
    status: "known" as any,
    visibility: "visible",
    x: 500,
    y: 400
  })

  React.useEffect(() => {
    if (!campaignId || !user) return
    let active = true
    const userId = user.uid
    const supabase = createClient()

    async function load() {
      setLoadingLocs(true)
      const [{ data: member }, { data, error }] = await Promise.all([
        supabase
          .from('campaign_members')
          .select('role')
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('locations')
          .select('id, name, type, description, region, image_url, visibility, discovery_condition, status')
          .eq('campaign_id', campaignId)
          .order('name', { ascending: true })
      ])

      if (!active) return
      setIsMaster(['owner', 'master', 'assistant_master'].includes(member?.role || ''))
      if (error) {
        toast({ variant: "destructive", title: "Erro ao Carregar Locais", description: error.message })
      }
      setLocations(data || [])
      setLoadingLocs(false)
    }

    load()

    return () => {
      active = false
    }
  }, [campaignId, user, toast])

  async function handleCreateLocal() {
    if (!campaignId || !user || !localData.name) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .insert({
          campaign_id: campaignId,
          name: localData.name,
          type: localData.type,
          description: localData.description || null,
          visibility: localData.visibility,
          status: localData.status === "known" ? "active" : localData.status,
          created_by: user.uid
        })
        .select('id, name, type, description, region, image_url, visibility, discovery_condition, status')
        .single()

      if (error) throw error
      toast({ title: "Local Fundado", description: `${localData.name} agora existe no mundo.` })
      setLocations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setIsCreateOpen(false)
      setLocalData({ name: "", type: "city", description: "", status: "known", visibility: "visible", x: 500, y: 400 })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Cartografia", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function toggleSecret(localId: string, currentVisibility: string) {
    if (!campaignId) return
    const nextVisibility = ['secret', 'master_only', 'hidden'].includes(currentVisibility) ? 'visible' : 'secret'
    const supabase = createClient()
    const { error } = await supabase
      .from('locations')
      .update({ visibility: nextVisibility })
      .eq('id', localId)
      .eq('campaign_id', campaignId)

    if (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Local", description: error.message })
      return
    }

    setLocations((prev) => prev.map((loc) => loc.id === localId ? { ...loc, visibility: nextVisibility } : loc))
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-10 border-white/5 gap-6">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-primary flex items-center gap-4">
            <Compass className="h-12 w-12" /> Atlas da Crônica
          </h1>
          <p className="text-muted-foreground mt-3 font-heading text-xl italic">Geografia, política e perigos dos reinos explorados.</p>
        </div>
        {isMaster && <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 literary-shadow rounded-full px-8">
              <Plus className="mr-2 h-4 w-4" /> Novo Local
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-accent/30 max-w-2xl">
            <DialogHeader><DialogTitle className="text-2xl font-display text-accent">Expandir o Mundo</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest">Nome do Local</Label>
                    <Input value={localData.name} onChange={e => setLocalData({...localData, name: e.target.value})} placeholder="Ex: Montanhas de Gelo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest">Tipo</Label>
                    <Select value={localData.type} onValueChange={v => setLocalData({...localData, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">Cidade/Vila</SelectItem>
                        <SelectItem value="dungeon">Masmorra/Interior</SelectItem>
                        <SelectItem value="forest">Natureza/Exterior</SelectItem>
                        <SelectItem value="danger">Zona de Perigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Coord X</Label>
                      <Input type="number" value={localData.x} onChange={e => setLocalData({...localData, x: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-bold tracking-widest">Coord Y</Label>
                      <Input type="number" value={localData.y} onChange={e => setLocalData({...localData, y: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest">Descrição Narrativa</Label>
                    <Textarea value={localData.description} onChange={e => setLocalData({...localData, description: e.target.value})} placeholder="O que se vê ao chegar..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-bold tracking-widest">Visibilidade</Label>
                    <Select value={localData.visibility} onValueChange={v => setLocalData({...localData, visibility: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visível aos Jogadores</SelectItem>
                        <SelectItem value="hidden">Oculto</SelectItem>
                        <SelectItem value="secret">Secreto</SelectItem>
                        <SelectItem value="master_only">Apenas Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>
            <DialogFooter>
              <Button disabled={loading || !localData.name} onClick={handleCreateLocal} className="bg-primary px-10">
                {loading ? "Mapeando..." : "Consagrar Local"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loadingLocs && (
          <div className="col-span-full p-20 text-center italic opacity-50">Consultando as cartas do atlas...</div>
        )}
        {!loadingLocs && locations.map((loc: any) => (
          <Card key={loc.id} className="bg-card/30 border-white/5 hover:border-primary/30 transition-all group overflow-hidden">
             <div className="relative h-40 bg-muted">
                <img src={`https://picsum.photos/seed/${loc.id}/400/200`} className="object-cover w-full h-full opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                   <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] uppercase font-black">{loc.type}</Badge>
                   {['secret', 'master_only', 'hidden'].includes(loc.visibility) && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[8px] uppercase font-black">Secreto</Badge>}
                </div>
             </div>
             <CardHeader>
                <CardTitle className="text-2xl font-display flex justify-between items-center">
                  {loc.name}
                  <Navigation className="h-4 w-4 text-muted-foreground opacity-20" />
                </CardTitle>
                <CardDescription className="font-heading italic line-clamp-2">{loc.description}</CardDescription>
             </CardHeader>
             <CardFooter className="pt-0 p-6 flex gap-3">
                {isMaster && (
                  <Button variant="ghost" size="sm" className="flex-1 bg-white/5 hover:bg-white/10 text-[9px] uppercase font-black" onClick={() => toggleSecret(loc.id, loc.visibility)}>
                     {['secret', 'master_only', 'hidden'].includes(loc.visibility) ? <><Eye className="mr-2 h-3 w-3" /> Revelar</> : <><EyeOff className="mr-2 h-3 w-3" /> Ocultar</>}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-[9px] uppercase font-black">
                   <Navigation className="mr-2 h-3 w-3" /> Ver no Mapa
                </Button>
             </CardFooter>
          </Card>
        ))}
        {!loadingLocs && locations.length === 0 && (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6">
            <p className="text-muted-foreground font-heading italic text-lg">Nenhum local foi traçado no atlas desta crônica.</p>
          </div>
        )}
      </div>
    </div>
  )
}
