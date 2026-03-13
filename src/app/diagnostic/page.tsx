"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  BrainCircuit, 
  Play, 
  ArrowRight, 
  Target, 
  Loader2, 
  CheckCircle2,
  Zap,
  Sparkles,
  ChevronRight,
  Info,
  History,
  XCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  MapPin,
  ListTodo,
  TrendingUp,
  Award
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { generateStartingRoute, type StartingRouteOutput } from "@/ai/flows/generate-starting-route-flow";

export default function DiagnosticPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"start" | "survey" | "analyzing" | "result">("start");
  const [currentQuestionIdx, setCurrentQuestionIndex] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<StartingRouteOutput | null>(null);
  
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

  const questions = [
    {
      id: "prepExperience",
      title: "Бұрын ҰБТ-ға дайындалдың ба?",
      options: [
        { label: "Жоқ, енді бастаймын", val: "none" },
        { label: "Иә, бірақ жүйесіз", val: "unsystematic" },
        { label: "Иә, біраз дайындалдым", val: "some" },
        { label: "Иә, тұрақты дайындалып жүрмін", val: "regular" }
      ]
    },
    {
      id: "lastScore",
      title: "Соңғы нәтижең (пробный) қандай?",
      options: [
        { label: "Пробный мүлде тапсырмадым", val: "no_test" },
        { label: "50-ден төмен", val: "under_50" },
        { label: "50–70 балл", val: "50_70" },
        { label: "70–90 балл", val: "70_90" },
        { label: "90+ балл", val: "above_90" }
      ]
    },
    {
      id: "hardestSubject",
      title: "Қай пәннен ең қатты қиналасың?",
      options: [
        { label: "Қазақстан тарихы", val: "history" },
        { label: "Оқу сауаттылығы", val: "reading" },
        { label: "Математикалық сауаттылық", val: "math_lit" },
        { label: "1-таңдау пәні", val: "elective_1" },
        { label: "2-таңдау пәні", val: "elective_2" }
      ]
    },
    {
      id: "mainDifficulty",
      title: "Қайсысы саған қиын?",
      options: [
        { label: "Теорияны түсіну", val: "theory" },
        { label: "Есте сақтау (дата, формула)", val: "memory" },
        { label: "Есеп шығару", val: "solving" },
        { label: "Уақытқа үлгеру", val: "timing" },
        { label: "Қатемен жұмыс жасау", val: "mistakes" }
      ]
    },
    {
      id: "dailyTime",
      title: "Күніне қанша уақыт оқи аласың?",
      options: [
        { label: "30 минут", val: "30m" },
        { label: "1 сағат", val: "1h" },
        { label: "2 сағат", val: "2h" },
        { label: "3+ сағат", val: "3h_plus" }
      ]
    },
    {
      id: "timeLeft",
      title: "ҰБТ-ға дейін қанша уақыт бар?",
      options: [
        { label: "1 айдан аз", val: "under_1m" },
        { label: "1–3 ай", val: "1_3m" },
        { label: "3–6 ай", val: "3_6m" },
        { label: "6 айдан көп", val: "above_6m" }
      ]
    },
    {
      id: "preferredFormat",
      title: "Қалай оқыған ыңғайлы?",
      options: [
        { label: "Қысқа теория", val: "short_theory" },
        { label: "Тестпен", val: "testing" },
        { label: "Қате талдаумен", val: "mistake_analysis" },
        { label: "Аралас формат", val: "mixed" }
      ]
    },
    {
      id: "goal",
      title: "Қай нәтиже сенің мақсатың?",
      options: [
        { label: "Өту баллы жеткілікті", val: "pass" },
        { label: "Орташа балл", val: "average" },
        { label: "Жоғары балл (120+)", val: "high" },
        { label: "Грантқа түсу", val: "grant" }
      ]
    }
  ];

  const handleAnswer = (val: string) => {
    const qId = questions[currentQuestionIdx].id;
    const nextResponses = { ...responses, [qId]: val };
    setAnswers(nextResponses);
    
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      processResults(nextResponses);
    }
  };

  const processResults = async (surveyResponses: typeof responses = responses) => {
    setStep("analyzing");
    setIsAiLoading(true);
    try {
      const res = await generateStartingRoute(surveyResponses);
      setRouteResult(res);
      setStep("result");
    } catch (error: any) {
      toast({ 
        title: "Қате", 
        description: "Маршрутты құру мүмкін болмады. Қайта көріңіз.", 
        variant: "destructive" 
      });
      setStep("survey");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="relative min-h-screen overflow-hidden -m-4 md:-m-6 p-4 md:p-6">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-grid-slate-200/[0.03]" />
        </div>

        <div className="max-w-5xl mx-auto space-y-10 pb-20 relative z-10">
          {step !== "result" && (
            <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <div className="size-14 rounded-[22px] bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-primary/40">
                  <Compass className="size-8" />
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase">
                  AI START STRATEGY
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary leading-tight">
                ҰБТ-ға дайындықты қалай бастау керек?
              </h1>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                Біз сенің біліміңді емес, жағдайыңды талдап, ең тиімді оқу жолын тауып береміз.
              </p>
            </div>
          )}

          {step === "start" && (
            <div className="grid lg:grid-cols-2 gap-8 items-center max-w-4xl mx-auto pt-10">
              <div className="space-y-6">
                <h3 className="text-2xl font-black font-headline">Бұл сауалнама саған не береді?</h3>
                <div className="space-y-4">
                  {[
                    { icon: MapPin, text: "Нақты старттық маршрут", desc: "Дайындықты неден бастау керек екенін білесің." },
                    { icon: Target, text: "Сегментация", desc: "Өз деңгейіңе сай оқу қарқынын анықтайсың." },
                    { icon: Sparkles, text: "AI стратегия", desc: "Алғашқы 7 күнге арналған нақты жоспар." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  size="lg" 
                  className="h-16 w-full rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20 gap-3" 
                  onClick={() => setStep("survey")}
                >
                  Бастау
                  <ArrowRight className="size-5" />
                </Button>
              </div>
              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
                <img 
                  src="https://picsum.photos/seed/starting/600/600" 
                  alt="Starting strategy" 
                  className="rounded-[40px] shadow-2xl relative z-10 border-8 border-white"
                  data-ai-hint="education student"
                />
              </div>
            </div>
          )}

          {step === "survey" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Прогресс</span>
                  <span className="text-sm font-black text-primary">{currentQuestionIdx + 1} / {questions.length}</span>
                </div>
                <Progress value={((currentQuestionIdx + 1) / questions.length) * 100} className="h-2 rounded-full" />
              </div>

              <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40">
                <CardHeader className="p-10 pb-6 text-center">
                  <CardTitle className="text-3xl font-black font-headline leading-tight">
                    {questions[currentQuestionIdx].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-4">
                  {questions[currentQuestionIdx].options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(opt.val)}
                      className="w-full text-left p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span className="font-bold text-lg text-slate-700 group-hover:text-primary transition-colors">{opt.label}</span>
                      <div className="size-8 rounded-full border-2 border-slate-200 group-hover:border-primary flex items-center justify-center transition-colors">
                        <div className="size-3 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                      </div>
                    </button>
                  ))}
                </CardContent>
                <CardFooter className="px-10 pb-10 flex justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="gap-2 font-bold"
                  >
                    <ArrowLeft className="size-4" /> Артқа
                  </Button>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Zap className="size-3 text-primary" /> Жалғастыру үшін таңдаңыз
                  </p>
                </CardFooter>
              </Card>
            </div>
          )}

          {step === "analyzing" && (
            <div className="max-w-2xl mx-auto py-32 flex flex-col items-center justify-center text-center gap-8">
              <div className="relative">
                <div className="size-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BrainCircuit className="size-12 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black font-headline animate-pulse">AI Маршрутты құруда...</h2>
                <p className="text-muted-foreground font-medium max-w-sm">Жауаптарыңды саралап, саған ең тиімді оқу стратегиясын дайындап жатырмыз.</p>
              </div>
            </div>
          )}

          {step === "result" && routeResult && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-4xl mx-auto">
              <div className="text-center space-y-6">
                <div className="inline-flex size-24 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-4 shadow-xl shadow-emerald-100/50">
                  <CheckCircle2 className="size-12" />
                </div>
                <h2 className="text-5xl font-black font-headline tracking-tighter text-slate-900 leading-tight">
                  Старттық маршрутыңыз дайын!
                </h2>
                <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                  {routeResult.analysis}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl bg-primary text-white rounded-[40px] overflow-hidden flex flex-col relative group">
                  <CardHeader className="p-10 relative z-10">
                    <Badge className="bg-white/20 text-white border-none backdrop-blur-md font-black uppercase tracking-widest text-[9px] mb-4 w-fit">Сенің сегментің</Badge>
                    <CardTitle className="text-4xl font-black font-headline leading-tight flex items-center gap-4">
                      <Award className="size-10 text-yellow-300" />
                      {routeResult.segment}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 relative z-10 flex-1">
                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-3">Тиімді оқу форматы</p>
                        <p className="text-lg font-bold leading-relaxed">
                          {routeResult.formatAdvice}
                        </p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-3">Бірінші кезектегі пәндер</p>
                        <div className="flex flex-wrap gap-2">
                          {routeResult.focusSubjects.map((s, i) => (
                            <Badge key={i} className="bg-white text-primary hover:bg-white border-none font-bold px-4 py-1.5 rounded-xl">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden flex flex-col border border-slate-100">
                  <CardHeader className="p-10 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <ListTodo className="size-6" />
                        </div>
                        Бастау стратегиясы
                      </CardTitle>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 uppercase font-black tracking-widest text-[9px]">STEP-BY-STEP</Badge>
                    </div>
                    <CardDescription className="text-base font-medium">Алғашқы 7 күндегі сенің нақты қадамдарың.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-5">
                    {routeResult.routeSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all group">
                        <div className="size-8 rounded-lg bg-white border-2 border-slate-200 text-slate-400 font-black text-xs flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                          {i + 1}
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[40px] overflow-hidden p-10 relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-3xl font-black font-headline">Апталық стратегиялық кеңес</h3>
                    <p className="text-lg text-indigo-100/80 font-medium leading-relaxed italic">
                      "{routeResult.weeklyPlan}"
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="h-20 px-12 rounded-3xl bg-white text-primary hover:bg-white/90 font-black text-xl shadow-2xl shadow-black/20 gap-3 shrink-0" 
                    asChild
                  >
                    <a href="/plan">
                      Кестені белсендіру
                      <ArrowRight className="size-6" />
                    </a>
                  </Button>
                </div>
                <Zap className="absolute -bottom-10 -right-10 size-64 text-white/5 rotate-12 pointer-events-none" />
              </Card>

              <div className="flex justify-center gap-4 pt-10">
                <Button variant="outline" className="h-12 rounded-xl px-8 font-bold border-2" onClick={() => setStep("start")}>
                  Сауалнамадан қайта өту
                </Button>
                <Button variant="ghost" className="h-12 rounded-xl px-8 font-bold text-muted-foreground" asChild>
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
