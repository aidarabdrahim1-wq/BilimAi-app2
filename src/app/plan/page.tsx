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
  Trash2, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ClipboardList, 
  Zap,
  Save,
  Loader2
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserRating } from "@/lib/rating";

export default function PlanPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
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
    const q = query(
      collection(db, "study_plans"),
      where("userId", "==", user?.uid),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setActivePlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } else {
      setActivePlan(null);
    }
  };

  const handleAddTask = async () => {
    if (!user || !newTask.title.trim() || !newTask.subject) {
      toast({
        title: "Мәліметтер толық емес",
        description: "Тақырып пен пәнді таңдаңыз.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const taskObj = {
        id: Math.random().toString(36).substring(7),
        title: newTask.title,
        time: newTask.time,
        type: newTask.type,
        subject: newTask.subject,
        status: "pending"
      };

      if (activePlan) {
        const planRef = doc(db, "study_plans", activePlan.id);
        await updateDoc(planRef, {
          tasks: arrayUnion(taskObj),
          totalCount: (activePlan.totalCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
      } else {
        const newPlan = {
          userId: user.uid,
          title: `Бүгінгі жоспар - ${new Date().toLocaleDateString()}`,
          tasks: [taskObj],
          status: "active",
          completedCount: 0,
          totalCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, "study_plans"), newPlan);
      }

      setNewTask({ title: "", time: "30 мин", type: "theory", subject: "" });
      toast({ title: "Тапсырма қосылды!" });
      fetchActivePlan();
    } catch (error) {
      toast({ title: "Қате", description: "Сақтау мүмкін болмады.", variant: "destructive" });
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
      const planRef = doc(db, "study_plans", activePlan.id);
      await updateDoc(planRef, {
        tasks: updatedTasks,
        completedCount,
        updatedAt: serverTimestamp()
      });

      // Егер барлығы орындалса рейтинг қосу
      if (completedCount === activePlan.totalCount && currentStatus !== "completed") {
        await updateUserRating(user.uid, 'PLAN_COMPLETED');
        toast({ title: "Жоспар толық орындалды!", description: "+20 рейтинг ұпайы қосылды! 🔥" });
      }

      fetchActivePlan();
    } catch (error) {
      toast({ title: "Қате", variant: "destructive" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <CalendarCheck className="size-8 text-primary" />
            Жеке оқу жоспары
          </h1>
          <p className="text-muted-foreground">Бүгінгі күніңізге мақсаттар қойып, орындалуын қадағалаңыз.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Add Task Form */}
          <Card className="md:col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Жаңа тапсырма</CardTitle>
              <CardDescription>Бүгін не істегіңіз келеді?</CardDescription>
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
                <Select onValueChange={(v) => setNewTask({...newTask, subject: v})}>
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
                <Select onValueChange={(v) => setNewTask({...newTask, type: v})} defaultValue="theory">
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
                <Select onValueChange={(v) => setNewTask({...newTask, time: v})} defaultValue="30 мин">
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
              <Button className="w-full gap-2" onClick={handleAddTask} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Қосу
              </Button>
            </CardFooter>
          </Card>

          {/* Current Plan List */}
          <Card className="md:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Бүгінгі тізім</CardTitle>
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
              {activePlan && activePlan.tasks && activePlan.tasks.length > 0 ? (
                activePlan.tasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      task.status === 'completed' ? 'bg-green-50/50 border-green-100 opacity-80' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                        className={`size-6 rounded-md border flex items-center justify-center transition-colors ${
                          task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30 hover:border-primary'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="size-4" />}
                      </button>
                      <div>
                        <h4 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
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
                ))
              ) : (
                <div className="text-center py-20 flex flex-col items-center gap-4 bg-muted/10 rounded-2xl border border-dashed">
                  <CalendarCheck className="size-12 text-muted-foreground opacity-20" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Тізім әлі бос</p>
                    <p className="text-xs text-muted-foreground">Сол жақтағы форманы толтырып, мақсат қойыңыз.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
