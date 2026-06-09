
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Plus, Search, Eye, EyeOff, Lock, Compass, Sparkles, Navigation } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LocalManager() {
  const { id: campaignId } = useParams() as { id: string }
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [localData, setLocalData] = React.useState({
    name: "",
    type: "city",
    description: "",
    status: "known" as any,
    isSecret: false,
    x: 500,
    y: 400
  })

  const locationsQuery = React.useMemo(() => {
    if (!db || !campaignId) return null
    return query(collection(db, "campaigns", campaignId, "locations"), orderBy("name", "asc"))
  }, [db, campaignId])

  const { data: locations, loading: loadingLocs } = useCollection(locationsQuery)

  async function handleCreateLocal() {
    if (!db || !campaignId || !localData.name) return
    setLoading(true)
    try {
      await addDoc(collection(db, "campaigns", campaignId, "locations"), {
        ...localData,
        campaignId,
        coords: { x: Number(localData.x), y: Number(localData.y) },
        createdAt: serverTimestamp()
      })
      toast({ title: "Local Fundado", description: `${localData.name} agora existe no mundo.` })
      setIsCreateOpen(false)
      setLocalData({ name: "", type: "city", description: "", status: "known", isSecret: false, x: 500, y: 400 })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Cartografia", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function toggleSecret(localId: string, current: boolean) {
    if (!db || !campaignId) return
    updateDoc(doc(db, "campaigns", campaignId, "locations", localId), { isSecret: !current })
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
               </div>
            </div>
            <DialogFooter>
              <Button disabled={loading || !localData.name} onClick={handleCreateLocal} className="bg-primary px-10">
                {loading ? "Mapeando..." : "Consagrar Local"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {locations?.map((loc: any) => (
          <Card key={loc.id} className="bg-card/30 border-white/5 hover:border-primary/30 transition-all group overflow-hidden">
             <div className="relative h-40 bg-muted">
                <img src={`https://picsum.photos/seed/${loc.id}/400/200`} className="object-cover w-full h-full opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                   <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] uppercase font-black">{loc.type}</Badge>
                   {loc.isSecret && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[8px] uppercase font-black">Secreto</Badge>}
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
                <Button variant="ghost" size="sm" className="flex-1 bg-white/5 hover:bg-white/10 text-[9px] uppercase font-black" onClick={() => toggleSecret(loc.id, loc.isSecret)}>
                   {loc.isSecret ? <><Eye className="mr-2 h-3 w-3" /> Revelar</> : <><EyeOff className="mr-2 h-3 w-3" /> Ocultar</>}
                </Button>
                <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/10 text-[9px] uppercase font-black">
                   <Navigation className="mr-2 h-3 w-3" /> Ver no Mapa
                </Button>
             </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
