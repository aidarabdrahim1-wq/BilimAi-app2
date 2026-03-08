
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Play, ArrowRight, BarChart3, Target, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DiagnosticPage() {
  const [step, setStep] = useState<"start" | "testing" | "result">("start");

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">AI Диагностика</h1>
          <p className="text-muted-foreground">Білім деңгейіңізді анықтап, әлсіз тұстарыңызды тауып көрейік.</p>
        </div>

        {step === "start" && (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Диагностика қалай өтеді?</h2>
                <ul className="space-y-4">
                  {[
                    { icon: Target, title: "Бейімделгіш сұрақтар", desc: "Сұрақтардың қиындығы сіздің жауабыңызға қарай өзгеріп отырады." },
                    { icon: BarChart3, title: "Терең талдау", desc: "Пәндер мен тақырыптар бойынша толық статистика аласыз." },
                    { icon: BrainCircuit, title: "Жеке жоспар", desc: "Нәтиже негізінде AI сізге 7 күндік жоспар құрып береді." },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="lg" className="h-12 px-10 gap-2" onClick={() => setStep("testing")}>
                Тестілеуді бастау <Play className="size-4 fill-current" />
              </Button>
            </div>
            <Card className="border-none shadow-xl bg-primary text-primary-foreground p-8 overflow-hidden relative">
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white mb-4">Жаңа мүмкіндік</Badge>
                <h3 className="text-2xl font-bold mb-4 font-headline">AI-мен ҰБТ-ға дайындықты жеделдетіңіз</h3>
                <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
                  Біздің алгоритм 15 минутта сіздің ҰБТ-дағы потенциалды балыңызды 95% дәлдікпен анықтайды.
                </p>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">15+</span>
                    <span className="text-[10px] opacity-70 uppercase">Пән</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">5000+</span>
                    <span className="text-[10px] opacity-70 uppercase">Сұрақ</span>
                  </div>
                </div>
              </div>
              <BrainCircuit className="absolute -bottom-10 -right-10 size-64 opacity-5 rotate-12" />
            </Card>
          </div>
        )}

        {step === "testing" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium">Сұрақ 4 / 20</span>
              <span className="text-sm text-muted-foreground">Уақыт: 12:45</span>
            </div>
            <Progress value={20} className="h-2" />
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="secondary">Математика</Badge>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Орташа қиындық</Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed font-headline">
                  Егер квадрат теңдеудің дискриминанты нөлден үлкен болса, теңдеудің неше түбірі болады?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Бір түбірі", "Екі түбірі", "Түбірі жоқ", "Шексіз көп түбірі"].map((opt, i) => (
                  <button key={i} className="w-full text-left p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group">
                    <span className="size-8 rounded-full border flex items-center justify-center text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-medium text-sm">{opt}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost">Кейін қарау</Button>
              <Button className="gap-2" onClick={() => setStep("result")}>
                Келесі сұрақ <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (step as any) !== "error" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Аяқталды</Badge>
              <h2 className="text-3xl font-bold font-headline">Диагностика қорытындысы</h2>
              <p className="text-muted-foreground">Сіздің деңгейіңіз: Ортадан жоғары</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white p-6 flex flex-col items-center text-center">
                <span className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">Орташа балл</span>
                <span className="text-5xl font-extrabold text-primary mb-2">94</span>
                <span className="text-xs text-green-600 font-medium">+8 өткен жолғыдан</span>
              </Card>
              <Card className="border-none shadow-sm bg-white p-6 flex flex-col items-center text-center">
                <span className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">Әлсіз тұсың</span>
                <span className="text-2xl font-bold text-destructive mb-2">Логарифмдер</span>
                <span className="text-xs text-muted-foreground">20% дұрыс жауап</span>
              </Card>
              <Card className="border-none shadow-sm bg-white p-6 flex flex-col items-center text-center">
                <span className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold">Уақыт/Дәлдік</span>
                <span className="text-2xl font-bold text-secondary mb-2">Жоғары жылдамдық</span>
                <span className="text-xs text-muted-foreground">Сұраққа 45 сек</span>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    Бірінші жабу керек тақырыптар
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { topic: "Логарифмдік теңдеулер", reason: "Концептуалды қателер", subject: "Математика" },
                    { topic: "Механикалық жұмыс", reason: "Формуланы шатастыру", subject: "Физика" },
                    { topic: "Қазақ хандығының құрылуы", reason: "Даталарды ұмыту", subject: "Тарих" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-accent/5 border">
                      <div>
                        <h4 className="font-bold text-sm">{item.topic}</h4>
                        <p className="text-[10px] text-muted-foreground">{item.subject} • {item.reason}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7">Оқу</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">AI-дан 7 күндік жоспар</CardTitle>
                  <CardDescription className="text-primary-foreground/70">Сіздің нәтижеңізге сай құрастырылды</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/10 text-xs flex justify-between">
                      <span>Дүйсенбі: Логарифм теориясы</span>
                      <span className="font-bold">45 мин</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/10 text-xs flex justify-between">
                      <span>Сейсенбі: Динамика есептері</span>
                      <span className="font-bold">60 мин</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/10 text-xs flex justify-between">
                      <span>Сәрсенбі: Аралас тест №1</span>
                      <span className="font-bold">90 мин</span>
                    </div>
                    <Button variant="secondary" className="w-full font-bold mt-4">Жоспарға көшу</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
