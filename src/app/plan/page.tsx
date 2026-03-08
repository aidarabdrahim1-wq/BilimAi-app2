
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
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserRating } from "@/lib/rating";
import { generateStudyPlan } from "@/ai/flows/generate-study-plan-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function PlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPreview, setAiPreview] = useState<any[] | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    time: "30 мин",
    type: "theory",
    subject: ""
  });

  const subjects = profile?.selectedSubjects || ["Математика", "Физика", "Тарих"];

  useEffect(() => {
    if (!user) return;
    fetchActivePlan();
  }, [user]);

  const fetchActivePlan = async () => {
    // Updated to match firestore.rules: /studentProfiles/{studentId}/studyPlans
    const plansRef = collection(db, "studentProfiles", user?.uid!, "studyPlans");
    const q = query(
      plansRef,
      where("status", "==", "active")
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
        // Updated to match firestore.rules: /studentProfiles/{studentId}/studyPlans/{planId}
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
          title: `Бүгінгі жоспар - ${new Date().toLocaleDateString()}`,
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
      setTimeout(fetchActivePlan, 1000);
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

      setTimeout(fetchActivePlan, 500);
    } catch (error) {
      toast({ title: "Қате", variant: "destructive" });
    }
  };

  const activeTasks = activePlan?.tasks?.filter((t: any) => t.status !== "completed") || [];
  const completedTasks = activePlan?.tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <CalendarCheck className="size-8 text-primary" />
              Жеке оқу жоспары
            </h1>
            <p className="text-muted-foreground text-sm">Бүгінгі күніңізге мақсаттар қойып, орындалуын қадағалаңыз.</p>
          </div>

          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 animate-pulse hover:animate-none">
                <Sparkles className="size-4" />
                AI-мен жоспар құру
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="size-5 text-primary" />
                  AI Куратор ұсынысы
                </DialogTitle>
                <DialogDescription>
                  Сіздің әлсіз тақырыптарыңыз бен мақсатты балыңызға негізделген жеке жоспар.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 min-h-[200px] flex flex-col items-center justify-center">
                {isAiGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">AI профиліңізді талдауда...</p>
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
                      Куратор сізге бүгінге арналған ең тиімді оқу кестесін жасап береді.
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

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Жаңа тапсырма</CardTitle>
              <CardDescription>Қолмен тапсырма қосу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Тақырыбы</Label>
                <Input 
                  placeholder="М: Логарифм теориясы" 
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
            <CardFooter>
              <Button className="w-full gap-2" onClick={() => handleAddTask()} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Қосу
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-2 border-none shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Белсенді тізім</CardTitle>
                <CardDescription>
                  {activePlan ? `Прогресс: ${activePlan.completedCount} / ${activePlan.totalCount}` : "Тізім бос"}
                </CardDescription>
              </div>
              {activePlan && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  <Zap className="size-3 mr-1" />
                  +20 Ұпай (100%)
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTasks.length > 0 ? (
                <div className="space-y-3">
                  {activeTasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => toggleTaskStatus(task.id, task.status)}
                          className="size-6 rounded-md border border-muted-foreground/30 flex items-center justify-center transition-colors hover:border-primary"
                        >
                          <CheckCircle2 className="size-4 text-transparent hover:text-primary/30" />
                        </button>
                        <div>
                          <h4 className="text-sm font-semibold">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] bg-accent/20 px-2 py-0.5 rounded text-accent-foreground font-bold uppercase tracking-wider">
                              {task.subject}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="size-3" /> {task.time}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {task.type === 'theory' ? <BookOpen className="size-3" /> : <ClipboardList className="size-3" />}
                              {task.type === 'theory' ? 'Теория' : task.type === 'test' ? 'Тест' : 'Талдау'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activePlan && completedTasks.length < activePlan.totalCount ? (
                <div className="text-center py-10 flex flex-col items-center gap-4 bg-muted/10 rounded-2xl border border-dashed">
                  <CalendarCheck className="size-10 text-muted-foreground opacity-20" />
                  <p className="text-xs text-muted-foreground">Барлық тапсырмалар орындалды!</p>
                </div>
              ) : !activePlan ? (
                <div className="text-center py-20 flex flex-col items-center gap-4 bg-muted/10 rounded-2xl border border-dashed">
                  <CalendarCheck className="size-12 text-muted-foreground opacity-20" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Тізім әлі бос</p>
                    <p className="text-xs text-muted-foreground">AI-дан көмек алыңыз немесе қолмен қосыңыз.</p>
                  </div>
                </div>
              ) : null}

              {completedTasks.length > 0 && (
                <Collapsible open={showArchive} onOpenChange={setShowArchive} className="mt-6 border-t pt-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full flex justify-between items-center text-muted-foreground hover:text-foreground">
                      <div className="flex items-center gap-2">
                        <Trash2 className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Мұрағат (Орындалғандар)</span>
                        <Badge variant="secondary" className="text-[10px]">{completedTasks.length}</Badge>
                      </div>
                      {showArchive ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-4">
                    {completedTasks.map((task: any) => (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-3 rounded-xl border bg-accent/5 opacity-60 grayscale-[0.5]"
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className="size-5 rounded-md bg-green-500 flex items-center justify-center text-white"
                          >
                            <CheckCircle2 className="size-3" />
                          </button>
                          <div>
                            <h4 className="text-xs font-medium line-through text-muted-foreground">
                              {task.title}
                            </h4>
                            <span className="text-[9px] text-muted-foreground uppercase">{task.subject}</span>
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
    </AppShell>
  );
}
