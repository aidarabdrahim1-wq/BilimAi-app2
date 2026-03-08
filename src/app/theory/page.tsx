
"use client";

import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Search, GraduationCap, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = [
  { name: "Математика", count: 24, icon: GraduationCap },
  { name: "Физика", count: 18, icon: GraduationCap },
  { name: "Тарих", count: 32, icon: GraduationCap },
  { name: "Биология", count: 15, icon: GraduationCap },
];

export default function TheoryPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <BookOpen className="size-8 text-primary" />
            Теориялық база
          </h1>
          <p className="text-muted-foreground">ҰБТ-да кездесетін барлық тақырыптар бойынша құрылымдалған конспектілер.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Тақырыпты іздеу..." className="pl-10" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Card key={i} className="hover:border-primary cursor-pointer transition-all group">
              <CardHeader className="pb-2">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <cat.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <CardDescription>{cat.count} тақырып</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-primary gap-1">
                  Оқуды бастау <ChevronRight className="size-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold font-headline">Соңғы оқылғандар</h2>
          <div className="space-y-3">
            {[
              { title: "Квадрат теңдеулер", subject: "Математика", progress: 80 },
              { title: "Ньютон заңдары", subject: "Физика", progress: 45 },
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-sm flex items-center justify-between p-4 bg-white">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-accent flex items-center justify-center text-primary">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.subject}</p>
                  </div>
                </div>
                <Badge variant="outline">{item.progress}% аяқталды</Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
