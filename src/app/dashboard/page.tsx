"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  AlertCircle,
  PlayCircle,
  BookMarked,
  Trophy,
  Zap,
  CheckCircle2,
  CalendarDays,
  Edit2,
  PlusCircle,
  BellRing
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(profile?.untDate || "2025-06-20");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const calculateDiff = () => {
      const now = new Date();
      const targetDate = profile?.untDate ? parseISO(profile.untDate) : new Date("2025-06-20");
      const diff = differenceInDays(targetDate, now);
      setDaysLeft(diff > 0 ? diff : 0);
    };

    calculateDiff();
  }, [profile?.untDate]);

  useEffect(() => {
    if (!user) return;
    
    // Бүгінгі жоспарды алу
    const q = query(
      collection(db, "study_plans"),
      where("userId", "==", user.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tasks) {
          tasks.push(...data.tasks.map((t: any) => ({ ...t, planId: doc.id })));
        }
      });
      setTodayTasks(tasks);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateDate = async () => {
    if (!user || !db) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        untDate: newDate,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Күн жаңартылды",
        description: `Жаңа ҰБТ күні: ${newDate}`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Қате",
        description: "Күнді жаңарту мүмкін болмады.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
      <div className="flex flex-col gap-6">
        {/* Reminder Alert */}
        {todayTasks.length === 0 && (
          <Alert className="bg-orange-50 border-orange-200 animate-pulse">
            <BellRing className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 font-bold">Оқу жоспары бос!</AlertTitle>
            <AlertDescription className="text-orange-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span>Бүгінгі күніңізді тиімді өткізу үшін оқу жоспарын құрыңыз. Тәртіп - жетістік кепілі!</span>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 bg-white hover:bg-orange-100" asChild>
                <Link href="/plan">Жоспар құру</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Сәлем, {profile?.fullName?.split(' ')[0] || "Оқушы"}! 👋
            </h1>
            <p className="text-muted-foreground">
              {todayTasks.length > 0 
                ? `Бүгінгі жоспарда ${todayTasks.length} тапсырма бар.` 
                : "Бүгінге әлі жоспар құрылмаған."}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-none shadow-sm bg-white overflow-hidden flex items-center px-6 py-3 gap-4 cursor-pointer hover:bg-accent/5 transition-colors group">
                <div className="size-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <CalendarDays className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">ҰБТ-ға қалды:</p>
                    <Edit2 className="size-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-orange-600">
                      {daysLeft !== null ? daysLeft : "..."}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">күн</span>
                  </div>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>ҰБТ күнін таңдау</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="untDate">Тапсыратын күніңізді белгілеңіз</Label>
                  <Input
                    id="untDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateDate} disabled={isUpdating}>
                  {isUpdating ? "Жаңартылуда..." : "Сақтау"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                <Link href="/plan">
                  {todayTasks.length > 0 ? "Басқару" : "Құру"}
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length > 0 ? (
                todayTasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-accent/10 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full flex items-center justify-center ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary text-primary-foreground'}`}>
                        {task.status === 'completed' ? <CheckCircle2 className="size-5" /> : <PlayCircle className="size-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{task.time}</span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">{task.type}</span>
                        </div>
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <Button size="sm" className="shadow-sm">Бастау</Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 flex flex-col items-center gap-4 bg-muted/20 rounded-2xl border border-dashed">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                    <PlusCircle className="size-8 text-muted-foreground" />
                  </div>
                  <div className="max-w-[200px]">
                    <h4 className="font-bold text-sm">Жоспар жоқ</h4>
                    <p className="text-xs text-muted-foreground mt-1">Бүгінгі күніңізге мақсат қойыңыз.</p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/plan">Жоспар құру</Link>
                  </Button>
                </div>
              )}
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
      </div>
    </AppShell>
  );
}
