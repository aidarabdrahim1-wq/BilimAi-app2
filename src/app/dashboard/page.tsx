"use client";

import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  PlayCircle,
  BookMarked
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export default function Dashboard() {
  const { profile } = useAuth();

  // Calculate percentage to target
  const currentScore = profile?.currentScore || 0;
  const targetScore = profile?.targetScore || 140;
  const progressToTarget = Math.round((currentScore / targetScore) * 100);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Сәлем, {profile?.fullName?.split(' ')[0] || "Оқушы"}! 👋
        </h1>
        <p className="text-muted-foreground">Бүгін сіздің оқу жоспарыңыз бойынша 4 тапсырма бар.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none bg-primary text-primary-foreground overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ағымдағы балл</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentScore}</div>
            <p className="text-xs opacity-70 mt-1">
              +12 өткен аптадан бері
            </p>
            <div className="absolute -bottom-2 -right-2 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-secondary text-secondary-foreground overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Мақсатты балл</CardTitle>
            <Target className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{targetScore}</div>
            <p className="text-xs opacity-70 mt-1">
              {progressToTarget}% жетістік
            </p>
            <div className="mt-4">
              <Progress value={progressToTarget} className="h-2 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Бүгінгі уақыт</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2с 15м</div>
            <p className="text-xs text-muted-foreground mt-1">
              Мақсат: 3 сағат
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Қателік коэффициенті</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14%</div>
            <p className="text-xs text-muted-foreground mt-1">
              -3% жақсару
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-headline">Бүгінгі оқу жоспары</CardTitle>
              <CardDescription>22 ақпан, Сәрсенбі</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/plan">Толық жоспар</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { time: "30 мин", title: "Тригонометрия теориясы", type: "Теория", status: "completed" },
              { time: "40 мин", title: "Математикадан бақылау тесті", type: "Тест", status: "in-progress" },
              { time: "20 мин", title: "Физика: Динамика қателерін талдау", type: "Талдау", status: "pending" },
              { time: "10 мин", title: "Күнделікті қайталау", type: "Қайталау", status: "pending" },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-accent/10 hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center ${task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'in-progress' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {task.status === 'completed' ? '✓' : <PlayCircle className="size-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{task.time}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{task.type}</span>
                    </div>
                  </div>
                </div>
                {task.status === 'in-progress' && (
                  <Button size="sm">Жалғастыру</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <Card className="border-none shadow-sm bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Әлсіз тақырыптар</CardTitle>
              <CardDescription>Жедел назар аудару керек</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(profile?.weakTopics?.length ? profile.weakTopics.slice(0, 3) : ["Логарифмдік теңдеулер", "Кванттық физика", "Генетика негіздері"]).map((topic, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{topic}</span>
                    <span className="text-destructive font-bold">{40 + (i * 10)}%</span>
                  </div>
                  <Progress value={40 + (i * 10)} className="h-1.5" />
                </div>
              ))}
              <Button variant="link" className="w-full text-xs text-primary" asChild>
                <Link href="/diagnostic">Диагностиканы жаңарту</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <BookMarked className="size-5 text-primary" />
                Ұсынылған келесі тақырып
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border bg-primary/5">
                <h4 className="font-bold text-sm">Химия: Органикалық қосылыстар</h4>
                <p className="text-xs text-muted-foreground mt-2">
                  Бұл тақырып ҰБТ-да жиі кездеседі (8-10 сұрақ). Сіздің деңгейіңізге сай бастауға болады.
                </p>
                <Button className="w-full mt-4" size="sm">Оқуды бастау</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
