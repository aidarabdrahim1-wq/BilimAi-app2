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
  BookMarked,
  Trophy,
  Zap,
  CheckCircle2,
  CalendarDays,
  Edit2,
  PlusCircle,
  BellRing,
  ArrowRight,
  Clock,
  BookOpen,
  ClipboardList,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Check,
  BarChart,
  PieChart
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateUserRating } from "@/lib/rating";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(profile?.untDate || "2025-06-20");
  const [newScore, setNewScore] = useState(profile?.currentScore || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  
  // Timer states
  const [activeTimerTask, setActiveTimerTask] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);

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
    if (profile?.currentScore !== undefined) {
      setNewScore(profile.currentScore);
    }
  }, [profile?.currentScore]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch active plans (today's tasks)
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
          tasks.push(...data.tasks.map((t: any) => ({ ...t, planId: doc.id, fullPlan: data })));
        }
      });
      setTodayTasks(tasks);
    });

    return () => unsubscribe();
  }, [user]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      toast({
        title: "Уақыт аяқталды!",
        description: "Тапсырманы аяқтауды ұмытпаңыз.",
      });
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, toast]);

  const startTaskTimer = (task: any) => {
    const minutes = parseInt(task.time) || 30;
    setTimeLeft(minutes * 60);
    setActiveTimerTask(task);
    setIsTimerRunning(true);
    setIsTimerDialogOpen(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completeTaskFromTimer = async () => {
    if (!activeTimerTask || !user) return;

    const planId = activeTimerTask.planId;
    const fullPlan = activeTimerTask.fullPlan;
    
    const updatedTasks = fullPlan.tasks.map((t: any) => 
      t.id === activeTimerTask.id ? { ...t, status: "completed" } : t
    );

    const completedCount = updatedTasks.filter((t: any) => t.status === "completed").length;
    
    try {
      const planRef = doc(db, "study_plans", planId);
      await updateDoc(planRef, {
        tasks: updatedTasks,
        completedCount,
        updatedAt: serverTimestamp()
      });

      if (completedCount === fullPlan.totalCount) {
        await updateUserRating(user.uid, 'PLAN_COMPLETED');
        await updateDoc(planRef, { status: 'completed' });
        toast({ title: "Жоспар толық орындалды!", description: "+20 рейтинг ұпайы қосылды! 🔥" });
      }

      setIsTimerDialogOpen(false);
      setActiveTimerTask(null);
      toast({ title: "Тапсырма орындалды!", variant: "default" });
    } catch (error) {
      toast({ title: "Қате", variant: "destructive" });
    }
  };

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
      setIsDateDialogOpen(false);
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

  const handleUpdateScore = async () => {
    if (!user || !db) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        currentScore: Number(newScore),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Балл жаңартылды",
        description: `Жаңа ағымдағы балл: ${newScore}`,
      });
      setIsScoreDialogOpen(false);
    } catch (error) {
      toast({
        title: "Қате",
        description: "Баллды жаңарту мүмкін болмады.",
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
  const completedPlansCount = profile?.completedPlans || 0;

  const progressToTarget = Math.round((currentScore / targetScore) * 100);
  const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
  
  const completedTodayCount = todayTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const dailyProgress = todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Reminder Alert */}
        {todayTasks.length === 0 && (
          <Alert className="bg-orange-50 border-orange-200 border-l-4 border-l-orange-500 animate-in fade-in slide-in-from-top-4 duration-500">
            <BellRing className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 font-bold">Оқу жоспары бос!</AlertTitle>
            <AlertDescription className="text-orange-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span>Бүгінгі күніңізді тиімді өткізу үшін оқу жоспарын құрыңыз. Тәртіп - жетістік кепілі!</span>
              <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm" asChild>
                <Link href="/plan" className="flex items-center gap-1">
                  Жоспар құру <ArrowRight className="size-3" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Сәлем, {profile?.fullName?.split(' ')[0] || "Оқушы"}! 👋
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {todayTasks.length > 0 
                ? <><span className="text-primary font-bold">{completedTodayCount}/{todayTasks.length}</span> тапсырма орындалды</> 
                : "Бүгінге әлі жоспар құрылмаған."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Card className="border-none shadow-sm bg-white flex items-center px-4 py-2 gap-3 cursor-pointer hover:bg-accent/5 transition-all group border-l-2 border-orange-500">
                  <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">ҰБТ-ға:</p>
                      <Edit2 className="size-2 text-muted-foreground opacity-50 group-hover:opacity-100" />
                    </div>
                    <div className="flex items-baseline gap-1 leading-none">
                      <span className="text-xl font-black text-orange-600">{daysLeft !== null ? daysLeft : "..."}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">күн</span>
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

            <div className="flex flex-col gap-1.5">
              <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-yellow-100 text-yellow-700 border-yellow-200">
                <Trophy className="size-3.5 fill-current" />
                {rating} ұпай
              </Badge>
              <Badge variant="outline" className="px-3 py-1 gap-1.5 border-orange-200 bg-orange-50 text-orange-700">
                <Zap className="size-3.5 fill-current" />
                {streak} күн streak
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
            <DialogTrigger asChild>
              <Card className="shadow-sm border-none bg-primary text-primary-foreground overflow-hidden relative group cursor-pointer hover:brightness-105 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ағымдағы балл</CardTitle>
                  <TrendingUp className="h-4 w-4 opacity-70 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{currentScore}</div>
                    <Edit2 className="size-3 opacity-0 group-hover:opacity-70" />
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    ҰБТ потенциалы: {Math.round(currentScore)} / 140
                  </p>
                </CardContent>
                <div className="absolute top-0 right-0 size-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ағымдағы баллды жаңарту</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scoreInput">Соңғы тест нәтижесін енгізіңіз (0-140)</Label>
                  <Input
                    id="scoreInput"
                    type="number"
                    min="0"
                    max="140"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateScore} disabled={isUpdating}>
                  {isUpdating ? "Жаңартылуда..." : "Сақтау"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="shadow-sm border-none bg-secondary text-secondary-foreground overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Мақсатты балл</CardTitle>
              <Target className="h-4 w-4 opacity-70 group-hover:scale-110 transition-transform" />
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

          <Card className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
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

          <Card className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Қателік коэффициенті</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{solvedCount > 0 ? 100 - accuracy : 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Талдау қажет: {solvedCount - correctCount} сұрақ
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-none shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  Бүгінгі оқу жоспары
                  {todayTasks.length > 0 && (
                    <Badge variant="outline" className="text-[10px] ml-2 font-bold bg-primary/5">
                      {dailyProgress}% орындалды
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {pendingTasks.length > 0 
                    ? `Орындауды күтіп тұр: ${pendingTasks.length} тапсырма` 
                    : todayTasks.length > 0 
                      ? "Бүгінгі барлық мақсаттар орындалды! 🔥" 
                      : "Күнделікті мақсаттарыңыз"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                <Link href="/plan" className="flex items-center gap-1 font-bold">
                  {todayTasks.length > 0 ? "Басқару" : "Құру"} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Header>
            <CardContent className="p-0">
              {todayTasks.length > 0 ? (
                pendingTasks.length > 0 ? (
                  <div className="divide-y">
                    {pendingTasks.map((task, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-5 hover:bg-accent/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all shadow-sm group-hover:scale-105">
                            {task.type === 'test' 
                              ? <ClipboardList className="size-6" /> 
                              : <BookOpen className="size-6" />
                            }
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm leading-none">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                <Clock className="size-3" /> {task.time}
                              </span>
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0 px-1.5 h-4 font-bold border-muted-foreground/20">
                                {task.subject}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="h-8 rounded-full px-4 text-xs font-bold shadow-sm"
                          onClick={() => startTaskTimer(task)}
                        >
                          Бастау
                        </Button>
                      </div>
                    ))}
                    <div className="p-4 bg-accent/5 flex items-center justify-center">
                      <Progress value={dailyProgress} className="h-1.5 flex-1 max-w-xs mx-auto" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center gap-4 bg-green-50/30 rounded-2xl m-6 border border-dashed border-green-200">
                    <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <Sparkles className="size-10 text-green-600 animate-bounce" />
                    </div>
                    <div className="max-w-[280px]">
                      <h4 className="font-bold text-lg text-green-800">Керемет жұмыс! 🚀</h4>
                      <p className="text-sm text-green-700/80 mt-2 leading-relaxed">
                        Бүгінгі жоспарланған барлық тапсырмаларды аяқтадыңыз. ҰБТ-ға тағы бір қадам жақындадыңыз!
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 border-green-200 text-green-700 hover:bg-green-100" asChild>
                      <Link href="/plan">Жоспарды көру</Link>
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-20 flex flex-col items-center gap-4 bg-muted/5 rounded-2xl m-6 border border-dashed border-muted-foreground/20">
                  <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                    <PlusCircle className="size-10 text-primary/30" />
                  </div>
                  <div className="max-w-[240px]">
                    <h4 className="font-bold text-base">Жоспар әлі құрылмаған</h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Бүгінгі күніңізге мақсат қойып, дайындықты тиімді өткізіңіз.
                    </p>
                  </div>
                  <Button size="default" className="mt-4 rounded-full font-bold px-8 shadow-md" asChild>
                    <Link href="/plan">Жоспар құру</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="pb-2 border-b bg-accent/5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart className="size-4 text-primary" />
                  Оқу статистикасы
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
                  Сіздің даму көрсеткіштеріңіз
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Clock className="size-3 text-blue-500" />
                      Орындалған жоспар:
                    </span>
                    <span className="font-black text-blue-600 text-base">{completedTodayCount} / {todayTasks.length || 0}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={dailyProgress} className="h-2 bg-blue-100" />
                    <p className="text-[9px] text-right text-muted-foreground font-medium">Бүгінгі мақсаттың {dailyProgress}%-ы</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-green-500" />
                      Орындалған жоспарлар:
                    </span>
                    <span className="font-black text-primary text-base">{completedPlansCount} / 30</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={(completedPlansCount / 30) * 100} className="h-2 bg-primary/10" />
                    <p className="text-[9px] text-right text-muted-foreground font-medium">Айлық мақсаттың {Math.round((completedPlansCount / 30) * 100)}%-ы</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-accent/5 border border-border/50 text-center space-y-1 group hover:bg-accent/10 transition-colors">
                    <div className="flex justify-center mb-1">
                      <PieChart className="size-4 text-green-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground block uppercase">Дұрыс жауап</span>
                    <span className="text-xl font-black text-foreground">{correctCount}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-accent/5 border border-border/50 text-center space-y-1 group hover:bg-accent/10 transition-colors">
                    <div className="flex justify-center mb-1">
                      <ClipboardList className="size-4 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground block uppercase">Жалпы сұрақ</span>
                    <span className="text-xl font-black text-foreground">{solvedCount}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-orange-500" />
                      <span className="text-xs font-bold">Streak (Күн):</span>
                    </div>
                    <span className="text-sm font-black">{streak} күн</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm relative overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary">
                  <BookMarked className="size-5" />
                  AI-дан ұсыныс
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-5 rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 relative overflow-hidden">
                  <h4 className="font-bold text-sm mb-2">{profile?.selectedSubjects?.[3] || "Пән"}: Жаңа тақырып</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Сіздің әлсіз тақырыптарыңызға сай: осы бөлімді меңгеріп, +20 рейтинг ұпайын алыңыз!
                  </p>
                  <Button className="w-full mt-4 shadow-md font-bold text-xs h-9" size="sm" asChild>
                    <Link href="/theory">Оқуды бастау</Link>
                  </Button>
                  <Sparkles className="absolute -bottom-4 -right-4 size-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timer Dialog */}
        <Dialog open={isTimerDialogOpen} onOpenChange={(open) => {
          if (!open) setIsTimerRunning(false);
          setIsTimerDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-center font-headline text-2xl font-bold flex flex-col items-center gap-3">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                  <Clock className="size-8" />
                </div>
                {activeTimerTask?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 gap-8">
              <div className="relative size-48 flex items-center justify-center">
                <svg className="size-full -rotate-90 transform">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-accent/20"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={552}
                    strokeDashoffset={552 - (552 * timeLeft) / ((parseInt(activeTimerTask?.time) || 30) * 60)}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black font-mono tracking-tighter">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    қалған уақыт
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full size-12"
                  onClick={() => {
                    const mins = parseInt(activeTimerTask?.time) || 30;
                    setTimeLeft(mins * 60);
                  }}
                >
                  <RotateCcw className="size-5" />
                </Button>
                <Button 
                  variant={isTimerRunning ? "secondary" : "default"} 
                  size="icon" 
                  className="rounded-full size-16 shadow-xl"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current ml-1" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full size-12 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={completeTaskFromTimer}
                >
                  <Check className="size-5" />
                </Button>
              </div>
            </div>
            <DialogFooter className="sm:justify-center border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Тәртіп — жеңістің кілті. Назарыңды тапсырмаға аудар! 🚀
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
