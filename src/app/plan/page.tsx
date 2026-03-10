
"use client";

import { useState, useEffect } from "react";
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
  Calendar as CalendarIcon
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, arrayUnion, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserRating } from "@/lib/rating";
import { generateStudyPlan } from "@/ai/flows/generate-study-plan-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { kk } from "date-fns/locale";

export default function PlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPreview, setAiPreview] = useState<any[] | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [newTask, setNewTask] = useState({
    title: "",
    time: "30 мин",
    type: "theory" as "theory" | "test" | "analysis",
    subject: ""
  });

  const subjects = profile?.selectedSubjects || ["Математика", "Физика", "Тарих"];

  useEffect(() => {
    if (!user) return;
    fetchPlanByDate();
  }, [user, selectedDate]);

  const fetchPlanByDate = async () => {
    if (!user || !selectedDate) return;
    
    // Форматтау арқылы күн бойынша іздеу
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
    // status == active немесе нақты күн бойынша іздеу (MVP үшін status active жеткілікті)
    const q = query(
      plansRef,
      where("status", "==", "active"),
      limit(1)
    );

    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setActivePlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActivePlan(null);
      }
    } catch (error) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: plansRef.path,
          operation: 'list'
       }));
    }
  };

  const handleAddTask = async (taskData?: any) => {
    if (!user) return;
    
    const taskToSave = taskData || {
      id: Math.random().toString(36).substring(7),
      title: newTask.title,
      time: newTask.time,
      type: newTask.type,
      subject: newTask.subject,
      status: "pending"
    };

    if (!taskToSave.title || !taskToSave.subject) {
      toast({ title: "Мәліметтер толық емес", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (activePlan) {
        const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id);
        updateDoc(planRef, {
          tasks: arrayUnion(taskToSave),
          totalCount: (activePlan.totalCount || 0) + 1,
          updatedAt: serverTimestamp()
        }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: planRef.path,
            operation: 'update',
            requestResourceData: { totalCount: (activePlan.totalCount || 0) + 1 }
          }));
        });
      } else {
        const newPlan = {
          studentId: user.uid,
          title: `Жоспар - ${format(selectedDate || new Date(), 'dd.MM.yyyy')}`,
          tasks: [taskToSave],
          status: "active",
          completedCount: 0,
          totalCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
        addDoc(plansRef, newPlan).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: plansRef.path,
            operation: 'create',
            requestResourceData: newPlan
          }));
        });
      }

      if (!taskData) {
        setNewTask({ title: "", time: "30 мин", type: "theory", subject: "" });
      }
      setTimeout(fetchPlanByDate, 1000);
    } catch (error) {
      toast({ title: "Қате", variant: "destructive" });
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
        weakSubjects: profile.selectedSubjects.slice(3, 5),
        weakTopics: profile.weakTopics || [],
        dailyAvailableStudyTimeMinutes: 120,
        studyGoals: `${profile.targetCareer || "Университетке"} түсу`,
        performanceSummary: "Соңғы тесттерде орташа балл жақсарып келеді.",
        levelSegmentation: "70-90 балл"
      });

      const newTasks = response.dailyPlan.map(p => ({
        id: Math.random().toString(36).substring(7),
        title: p.description,
        time: p.activity.split(' ')[0] + " " + p.activity.split(' ')[1],
        type: p.activity.toLowerCase().includes('test') ? 'test' : 'theory',
        subject: p.description.split(':')[0],
        status: "pending"
      }));

      setAiPreview(newTasks);
    } catch (error) {
      toast({ title: "AI қатесі", description: "Жоспар құру мүмкін болмады.", variant: "destructive" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const applyAiPlan = async () => {
    if (!aiPreview || !user) return;
    setIsLoading(true);
    try {
      for (const task of aiPreview) {
        await handleAddTask(task);
      }
      setAiPreview(null);
      setIsAiDialogOpen(false);
      toast({ title: "AI жоспары қосылды!", description: "Бүгінгі күніңізге сәттілік! 🚀" });
    } catch (error) {
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
      const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id);
      updateDoc(planRef, {
        tasks: updatedTasks,
        completedCount,
        updatedAt: serverTimestamp()
      }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: planRef.path,
          operation: 'update',
          requestResourceData: { completedCount }
        }));
      });

      if (completedCount === activePlan.totalCount && currentStatus !== "completed") {
        await updateUserRating(user.uid, 'PLAN_COMPLETED');
        toast({ title: "Жоспар толық орындалды!", description: "+20 рейтинг ұпайы қосылды! 🔥" });
      }

      setTimeout(fetchPlanByDate, 500);
    } catch (error) {
      toast({ title: "Қате", variant: "destructive" });
    }
  };

  const activeTasks = activePlan?.tasks?.filter((t: any) => t.status !== "completed") || [];
  const completedTasks = activePlan?.tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <CalendarCheck className="size-8 text-primary" />
              Оқу жоспары
            </h1>
            <p className="text-muted-foreground text-sm">
              {selectedDate ? format(selectedDate, 'd MMMM, yyyy', { locale: kk }) : "Күнді таңдаңыз"} арналған мақсаттар.
            </p>
          </div>

          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 animate-pulse hover:animate-none">
                <Sparkles className="size-4" />
                AI Куратормен жоспарлау
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="size-5 text-primary" />
                  Жеке оқу стратегиясы
                </DialogTitle>
                <DialogDescription>
                  Профиліңізді талдау арқылы құрастырылған оңтайлы кесте.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 min-h-[200px] flex flex-col items-center justify-center">
                {isAiGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">AI жоспар құруда...</p>
                  </div>
                ) : aiPreview ? (
                  <div className="w-full space-y-3">
                    {aiPreview.map((task, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-accent/5 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{task.title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{task.subject}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{task.time}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                      <Sparkles className="size-8" />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      AI сіздің әлсіз тұстарыңызды ескере отырып, бүгінге арналған ең тиімді оқу кестесін жасап береді.
                    </p>
                    <Button onClick={handleAiGenerate}>Жоспарды генерациялау</Button>
                  </div>
                )}
              </div>
              <DialogFooter>
                {aiPreview && (
                  <Button className="w-full gap-2" onClick={applyAiPlan} disabled={isLoading}>
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Бұл жоспарды қолдану
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Left Column: Calendar and New Task Form */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="pb-2 border-b bg-accent/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" />
                  Күнтізбе
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-none border-none"
                  locale={kk}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Жаңа тапсырма</CardTitle>
                <CardDescription>Күнделікті мақсаттарды енгізу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Тақырыбы</Label>
                  <Input 
                    placeholder="М: Логарифмдерді қайталау" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пән</Label>
                  <Select onValueChange={(v) => setNewTask({...newTask, subject: v})} value={newTask.subject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Таңдаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Түрі</Label>
                  <Select onValueChange={(v: any) => setNewTask({...newTask, type: v})} value={newTask.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">Теория</SelectItem>
                      <SelectItem value="test">Тест</SelectItem>
                      <SelectItem value="analysis">Талдау</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Уақыт</Label>
                  <Select onValueChange={(v) => setNewTask({...newTask, time: v})} value={newTask.time}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 мин">15 мин</SelectItem>
                      <SelectItem value="30 мин">30 мин</SelectItem>
                      <SelectItem value="45 мин">45 мин</SelectItem>
                      <SelectItem value="60 мин">60 мин</SelectItem>
                      <SelectItem value="90 мин">90 мин</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full gap-2 rounded-xl" onClick={() => handleAddTask()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Тізімге қосу
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Active Plan List */}
          <div className="md:col-span-8 space-y-6">
            <Card className="border-none shadow-sm h-fit bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-xl font-headline">
                    {selectedDate ? format(selectedDate, 'EEEE', { locale: kk }) : "Жоспар"}
                  </CardTitle>
                  <CardDescription>
                    {activePlan ? `Орындалуы: ${activePlan.completedCount} / ${activePlan.totalCount}` : "Әзірге жоспар бос"}
                  </CardDescription>
                </div>
                {activePlan && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
                    <Zap className="size-3 mr-1.5" />
                    +20 Ұпай (100% үшін)
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {activeTasks.length > 0 ? (
                  <div className="space-y-3">
                    {activeTasks.map((task: any) => (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-5 rounded-2xl border-2 border-border/50 bg-white hover:border-primary/30 transition-all group/item shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className="size-7 rounded-lg border-2 border-muted-foreground/20 flex items-center justify-center transition-all hover:border-primary hover:bg-primary/5"
                          >
                            <CheckCircle2 className="size-5 text-transparent group-hover/item:text-primary/20" />
                          </button>
                          <div>
                            <h4 className="text-base font-bold text-foreground">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-1.5">
                              <Badge variant="secondary" className="bg-accent/50 text-accent-foreground text-[10px] font-black uppercase">
                                {task.subject}
                              </Badge>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <Clock className="size-3.5" /> {task.time}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest text-[9px]">
                                {task.type === 'theory' ? <BookOpen className="size-3.5" /> : <ClipboardList className="size-3.5" />}
                                {task.type === 'theory' ? 'Теория' : task.type === 'test' ? 'Тест' : 'Талдау'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activePlan && completedTasks.length < activePlan.totalCount ? (
                  <div className="text-center py-16 flex flex-col items-center gap-4 bg-muted/5 rounded-[32px] border-2 border-dashed border-muted-foreground/10">
                    <CalendarCheck className="size-16 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground font-medium">Орындалатын тапсырмалар қалмады!</p>
                  </div>
                ) : !activePlan ? (
                  <div className="text-center py-24 flex flex-col items-center gap-6 bg-muted/5 rounded-[32px] border-2 border-dashed border-muted-foreground/10">
                    <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center">
                      <CalendarIcon className="size-10 text-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-black text-xl">Күнделік бос</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        AI Куратордан көмек алыңыз немесе бүгінгі мақсаттарды қолмен енгізіңіз.
                      </p>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsAiDialogOpen(true)}>
                      AI көмегін алу
                    </Button>
                  </div>
                ) : null}

                {completedTasks.length > 0 && (
                  <Collapsible open={showArchive} onOpenChange={setShowArchive} className="mt-8 border-t pt-6">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full flex justify-between items-center text-muted-foreground hover:text-foreground font-bold group">
                        <div className="flex items-center gap-2">
                          <Trash2 className="size-4 text-muted-foreground/50 group-hover:text-destructive transition-colors" />
                          <span className="text-xs uppercase tracking-[0.2em]">Орындалғандар</span>
                          <Badge variant="secondary" className="text-[10px] h-5 min-w-5">{completedTasks.length}</Badge>
                        </div>
                        {showArchive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-6">
                      {completedTasks.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between p-4 rounded-2xl border bg-accent/5 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleTaskStatus(task.id, task.status)}
                              className="size-6 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm"
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                            <div>
                              <h4 className="text-sm font-bold line-through text-muted-foreground">
                                {task.title}
                              </h4>
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{task.subject}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
