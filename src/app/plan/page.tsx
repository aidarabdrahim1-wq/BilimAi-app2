"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  ClipboardList,
  Zap,
  Loader2,
  Sparkles,
  Wand2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  LayoutGrid,
  ListTodo,
  Columns,
  Circle,
  Flame,
  Target,
  TrendingUp,
  Brain,
  Play,
  RotateCcw,
  Quote,
  Star,
  Award,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, updateDoc, doc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserRating } from "@/lib/rating";
import { generateStudyPlan } from "@/ai/flows/generate-study-plan-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns";
import { kk } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const SUBJECT_COLORS: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  "Математика":        { bg: "bg-blue-50",    text: "text-blue-700",   ring: "ring-blue-200",   dot: "bg-blue-500" },
  "Физика":            { bg: "bg-purple-50",  text: "text-purple-700", ring: "ring-purple-200", dot: "bg-purple-500" },
  "Химия":             { bg: "bg-green-50",   text: "text-green-700",  ring: "ring-green-200",  dot: "bg-green-500" },
  "Биология":          { bg: "bg-emerald-50", text: "text-emerald-700",ring: "ring-emerald-200",dot: "bg-emerald-500" },
  "Қазақстан тарихы": { bg: "bg-amber-50",   text: "text-amber-700",  ring: "ring-amber-200",  dot: "bg-amber-500" },
  "Дүниежүзі тарихы": { bg: "bg-orange-50",  text: "text-orange-700", ring: "ring-orange-200", dot: "bg-orange-500" },
  "География":         { bg: "bg-teal-50",    text: "text-teal-700",   ring: "ring-teal-200",   dot: "bg-teal-500" },
  "Қазақ тілі":        { bg: "bg-rose-50",    text: "text-rose-700",   ring: "ring-rose-200",   dot: "bg-rose-500" },
  "Орыс тілі":         { bg: "bg-red-50",     text: "text-red-700",    ring: "ring-red-200",    dot: "bg-red-500" },
  "Ағылшын тілі":      { bg: "bg-indigo-50",  text: "text-indigo-700", ring: "ring-indigo-200", dot: "bg-indigo-500" },
  "Информатика":       { bg: "bg-cyan-50",    text: "text-cyan-700",   ring: "ring-cyan-200",   dot: "bg-cyan-500" },
};
const DEFAULT_COLOR = { bg: "bg-primary/5", text: "text-primary", ring: "ring-primary/20", dot: "bg-primary" };

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || DEFAULT_COLOR;
}

function CircularProgress({ value, size = 100, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-primary/10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-700"
      />
    </svg>
  );
}

