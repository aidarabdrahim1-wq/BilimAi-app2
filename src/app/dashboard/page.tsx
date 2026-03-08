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
  BookMarked,
  Trophy,
  Zap,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { profile } = useAuth();

  const currentScore = profile?.currentScore || 0;
  const targetScore = profile?.targetScore || 140;
  const rating = profile?.rating || 0;
  const solvedCount = profile?.solvedQuestions || 0;
  const correctCount = profile?.correctAnswers || 0;
  const streak = profile?.streakDays || 0;

  const progressToTarget = Math.round((currentScore / targetScore) * 100);
  const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Сәлем, {profile?.fullName?.split(' ')[0] || "Оқушы"}! 👋
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-yellow-100 text-yellow-700 border-yellow-200">
              <Trophy className="size-3.5 fill-current" />
              {rating} ұпай
            </Badge>
            <Badge variant="outline" className="px-3 py-1 gap-1.5 border-orange-200 bg-orange-50 text-orange-700">
              <Zap className="size-3.5 fill-current" />
              {streak} күн
            </Badge>
          </div>
        </div>
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
              ҰБТ потенциалы: {Math.round(currentScore)} / 140
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Дәлдік (Accuracy)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{accuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {correctCount} / {solvedCount} дұрыс жауап
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Қателік коэффициенті</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{100 - accuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Талдау қажет: {solvedCount - correctCount} сұрақ
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-headline">Бүгінгі оқу жоспары</CardTitle>
              <CardDescription>Дайындықты жалғастырыңыз</CardDescription>
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
                    {task.status === 'completed' ? <CheckCircle2 className="size-5" /> : <PlayCircle className="size-5" />}
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
                  <Button size="sm" className="shadow-sm">Жалғастыру</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <Card className="border-none shadow-sm bg-accent/5 overflow-hidden">
            <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
              <h3 className="font-bold">Рейтинг статистикасы</h3>
              <Trophy className="size-5 opacity-50" />
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground">Орындалған жоспарлар:</span>
                <span className="font-bold">{profile?.completedPlans || 0} / 30</span>
              </div>
              <Progress value={((profile?.completedPlans || 0) / 30) * 100} className="h-1.5" />
              
              <div className="flex justify-between items-end pt-2">
                <span className="text-sm text-muted-foreground">Дұрыс жауаптар:</span>
                <span className="font-bold text-green-600">{correctCount}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground">Барлық сұрақтар:</span>
                <span className="font-bold">{solvedCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary">
                <BookMarked className="size-5" />
                AI-дан ұсыныс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border bg-primary/5">
                <h4 className="font-bold text-sm">Химия: Органикалық қосылыстар</h4>
                <p className="text-xs text-muted-foreground mt-2">
                  Бұл тақырып бойынша 10 сұраққа жауап беріп, +20 рейтинг ұпайын алыңыз!
                </p>
                <Button className="w-full mt-4 shadow-sm" size="sm">Оқуды бастау</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
