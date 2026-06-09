
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
  MapPin
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
    { icon: Settings, label: "Configurações", href: `/campaign/${campaignId}/settings` },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-white/5 bg-sidebar">
          <SidebarHeader className="p-6 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-primary group-hover:scale-110 transition-transform shadow-arcane">
                <Hourglass className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter font-display text-accent">Cronofábula</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    <Home className="h-4 w-4" />
                    <span>Voltar ao Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <div className="mt-8 mb-4 px-4">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-30 font-ui">Aventureiro</span>
              </div>
              {playerItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                    className="h-10"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <div className="mt-12 mb-4 px-4 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-30 font-ui">Mestre Arcano</span>
                <Database className="h-3 w-3 text-muted-foreground opacity-20" />
              </div>
              {masterItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.label}
                    className="h-10"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-sm text-accent border border-accent/30">
                G
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">Gob</span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Ladino Nvl 3</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto bg-background relative">
          <div className="absolute top-4 left-4 z-50">
            <SidebarTrigger className="bg-background/80 backdrop-blur-sm border border-white/10" />
          </div>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
