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
  Circle
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, updateDoc, doc, serverTimestamp, arrayUnion, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserRating } from "@/lib/rating";
import { generateStudyPlan } from "@/ai/flows/generate-study-plan-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { kk } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPreview, setAiPreview] = useState<any[] | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const [newTask, setNewTask] = useState({
    title: "",
    time: "30 мин",
    type: "theory" as "theory" | "test" | "analysis",
    subject: ""
  });

  const subjects = profile?.selectedSubjects || ["Математика", "Физика", "Тарих"];

  useEffect(() => {
    if (!user) return;

    const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
    const q = query(plansRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPlans(plans);
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: plansRef.path,
        operation: 'list'
      }));
    });

    return () => unsubscribe();
  }, [user]);

  const activePlan = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return allPlans.find(p => p.planDate === dateStr) || null;
  }, [allPlans, selectedDate]);

  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const handleAddTask = async (taskData?: any) => {
    if (!user || !selectedDate) return;
    
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
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      if (activePlan) {
        const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id);
        const currentTasks = activePlan.tasks || [];
        await updateDoc(planRef, {
          tasks: [...currentTasks, taskToSave],
          totalCount: (activePlan.totalCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
      } else {
        const newPlan = {
          studentId: user.uid,
          planDate: dateStr,
          title: `Жоспар - ${format(selectedDate, 'dd.MM.yyyy')}`,
          tasks: [taskToSave],
          status: "active",
          completedCount: 0,
          totalCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
        await addDoc(plansRef, newPlan);
      }

      if (!taskData) {
        setNewTask({ title: "", time: "30 мин", type: "theory", subject: "" });
      }
      toast({ title: "Тапсырма қосылды" });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `studentProfiles/${user.uid}/studyPlans`,
        operation: 'write',
        requestResourceData: taskToSave
      }));
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

      const newTasks = response.dailyPlan.map(p => ({
        id: Math.random().toString(36).substring(7),
        title: p.description,
        time: p.activity.includes('min') ? p.activity.split(' ')[0] + " мин" : "30 мин",
        type: p.activity.toLowerCase().includes('test') ? 'test' : 'theory',
        subject: p.description.split(':')[0]?.trim() || profile.selectedSubjects[0],
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
    if (!aiPreview || !user || !selectedDate) return;
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingPlan = allPlans.find(p => p.planDate === dateStr);

      if (existingPlan) {
        const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", existingPlan.id);
        const currentTasks = existingPlan.tasks || [];
        await updateDoc(planRef, {
          tasks: [...currentTasks, ...aiPreview],
          totalCount: (existingPlan.totalCount || 0) + aiPreview.length,
          updatedAt: serverTimestamp()
        });
      } else {
        const newPlan = {
          studentId: user.uid,
          planDate: dateStr,
          title: `Жоспар - ${format(selectedDate, 'dd.MM.yyyy')}`,
          tasks: aiPreview,
          status: "active",
          completedCount: 0,
          totalCount: aiPreview.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const plansRef = collection(db, "studentProfiles", user.uid, "studyPlans");
        await addDoc(plansRef, newPlan);
      }

      setAiPreview(null);
      setIsAiDialogOpen(false);
      toast({ title: "AI жоспары қосылды!", description: "Сәттілік! 🚀" });
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
      await updateDoc(planRef, {
        tasks: updatedTasks,
        completedCount,
        updatedAt: serverTimestamp()
      });

      if (completedCount === activePlan.totalCount && currentStatus !== "completed") {
        updateUserRating(user.uid, 'PLAN_COMPLETED');
        toast({ title: "Жоспар толық орындалды!", description: "+20 рейтинг ұпайы қосылды! 🔥" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!activePlan || !user) return;
    if (!confirm("Бұл тапсырманы өшіргіңіз келе ме?")) return;

    const updatedTasks = activePlan.tasks.filter((t: any) => t.id !== taskId);
    const completedCount = updatedTasks.filter((t: any) => t.status === "completed").length;

    try {
      const planRef = doc(db, "studentProfiles", user.uid, "studyPlans", activePlan.id);
      await updateDoc(planRef, {
        tasks: updatedTasks,
        totalCount: updatedTasks.length,
        completedCount,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Тапсырма өшірілді" });
    } catch (error) {
      console.error(error);
    }
  };

  const activeTasks = activePlan?.tasks?.filter((t: any) => t.status !== "completed") || [];
  const completedTasks = activePlan?.tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="size-8" />
              </div>
              Оқу жоспары
            </h1>
            <p className="text-muted-foreground font-medium">
              {selectedDate ? format(selectedDate, 'd MMMM, yyyy', { locale: kk }) : "Күнді таңдаңыз"}
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

            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold">
                  <Sparkles className="size-4" />
                  AI Көмекші
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                    <Wand2 className="size-6 text-primary" />
                    Жеке оқу стратегиясы
                  </DialogTitle>
                  <DialogDescription>
                    Профиліңізді талдау арқылы құрастырылған оңтайлы кесте.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 min-h-[200px] flex flex-col items-center justify-center">
                  {isAiGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="size-12 animate-spin text-primary" />
                      <p className="text-sm font-bold animate-pulse text-primary">AI жоспар құруда...</p>
                    </div>
                  ) : aiPreview ? (
                    <div className="w-full space-y-3">
                      {aiPreview.map((task, i) => (
                        <div key={i} className="p-4 rounded-2xl border-2 bg-accent/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{task.title}</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{task.subject}</span>
                          </div>
                          <Badge variant="secondary" className="rounded-lg">{task.time}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-primary">
                        <Sparkles className="size-10" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">
                        AI сіздің әлсіз тұстарыңыз бен ҰБТ мақсатыңызды ескере отырып, ең тиімді оқу кестесін жасап береді.
                      </p>
                      <Button onClick={handleAiGenerate} className="h-12 px-8 rounded-xl font-bold">Жоспарды генерациялау</Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {aiPreview && (
                    <Button className="w-full h-12 gap-2 rounded-xl font-black text-lg shadow-xl" onClick={applyAiPlan} disabled={isLoading}>
                      {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                      Бұл жоспарды қолдану
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="pb-2 border-b bg-accent/5">
                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <CalendarIcon className="size-4 text-primary" />
                  Күнтізбе
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className="rounded-none border-none"
                  locale={kk}
                  modifiers={{
                    hasTasks: (date) => allPlans.some(p => p.planDate === format(date, 'yyyy-MM-dd') && p.tasks?.length > 0)
                  }}
                  modifiersClassNames={{
                    hasTasks: "font-black text-primary underline decoration-2 underline-offset-4"
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-[32px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">Жаңа тапсырма</CardTitle>
                <CardDescription className="font-medium">Мақсатты қолмен енгізу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold">Тақырыбы</Label>
                  <Input 
                    placeholder="М: Логарифмдерді қайталау" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="h-11 rounded-xl bg-accent/5 border-none shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Пән</Label>
                    <Select onValueChange={(v) => setNewTask({...newTask, subject: v})} value={newTask.subject}>
                      <SelectTrigger className="h-11 rounded-xl bg-accent/5 border-none">
                        <SelectValue placeholder="Таңдаңыз" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Түрі</Label>
                    <Select onValueChange={(v: any) => setNewTask({...newTask, type: v})} value={newTask.type}>
                      <SelectTrigger className="h-11 rounded-xl bg-accent/5 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Теория</SelectItem>
                        <SelectItem value="test">Тест</SelectItem>
                        <SelectItem value="analysis">Талдау</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Уақыт</Label>
                  <Select onValueChange={(v) => setNewTask({...newTask, time: v})} value={newTask.time}>
                    <SelectTrigger className="h-11 rounded-xl bg-accent/5 border-none">
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
                <Button className="w-full gap-2 h-12 rounded-xl font-bold shadow-lg" onClick={() => handleAddTask()} disabled={isLoading || !newTask.title || !newTask.subject}>
                  {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                  Тізімге қосу
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {viewMode === "day" && (
              <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden h-fit min-h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b bg-accent/5">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black font-headline">
                      {selectedDate ? format(selectedDate, 'EEEE', { locale: kk }) : "Күнделік"}
                    </CardTitle>
                    <CardDescription className="font-bold text-primary">
                      {activePlan ? `Прогресс: ${activePlan.completedCount} / ${activePlan.totalCount}` : "Жоспар құрылмаған"}
                    </CardDescription>
                  </div>
                  {activePlan && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 px-4 py-1.5 font-black rounded-xl">
                      <Zap className="size-4 mr-2 fill-current" />
                      +20 ҰПАЙ
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {activeTasks.length > 0 ? (
                    <div className="space-y-4">
                      {activeTasks.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between p-6 rounded-[24px] border-2 border-border/50 bg-white hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group/item cursor-default"
                        >
                          <div className="flex items-center gap-5">
                            <button 
                              onClick={() => toggleTaskStatus(task.id, task.status)}
                              className="size-10 rounded-xl border-2 border-primary/20 flex items-center justify-center transition-all hover:bg-primary hover:text-white"
                            >
                              <Circle className="size-6 text-primary/20 group-hover/item:text-primary/40" />
                            </button>
                            <div className="space-y-1">
                              <h4 className="text-lg font-black text-foreground leading-tight">
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border-none">
                                  {task.subject}
                                </Badge>
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                  <Clock className="size-3.5" /> {task.time}
                                </span>
                                <span className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                  {task.type === 'theory' ? <BookOpen className="size-3.5" /> : <ClipboardList className="size-3.5" />}
                                  {task.type === 'theory' ? 'Теория' : task.type === 'test' ? 'Тест' : 'Талдау'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : activePlan && completedTasks.length === activePlan.totalCount && activePlan.totalCount > 0 ? (
                    <div className="text-center py-24 flex flex-col items-center gap-6 bg-green-50/30 rounded-[40px] border-2 border-dashed border-green-200 m-4">
                      <div className="size-24 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
                        <Sparkles className="size-12 text-green-600 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black text-green-800">Керемет жұмыс! 🚀</h4>
                        <p className="text-green-700/70 font-medium max-w-xs mx-auto">
                          Бүгінгі барлық тапсырмаларды аяқтадыңыз. Ертеңгі күнге дайындала беріңіз.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-32 flex flex-col items-center gap-8 bg-muted/5 rounded-[40px] border-4 border-dashed border-white m-4">
                      <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center shadow-inner">
                        <ListTodo className="size-12 text-primary/20" />
                      </div>
                      <div className="space-y-3">
                        <p className="font-black text-2xl">Бұл күнге жоспар жоқ</p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">
                          AI Куратордан көмек алыңыз немесе жаңа тапсырма қосыңыз.
                        </p>
                      </div>
                      <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-2" onClick={() => setIsAiDialogOpen(true)}>
                        AI-мен жоспарлау
                      </Button>
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <Collapsible open={showArchive} onOpenChange={setShowArchive} className="mt-10 border-t-2 border-dashed pt-8">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full flex justify-between items-center text-muted-foreground hover:text-foreground font-black group px-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-green-500" />
                            <span className="text-xs uppercase tracking-[0.2em]">Орындалғандар</span>
                            <Badge variant="secondary" className="rounded-lg h-6 min-w-6 font-black">{completedTasks.length}</Badge>
                          </div>
                          {showArchive ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-6 px-4">
                        {completedTasks.map((task: any) => (
                          <div 
                            key={task.id} 
                            className="flex items-center justify-between p-5 rounded-2xl border bg-accent/5 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => toggleTaskStatus(task.id, task.status)}
                                className="size-8 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-lg"
                              >
                                <CheckCircle2 className="size-5" />
                              </button>
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-bold line-through text-muted-foreground">
                                  {task.title}
                                </h4>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{task.subject}</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full text-destructive hover:bg-destructive/10"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}

            {viewMode === "week" && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {weekDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayPlan = allPlans.find(p => p.planDate === dateStr);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <Card 
                        key={idx} 
                        className={`border-none shadow-md cursor-pointer transition-all hover:scale-[1.01] rounded-3xl overflow-hidden ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${isToday ? 'bg-primary/5' : 'bg-white'}`}
                        onClick={() => {
                          setSelectedDate(day);
                          setViewMode("day");
                        }}
                      >
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className={`size-14 rounded-2xl flex flex-col items-center justify-center shadow-inner ${
                              isToday ? 'bg-primary text-white' : 'bg-accent/10 text-foreground'
                            }`}>
                              <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                {format(day, 'EEE', { locale: kk })}
                              </span>
                              <span className="text-xl font-black">
                                {format(day, 'd')}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-lg">
                                {isToday ? "Бүгін" : format(day, 'd MMMM', { locale: kk })}
                              </h4>
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                {dayPlan && dayPlan.totalCount > 0 ? `${dayPlan.completedCount} / ${dayPlan.totalCount} тапсырма` : "Жоспар жоқ"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {dayPlan && dayPlan.tasks?.length > 0 && (
                              <div className="flex -space-x-2">
                                {dayPlan.tasks.slice(0, 3).map((t: any, i: number) => (
                                  <div key={i} className="size-8 rounded-lg bg-white border-2 border-primary/10 flex items-center justify-center shadow-sm">
                                    {t.type === 'test' ? <ClipboardList className="size-4 text-primary" /> : <BookOpen className="size-4 text-primary" />}
                                  </div>
                                ))}
                                {dayPlan.tasks.length > 3 && (
                                  <div className="size-8 rounded-lg bg-accent flex items-center justify-center text-[10px] font-black border-2 border-white">
                                    +{dayPlan.tasks.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            <Button size="icon" variant="ghost" className="rounded-full">
                              <Plus className="size-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "month" && (
              <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden min-h-[600px] flex flex-col items-center justify-center p-12 text-center gap-8">
                <div className="size-32 rounded-full bg-primary/5 flex items-center justify-center animate-in zoom-in duration-500">
                  <LayoutGrid className="size-16 text-primary/20" />
                </div>
                <div className="space-y-4 max-w-md">
                  <h3 className="text-3xl font-black font-headline">Айлық шолу</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Сол жақтағы күнтізбе арқылы кез келген күнді таңдап, оның жоспарын көре аласыз.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="p-6 rounded-[32px] bg-accent/10 border-2 border-white text-center space-y-1 shadow-inner">
                    <span className="text-3xl font-black text-primary">{allPlans.filter(p => p.tasks?.length > 0).length}</span>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Белсенді күн</p>
                  </div>
                  <div className="p-6 rounded-[32px] bg-accent/10 border-2 border-white text-center space-y-1 shadow-inner">
                    <span className="text-3xl font-black text-primary">
                      {allPlans.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}
                    </span>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Жалпы тапсырма</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
