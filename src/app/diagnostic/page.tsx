"use client";

import { useState, useEffect } from "react";
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
  Award,
  Save,
  Rocket,
  ShieldCheck,
  Star
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const { user, profile } = useAuth();
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

  // Fetch History
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
    {
      id: "prepExperience",
      title: "Бұрын ҰБТ-ға дайындалдың ба?",
      icon: <History className="size-6" />,
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
      icon: <TrendingUp className="size-6" />,
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
      icon: <ShieldCheck className="size-6" />,
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
      icon: <BrainCircuit className="size-6" />,
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
      icon: <Clock className="size-6" />,
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
      icon: <Calendar className="size-6" />,
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
      icon: <Zap className="size-6" />,
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
      icon: <Target className="size-6" />,
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
      
      // Save to Firestore
      if (user) {
        const routeData = {
          ...res,
          responses,
          createdAt: serverTimestamp()
        };
        const routesRef = collection(db, "studentProfiles", user.uid, "startingRoutes");
        await addDoc(routesRef, routeData);

        // Update profile segment
        const userRef = doc(db, "studentProfiles", user.uid);
        await updateDoc(userRef, {
          segment: res.segment,
          updatedAt: serverTimestamp()
        });
      }

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

  const loadFromHistory = (item: any) => {
    setRouteResult(item);
    setStep("result");
  };

  return (
    <AppShell>
      <div className="relative min-h-screen -m-4 md:-m-6 p-4 md:p-6 overflow-x-hidden bg-[#fafafa]">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-[5%] right-[5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>

        <div className="max-w-6xl mx-auto space-y-10 pb-20 relative z-10">
          {step !== "result" && step !== "history" && (
            <div className="flex flex-col gap-6 text-center max-w-3xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-4">
                <div className="size-16 rounded-[28px] bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-primary/30 transform -rotate-6">
                  <Rocket className="size-9" />
                </div>
                <div className="flex flex-col items-start">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase mb-1">
                    INTELLECTUAL DIAGNOSIS
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-slate-900 leading-none">
                    Start Strategy
                  </h1>
                </div>
              </div>
              <p className="text-slate-500 text-xl font-medium leading-relaxed">
                Біз сенің академиялық жағдайыңды талдап, ҰБТ-ға дайындықтың ең тиімді «Roadmap» жоспарын сызып береміз.
              </p>
            </div>
          )}

          {step === "start" && (
            <div className="space-y-16 animate-in fade-in duration-700">
              <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto pt-4">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black font-headline text-slate-900 tracking-tight">Маршрут саған не береді?</h3>
                    <p className="text-slate-500 font-medium">AI диагностика жай ғана тест емес, бұл сенің болашақ грантыңның іргетасы.</p>
                  </div>
                  
                  <div className="space-y-5">
                    {[
                      { icon: Compass, color: "bg-blue-50 text-blue-600", text: "Жеке оқу траекториясы", desc: "Сенің деңгейіңе сай келетін қадамдық нұсқаулық." },
                      { icon: Target, color: "bg-orange-50 text-orange-600", text: "Сегментация және Талдау", desc: "Дайындықтағы басты кедергілерді анықтау." },
                      { icon: Sparkles, color: "bg-purple-50 text-purple-600", text: "AI Стратегиялық жоспар", desc: "Алғашқы аптаға арналған нақты тапсырмалар жинағы." }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-5 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className={`size-14 rounded-2xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                          <item.icon className="size-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg text-slate-800">{item.text}</p>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                      size="lg" 
                      className="h-20 flex-[2] rounded-[28px] bg-primary text-white hover:bg-primary/90 font-black text-xl shadow-2xl shadow-primary/30 gap-4 group" 
                      onClick={() => setStep("survey")}
                    >
                      Диагностиканы бастау
                      <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    {history.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-20 flex-1 rounded-[28px] border-2 font-bold gap-3 hover:bg-slate-50"
                        onClick={() => setStep("history")}
                      >
                        <History className="size-6" />
                        Тарих
                      </Button>
                    )}
                  </div>
                </div>

                <div className="hidden lg:block relative">
                  <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                  <div className="relative z-10 p-4 bg-white rounded-[56px] shadow-2xl border border-white/50 backdrop-blur-xl">
                    <img 
                      src="https://picsum.photos/seed/starting/600/700" 
                      alt="Starting strategy" 
                      className="rounded-[48px] object-cover w-full h-[500px]"
                      data-ai-hint="student success"
                    />
                    <div className="absolute -top-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border flex items-center gap-4 animate-float">
                      <div className="size-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-inner">
                        <Star className="size-8 fill-current" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">AI Insight</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">Жеке оқу траекториясы</p>
                      </div>
                    </div>
                    <div className="absolute -bottom-8 -right-8 bg-primary text-white p-6 rounded-3xl shadow-xl flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="size-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 leading-none">Мақсат</p>
                        <p className="text-lg font-black tracking-tight">Грант иегері атану</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "survey" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-10 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Процесс талдау</span>
                    <span className="text-2xl font-black text-primary font-headline">{currentQuestionIdx + 1} / {questions.length}</span>
                  </div>
                  <Badge className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 rounded-xl font-bold">
                    Question Stage
                  </Badge>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[48px] overflow-hidden bg-white/90 backdrop-blur-2xl border border-white/50">
                <CardHeader className="p-12 pb-8 text-center space-y-4">
                  <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 shadow-inner">
                    {questions[currentQuestionIdx].icon}
                  </div>
                  <CardTitle className="text-3xl font-black font-headline leading-tight tracking-tight text-slate-900">
                    {questions[currentQuestionIdx].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-12 pt-0 pb-12 space-y-4">
                  {questions[currentQuestionIdx].options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(opt.val)}
                      className="w-full text-left p-6 rounded-[28px] border-2 border-slate-100 bg-white hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span className="font-bold text-lg text-slate-600 group-hover:text-primary transition-colors">{opt.label}</span>
                      <div className="size-10 rounded-2xl border-2 border-slate-100 bg-slate-50 group-hover:border-primary group-hover:bg-white flex items-center justify-center transition-all">
                        <div className="size-4 rounded-lg bg-primary scale-0 group-hover:scale-100 transition-transform shadow-lg shadow-primary/20" />
                      </div>
                    </button>
                  ))}
                </CardContent>
                <CardFooter className="px-12 pb-10 flex justify-between border-t border-slate-50 pt-8">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="gap-2 font-bold h-12 rounded-xl text-slate-500 hover:text-slate-900"
                  >
                    <ArrowLeft className="size-4" /> Артқа
                  </Button>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="size-3 text-yellow-500 fill-current" /> Оқу форматын таңдаңыз
                  </p>
                </CardFooter>
              </Card>
            </div>
          )}

          {step === "analyzing" && (
            <div className="max-w-2xl mx-auto py-32 flex flex-col items-center justify-center text-center gap-10 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="size-48 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-32 rounded-full bg-white shadow-2xl flex items-center justify-center relative overflow-hidden">
                    <BrainCircuit className="size-16 text-primary animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 p-3 rounded-2xl shadow-xl animate-bounce">
                  <Sparkles className="size-8 text-white" />
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-black font-headline tracking-tight text-slate-900 leading-tight">Интеллектуалды талдау...</h2>
                <div className="flex flex-col items-center gap-4">
                  <p className="text-primary font-black text-sm uppercase tracking-widest bg-primary/5 px-6 py-2 rounded-full border border-primary/10 animate-pulse">
                    {loadingSteps[loadingStep]}
                  </p>
                  <div className="flex gap-2">
                    {loadingSteps.map((_, i) => (
                      <div key={i} className={`h-2 rounded-full transition-all duration-700 ${i === loadingStep ? 'bg-primary w-10 shadow-lg shadow-primary/20' : 'bg-slate-200 w-2'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-400 font-medium max-w-sm mx-auto pt-6 border-t border-dashed leading-relaxed">
                  Жүйе сіздің барлық жауаптарыңызды ҰБТ спецификациясымен және грант талаптарымен салыстыруда.
                </p>
              </div>
            </div>
          )}

          {step === "history" && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black font-headline text-slate-900">Сақталған стратегиялар</h2>
                  <p className="text-slate-500 font-medium">Бұрын жасалған диагностика нәтижелері.</p>
                </div>
                <Button variant="ghost" onClick={() => setStep("start")} className="gap-2 font-bold h-12 rounded-xl">
                  <ArrowLeft className="size-4" /> Артқа
                </Button>
              </div>
              <div className="grid gap-6">
                {history.map((item) => (
                  <Card 
                    key={item.id} 
                    className="border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer group bg-white rounded-[32px] overflow-hidden border border-slate-50"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex items-center justify-between p-8">
                      <div className="flex items-center gap-8">
                        <div className="size-16 rounded-[22px] bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                          <Award className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-slate-800">{item.segment}</h4>
                          <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {format(item.createdAt?.toDate(), 'd MMMM, yyyy', { locale: kk })}</span>
                            <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {format(item.createdAt?.toDate(), 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold px-4 py-1.5 rounded-xl">View Details</Badge>
                        <div className="size-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all group-hover:translate-x-1">
                          <ArrowRight className="size-6 text-slate-300 group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === "result" && routeResult && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 max-w-5xl mx-auto">
              <div className="text-center space-y-6">
                <div className="inline-flex size-28 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-4 shadow-2xl shadow-emerald-100/50 border-8 border-white">
                  <CheckCircle2 className="size-14" />
                </div>
                <h2 className="text-5xl font-black font-headline tracking-tighter text-slate-900 leading-tight">
                  Старттық маршрутыңыз дайын!
                </h2>
                <div className="max-w-3xl mx-auto p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                  <p className="text-slate-600 text-xl font-medium leading-relaxed italic relative z-10">
                    "{routeResult.analysis}"
                  </p>
                  <Sparkles className="absolute -top-4 -right-4 size-24 text-slate-50 opacity-50" />
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Segment & Format Section */}
                <div className="lg:col-span-5 space-y-8">
                  <Card className="border-none shadow-2xl bg-gradient-to-br from-primary to-indigo-800 text-white rounded-[48px] overflow-hidden flex flex-col relative group">
                    <CardHeader className="p-10 pb-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">DIAGNOSTIC SEGMENT</Badge>
                        <Star className="size-6 text-yellow-300 fill-current" />
                      </div>
                      <CardTitle className="text-4xl font-black font-headline leading-tight flex flex-col gap-2">
                        <span className="text-lg opacity-80 font-bold uppercase tracking-[0.2em]">Сегмент:</span>
                        {routeResult.segment}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 relative z-10 flex-1">
                      <div className="space-y-8">
                        <div className="p-6 rounded-[32px] bg-white/10 backdrop-blur-md border border-white/10 space-y-3">
                          <div className="flex items-center gap-2 text-white/70">
                            <Rocket className="size-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Оқу форматы</span>
                          </div>
                          <p className="text-xl font-bold leading-snug">
                            {routeResult.formatAdvice}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-white/70 px-2">
                            <Target className="size-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Басымдық берілетін пәндер</span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {routeResult.focusSubjects.map((s, i) => (
                              <Badge key={i} className="bg-white text-primary hover:bg-white border-none font-black px-5 py-2.5 rounded-2xl shadow-xl shadow-black/10">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 size-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <Award className="absolute -bottom-10 -right-10 size-56 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                  </Card>
                  
                  <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden p-8 border border-slate-100">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle className="text-xl font-black flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <ShieldCheck className="size-6" />
                        </div>
                        Маман кеңесі
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-600 font-medium leading-relaxed text-sm">
                          «{routeResult.weeklyPlan}»
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Steps Section */}
                <div className="lg:col-span-7">
                  <Card className="border-none shadow-2xl bg-white rounded-[48px] overflow-hidden flex flex-col border border-slate-100 h-full">
                    <CardHeader className="p-10 border-b bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-3xl font-black font-headline flex items-center gap-4 text-slate-900">
                          <div className="size-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                            <ListTodo className="size-8" />
                          </div>
                          Дайындық Roadmap
                        </CardTitle>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 uppercase font-black tracking-[0.2em] text-[10px] px-3 py-1">FIRST 7 DAYS</Badge>
                      </div>
                      <CardDescription className="text-lg font-medium text-slate-500">Алғашқы аптаға арналған нақты қадамдық стратегия.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                      {routeResult.routeSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-6 p-6 rounded-[32px] bg-slate-50/50 border-2 border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className="size-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 font-black text-lg flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                            {i + 1}
                          </div>
                          <div className="space-y-1 pt-1">
                            <p className="text-lg font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors">{step}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Call to Action */}
              <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[56px] overflow-hidden p-12 md:p-16 relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="space-y-6 max-w-2xl text-center md:text-left">
                    <h3 className="text-4xl md:text-5xl font-black font-headline tracking-tight leading-tight">
                      Жоспарды іске асыруға дайынсың ба?
                    </h3>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                      AI құрастырған маршрутты жеке оқу кестеңізге бірден енгізіп, дайындықты бүгін бастаңыз.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    <Button 
                      size="lg" 
                      className="h-24 px-16 rounded-[32px] bg-white text-slate-900 hover:bg-slate-100 font-black text-2xl shadow-2xl shadow-black/20 gap-4 group shrink-0" 
                      asChild
                    >
                      <a href="/plan">
                        Оқуды бастау
                        <ArrowRight className="size-8 group-hover:translate-x-2 transition-transform" />
                      </a>
                    </Button>
                    <p className="text-center text-xs font-black uppercase tracking-widest text-slate-500 opacity-60">+20 РЕЙТИНГ ҰПАЙЫ ҚОСЫЛАДЫ</p>
                  </div>
                </div>
                <Zap className="absolute -bottom-20 -right-20 size-80 text-white/5 rotate-12 pointer-events-none" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
              </Card>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-12">
                <Button variant="outline" className="h-14 rounded-2xl px-10 font-bold border-2 hover:bg-slate-50" onClick={() => setStep("start")}>
                  Жаңа сауалнама бастау
                </Button>
                <Button variant="secondary" className="h-14 rounded-2xl px-10 font-bold bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => setStep("history")}>
                  Тарихты көру
                </Button>
                <Button variant="ghost" className="h-14 rounded-2xl px-10 font-bold text-slate-400 hover:text-slate-900" asChild>
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
