"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  BrainCircuit, 
  ArrowRight, 
  Target, 
  CheckCircle2,
  Zap,
  Sparkles,
  History,
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  MapPin,
  ListTodo,
  TrendingUp,
  Award,
  Rocket,
  ShieldCheck,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { generateStartingRoute, type StartingRouteOutput } from "@/ai/flows/generate-starting-route-flow";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { errorEmitter, FirestorePermissionError } from "@/firebase";
import { format } from "date-fns";
import { kk } from "date-fns/locale";

export default function DiagnosticPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"start" | "survey" | "analyzing" | "result" | "history">("start");
  const [currentQuestionIdx, setCurrentQuestionIndex] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [routeResult, setRouteResult] = useState<StartingRouteOutput | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [responses, setAnswers] = useState({
    prepExperience: "",
    lastScore: "",
    hardestSubject: "",
    mainDifficulty: "",
    dailyTime: "",
    timeLeft: "",
    preferredFormat: "",
    goal: ""
  });

  const loadingSteps = [
    "Жауаптарыңызды сараптауда...",
    "Оқушы сегментін анықтауда...",
    "Тиімді пәндер тізімін құруда...",
    "Апталық стратегияны дайындауда...",
    "Жеке старттық маршрут сызылуда..."
  ];

  useEffect(() => {
    if (isAiLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isAiLoading]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "studentProfiles", user.uid, "startingRoutes"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const questions = [
    { id: "prepExperience", title: "Бұрын ҰБТ-ға дайындалдың ба?", icon: <History className="size-6" />, options: [{ label: "Жоқ, енді бастаймын", val: "none" }, { label: "Иә, бірақ жүйесіз", val: "unsystematic" }, { label: "Иә, біраз дайындалдым", val: "some" }, { label: "Иә, тұрақты дайындалып жүрмін", val: "regular" }] },
    { id: "lastScore", title: "Соңғы нәтижең (пробный) қандай?", icon: <TrendingUp className="size-6" />, options: [{ label: "Пробный мүлде тапсырмадым", val: "no_test" }, { label: "50-ден төмен", val: "under_50" }, { label: "50–70 балл", val: "50_70" }, { label: "70–90 балл", val: "70_90" }, { label: "90+ балл", val: "above_90" }] },
    { id: "hardestSubject", title: "Қай пәннен ең қатты қиналасың?", icon: <ShieldCheck className="size-6" />, options: [{ label: "Қазақстан тарихы", val: "history" }, { label: "Оқу сауаттылығы", val: "reading" }, { label: "Математикалық сауаттылық", val: "math_lit" }, { label: "1-таңдау пәні", val: "elective_1" }, { label: "2-таңдау пәні", val: "elective_2" }] },
    { id: "mainDifficulty", title: "Қайсысы саған қиын?", icon: <BrainCircuit className="size-6" />, options: [{ label: "Теорияны түсіну", val: "theory" }, { label: "Есте сақтау (дата, формула)", val: "memory" }, { label: "Есеп шығару", val: "solving" }, { label: "Уақытқа үлгеру", val: "timing" }, { label: "Қатемен жұмыс жасау", val: "mistakes" }] },
    { id: "dailyTime", title: "Күніне қанша уақыт оқи аласың?", icon: <Clock className="size-6" />, options: [{ label: "30 минут", val: "30m" }, { label: "1 сағат", val: "1h" }, { label: "2 сағат", val: "2h" }, { label: "3+ сағат", val: "3h_plus" }] },
    { id: "timeLeft", title: "ҰБТ-ға дейін қанша уақыт бар?", icon: <Calendar className="size-6" />, options: [{ label: "1 айдан аз", val: "under_1m" }, { label: "1–3 ай", val: "1_3m" }, { label: "3–6 ай", val: "3_6m" }, { label: "6 айдан көп", val: "above_6m" }] },
    { id: "preferredFormat", title: "Қалай оқыған ыңғайлы?", icon: <Zap className="size-6" />, options: [{ label: "Қысқа теория", val: "short_theory" }, { label: "Тестпен", val: "testing" }, { label: "Қате талдаумен", val: "mistake_analysis" }, { label: "Аралас формат", val: "mixed" }] },
    { id: "goal", title: "Қай нәтиже сенің мақсатың?", icon: <Target className="size-6" />, options: [{ label: "Өту баллы жеткілікті", val: "pass" }, { label: "Орташа балл", val: "average" }, { label: "Жоғары балл (120+)", val: "high" }, { label: "Грантқа түсу", val: "grant" }] }
  ];

  const handleAnswer = (val: string) => {
    const qId = questions[currentQuestionIdx].id;
    setAnswers({ ...responses, [qId]: val });
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      processResults();
    }
  };

  const processResults = async () => {
    setStep("analyzing");
    setIsAiLoading(true);
    try {
      const res = await generateStartingRoute(responses);
      setRouteResult(res);
      if (user) {
        const routeData = { ...res, responses, createdAt: serverTimestamp() };
        const routesRef = collection(db, "studentProfiles", user.uid, "startingRoutes");
        addDoc(routesRef, routeData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: routesRef.path, operation: 'create', requestResourceData: routeData }));
        });
        const userRef = doc(db, "studentProfiles", user.uid);
        updateDoc(userRef, { segment: res.segment, updatedAt: serverTimestamp() }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { segment: res.segment } }));
        });
      }
      setStep("result");
    } catch (error: any) {
      toast({ title: "Қате", description: "Маршрутты құру мүмкін болмады.", variant: "destructive" });
      setStep("survey");
    } finally {
      setIsAiLoading(false);
    }
  };

  const loadFromHistory = (item: any) => {
    setRouteResult(item);
    setStep("result");
  };

  return (
    <AppShell>
      <div className="relative min-h-screen -m-4 md:-m-6 p-4 md:p-6 overflow-x-hidden bg-[#fafafa]">
        <div className="max-w-6xl mx-auto space-y-10 pb-20 relative z-10">
          {step === "start" && (
            <div className="space-y-16 animate-in fade-in duration-700">
              <div className="flex flex-col gap-6 text-center max-w-3xl mx-auto mb-12">
                <div className="flex items-center justify-center gap-4">
                  <div className="size-16 rounded-[28px] bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Rocket className="size-9" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-slate-900 leading-none">Start Strategy</h1>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-20 px-12 rounded-[28px] bg-primary text-white font-black text-xl shadow-xl gap-4" onClick={() => setStep("survey")}>
                  Диагностиканы бастау <ArrowRight className="size-6" />
                </Button>
                {history.length > 0 && (
                  <Button variant="outline" size="lg" className="h-20 px-8 rounded-[28px] border-2 font-bold gap-3" onClick={() => setStep("history")}>
                    <History className="size-6" /> Тарих
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === "survey" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-10 space-y-6 text-center">
                <span className="text-2xl font-black text-primary font-headline">{currentQuestionIdx + 1} / {questions.length}</span>
                <Card className="p-12 rounded-[48px] shadow-2xl bg-white">
                  <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                    {questions[currentQuestionIdx].icon}
                  </div>
                  <CardTitle className="text-3xl font-black mb-10">{questions[currentQuestionIdx].title}</CardTitle>
                  <div className="space-y-4">
                    {questions[currentQuestionIdx].options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(opt.val)} className="w-full text-left p-6 rounded-[28px] border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all font-bold text-lg text-slate-600">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {step === "analyzing" && (
            <div className="max-w-2xl mx-auto py-32 flex flex-col items-center justify-center text-center gap-10">
              <div className="size-48 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                <BrainCircuit className="size-16 text-primary" />
              </div>
              <h2 className="text-4xl font-black font-headline tracking-tight text-slate-900 leading-tight">Интеллектуалды талдау...</h2>
              <p className="text-primary font-black text-sm uppercase tracking-widest bg-primary/5 px-6 py-2 rounded-full border border-primary/10">
                {loadingSteps[loadingStep]}
              </p>
            </div>
          )}

          {step === "result" && routeResult && (
            <div className="space-y-12 animate-in fade-in duration-1000 max-w-5xl mx-auto">
              <div className="text-center space-y-6">
                <div className="inline-flex size-28 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-4">
                  <CheckCircle2 className="size-14" />
                </div>
                <h2 className="text-5xl font-black font-headline tracking-tighter text-slate-900 leading-tight">Старттық маршрутыңыз дайын!</h2>
                <div className="p-8 rounded-[40px] bg-white shadow-sm"><p className="text-slate-600 text-xl font-medium italic">"{routeResult.analysis}"</p></div>
              </div>
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-8">
                  <Card className="bg-gradient-to-br from-primary to-indigo-800 text-white rounded-[48px] p-10">
                    <CardTitle className="text-4xl font-black mb-6">Сегмент: {routeResult.segment}</CardTitle>
                    <p className="text-xl font-bold">{routeResult.formatAdvice}</p>
                  </Card>
                </div>
                <div className="lg:col-span-7">
                  <Card className="rounded-[48px] p-10 bg-white shadow-2xl">
                    <CardTitle className="text-3xl font-black mb-6">Дайындық Roadmap</CardTitle>
                    {routeResult.routeSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-6 p-6 rounded-[32px] hover:bg-slate-50 transition-all border-b">
                        <div className="size-12 rounded-2xl bg-primary text-white font-black text-lg flex items-center justify-center shrink-0">{i + 1}</div>
                        <p className="text-lg font-bold text-slate-800">{step}</p>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>
              <div className="flex justify-center gap-6 pt-12">
                <Button variant="outline" className="h-14 rounded-2xl px-10 font-bold border-2" onClick={() => setStep("start")}>Жаңа сауалнама</Button>
                <Button variant="secondary" className="h-14 rounded-2xl px-10 font-bold bg-slate-100 text-slate-600" onClick={() => setStep("history")}>Тарихты көру</Button>
                <Button variant="ghost" className="h-14 rounded-2xl px-10 font-bold text-slate-400" asChild>
                  <a href="/dashboard">Дашбордқа қайту</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
