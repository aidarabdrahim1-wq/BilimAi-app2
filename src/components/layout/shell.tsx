"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div className="flex flex-1 items-center gap-4 md:gap-8">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Іздеу..."
                className="w-full bg-background pl-8 shadow-none md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold">124 балл</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ағымдағы рейтинг</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 space-y-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
