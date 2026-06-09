
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
  Compass,
  Package,
  Sparkles,
  Database,
  MapPin,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const campaignId = pathname.split('/')[2];

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
    { icon: Sparkles, label: "IA Mestre", href: `/campaign/${campaignId}/ai-mestre` },
    { icon: Settings, label: "Configurações", href: `/settings` },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#050711]">
        <Sidebar className="border-r border-primary/20 bg-[#03040A] text-foreground">
          <SidebarHeader className="p-8 border-b border-primary/10">
            <Link href="/dashboard" className="flex items-center gap-4 group">
              <div className="p-2 rounded-xl bg-primary group-hover:rotate-[360deg] transition-all duration-1000 shadow-arcane">
                <Hourglass className="h-6 w-6 text-black" />
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
                    className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.href ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'hover:bg-primary/5 text-muted-foreground'}`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary animate-glow' : ''}`} />
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
                    className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.href ? 'bg-[#3A1F5D]/20 text-primary border-l-2 border-primary' : 'hover:bg-primary/5 text-muted-foreground'}`}
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
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center font-display font-black text-lg text-primary border-2 border-primary/30 group-hover:scale-110 transition-transform shadow-arcane">
                G
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold tracking-tight text-primary">Gob</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">Ladino Nvl 3</span>
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
