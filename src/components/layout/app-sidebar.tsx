"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Settings,
  ShieldCheck,
  BrainCircuit,
  AlertCircle
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Басты бет", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Теория", icon: BookOpen, url: "/theory" },
  { title: "Тест тапсыру", icon: ClipboardCheck, url: "/practice" },
  { title: "Диагностика", icon: BrainCircuit, url: "/diagnostic" },
  { title: "Қатемен жұмыс", icon: AlertCircle, url: "/analysis" },
];

const secondaryNavItems = [
  { title: "Оқу жоспары", icon: CalendarDays, url: "/plan" },
  { title: "Прогресс", icon: BarChart3, url: "/progress" },
  { title: "AI Куратор", icon: MessageSquare, url: "/curator" },
];

const adminItems = [
  { title: "Мазмұн басқару", icon: ShieldCheck, url: "/admin" },
  { title: "Баптаулар", icon: Settings, url: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-4">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary font-headline group-data-[collapsible=icon]:hidden">
            BilimAI
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Негізгі</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Жеке даму</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Әкімшілік</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 rounded-lg border p-2 group-data-[collapsible=icon]:border-none">
          <div className="size-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shrink-0">
            A
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium leading-none truncate">Арман Серік</span>
            <span className="text-xs text-muted-foreground truncate">11-сынып</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