export default function PlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ tasks: any[]; weeklyPlan: any[]; motivation: string } | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", time: "30 мин", type: "theory" as "theory" | "test" | "analysis", subject: "" });

  useEffect(() => { setSelectedDate(new Date()); }, []);

  const subjects = profile?.selectedSubjects || ["Математика", "Физика", "Тарих"];

  useEffect(() => {
    if (!user) return;
    const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
    const unsubscribe = onSnapshot(query(plansRef), (snapshot) => {
      setAllPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `studentProfiles/${user.uid}/studyPlans`, operation: 'list' }));
    });
    return () => unsubscribe();
  }, [user]);

  const activePlan = useMemo(() => {
    if (!selectedDate) return null;
    return allPlans.find(p => p.planDate === format(selectedDate, 'yyyy-MM-dd')) || null;
  }, [allPlans, selectedDate]);

  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    return eachDayOfInterval({ start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) });
  }, [selectedDate]);

  const progressPct = activePlan && activePlan.totalCount > 0
    ? Math.round((activePlan.completedCount / activePlan.totalCount) * 100)
    : 0;

  const totalMinutes = useMemo(() => {
    if (!activePlan?.tasks) return 0;
    return activePlan.tasks.reduce((acc: number, t: any) => {
      const m = parseInt(t.time?.replace(/\D/g, "") || "0");
      return acc + m;
    }, 0);
  }, [activePlan]);

  const activeTasks = activePlan?.tasks?.filter((t: any) => t.status !== "completed") || [];
  const completedTasks = activePlan?.tasks?.filter((t: any) => t.status === "completed") || [];

  const handleAddTask = async (taskData?: any) => {
    if (!user || !selectedDate) return;
    const taskToSave = taskData || {
      id: Math.random().toString(36).substring(7),
      title: newTask.title, time: newTask.time, type: newTask.type, subject: newTask.subject, status: "pending"
    };
    if (!taskToSave.title || !taskToSave.subject) {
      toast({ title: "Мәліметтер толық емес", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      if (activePlan) {
        await updateDoc(doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id), {
          tasks: [...(activePlan.tasks || []), taskToSave],
          totalCount: (activePlan.totalCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "studentProfiles", user.uid, "studyPlans"), {
          studentId: user.uid, planDate: dateStr,
          title: `Жоспар - ${format(selectedDate, 'dd.MM.yyyy')}`,
          tasks: [taskToSave], status: "active", completedCount: 0, totalCount: 1,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }
      if (!taskData) setNewTask({ title: "", time: "30 мин", type: "theory", subject: "" });
      toast({ title: "Тапсырма қосылды ✓" });
    } catch {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `studentProfiles/${user.uid}/studyPlans`, operation: 'write' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!user || !profile) return;
    setIsAiGenerating(true);
    try {
      const response = await generateStudyPlan({
        studentName: profile.fullName,
        currentScore: profile.currentScore || 0,
        targetScore: profile.targetScore || 140,
        weakSubjects: profile.selectedSubjects.slice(0, 5),
        weakTopics: profile.weakTopics || [],
        dailyAvailableStudyTimeMinutes: 120,
        studyGoals: `${profile.targetCareer || "Университетке"} түсу`,
        performanceSummary: "Соңғы тесттерде орташа балл жақсарып келеді.",
        levelSegmentation: "70-90 балл"
      });
      const tasks = response.dailyPlan.map(p => ({
        id: Math.random().toString(36).substring(7),
        title: p.description,
        time: p.activity.match(/\d+/)?.[0] ? `${p.activity.match(/\d+/)?.[0]} мин` : "30 мин",
        type: p.activity.toLowerCase().includes('test') ? 'test' : p.activity.toLowerCase().includes('analysis') ? 'analysis' : 'theory',
        subject: p.description.split(':')[0]?.trim() || profile.selectedSubjects[0],
        status: "pending"
      }));
      setAiResult({ tasks, weeklyPlan: response.weeklyPlan || [], motivation: response.motivationMessage || "" });
    } catch {
      toast({ title: "AI қатесі", description: "Жоспар құру мүмкін болмады.", variant: "destructive" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const applyAiPlan = async () => {
    if (!aiResult || !user || !selectedDate) return;
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingPlan = allPlans.find(p => p.planDate === dateStr);
      if (existingPlan) {
        await updateDoc(doc(db, "studentProfiles", user.uid, "studyPlans", existingPlan.id), {
          tasks: [...(existingPlan.tasks || []), ...aiResult.tasks],
          totalCount: (existingPlan.totalCount || 0) + aiResult.tasks.length,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "studentProfiles", user.uid, "studyPlans"), {
          studentId: user.uid, planDate: dateStr,
          title: `AI Жоспар - ${format(selectedDate, 'dd.MM.yyyy')}`,
          tasks: aiResult.tasks, status: "active", completedCount: 0, totalCount: aiResult.tasks.length,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }
      setAiResult(null);
      setIsAiDialogOpen(false);
      toast({ title: "AI жоспары қосылды!", description: "Сәттілік! 🚀" });
    } catch {
      toast({ title: "Қате", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!activePlan || !user) return;
    const updatedTasks = activePlan.tasks.map((t: any) =>
      t.id === taskId ? { ...t, status: currentStatus === "completed" ? "pending" : "completed" } : t
    );
    const completedCount = updatedTasks.filter((t: any) => t.status === "completed").length;
    try {
      await updateDoc(doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id), {
        tasks: updatedTasks, completedCount, updatedAt: serverTimestamp()
      });
      if (completedCount === activePlan.totalCount && currentStatus !== "completed") {
        updateUserRating(user.uid, 'PLAN_COMPLETED');
        toast({ title: "Жоспар толық орындалды! 🔥", description: "+20 рейтинг ұпайы қосылды!" });
      }
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (taskId: string) => {
    if (!activePlan || !user) return;
    if (!confirm("Бұл тапсырманы өшіргіңіз келе ме?")) return;
    const updatedTasks = activePlan.tasks.filter((t: any) => t.id !== taskId);
    try {
      await updateDoc(doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id), {
        tasks: updatedTasks, totalCount: updatedTasks.length,
        completedCount: updatedTasks.filter((t: any) => t.status === "completed").length,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Тапсырма өшірілді" });
    } catch (e) { console.error(e); }
  };

  const totalCompletedAllTime = allPlans.reduce((a, p) => a + (p.completedCount || 0), 0);
  const activeDays = allPlans.filter(p => p.tasks?.length > 0).length;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="size-7" />
              </div>
              Оқу маршруты
            </h1>
            <p className="text-muted-foreground font-medium pl-1">
              {selectedDate ? format(selectedDate, 'd MMMM, yyyy — EEEE', { locale: kk }) : "Күнді таңдаңыз"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="bg-white p-1 rounded-xl shadow-sm border">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="day" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ListTodo className="size-4" /> Күн
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Columns className="size-4" /> Апта
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                  <LayoutGrid className="size-4" /> Ай
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={isAiDialogOpen} onOpenChange={(open) => { setIsAiDialogOpen(open); if (!open) setAiResult(null); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold">
                  <Sparkles className="size-4" /> AI Жоспар
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Wand2 className="size-5" />
                    </div>
                    AI Жеке Оқу Стратегиясы
                  </DialogTitle>
                  <DialogDescription>
                    Профиліңізді AI талдап, сізге ең тиімді кестені ұсынады.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {isAiGenerating ? (
                    <div className="flex flex-col items-center gap-6 py-16">
                      <div className="relative">
                        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <Brain className="size-10 text-primary animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-black text-lg text-primary">AI талдау жасауда...</p>
                        <p className="text-sm text-muted-foreground">Профиліңіздің әлсіз тұстарын анықтап жатыр</p>
                      </div>
                    </div>
                  ) : aiResult ? (
                    <div className="space-y-6">
                      {/* Motivation */}
                      {aiResult.motivation && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-indigo-50 border border-primary/10 relative overflow-hidden">
                          <Quote className="size-8 text-primary/20 absolute top-3 right-3" />
                          <p className="text-sm font-medium text-foreground/80 leading-relaxed italic pr-8">
                            "{aiResult.motivation}"
                          </p>
                        </div>
                      )}

                      {/* Daily tasks */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Target className="size-4 text-primary" /> Бүгінгі жоспар ({aiResult.tasks.length} тапсырма)
                        </h4>
                        {aiResult.tasks.map((task, i) => {
                          const c = getSubjectColor(task.subject);
                          const icon = task.type === 'test' ? <ClipboardList className="size-4" /> : task.type === 'analysis' ? <TrendingUp className="size-4" /> : <BookOpen className="size-4" />;
                          return (
                            <div key={i} className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${c.bg} border-transparent ring-1 ${c.ring} transition-all`}>
                              <div className={`size-9 rounded-xl flex items-center justify-center ${c.text} bg-white/70 shrink-0`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black truncate">{task.title}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text}`}>{task.subject}</p>
                              </div>
                              <Badge className={`rounded-lg shrink-0 border-none font-black ${c.bg} ${c.text}`}>{task.time}</Badge>
                            </div>
                          );
                        })}
                      </div>

                      {/* Weekly plan */}
                      {aiResult.weeklyPlan?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CalendarCheck className="size-4 text-primary" /> Апталық маршрут
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {aiResult.weeklyPlan.map((day, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-white">
                                <span className="text-xs font-black text-primary w-20 shrink-0">{day.day}</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {day.activities?.map((act: string, j: number) => (
                                    <Badge key={j} variant="secondary" className="text-[10px] font-bold rounded-lg">{act}</Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-8 py-10">
                      <div className="relative mx-auto w-fit">
                        <div className="size-24 rounded-full bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center mx-auto">
                          <Sparkles className="size-12 text-primary" />
                        </div>
                        <div className="absolute -top-1 -right-1 size-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                          <Star className="size-4 text-white fill-current" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-black text-xl">Жеке AI Стратегия</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                          AI сіздің балыңызды, әлсіз тақырыптарыңызды және мақсатыңызды ескере отырып, оңтайлы оқу кестесін жасап береді.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                          {subjects.slice(0, 4).map(s => {
                            const c = getSubjectColor(s);
                            return <Badge key={s} className={`${c.bg} ${c.text} border-none font-bold rounded-xl`}>{s}</Badge>;
                          })}
                        </div>
                      </div>
                      <Button onClick={handleAiGenerate} size="lg" className="h-14 px-10 rounded-2xl font-black shadow-xl shadow-primary/20 gap-2">
                        <Wand2 className="size-5" /> Стратегия жасау
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-3">
                  {aiResult && (
                    <>
                      <Button variant="outline" className="rounded-xl font-bold" onClick={() => setAiResult(null)}>
                        <RotateCcw className="size-4 mr-2" /> Қайта жасау
                      </Button>
                      <Button className="flex-1 h-12 gap-2 rounded-xl font-black shadow-xl" onClick={applyAiPlan} disabled={isLoading}>
                        {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
                        Бұл жоспарды қолдану
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Left sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Progress ring card */}
            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <CircularProgress value={progressPct} size={96} stroke={9} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-primary leading-none">{progressPct}%</span>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <div>
                      <p className="font-black text-lg leading-tight">Бүгінгі прогресс</p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {activePlan ? `${activePlan.completedCount} / ${activePlan.totalCount} тапсырма` : "Жоспар жоқ"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-amber-50 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <Flame className="size-4 text-amber-500" />
                          <span className="font-black text-lg text-amber-700">{profile?.streakDays || 0}</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Streak</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-primary/5 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <Clock className="size-4 text-primary" />
                          <span className="font-black text-lg text-primary">{totalMinutes}</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/70">мин</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="pb-2 border-b bg-accent/5">
                <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <CalendarIcon className="size-4 text-primary" /> Күнтізбе
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className="rounded-none border-none"
                  locale={kk}
                  modifiers={{ hasTasks: (date) => allPlans.some(p => p.planDate === format(date, 'yyyy-MM-dd') && p.tasks?.length > 0) }}
                  modifiersClassNames={{ hasTasks: "font-black text-primary after:block after:w-1 after:h-1 after:bg-primary after:rounded-full after:mx-auto after:-mt-1" }}
                />
              </CardContent>
            </Card>

            {/* Quick add */}
            <Card className="border-none shadow-xl bg-white rounded-[32px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">Жаңа тапсырма</CardTitle>
                <CardDescription className="font-medium">Мақсатты қолмен енгізу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Тақырыбы</Label>
                  <Input
                    placeholder="М: Логарифмдерді қайталау"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="h-11 rounded-xl bg-accent/5 border-none shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Пән</Label>
                    <Select onValueChange={(v) => setNewTask({ ...newTask, subject: v })} value={newTask.subject}>
                      <SelectTrigger className="h-11 rounded-xl bg-accent/5 border-none">
                        <SelectValue placeholder="Таңдаңыз" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${getSubjectColor(s).dot}`} />
                              {s}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Түрі</Label>
                    <Select onValueChange={(v: any) => setNewTask({ ...newTask, type: v })} value={newTask.type}>
                      <SelectTrigger className="h-11 rounded-xl bg-accent/5 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory"><div className="flex items-center gap-2"><BookOpen className="size-4" /> Теория</div></SelectItem>
                        <SelectItem value="test"><div className="flex items-center gap-2"><ClipboardList className="size-4" /> Тест</div></SelectItem>
                        <SelectItem value="analysis"><div className="flex items-center gap-2"><TrendingUp className="size-4" /> Талдау</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Уақыт</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["15 мин", "30 мин", "45 мин", "60 мин", "90 мин"].map(t => (
                      <button
                        key={t}
                        onClick={() => setNewTask({ ...newTask, time: t })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${newTask.time === t ? 'bg-primary text-white shadow-lg' : 'bg-accent/10 hover:bg-accent/30'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full gap-2 h-12 rounded-xl font-bold shadow-lg"
                  onClick={() => handleAddTask()}
                  disabled={isLoading || !newTask.title || !newTask.subject}
                >
                  {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                  Тізімге қосу
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right main content */}
          <div className="lg:col-span-8 space-y-6">

            {/* DAY VIEW */}
            {viewMode === "day" && (
              <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden min-h-[600px]">
                <CardHeader className="pb-6 border-b bg-gradient-to-r from-accent/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-black font-headline capitalize">
                        {selectedDate ? format(selectedDate, 'EEEE', { locale: kk }) : "Күн"}
                      </CardTitle>
                      {activePlan && (
                        <div className="flex items-center gap-3">
                          <Progress value={progressPct} className="h-2 w-40 rounded-full" />
                          <span className="text-xs font-black text-primary">{progressPct}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {activePlan && (
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-none px-4 py-2 rounded-xl font-black shadow-lg shadow-amber-200">
                          <Zap className="size-4 mr-1.5 fill-current" /> +20 ұпай
                        </Badge>
                      )}
                      {!activePlan && (
                        <Button variant="outline" size="sm" className="rounded-xl font-bold border-2 gap-2" onClick={() => setIsAiDialogOpen(true)}>
                          <Sparkles className="size-4 text-primary" /> AI-мен жасау
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {activeTasks.length > 0 ? (
                    <div className="space-y-3">
                      {activeTasks.map((task: any, idx: number) => {
                        const c = getSubjectColor(task.subject);
                        const typeIcon = task.type === 'test'
                          ? <ClipboardList className="size-5" />
                          : task.type === 'analysis'
                          ? <TrendingUp className="size-5" />
                          : <BookOpen className="size-5" />;
                        const typeLabel = task.type === 'theory' ? 'Теория' : task.type === 'test' ? 'Тест' : 'Талдау';
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-4 p-5 rounded-[20px] border-2 border-border/40 bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group/item"
                          >
                            <button
                              onClick={() => toggleTaskStatus(task.id, task.status)}
                              className="size-11 rounded-xl border-2 border-primary/20 flex items-center justify-center transition-all hover:bg-primary hover:border-primary hover:text-white shrink-0"
                            >
                              <Circle className="size-5 text-primary/30 group-hover/item:text-primary/60" />
                            </button>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h4 className="font-black text-foreground leading-tight truncate">{task.title}</h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.bg} ${c.text}`}>
                                  <span className={`size-1.5 rounded-full ${c.dot}`} />
                                  {task.subject}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                  <Clock className="size-3.5" /> {task.time}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase">
                                  {typeIcon && <span className="size-3.5">{typeIcon}</span>}
                                  {typeLabel}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost" size="icon"
                              className="rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : activePlan && completedTasks.length === activePlan.totalCount && activePlan.totalCount > 0 ? (
                    <div className="text-center py-20 flex flex-col items-center gap-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-[32px] border-2 border-dashed border-green-200 m-2">
                      <div className="size-24 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
                        <Award className="size-12 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black text-green-800">Керемет! Барлығы орындалды! 🚀</h4>
                        <p className="text-green-700/70 font-medium max-w-xs mx-auto">
                          Бүгінгі барлық тапсырмаларды аяқтадыңыз. Ертеңгі күнге дайындала беріңіз.
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white border-none px-6 py-2 rounded-xl font-black text-sm">
                        +20 рейтинг ұпайы қосылды!
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-24 flex flex-col items-center gap-8 m-2">
                      <div className="size-28 rounded-full bg-primary/5 flex items-center justify-center">
                        <ListTodo className="size-14 text-primary/20" />
                      </div>
                      <div className="space-y-3">
                        <p className="font-black text-2xl">Бұл күнге жоспар жоқ</p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">
                          AI куратордан автоматты кесте алыңыз немесе сол жақтан тапсырма қосыңыз.
                        </p>
                      </div>
                      <Button className="h-14 px-10 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20" onClick={() => setIsAiDialogOpen(true)}>
                        <Sparkles className="size-5" /> AI-мен жоспарлау
                      </Button>
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <Collapsible open={showArchive} onOpenChange={setShowArchive} className="mt-8 border-t-2 border-dashed pt-6">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full flex justify-between items-center text-muted-foreground hover:text-foreground font-black group px-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-green-500" />
                            <span className="text-xs uppercase tracking-[0.2em]">Орындалғандар</span>
                            <Badge variant="secondary" className="rounded-lg h-6 min-w-6 font-black">{completedTasks.length}</Badge>
                          </div>
                          {showArchive ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-4">
                        {completedTasks.map((task: any) => {
                          const c = getSubjectColor(task.subject);
                          return (
                            <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-accent/5 opacity-60 hover:opacity-100 transition-opacity group/done">
                              <button
                                onClick={() => toggleTaskStatus(task.id, task.status)}
                                className="size-9 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-md shrink-0"
                              >
                                <CheckCircle2 className="size-5" />
                              </button>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <h4 className="text-sm font-bold line-through text-muted-foreground truncate">{task.title}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${c.text}`}>{task.subject}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover/done:opacity-100 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteTask(task.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}

            {/* WEEK VIEW */}
            {viewMode === "week" && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {weekDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayPlan = allPlans.find(p => p.planDate === dateStr);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const pct = dayPlan && dayPlan.totalCount > 0
                      ? Math.round((dayPlan.completedCount / dayPlan.totalCount) * 100) : 0;

                    return (
                      <Card
                        key={idx}
                        className={`border-none shadow-md cursor-pointer transition-all hover:scale-[1.01] rounded-3xl overflow-hidden
                          ${isSelected ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''}
                          ${isToday ? 'bg-primary/5' : 'bg-white'}`}
                        onClick={() => { setSelectedDate(day); setViewMode("day"); }}
                      >
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-5">
                            <div className={`size-14 rounded-2xl flex flex-col items-center justify-center shadow-inner shrink-0 ${isToday ? 'bg-primary text-white' : 'bg-accent/10 text-foreground'}`}>
                              <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">{format(day, 'EEE', { locale: kk })}</span>
                              <span className="text-xl font-black">{format(day, 'd')}</span>
                            </div>
                            <div className="space-y-2 min-w-0">
                              <h4 className="font-black text-base">
                                {isToday ? "Бүгін" : format(day, 'd MMMM', { locale: kk })}
                              </h4>
                              {dayPlan && dayPlan.totalCount > 0 ? (
                                <div className="flex items-center gap-3">
                                  <Progress value={pct} className="h-1.5 w-24 rounded-full" />
                                  <span className="text-[10px] font-black text-muted-foreground">
                                    {dayPlan.completedCount}/{dayPlan.totalCount}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Жоспар жоқ</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {dayPlan?.tasks?.length > 0 && (
                              <div className="flex -space-x-2">
                                {dayPlan.tasks.slice(0, 3).map((t: any, i: number) => {
                                  const c = getSubjectColor(t.subject);
                                  return (
                                    <div key={i} className={`size-8 rounded-lg border-2 border-white flex items-center justify-center shadow-sm ${c.bg} ${c.text}`}>
                                      {t.type === 'test' ? <ClipboardList className="size-3.5" /> : <BookOpen className="size-3.5" />}
                                    </div>
                                  );
                                })}
                                {dayPlan.tasks.length > 3 && (
                                  <div className="size-8 rounded-lg bg-accent flex items-center justify-center text-[10px] font-black border-2 border-white">
                                    +{dayPlan.tasks.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            <ChevronRight className="size-5 text-muted-foreground/40" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MONTH VIEW */}
            {viewMode === "month" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Белсенді күн", value: activeDays, icon: <CalendarCheck className="size-6 text-primary" />, color: "bg-primary/5" },
                    { label: "Жалпы тапсырма", value: allPlans.reduce((a, p) => a + (p.tasks?.length || 0), 0), icon: <ListTodo className="size-6 text-indigo-500" />, color: "bg-indigo-50" },
                    { label: "Орындалған", value: totalCompletedAllTime, icon: <CheckCircle2 className="size-6 text-green-500" />, color: "bg-green-50" },
                    { label: "Streak", value: `${profile?.streakDays || 0} күн`, icon: <Flame className="size-6 text-amber-500" />, color: "bg-amber-50" },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-lg rounded-[28px]">
                      <CardContent className={`p-6 text-center space-y-3 ${stat.color} rounded-[28px]`}>
                        <div className="flex justify-center">{stat.icon}</div>
                        <p className="text-3xl font-black">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="border-b bg-accent/5">
                    <CardTitle className="text-lg font-black">Барлық жоспарлар</CardTitle>
                    <CardDescription>Пәндер бойынша бөлу</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {subjects.map(subject => {
                      const c = getSubjectColor(subject);
                      const count = allPlans.reduce((acc, p) => acc + (p.tasks?.filter((t: any) => t.subject === subject).length || 0), 0);
                      const done = allPlans.reduce((acc, p) => acc + (p.tasks?.filter((t: any) => t.subject === subject && t.status === 'completed').length || 0), 0);
                      const pct = count > 0 ? Math.round((done / count) * 100) : 0;
                      if (count === 0) return null;
                      return (
                        <div key={subject} className="flex items-center gap-4">
                          <div className={`size-2.5 rounded-full shrink-0 ${c.dot}`} />
                          <span className="text-sm font-bold w-36 shrink-0 truncate">{subject}</span>
                          <Progress value={pct} className="flex-1 h-2 rounded-full" />
                          <span className="text-xs font-black text-muted-foreground w-16 text-right">{done}/{count}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
