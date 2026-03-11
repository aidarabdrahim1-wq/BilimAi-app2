"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  AlertCircle,
  LogOut,
  Trophy,
  Compass,
} from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useAuth } from "@/components/auth/auth-provider";

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
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Басты бет", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Практика", icon: BookOpen, url: "/theory" },
  { title: "Тест тапсыру", icon: ClipboardCheck, url: "/practice" },
  { title: "Диагностика", icon: BrainCircuit, url: "/diagnostic" },
  { title: "Қатемен жұмыс", icon: AlertCircle, url: "/analysis" },
];

const secondaryNavItems = [
  { title: "Оқу жоспары", icon: CalendarDays, url: "/plan" },
  { title: "Профориентолог", icon: Compass, url: "/proforientologist" },
  { title: "Прогресс", icon: BarChart3, url: "/progress" },
  { title: "Рейтинг", icon: Trophy, url: "/leaderboard" },
  { title: "AI Куратор", icon: MessageSquare, url: "/curator" },
];

const adminItems = [
  { title: "Мазмұн басқару", icon: ShieldCheck, url: "/admin" },
  { title: "Баптаулар", icon: Settings, url: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-lg border p-2 group-data-[collapsible=icon]:border-none">
            <div className="size-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shrink-0">
              {profile?.fullName?.[0] || "U"}
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium leading-none truncate">{profile?.fullName || "Пайдаланушы"}</span>
              <span className="text-xs text-muted-foreground truncate">{profile?.grade ? `${profile.grade}-сынып` : "Тіркелген"}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 group-data-[collapsible=icon]:px-2" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Шығу</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
