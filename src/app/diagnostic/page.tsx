
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BrainCircuit, Play, ArrowRight, BarChart3, Target, AlertTriangle, CreditCard, ShieldCheck, QrCode, Loader2, CheckCircle2 } from "lucide-react";
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <BrainCircuit className="size-8 text-primary" />
            AI Диагностика
          </h1>
          <p className="text-muted-foreground">Білім деңгейіңізді 95% дәлдікпен анықтап, жеке даму стратегиясын алыңыз.</p>
        </div>

        {step === "start" && (
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Диагностика қалай өтеді?</h2>
                <ul className="space-y-4">
                  {[
                    { icon: Target, title: "Бейімделгіш сұрақтар", desc: "Сұрақтардың қиындығы сіздің жауабыңызға қарай өзгеріп отырады." },
                    { icon: BarChart3, title: "Терең талдау", desc: "Пәндер мен тақырыптар бойынша толық статистика аласыз." },
                    { icon: BrainCircuit, title: "Жеке жоспар", desc: "Нәтиже негізінде AI сізге 7 күндік жоспар құрып береді." },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Card className="border-2 border-primary/20 bg-primary/5 rounded-3xl overflow-hidden relative group">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Қызмет құны</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">9 990 ₸</span>
                      <span className="text-xs font-bold text-muted-foreground line-through decoration-destructive/50">14 900 ₸</span>
                    </div>
                  </div>
                  <Button size="lg" className="h-14 px-8 gap-2 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => setStep("payment")}>
                    Қол жеткізу <ArrowRight className="size-5" />
                  </Button>
                </CardContent>
                <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </Card>
            </div>

            <Card className="border-none shadow-2xl bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground p-8 overflow-hidden relative rounded-[40px]">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md mb-6 font-bold px-3 py-1">PREMIUM МҮМКІНДІК</Badge>
                  <h3 className="text-3xl font-black mb-4 font-headline leading-tight">AI-мен ҰБТ-ға дайындықты жеделдетіңіз</h3>
                  <p className="text-primary-foreground/80 text-base leading-relaxed mb-8">
                    Біздің алгоритм 15 минутта сіздің ҰБТ-дағы потенциалды балыңызды анықтап, қай тақырыптардан қателесетініңізді болжайды.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter">15+</span>
                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Пән бойынша талдау</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter">5000+</span>
                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Белсенді сұрақтар</span>
                  </div>
                </div>
              </div>
              <BrainCircuit className="absolute -bottom-20 -right-20 size-80 opacity-10 rotate-12 pointer-events-none" />
            </Card>
          </div>
        )}

        {step === "payment" && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 p-8 text-center border-b border-primary/10">
                <div className="size-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <CreditCard className="size-8" />
                </div>
                <CardTitle className="text-2xl font-black font-headline">Төлемді растау</CardTitle>
                <CardDescription className="font-medium">AI Диагностика қызметін ашу үшін төлем жасаңыз</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex justify-between items-center p-6 rounded-3xl bg-accent/5 border-2 border-dashed border-border/50">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Тапсырыс</p>
                    <p className="text-lg font-black">Толық AI Диагностика</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">9 990 ₸</p>
                    <p className="text-[10px] font-bold text-green-600">Бір реттік төлем</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl border-2 border-primary bg-primary/5 flex flex-col items-center gap-3 cursor-pointer transition-all hover:bg-primary/10">
                    <QrCode className="size-10 text-primary" />
                    <span className="text-sm font-black">Kaspi QR</span>
                  </div>
                  <div className="p-6 rounded-3xl border-2 border-transparent bg-accent/10 flex flex-col items-center gap-3 cursor-pointer opacity-60 hover:opacity-100 transition-all">
                    <CreditCard className="size-10 text-muted-foreground" />
                    <span className="text-sm font-black">Банк картасы</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                    <ShieldCheck className="size-5 text-green-600 shrink-0" />
                    <p className="text-xs text-green-800 leading-relaxed font-medium">
                      Төлем қауіпсіздігі сертификатталған. Сіздің деректеріңіз қорғалған.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0 flex flex-col gap-4">
                <Button 
                  className="w-full h-16 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 gap-3" 
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="size-6 animate-spin" />
                      Төлем өңделуде...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-6" />
                      Төлемді растау (9 990 ₸)
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full font-bold text-muted-foreground" onClick={() => setStep("start")} disabled={isProcessingPayment}>
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
                <Badge variant="outline" className="w-fit mb-1 bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">БЕЛСЕНДІ СЕССИЯ</Badge>
                <span className="text-2xl font-black font-headline">Сұрақ 4 / 20</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Уақыт</span>
                <span className="text-sm font-black text-primary">12:45</span>
              </div>
            </div>
            <Progress value={20} className="h-2 rounded-full" />
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[32px]">
              <div className="h-2 bg-gradient-to-r from-primary to-indigo-500" />
              <CardHeader className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">Математика</Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold">Орташа қиындық</Badge>
                </div>
                <CardTitle className="text-2xl leading-relaxed font-bold">
                  Егер квадрат теңдеудің дискриминанты нөлден үлкен болса, теңдеудің неше түбірі болады?
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-3">
                {["Бір түбірі", "Екі түбірі", "Түбірі жоқ", "Шексіз көп түбірі"].map((opt, i) => (
                  <button key={i} className="w-full text-left p-5 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-5 group active:scale-[0.98]">
                    <span className="size-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-bold text-base">{opt}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between gap-4">
              <Button variant="ghost" className="font-bold rounded-xl">Кейін қарау</Button>
              <Button className="gap-2 h-12 px-10 rounded-xl font-black text-lg shadow-lg shadow-primary/20" onClick={() => setStep("result")}>
                Келесі сұрақ <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex size-20 rounded-full bg-green-100 text-green-600 items-center justify-center mb-2 shadow-inner">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="text-4xl font-black font-headline tracking-tight">Диагностика қорытындысы</h2>
              <p className="text-muted-foreground text-lg font-medium">Сіздің деңгейіңіз: <span className="text-primary font-black">Ортадан жоғары</span></p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl bg-white p-8 flex flex-col items-center text-center rounded-[32px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.2em] font-black">Орташа балл</span>
                <span className="text-6xl font-black text-primary mb-2 tabular-nums">94</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">+8 өткен жолғыдан</Badge>
              </Card>
              <Card className="border-none shadow-xl bg-white p-8 flex flex-col items-center text-center rounded-[32px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.2em] font-black">Әлсіз тұсың</span>
                <span className="text-2xl font-black text-destructive mb-3">Логарифмдер</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">20% дұрыс жауап</p>
              </Card>
              <Card className="border-none shadow-xl bg-white p-8 flex flex-col items-center text-center rounded-[32px] group hover:scale-[1.02] transition-transform">
                <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.2em] font-black">Уақыт/Дәлдік</span>
                <span className="text-2xl font-black text-indigo-600 mb-3">Жоғары жылдамдық</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Сұраққа 45 сек</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="bg-accent/5 pb-6">
                  <CardTitle className="text-xl font-black font-headline flex items-center gap-3">
                    <AlertTriangle className="size-6 text-destructive" />
                    Бірінші жабу керек тақырыптар
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[
                    { topic: "Логарифмдік теңдеулер", reason: "Концептуалды қателер", subject: "Математика" },
                    { topic: "Механикалық жұмыс", reason: "Формуланы шатастыру", subject: "Физика" },
                    { topic: "Қазақ хандығының құрылуы", reason: "Даталарды ұмыту", subject: "Тарих" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-accent/10 border-2 border-white shadow-sm hover:border-primary/20 transition-all group">
                      <div>
                        <h4 className="font-black text-sm group-hover:text-primary transition-colors">{item.topic}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{item.subject} • {item.reason}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-[10px] h-8 rounded-lg font-bold border-2">Оқу</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl bg-primary text-primary-foreground rounded-[32px] overflow-hidden flex flex-col relative group">
                <CardHeader className="relative z-10 p-8 pb-4">
                  <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                    <Sparkles className="size-6" />
                    AI-дан 7 күндік жоспар
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/70 font-medium">Сіздің нәтижеңізге сай құрастырылды</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-8 pt-0 space-y-3">
                  {[
                    { day: "Дүйсенбі", text: "Логарифм теориясы", time: "45 мин" },
                    { day: "Сейсенбі", text: "Динамика есептері", time: "60 мин" },
                    { day: "Сәрсенбі", text: "Аралас тест №1", time: "90 мин" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex justify-between items-center group/item hover:bg-white/20 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">{item.day}</span>
                        <span className="text-sm font-bold">{item.text}</span>
                      </div>
                      <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-lg">{item.time}</span>
                    </div>
                  ))}
                  <Button variant="secondary" className="w-full font-black h-12 rounded-xl mt-6 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all" asChild>
                    <a href="/plan">Жоспарға көшу</a>
                  </Button>
                </CardContent>
                <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
