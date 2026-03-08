
"use client";

import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardCheck, Zap, History, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PracticePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <ClipboardCheck className="size-8 text-primary" />
            Практикалық жаттығу
          </h1>
          <p className="text-muted-foreground">ҰБТ форматындағы тесттер арқылы біліміңді бекіт.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <CardHeader>
              <Badge className="bg-white/20 text-white w-fit mb-2">Күнделікті тест</Badge>
              <CardTitle className="text-2xl font-bold">Бүгінгі аралас тест №12</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Барлық 5 пән бойынша 20 сұрақ. Уақыт: 25 мин.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">20</span>
                  <span className="text-[10px] uppercase opacity-70">Сұрақ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">25</span>
                  <span className="text-[10px] uppercase opacity-70">Минут</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">+15</span>
                  <span className="text-[10px] uppercase opacity-70">Рейтинг</span>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="mt-8 font-bold gap-2">
                Тестті бастау <Play className="size-4 fill-current" />
              </Button>
            </CardContent>
            <Zap className="absolute -bottom-10 -right-10 size-48 opacity-10" />
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="size-4" />
                  Соңғы нәтижелер
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Математика №4", score: "18/20", date: "Бүгін" },
                  { title: "Тарих №2", score: "14/20", date: "Кеше" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.date}</p>
                    </div>
                    <span className="font-bold text-primary">{item.score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-accent/30 border-none shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Пәндер бойынша</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {["Мат", "Физ", "Тарих", "Химия"].map(s => (
                  <Button key={s} variant="outline" size="sm" className="text-xs h-8 bg-white">{s}</Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
