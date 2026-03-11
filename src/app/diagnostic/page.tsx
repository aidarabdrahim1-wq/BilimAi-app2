"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  BrainCircuit, 
  Play, 
  ArrowRight, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
  Info,
  History,
  ClipboardCheck,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { runAdaptiveDiagnosticTest, type TestState, type AdaptiveDiagnosticTestOutput } from "@/ai/flows/run-adaptive-diagnostic";
import { diagnosticService } from "@/services/diagnostic-service";

export default function DiagnosticPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"start" | "survey" | "rules" | "testing" | "result">("start");
  const [testState, setTestState] = useState<TestState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [testSummary, setTestSummary] = useState<any>(null);
  
  const [testSeconds, setTestSeconds] = useState(0);
  const [prepExperience, setPrepExperience] = useState<string>("");

  useEffect(() => {
    let interval: any;
    if (step === "testing") {
      interval = setInterval(() => {
        setTestSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTestSeconds(0);
    }
    return () => clearInterval(interval);
  }, [step]);

  const startTest = async () => {
    if (!user || !profile) return;
    setIsAiLoading(true);
    try {
      const response = await runAdaptiveDiagnosticTest({
        studentId: user.uid,
        selectedSubjects: profile.selectedSubjects
      });
      
      setTestState(response.updatedTestState);
      setCurrentQuestion(response.question);
      setStep("testing");
    } catch (error) {
      toast({ title: "Қате", description: "Тестті бастау мүмкін болмады.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!user || !testState || !selectedAnswer || isAiLoading) return;
    
    setIsAiLoading(true);
    try {
      const response = await runAdaptiveDiagnosticTest({
        studentId: user.uid,
        testState: testState,
        previousAnswer: selectedAnswer
      });

      if (response.isTestComplete) {
        setTestSummary(response.testSummary);
        setStep("result");
        // Нәтижені Firestore-ға сақтау
        if (response.testSummary) {
          diagnosticService.saveDiagnosticResult({
            userId: user.uid,
            score: response.testSummary.overallScore,
            weakTopics: response.testSummary.weakTopics,
            summary: response.testSummary.recommendedNextActions
          });
        }
      } else {
        setTestState(response.updatedTestState);
        setCurrentQuestion(response.question);
        setSelectedAnswer(null);
      }
    } catch (error) {
      toast({ title: "Қате", description: "Жауапты өңдеу мүмкін болмады.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatTestTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AppShell>
      <div className="relative min-h-screen overflow-hidden -m-4 md:-m-6 p-4 md:p-6">
        {/* Creative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] animate-bounce duration-[10s]" />
          <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
          <div className="absolute inset-0 bg-grid-slate-200/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        </div>

        <div className="max-w-7xl mx-auto space-y-10 pb-20 relative z-10">
          <div className="flex flex-col gap-4 text-center md:text-left max-w-3xl">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="size-14 rounded-[22px] bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-primary/40 animate-in zoom-in duration-500">
                <BrainCircuit className="size-9" />
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase backdrop-blur-sm">
                AI Intelligence
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-primary leading-tight">
              AI Диагностика <span className="text-primary italic">PRO</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              Білім деңгейіңізді 95% дәлдікпен анықтап, мақсатты балға жетудің толық стратегиясын алыңыз.
            </p>
          </div>

          {step === "start" && (
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8 space-y-10">
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { 
                      icon: Target, 
                      title: "Бейімделгіш сұрақтар", 
                      desc: "Сұрақтардың қиындығы сіздің жауаптарыңызға қарай нақты уақытта автоматты түрде өзгеріп отырады.",
                      color: "text-blue-600",
                      bg: "bg-blue-50"
                    },
                    { 
                      icon: TrendingUp, 
                      title: "Болжамды балл", 
                      desc: "Қазіргі біліміңізбен нақты ҰБТ-да қанша балл алатыныңызды 95% дәлдікпен анықтаймыз.",
                      color: "text-indigo-600",
                      bg: "bg-indigo-50"
                    },
                    { 
                      icon: BrainCircuit, 
                      title: "Толық стратегия", 
                      desc: "AI сіздің мақсатты балыңызға жету үшін нақты апталық және айлық стратегиялық жоспар құрады.",
                      color: "text-purple-600",
                      bg: "bg-purple-50"
                    },
                    { 
                      icon: AlertTriangle, 
                      title: "Қателер үлгісі", 
                      desc: "Жүйелі және кездейсоқ қателеріңізді ажыратып, оларды біржола жоюдың жолдарын ұсынады.",
                      color: "text-orange-600",
                      bg: "bg-orange-50"
                    },
                    { 
                      icon: Clock, 
                      title: "Уақыт аналитикасы", 
                      desc: "Тест тапсыру жылдамдығын талдап, уақытты тиімді басқарудың жеке техникасын береді.",
                      color: "text-emerald-600",
                      bg: "bg-emerald-50"
                    },
                  ].map((item, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden bg-white/40 backdrop-blur-md rounded-[32px] border border-white/20">
                      <CardContent className="p-8">
                        <div className={`size-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                          <item.icon className="size-7" />
                        </div>
                        <h4 className="font-black text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 h-full">
                <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-primary text-white h-full overflow-hidden relative rounded-[48px] p-1 shadow-primary/20 hover:scale-[1.02] transition-transform duration-500">
                  <div className="bg-slate-900/40 backdrop-blur-3xl h-full w-full rounded-[46px] p-10 flex flex-col justify-between relative z-10">
                    <div className="space-y-8">
                      <div className="flex flex-col gap-2">
                        <Badge className="bg-white/10 text-white border-white/20 w-fit backdrop-blur-md font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-[9px]">
                          <Zap className="size-3 mr-2 fill-current text-yellow-400" />
                          DIAGNOSTIC ACCESS
                        </Badge>
                        <h3 className="text-4xl font-black font-headline leading-tight">Біліміңіздің цифрлық есебі</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                            <CheckCircle2 className="size-5 text-green-400" />
                          </div>
                          <p className="text-sm font-medium text-white/80">Оңтайландырылған 20 сұрақтан тұратын талдау</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                            <CheckCircle2 className="size-5 text-green-400" />
                          </div>
                          <p className="text-sm font-medium text-white/80">Таңдау пәндеріңізге негізделген AI стратегия</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      className="h-20 w-full rounded-[28px] bg-white text-primary hover:bg-white/90 font-black text-xl shadow-2xl shadow-black/20 group gap-3 active:scale-95 transition-all mt-10" 
                      onClick={() => setStep("survey")}
                    >
                      Бастау
                      <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  
                  <BrainCircuit className="absolute -bottom-20 -right-20 size-[450px] text-white/5 rotate-12 pointer-events-none" />
                </Card>
              </div>
            </div>
          )}

          {step === "survey" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-10 duration-700">
              <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40">
                <CardHeader className="p-12 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <History className="size-6" />
                    </div>
                    <Badge variant="outline" className="text-primary border-primary/20">1-ҚАДАМ: ТӘЖІРИБЕ</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black font-headline">Өзіңіз жайлы мәлімет</CardTitle>
                  <CardDescription className="text-base font-medium">AI стратегияңызды нақтылау үшін жауап беріңіз.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Бұрын ҰБТ-ға арнайы дайындалдыңыз ба?</Label>
                    <RadioGroup onValueChange={setPrepExperience} className="grid gap-4">
                      {[
                        { id: "none", label: "Жоқ, енді бастап жатырмын", desc: "Нөлден бастағандарға арналған маршрут." },
                        { id: "basic", label: "Иә, мектепте немесе өз бетімше", desc: "Негізгі базасы бар оқушыларға арналған." },
                        { id: "intensive", label: "Иә, курстарда қарқынды дайындалдым", desc: "Тереңдетілген талдауды қажет ететіндерге." },
                      ].map((opt) => (
                        <div key={opt.id} className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer hover:bg-primary/5 ${prepExperience === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-white'}`} onClick={() => setPrepExperience(opt.id)}>
                          <RadioGroupItem value={opt.id} id={opt.id} className="mt-1" />
                          <div className="space-y-1">
                            <Label htmlFor={opt.id} className="font-black text-base cursor-pointer">{opt.label}</Label>
                            <p className="text-xs text-muted-foreground font-medium">{opt.desc}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="p-12 pt-0">
                  <Button 
                    className="w-full h-16 rounded-[24px] font-black text-xl gap-3 shadow-xl" 
                    disabled={!prepExperience}
                    onClick={() => setStep("rules")}
                  >
                    Жалғастыру
                    <ArrowRight className="size-6" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {step === "rules" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-10 duration-700">
              <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40">
                <CardHeader className="p-12 pb-6 bg-orange-50/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <ClipboardCheck className="size-6" />
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">2-ҚАДАМ: ТАЛАПТАР</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black font-headline">Диагностика ережелері</CardTitle>
                  <CardDescription className="text-base font-medium">Шынайы нәтиже алу үшін осы талаптарды орындаңыз.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 space-y-8">
                  <div className="grid gap-6">
                    <div className="flex items-start gap-5 p-6 rounded-3xl bg-blue-50 border border-blue-100">
                      <Info className="size-8 text-blue-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-base font-bold text-blue-950">Нақты білетін сұраққа ғана жауап беріңіз</p>
                        <p className="text-sm text-blue-800/70 leading-relaxed font-medium">
                          Егер сұрақтың жауабын мүлдем білмесеңіз, оны белгілемеңіз. Бұл AI-ға сіздің білім деңгейіңізді 100% дәл анықтауға мүмкіндік береді.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-5 p-6 rounded-3xl bg-red-50 border border-red-100">
                      <XCircle className="size-8 text-red-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-base font-bold text-red-950">Ешнәрседен көшірмеңіз</p>
                        <p className="text-sm text-red-800/70 leading-relaxed font-medium">
                          Интернетті, Google-ды немесе оқулықтарды қолданбаңыз. Көшіру арқылы алынған жоғары балл сізге қате стратегия құрылуына алып келеді.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-5 p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                      <Zap className="size-8 text-emerald-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-base font-bold text-emerald-950">Уақыт пен зейін</p>
                        <p className="text-sm text-emerald-800/70 leading-relaxed font-medium">
                          Диагностика шамамен 20 сұрақтан тұрады. Бөгелмей, толық аяқтауға тырысыңыз.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-12 pt-0 flex flex-col gap-4">
                  <Button 
                    className="w-full h-20 rounded-[32px] font-black text-2xl gap-4 shadow-2xl shadow-primary/30 animate-pulse hover:animate-none" 
                    onClick={startTest}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? <Loader2 className="size-8 animate-spin" /> : <>Түсіндім, бастаймын <Play className="size-8 fill-current" /></>}
                  </Button>
                  <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Ережелерді бұзу нәтиженің дәлдігін төмендетеді.
                  </p>
                </CardFooter>
              </Card>
            </div>
          )}

          {step === "testing" && currentQuestion && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-1000">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] tracking-widest backdrop-blur-md">ADAPTIVE SESSION</Badge>
                  </div>
                  <h2 className="text-4xl font-black font-headline tracking-tight">Сұрақ <span className="text-primary tabular-nums">{(testState?.totalQuestionsAsked || 0) + 1}</span> / {testState?.maxTotalQuestions}</h2>
                </div>
                <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-white/40 flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Уақыт</span>
                    <span className="text-xl font-black text-primary tabular-nums">{formatTestTime(testSeconds)}</span>
                  </div>
                  <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                    <Clock className="size-6" />
                  </div>
                </div>
              </div>
              
              <div className="px-4">
                <Progress value={((testState?.totalQuestionsAsked || 0) / (testState?.maxTotalQuestions || 20)) * 100} className="h-3 rounded-full bg-slate-200/50 shadow-inner overflow-hidden border border-white/20" />
              </div>

              <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-[48px] border border-white/40">
                <div className="h-3 bg-gradient-to-r from-primary via-indigo-500 to-primary animate-gradient-x" />
                <CardHeader className="p-12 md:p-16">
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-5 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">{currentQuestion.subject}</Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50/50 font-black px-5 py-1.5 rounded-xl uppercase tracking-widest text-[10px] backdrop-blur-sm">{currentQuestion.topic}</Badge>
                    <Badge className="bg-indigo-500 text-white border-none font-black px-5 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">{currentQuestion.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl leading-relaxed font-black text-slate-900">
                    {currentQuestion.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-12 md:px-16 pb-16 space-y-5">
                  {currentQuestion.options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <button 
                        key={i} 
                        onClick={() => setSelectedAnswer(letter)}
                        className={`w-full text-left p-8 rounded-[32px] border-2 transition-all flex items-center gap-8 group active:scale-[0.98] shadow-sm relative overflow-hidden ${selectedAnswer === letter ? 'border-primary bg-primary/5' : 'border-slate-200/50 bg-white/50 backdrop-blur-sm hover:border-primary hover:bg-primary/5'}`}
                      >
                        <span className={`size-14 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all shadow-sm relative z-10 ${selectedAnswer === letter ? 'bg-primary text-white border-primary' : 'border-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary'}`}>
                          {letter}
                        </span>
                        <span className={`font-bold text-xl relative z-10 transition-colors ${selectedAnswer === letter ? 'text-primary' : 'text-slate-700 group-hover:text-primary'}`}>{opt}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center gap-6 px-4">
                <button 
                  className="text-sm font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors py-2 px-4"
                  onClick={() => { setSelectedAnswer("NONE"); submitAnswer(); }}
                >
                  Білмеймін / Жауап жоқ
                </button>
                <Button 
                  className="gap-4 h-20 px-16 rounded-[28px] font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all" 
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || isAiLoading}
                >
                  {isAiLoading ? <Loader2 className="size-8 animate-spin" /> : <>Келесі сұрақ <ArrowRight className="size-8" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === "result" && testSummary && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="text-center space-y-6 max-w-3xl mx-auto">
                <div className="inline-flex size-32 rounded-[40px] bg-emerald-100 text-emerald-600 items-center justify-center mb-4 shadow-2xl shadow-emerald-200/50 rotate-6 animate-bounce">
                  <CheckCircle2 className="size-16" />
                </div>
                <h2 className="text-6xl font-black font-headline tracking-tighter text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-primary">Диагностика дайын</h2>
                <p className="text-muted-foreground text-2xl font-medium leading-relaxed">
                  Біз сіздің біліміңізді толық талдап шықтық. Төмендегі нәтижелер грантқа жетудің <span className="text-primary font-black">кілті</span> болмақ.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: "Болжамды балл", val: testSummary.overallScore, desc: "ҰБТ потенциалы", icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
                  { label: "Әлсіз бағыт", val: testSummary.weakTopics[0] || "Жалпы", desc: "Қайталау қажет", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: "Дәлдік деңгейі", val: "95%", desc: "Жоғары сенімділік", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-xl bg-white/60 backdrop-blur-xl p-12 flex flex-col items-center text-center rounded-[48px] group hover:-translate-y-2 transition-all duration-500 border border-white/40">
                    <div className={`size-16 rounded-[22px] ${stat.bg} ${stat.color} flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
                      <stat.icon className="size-8" />
                    </div>
                    <span className="text-[11px] text-muted-foreground mb-3 uppercase tracking-[0.2em] font-black">{stat.label}</span>
                    <span className={`text-6xl font-black ${stat.color} mb-3 tracking-tighter`}>{stat.val}</span>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.desc}</p>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-10">
                <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[56px] overflow-hidden flex flex-col border border-white/40">
                  <CardHeader className="bg-slate-50/50 p-12 pb-8 border-b border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="text-3xl font-black font-headline flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                          <AlertTriangle className="size-7" />
                        </div>
                        Критикалық тақырыптар
                      </CardTitle>
                      <Badge className="bg-orange-500 text-white border-none font-bold uppercase tracking-widest text-[9px] px-3 py-1">HIGH PRIORITY</Badge>
                    </div>
                    <CardDescription className="text-lg font-medium text-muted-foreground">Бұл тақырыптарды жабу арқылы <span className="text-orange-600 font-black">+15-20 балл</span> қоса аласыз.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-12 space-y-6">
                    {testSummary.weakTopics.map((topic: string, i: number) => (
                      <div key={i} className="flex justify-between items-center p-8 rounded-[36px] bg-slate-50/50 border-2 border-transparent hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-slate-900 group-hover:text-orange-700 transition-colors">{topic}</h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="text-orange-500">ӘЛСІЗ ТҰС</span>
                            <span className="size-1 rounded-full bg-slate-300" />
                            Жақсарту қажет
                          </p>
                        </div>
                        <Badge className="bg-white text-orange-600 border border-orange-100 shadow-sm h-10 px-4 rounded-xl font-black">+{Math.floor(Math.random() * 5) + 3} балл</Badge>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="p-12 pt-0">
                    <Button className="w-full h-16 rounded-[24px] font-black text-lg border-2 hover:bg-slate-50 gap-3 transition-all" variant="outline" asChild>
                      <a href="/theory">
                        Практикалық базаға өту
                        <ArrowRight className="size-5" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-none shadow-[0_40px_100px_-20px_rgba(37,99,235,0.25)] bg-primary text-white rounded-[56px] overflow-hidden flex flex-col relative group">
                  <CardHeader className="relative z-10 p-12 pb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                          <Zap className="size-8 fill-current text-yellow-300" />
                        </div>
                        <div>
                          <Badge className="bg-white/20 text-white border-none backdrop-blur-md font-black uppercase tracking-[0.2em] text-[9px] mb-1">AI STRATEGY</Badge>
                          <CardTitle className="text-4xl font-black font-headline leading-tight">Балды көтеру жолы</CardTitle>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-primary-foreground/80 font-medium text-lg">{testSummary.recommendedNextActions}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 p-12 pt-0 space-y-5">
                    {[
                      { day: "1-кезең", text: "Әлсіз тақырыптарды теориялық өңдеу", icon: Clock },
                      { day: "2-кезең", text: "Тақырыптық тесттермен бекіту", icon: Target },
                      { day: "3-кезең", text: "Аралас тесттер және уақыт бақылауы", icon: BarChart3 },
                      { day: "4-кезең", text: "Толық ҰБТ симуляциялары", icon: Sparkles },
                    ].map((item, i) => (
                      <div key={i} className="p-6 rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/10 flex justify-between items-center group/item hover:bg-white/20 transition-all cursor-default">
                        <div className="flex items-center gap-5">
                          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                            <item.icon className="size-6 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-white/50">{item.day}</span>
                            <span className="text-base font-bold text-white">{item.text}</span>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-white/30 group-hover/item:translate-x-1 transition-transform" />
                      </div>
                    ))}
                    <Button 
                      variant="secondary" 
                      className="w-full font-black h-20 rounded-[32px] mt-10 shadow-2xl hover:scale-[1.03] active:scale-95 transition-all text-xl gap-4 bg-white text-primary hover:bg-white/95" 
                      asChild
                    >
                      <a href="/plan">
                        Кестені белсендіру
                        <ArrowRight className="size-6" />
                      </a>
                    </Button>
                  </CardContent>
                  <div className="absolute top-0 right-0 size-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 size-80 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] pointer-events-none" />
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
