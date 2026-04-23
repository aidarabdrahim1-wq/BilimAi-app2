
"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  Trophy,
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
  Timer,
  Quote,
  Zap,
  Star,
  Medal,
  GraduationCap,
  Flame
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO, format } from "date-fns";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateUserRating } from "@/lib/rating";
import { useMemoFirebase, useCollection } from "@/firebase";

const MOTIVATION_QUOTES = [
  { text: "Жетістіктің құпиясы — бастауда. Ал бүгінгі 1 сағаттық дайындық ертеңгі үлкен жеңістің негізі.", author: "BilimAI Рухы" },
  { text: "Ең үлкен бәсекелесің — кешегі өзің. Күн сайын 1%-ға болса да жақсару сені шыңға шығарады.", author: "Даму қағидасы" },
  { text: "Сен бүгін шаршаған шығарсың, бірақ ертең грант иегері атанғанда бұл қиындықтардың бәрі тек жағымды естелікке айналады.", author: "Сенімділік жолы" },
  { text: "Білім — қару, оны тек еңбекпен ғана шыңдай аласың. ҰБТ — сенің мүмкіндігің!", author: "Білім жолы" },
  { text: "Талап пен еңбек болса, алынбайтын қамал жоқ. Сенің қолыңнан бәрі келеді!", author: "Жеңімпаз мотивациясы" }
];

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newScore, setNewScore] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [randomQuote, setRandomQuote] = useState(MOTIVATION_QUOTES[0]);
  const [todayStr, setTodayStr] = useState("");
  
  // Timer states
  const [activeTimerTask, setActiveTimerTask] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setRandomQuote(MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
    setTodayStr(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (profile) {
      setNewDate(profile.untDate || "2025-06-20");
      setNewScore(profile.currentScore || 0);
    }
  }, [profile]);

  // Fetch only TODAY's plan
  const plansQuery = useMemoFirebase(() => {
    if (!user || !todayStr) return null;
    return query(
      collection(db, "studentProfiles", user.uid, "studyPlans"),
      where("planDate", "==", todayStr)
    );
  }, [user, todayStr]);
  const { data: plansData } = useCollection(plansQuery);

  const todayTasks = useMemo(() => {
    if (!plansData || plansData.length === 0) return [];
    const plan = plansData[0];
    if (!plan.tasks) return [];
    return plan.tasks.map((t: any) => ({ ...t, planId: plan.id, fullPlan: plan }));
  }, [plansData]);

  useEffect(() => {
    const calculateDiff = () => {
      const now = new Date();
      const targetDate = profile?.untDate ? parseISO(profile.untDate) : new Date("2025-06-20");
      const diff = differenceInDays(targetDate, now);
      setDaysLeft(diff > 0 ? diff : 0);
    };
    calculateDiff();
  }, [profile?.untDate]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      toast({ title: "Уақыт аяқталды!", description: "Тапсырманы аяқтауды ұмытпаңыз." });
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

  const formatMinutes = (totalMins: number) => {
    if (totalMins < 60) return `${totalMins} мин`;
    const hh = Math.floor(totalMins / 60);
    const mm = totalMins % 60;
    return `${hh} сағ ${mm} мин`;
  };

  const completeTaskFromTimer = async () => {
    if (!activeTimerTask || !user) return;
    const planId = activeTimerTask.planId;
    const fullPlan = activeTimerTask.fullPlan;
    const updatedTasks = fullPlan.tasks.map((t: any) => t.id === activeTimerTask.id ? { ...t, status: "completed" } : t);
    const completedCount = updatedTasks.filter((t: any) => t.status === "completed").length;
    const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", planId);
    updateDoc(planRef, { tasks: updatedTasks, completedCount, updatedAt: serverTimestamp() });
    if (completedCount === fullPlan.totalCount) {
      updateUserRating(user.uid, 'PLAN_COMPLETED');
      updateDoc(planRef, { status: 'completed' });
      toast({ title: "Жоспар толық орындалды!", description: "+20 рейтинг ұпайы қосылды! 🔥" });
    }
    setIsTimerDialogOpen(false);
    setActiveTimerTask(null);
  };

  const handleUpdateDate = async () => {
    if (!user || !isAdmin) return;
    setIsUpdating(true);
    const userRef = doc(db, "studentProfiles", user.uid);
    updateDoc(userRef, { untDate: newDate, updatedAt: serverTimestamp() })
      .then(() => { setIsDateDialogOpen(false); toast({ title: "Күн жаңартылды" }); })
      .finally(() => setIsUpdating(false));
  };

  const handleUpdateScore = async () => {
    if (!user || !isAdmin) return;
    setIsUpdating(true);
    const userRef = doc(db, "studentProfiles", user.uid);
    updateDoc(userRef, { currentScore: Number(newScore), updatedAt: serverTimestamp() })
      .then(() => { setIsScoreDialogOpen(false); toast({ title: "Балл жаңартылды" }); })
      .finally(() => setIsUpdating(false));
  };

  const currentScore = profile?.currentScore || 0;
  const rating = profile?.rating || 0;
  const todayStudyMinutes = profile?.todayStudyTimeMinutes || 0;

  const getRankInfo = (pts: number) => {
    if (pts < 100) return { name: "Бастаушы", next: 100, icon: Medal, color: "text-slate-400" };
    if (pts < 500) return { name: "Ізденуші", next: 500, icon: Star, color: "text-blue-500" };
    if (pts < 1500) return { name: "Озат", next: 1500, icon: Trophy, color: "text-yellow-500" };
    return { name: "Маман", next: 5000, icon: Zap, color: "text-orange-500" };
  };
  const rank = getRankInfo(rating);
  const rankProgress = (rating / rank.next) * 100;
  const grantProb = Math.min(Math.round((currentScore / 140) * 100), 100);
  const grantStatus = grantProb > 85 ? "Жоғары сенімділік" : grantProb > 60 ? "Жақсы мүмкіндік" : "Көбірек еңбек керек";
  const completedTodayCount = todayTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const dailyProgress = todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {todayTasks.length === 0 && (
          <Alert className="bg-orange-50 border-orange-200 border-l-4 border-l-orange-500 animate-in fade-in slide-in-from-top-4 duration-500">
            <BellRing className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 font-bold">Бүгінге жоспар бос!</AlertTitle>
            <AlertDescription className="text-orange-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span>Күніңізді тиімді өткізу үшін бүгінге мақсаттар белгілеңіз.</span>
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
                      {isAdmin && <Edit2 className="size-2 text-muted-foreground opacity-50 group-hover:opacity-100" />}
                    </div>
                    <div className="flex items-baseline gap-1 leading-none">
                      <span className="text-xl font-black text-orange-600">{daysLeft !== null ? daysLeft : "..."}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">күн</span>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>ҰБТ күнін таңдау</DialogTitle></DialogHeader>
                {isAdmin ? (
                  <div className="space-y-4 py-4">
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    <Button className="w-full" onClick={handleUpdateDate} disabled={isUpdating}>Сақтау</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">Мәліметті өзгерту үшін админге хабарласыңыз.</p>
                )}
              </DialogContent>
            </Dialog>
            <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-yellow-100 text-yellow-700 border-yellow-200">
              <Trophy className="size-3.5 fill-current" /> {rating} ұпай
            </Badge>
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
                    {isAdmin && <Edit2 className="size-3 opacity-0 group-hover:opacity-70" />}
                  </div>
                  <p className="text-xs opacity-70 mt-1">ҰБТ потенциалы: {Math.round(currentScore)} / 140</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Ағымдағы баллды жаңарту</DialogTitle></DialogHeader>
              {isAdmin ? (
                <div className="space-y-4 py-4">
                  <Input type="number" min="0" max="140" value={newScore} onChange={(e) => setNewScore(Number(e.target.value))} />
                  <Button className="w-full" onClick={handleUpdateScore} disabled={isUpdating}>Сақтау</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Мәліметті өзгерту үшін админге хабарласыңыз.</p>
              )}
            </DialogContent>
          </Dialog>

          <Card className="shadow-sm border-none bg-indigo-600 text-white overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Бүгінгі оқу уақыты</CardTitle>
              <Timer className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatMinutes(todayStudyMinutes)}</div>
              <Progress value={Math.min((todayStudyMinutes / 120) * 100, 100)} className="h-2 bg-white/20 mt-4" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Лидерлік мәртебе</CardTitle>
              <rank.icon className={`h-5 w-5 ${rank.color} animate-bounce`} />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2"><span className={`text-2xl font-black ${rank.color}`}>{rank.name}</span></div>
              <Progress value={rankProgress} className="h-1.5 bg-accent/20" />
              <p className="text-[9px] font-bold text-muted-foreground/70 uppercase">Келесі деңгейге: {rank.next - rating} ұпай</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white hover:shadow-md transition-all group overflow-hidden border-r-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Грант мүмкіндігі</CardTitle>
              <GraduationCap className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-green-600 tracking-tighter">{grantProb}%</div>
              <p className="text-[10px] font-black text-green-700/60 uppercase">{grantStatus}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-none shadow-xl bg-white rounded-[32px] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-accent/5 pb-6">
              <div>
                <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <ClipboardList className="size-6" />
                  </div>
                  Бүгінгі оқу жоспары
                </CardTitle>
                <CardDescription className="font-bold text-primary mt-1">
                  {todayTasks.length > 0 ? `Прогресс: ${dailyProgress}% (${completedTodayCount}/${todayTasks.length})` : "Бүгінге мақсаттар қойылмаған"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl font-bold border-2">
                <Link href="/plan">Барлығы <ArrowRight className="size-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {todayTasks.length > 0 ? (
                pendingTasks.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-6 hover:bg-accent/5 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="size-12 rounded-2xl bg-white border-2 border-primary/10 text-primary flex items-center justify-center shadow-sm">
                            {task.type === 'test' ? <ClipboardList className="size-6" /> : <BookOpen className="size-6" />}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-lg">{task.title}</h4>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border-none">{task.subject}</Badge>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold"><Clock className="size-3.5" /> {task.time}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="h-10 rounded-xl px-6 font-black text-sm shadow-lg shadow-primary/10" onClick={() => startTaskTimer(task)}>Бастау</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 flex flex-col items-center gap-6 bg-green-50/30 rounded-[40px] m-6 border-2 border-dashed border-green-200">
                    <div className="size-24 rounded-full bg-green-100 flex items-center justify-center shadow-inner"><Sparkles className="size-12 text-green-600 animate-bounce" /></div>
                    <div className="max-w-[300px]"><h4 className="font-black text-2xl text-green-800">Керемет жұмыс! 🚀</h4></div>
                  </div>
                )
              ) : (
                <div className="text-center py-24 flex flex-col items-center gap-8 bg-muted/5 rounded-[40px] m-6 border-4 border-dashed border-white">
                  <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center"><PlusCircle className="size-12 text-primary/30" /></div>
                  <Button size="lg" className="mt-4 rounded-xl font-black px-10 shadow-xl" asChild><Link href="/plan">Жоспар құру</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-[32px] overflow-hidden relative group p-8">
              <CardHeader className="pb-2 p-0">
                <div className="flex items-center gap-2 mb-1"><Zap className="size-4 fill-current" /><span className="text-[10px] font-black uppercase tracking-widest opacity-80">Күн мотивациясы</span></div>
                <CardTitle className="text-xl font-headline flex items-center gap-2"><Quote className="size-6 opacity-50" />Сенің қолыңнан келеді!</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <p className="text-lg font-medium leading-relaxed italic opacity-95">"{randomQuote.text}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/10"><span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">— {randomQuote.author}</span><Star className="size-5 fill-yellow-300 text-yellow-300" /></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden p-6">
              <CardTitle className="text-base font-black flex items-center gap-3 mb-6"><div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><BarChart className="size-4" /></div>Статистика</CardTitle>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end"><span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Бүгінгі белсенділік</span><span className="font-black text-indigo-600">{formatMinutes(todayStudyMinutes)}</span></div>
                  <Progress value={Math.min((todayStudyMinutes / 120) * 100, 100)} className="h-2 bg-indigo-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-accent/5 border border-border/50 text-center"><span className="text-[9px] font-black text-muted-foreground block uppercase tracking-widest">Стрим (Streak)</span><div className="flex items-center justify-center gap-1.5"><Flame className="size-5 text-orange-500 fill-current" /><span className="text-2xl font-black">{profile?.streakDays || 0} күн</span></div></div>
                  <div className="p-4 rounded-2xl bg-accent/5 border border-border/50 text-center"><span className="text-[9px] font-black text-muted-foreground block uppercase tracking-widest">Рейтинг</span><div className="flex items-center justify-center gap-1.5"><Medal className="size-5 text-primary" /><span className="text-2xl font-black">{rating}</span></div></div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Dialog open={isTimerDialogOpen} onOpenChange={(open) => { if (!open) setIsTimerRunning(false); setIsTimerDialogOpen(open); }}>
          <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[40px]">
            <DialogHeader><DialogTitle className="text-center font-headline text-2xl font-black">{activeTimerTask?.title}</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 gap-10">
              <div className="relative size-56 flex items-center justify-center">
                <svg className="size-full -rotate-90 transform"><circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-accent/20" /><circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={653} strokeDashoffset={653 - (653 * timeLeft) / ((parseInt(activeTimerTask?.time) || 30) * 60)} className="text-primary transition-all duration-1000" strokeLinecap="round" /></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-6xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span></div>
              </div>
              <div className="flex items-center gap-6">
                <Button variant="outline" size="icon" className="rounded-2xl size-14 border-2" onClick={() => setTimeLeft((parseInt(activeTimerTask?.time) || 30) * 60)}><RotateCcw className="size-6" /></Button>
                <Button variant={isTimerRunning ? "secondary" : "default"} size="icon" className="rounded-[32px] size-20 shadow-2xl" onClick={() => setIsTimerRunning(!isTimerRunning)}>{isTimerRunning ? <Pause className="size-10 fill-current" /> : <Play className="size-10 fill-current ml-1" />}</Button>
                <Button variant="outline" size="icon" className="rounded-2xl size-14 text-green-600 border-2" onClick={completeTaskFromTimer}><Check className="size-6" /></Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
