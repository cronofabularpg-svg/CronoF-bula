
"use client"

import * as React from "react"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { 
  MessageSquare, 
  Map as MapIcon, 
  Swords, 
  User, 
  Book, 
  ScrollText, 
  Settings, 
  ShieldCheck, 
  Home,
  Hourglass,
  Users,
  Package,
  Sparkles,
  Database,
  MapPin,
  ChevronRight,
  Maximize2
} from "lucide-react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { createClient } from "@/lib/supabase/client"
import { getCharacterTheme } from "@/lib/themes"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { id: campaignId } = useParams() as { id: string };
  const { user } = useUser();

  // Personagem ativo (para tema visual e rodapé)
  const [activeChar, setActiveChar] = React.useState<{
    id: string
    name: string
    race: string | null
    class: string | null
    avatar_url: string | null
  } | null>(null);

  React.useEffect(() => {
    if (!user || !campaignId) return;
    let active = true;
    const supabase = createClient();

    supabase
      .from('characters')
      .select('id, name, race, class, avatar_url')
      .eq('campaign_id', campaignId)
      .eq('owner_user_id', user.uid)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setActiveChar(data);
      });

    return () => {
      active = false;
    };
  }, [user, campaignId]);

  const theme = React.useMemo(() => {
    if (!activeChar) return 'institutional';
    return getCharacterTheme(activeChar.class ?? undefined, activeChar.race ?? undefined);
  }, [activeChar]);

  const charPhoto = activeChar?.avatar_url || `https://picsum.photos/seed/${activeChar?.id || 'default'}/300/300`;

  const playerItems = [
    { icon: MessageSquare, label: "Mesa Viva", href: `/campaign/${campaignId}/mesa-viva` },
    { icon: MapIcon, label: "Mapa Vivo", href: `/campaign/${campaignId}/mapa-vivo` },
    { icon: Swords, label: "Combate", href: `/campaign/${campaignId}/combate` },
    { icon: User, label: "Ficha", href: `/campaign/${campaignId}/ficha` },
    { icon: Book, label: "Diário", href: `/campaign/${campaignId}/diario` },
    { icon: Package, label: "Inventário", href: `/campaign/${campaignId}/inventario` },
    { icon: ScrollText, label: "Crônicas", href: `/campaign/${campaignId}/cronicas` },
  ];

  const masterItems = [
    { icon: ShieldCheck, label: "Portal do Mestre", href: `/campaign/${campaignId}/master` },
    { icon: Users, label: "NPCs", href: `/campaign/${campaignId}/npcs` },
    { icon: MapPin, label: "Locais", href: `/campaign/${campaignId}/locais` },
    { icon: Settings, label: "Configurações", href: `/settings` },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" data-theme={theme}>
        <Sidebar className="border-r border-primary/20 bg-sidebar text-foreground shadow-2xl">
          <SidebarHeader className="p-8 border-b border-primary/10">
            <Link href="/dashboard" className="flex items-center gap-4 group">
              <div className="p-2 rounded-xl bg-primary group-hover:rotate-[360deg] transition-all duration-1000 shadow-arcane">
                <Hourglass className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-black text-2xl tracking-tighter font-display text-primary">Cronofábula</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-6 scrollbar-hide">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" className="h-12 hover:bg-primary/5 rounded-xl transition-all">
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary flex items-center gap-3">
                    <Home className="h-5 w-5" />
                    <span className="font-display text-[10px] uppercase tracking-widest font-bold">Início</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <div className="mt-12 mb-6 px-4 flex flex-col gap-2">
                <span className="text-[10px] font-display uppercase font-black tracking-[0.3em] text-primary opacity-60">Aventureiro</span>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
              </div>

              {playerItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                    className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.href ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm' : 'hover:bg-primary/5 text-muted-foreground'}`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary animate-pulse' : ''}`} />
                      <span className="font-display text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                      {pathname === item.href && <ChevronRight className="ml-auto h-3 w-3 animate-in slide-in-from-left-2" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <div className="mt-16 mb-6 px-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display uppercase font-black tracking-[0.3em] text-primary opacity-60">Mestre Arcano</span>
                    <Database className="h-3 w-3 text-primary opacity-20" />
                </div>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
              </div>

              {masterItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                    className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.href ? 'bg-secondary/20 text-primary border-l-2 border-primary' : 'hover:bg-primary/5 text-muted-foreground'}`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-display text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-8 border-t border-primary/10 bg-black/40">
            <div className="flex items-center gap-5 group cursor-default">
              <Dialog>
                <DialogTrigger asChild>
                  <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary/30 group-hover:scale-110 transition-transform shadow-arcane cursor-zoom-in overflow-hidden">
                    <AvatarImage src={charPhoto} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary font-display font-black text-lg">
                      {activeChar?.name?.[0] || 'G'}
                    </AvatarFallback>
                  </Avatar>
                </DialogTrigger>
                <DialogContent className="bg-black/90 border-primary/20 p-0 overflow-hidden">
                  <img src={charPhoto} alt={activeChar?.name} className="w-full h-full object-contain" />
                </DialogContent>
              </Dialog>
              
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold tracking-tight text-primary truncate max-w-[120px]">
                  {activeChar?.name || 'Aventureiro'}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
                  {activeChar ? `${activeChar.race} ${activeChar.class}` : 'Explorador'}
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto bg-background relative scrollbar-hide">
          <div className="absolute top-6 left-6 z-50">
            <SidebarTrigger className="bg-background/40 backdrop-blur-xl border border-primary/20 text-primary h-12 w-12 rounded-2xl shadow-arcane hover:bg-primary/10 transition-all" />
          </div>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
