
"use client";

import { useState } from "react";
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
  CreditCard, 
  ShieldCheck, 
  QrCode, 
  Loader2, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Award,
  Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function DiagnosticPage() {
  const [step, setStep] = useState<"start" | "payment" | "testing" | "result">("start");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handlePayment = () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setStep("testing");
      toast({
        title: "Төлем сәтті өтті!",
        description: "AI Диагностика іске қосылды. Сәттілік!",
      });
    }, 2000);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="size-8" />
            </div>
            AI Диагностика PRO
          </h1>
          <p className="text-muted-foreground text-lg">Білім деңгейіңізді 95% дәлдікпен анықтап, грантқа жетудің нақты жоспарын алыңыз.</p>
        </div>

        {step === "start" && (
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-headline">Диагностиканың артықшылықтары:</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Target, title: "Бейімделгіш сұрақтар", desc: "Сұрақтардың қиындығы сіздің жауаптарыңызға қарай автоматты түрде өзгеріп отырады." },
                    { icon: TrendingUp, title: "Болжамды балл", desc: "Қазіргі біліміңізбен ҰБТ-да қанша балл алатыныңызды 95% дәлдікпен анықтаймыз." },
                    { icon: BrainCircuit, title: "Толық стратегия", desc: "AI сіздің мақсатты балыңызға жету үшін апталық және айлық нақты жоспар құрады." },
                    { icon: AlertTriangle, title: "Қателер үлгісі", desc: "Жүйелі және кездейсоқ қателеріңізді ажыратып, оларды жою жолдарын ұсынады." },
                    { icon: Clock, title: "Уақыт аналитикасы", desc: "Тест тапсыру жылдамдығын талдап, уақытты тиімді басқару стратегиясын береді." },
                    { icon: Award, title: "Грант мүмкіндігі", desc: "Таңдалған мамандық бойынша грантқа түсу ықтималдығын пайыздармен есептейді." },
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border-2 border-accent/50 hover:border-primary/30 transition-all group shadow-sm">
                      <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <item.icon className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <Card className="border-none shadow-2xl bg-primary/5 rounded-[32px] overflow-hidden relative group border-2 border-primary/10">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Пакет құны</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary">9 990 ₸</span>
                      <span className="text-lg font-bold text-muted-foreground line-through decoration-destructive/50">14 900 ₸</span>
                    </div>
                    <p className="text-sm font-medium text-primary/80">Барлық мүмкіндіктер мен жеке стратегия қосылған.</p>
                  </div>
                  <Button size="lg" className="h-16 px-10 gap-3 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto" onClick={() => setStep("payment")}>
                    Қол жеткізу <ArrowRight className="size-6" />
                  </Button>
                </CardContent>
                <div className="absolute -top-10 -right-10 size-40 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              </Card>
            </div>

            <div className="lg:col-span-5 h-full">
              <Card className="border-none shadow-2xl bg-gradient-to-br from-primary via-indigo-700 to-indigo-900 text-primary-foreground p-10 h-full overflow-hidden relative rounded-[48px] flex flex-col justify-between">
                <div className="relative z-10 space-y-8">
                  <div>
                    <Badge className="bg-white/20 text-white border-none backdrop-blur-md mb-6 font-bold px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
                      <Zap className="size-3 mr-2 fill-current" />
                      PREMIUM ACCESS
                    </Badge>
                    <h3 className="text-4xl font-black mb-6 font-headline leading-[1.1] tracking-tight">AI-мен ҰБТ-ға дайындықтың жаңа деңгейі</h3>
                    <p className="text-primary-foreground/80 text-lg leading-relaxed font-medium">
                      Бұл жай ғана тест емес. Бұл — сіздің біліміңіздің толық цифрлық көшірмесін жасап, грантқа жететін ең қысқа жолды табу.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Sparkles className="size-6 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Жеке AI Куратор</p>
                        <p className="text-xs opacity-70">Диагностикадан кейін сізді 24/7 бақылайды.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <BarChart3 className="size-6 text-green-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Терең аналитика</p>
                        <p className="text-xs opacity-70">15 минутта 3 айлық дайындықтың орнын толтырыңыз.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                  <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tighter">15+</span>
                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">Пән талдау</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tighter">5000+</span>
                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">Белсенді сұрақ</span>
                  </div>
                </div>
                
                <BrainCircuit className="absolute -bottom-20 -right-20 size-[400px] opacity-10 rotate-12 pointer-events-none" />
              </Card>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 p-10 text-center border-b border-primary/10">
                <div className="size-20 rounded-3xl bg-primary text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3">
                  <CreditCard className="size-10" />
                </div>
                <CardTitle className="text-3xl font-black font-headline">Төлемді растау</CardTitle>
                <CardDescription className="font-bold text-base mt-2">AI Диагностика PRO пакетін іске қосу</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="flex justify-between items-center p-8 rounded-[32px] bg-accent/10 border-2 border-dashed border-primary/20">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Таңдалған қызмет</p>
                    <p className="text-xl font-black">AI Диагностика PRO</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary">9 990 ₸</p>
                    <p className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">ШЕКСІЗ МҮМКІНДІК</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-[32px] border-2 border-primary bg-primary/5 flex flex-col items-center gap-4 cursor-pointer transition-all hover:bg-primary/10 shadow-lg shadow-primary/5 group">
                    <QrCode className="size-14 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest">Kaspi QR</span>
                  </div>
                  <div className="p-8 rounded-[32px] border-2 border-transparent bg-accent/10 flex flex-col items-center gap-4 cursor-pointer opacity-60 hover:opacity-100 transition-all group">
                    <CreditCard className="size-14 text-muted-foreground group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest">Банк картасы</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-green-50 border border-green-100 shadow-sm">
                  <ShieldCheck className="size-6 text-green-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-green-900">Төлем қауіпсіздігі кепілдендірілген</p>
                    <p className="text-xs text-green-800/70 leading-relaxed font-medium">
                      Барлық транзакциялар шифрланған. Сіздің деректеріңіз біздің қорғауымызда.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex flex-col gap-4">
                <Button 
                  className="w-full h-20 rounded-3xl font-black text-2xl shadow-2xl shadow-primary/30 gap-4 hover:scale-[1.01] active:scale-95 transition-all" 
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="size-8 animate-spin" />
                      Төлем өңделуде...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-8" />
                      Растау (9 990 ₸)
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:bg-destructive/5 hover:text-destructive h-12 rounded-xl" onClick={() => setStep("start")} disabled={isProcessingPayment}>
                  Бас тарту
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === "testing" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-end px-2">
              <div className="flex flex-col">
                <Badge variant="outline" className="w-fit mb-1 bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">БЕЛСЕНДІ СЕССИЯ</Badge>
                <span className="text-2xl font-black font-headline">Сұрақ 4 / 20</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Уақыт</span>
                <span className="text-sm font-black text-primary tabular-nums">12:45</span>
              </div>
            </div>
            <Progress value={20} className="h-2 rounded-full" />
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[32px]">
              <div className="h-2 bg-gradient-to-r from-primary to-indigo-500" />
              <CardHeader className="p-10">
                <div className="flex justify-between items-center mb-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold px-4 py-1 rounded-lg">Математика</Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold px-4 py-1 rounded-lg">Орташа қиындық</Badge>
                </div>
                <CardTitle className="text-2xl leading-relaxed font-bold">
                  Егер квадрат теңдеудің дискриминанты нөлден үлкен болса, теңдеудің неше түбірі болады?
                </CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10 space-y-4">
                {["Бір түбірі", "Екі түбірі", "Түбірі жоқ", "Шексіз көп түбірі"].map((opt, i) => (
                  <button key={i} className="w-full text-left p-6 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-6 group active:scale-[0.98] shadow-sm">
                    <span className="size-12 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-bold text-lg">{opt}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between gap-4">
              <Button variant="ghost" className="font-bold rounded-xl h-12 px-8">Кейін қарау</Button>
              <Button className="gap-3 h-14 px-12 rounded-2xl font-black text-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={() => setStep("result")}>
                Келесі сұрақ <ArrowRight className="size-6" />
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex size-24 rounded-full bg-green-100 text-green-600 items-center justify-center mb-2 shadow-inner">
                <CheckCircle2 className="size-12" />
              </div>
              <h2 className="text-5xl font-black font-headline tracking-tight">Диагностика қорытындысы</h2>
              <p className="text-muted-foreground text-xl font-medium">Сіздің дайындық деңгейіңіз: <span className="text-primary font-black">Ортадан жоғары</span></p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-xl bg-white p-10 flex flex-col items-center text-center rounded-[40px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-3 uppercase tracking-[0.2em] font-black">Болжамды балл</span>
                <span className="text-7xl font-black text-primary mb-3 tabular-nums">94</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-4 py-1">+8 өткен жолғыдан</Badge>
              </Card>
              <Card className="border-none shadow-xl bg-white p-10 flex flex-col items-center text-center rounded-[40px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-3 uppercase tracking-[0.2em] font-black">Ең әлсіз пән</span>
                <span className="text-3xl font-black text-destructive mb-4">Логарифмдер</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-destructive/5 px-3 py-1 rounded-full">20% меңгерілген</p>
              </Card>
              <Card className="border-none shadow-xl bg-white p-10 flex flex-col items-center text-center rounded-[40px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-3 uppercase tracking-[0.2em] font-black">Уақыт/Дәлдік</span>
                <span className="text-3xl font-black text-indigo-600 mb-4">Жоғары қарқын</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Сұраққа 45 сек</p>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden flex flex-col">
                <CardHeader className="bg-accent/5 p-8 pb-6">
                  <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                    <AlertTriangle className="size-8 text-destructive" />
                    Бірінші кезектегі мақсаттар
                  </CardTitle>
                  <CardDescription className="font-medium">Бұл тақырыптарды жабу арқылы +15 балл қоса аласыз</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-4 flex-1">
                  {[
                    { topic: "Логарифмдік теңдеулер", reason: "Концептуалды қателер", subject: "Математика", gain: "+5 балл" },
                    { topic: "Механикалық жұмыс", reason: "Формуланы шатастыру", subject: "Физика", gain: "+4 балл" },
                    { topic: "Қазақ хандығының құрылуы", reason: "Даталарды ұмыту", subject: "Тарих", gain: "+6 балл" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-accent/10 border-2 border-white shadow-sm hover:border-primary/20 transition-all group">
                      <div>
                        <h4 className="font-black text-base group-hover:text-primary transition-colors">{item.topic}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{item.subject} • {item.reason}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none font-bold">{item.gain}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button className="w-full h-12 rounded-xl font-bold" variant="outline" asChild>
                    <a href="/theory">Барлық тақырыптарды қарау</a>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-none shadow-2xl bg-primary text-primary-foreground rounded-[40px] overflow-hidden flex flex-col relative group">
                <CardHeader className="relative z-10 p-10 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Zap className="size-6 fill-current" />
                    </div>
                    <Badge className="bg-white/20 text-white border-none backdrop-blur-md font-bold">AI STRATEGY</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black font-headline leading-tight">Балды көтеру стратегиясы</CardTitle>
                  <CardDescription className="text-primary-foreground/70 font-medium text-base">Келесі 30 күнге арналған оңтайлы жол</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-10 pt-0 space-y-4">
                  {[
                    { day: "1-апта", text: "Әлсіз тақырыптарды теориялық өңдеу", icon: Clock },
                    { day: "2-апта", text: "Тақырыптық тесттермен бекіту", icon: Target },
                    { day: "3-апта", text: "Аралас тесттер және уақыт бақылауы", icon: BarChart3 },
                    { day: "4-апта", text: "Толық ҰБТ форматты симуляциялары", icon: Award },
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex justify-between items-center group/item hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <item.icon className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">{item.day}</span>
                          <span className="text-sm font-bold">{item.text}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" className="w-full font-black h-16 rounded-2xl mt-8 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg gap-3" asChild>
                    <a href="/plan">
                      Оқу жоспарына көшу <ArrowRight className="size-5" />
                    </a>
                  </Button>
                </CardContent>
                <div className="absolute top-0 right-0 size-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 size-64 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
