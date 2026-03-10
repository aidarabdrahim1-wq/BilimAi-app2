
"use client";

import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ALL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Наурыз ҰБТ-ға тіркелу басталды!",
    content: "Ресми сайтта тіркелу 10-наурызға дейін жалғасады. Уақытты өткізіп алмаңыз! ҰБТ-ға тіркелу үшін app.testcenter.kz сайтына өтіңіз. Барлық қажетті құжаттарды алдын ала дайындап қойыңыз.",
    date: "2024-03-01",
    type: "urgent"
  },
  {
    id: 2,
    title: "Жаңа пән: Информатика қосылды",
    content: "Енді IT бағытын таңдаған оқушылар үшін Информатикадан тест тапсыру мүмкіндігі бар. Базаға 500-ден астам жаңа сұрақтар мен тақырыптық конспектілер қосылды.",
    date: "2024-02-28",
    type: "info"
  },
  {
    id: 3,
    title: "Апталық рейтинг қорытындысы",
    content: "Өткен аптаның үздіктері анықталды. Топ-10 оқушыға қосымша бонус рейтинг ұпайлары берілді. Өз жетістіктеріңізді 'Рейтинг' бөлімінен көре аласыз.",
    date: "2024-02-25",
    type: "success"
  }
];

export default function AnnouncementsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <Megaphone className="size-8 text-primary" />
              Барлық хабарландырулар
            </h1>
            <p className="text-muted-foreground">Платформадағы соңғы жаңалықтар мен маңызды ақпараттар.</p>
          </div>
          <Button variant="outline" asChild className="rounded-xl border-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="size-4" /> Артқа
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {ALL_ANNOUNCEMENTS.map((ann) => (
            <Card key={ann.id} className={`border-none shadow-md overflow-hidden transition-all hover:shadow-lg ${
              ann.type === 'urgent' ? 'bg-red-50 border-l-4 border-l-red-500' : 
              ann.type === 'success' ? 'bg-green-50 border-l-4 border-l-green-500' : 
              'bg-blue-50 border-l-4 border-l-blue-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest ${
                    ann.type === 'urgent' ? 'text-red-600 bg-red-100 border-red-200' : 
                    ann.type === 'success' ? 'text-green-600 bg-green-100 border-green-200' : 
                    'text-blue-600 bg-blue-100 border-blue-200'
                  }`}>
                    {ann.type === 'urgent' ? 'Шұғыл' : ann.type === 'success' ? 'Жаңалық' : 'Ақпарат'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                    <Calendar className="size-3.5" /> {ann.date}
                  </div>
                </div>
                <CardTitle className="text-2xl font-black mt-4">{ann.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-foreground/80 leading-relaxed text-base font-medium">
                  {ann.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {ALL_ANNOUNCEMENTS.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
            <p className="text-muted-foreground">Әзірге жаңа хабарландырулар жоқ.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
