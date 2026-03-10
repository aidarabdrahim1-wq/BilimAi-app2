
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, 
  Sparkles, 
  Loader2, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  Trophy,
  Star,
  MapPin,
  ListTodo,
  Info
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getCareerGuidance, type CareerGuidanceOutput } from "@/ai/flows/career-guidance-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export default function ProforientologistPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CareerGuidanceOutput | null>(null);

  const handleConsultation = async () => {
    if (!profile) return;
    if (!interests.trim()) {
      toast({ title: "Қызығушылықтарыңызды жазыңыз", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const guidance = await getCareerGuidance({
        fullName: profile.fullName,
        selectedSubjects: profile.selectedSubjects,
        targetScore: profile.targetScore,
        currentScore: profile.currentScore,
        interests: interests,
      });
      setResult(guidance);
      toast({ title: "Талдау аяқталды!", description: "AI сізге сәйкес мамандықтарды тапты." });
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Қате орын алды", 
        description: error.message === 'AI_QUOTA_EXCEEDED' ? "AI лимиті аяқталды. Сәлден соң көріңіз." : "Кеңес алу мүмкін болмады.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Compass className="size-8" />
              </div>
              AI Профориентолог
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">Пәндеріңіз бен қызығушылықтарыңызға негізделген жеке кәсіби бағдар беру жүйесі.</p>
          </div>
          
          {result && (
            <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl border-2">
              Қайта бастау
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Panel: Input */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden sticky top-24">
              <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="size-5 text-yellow-500 fill-current" />
                  Консультация
                </CardTitle>
                <CardDescription>Болашағыңызды жоспарлау үшін өзіңіз туралы ақпарат беріңіз.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Таңдаған пәндеріңіз:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.selectedSubjects.map(s => (
                      <Badge key={s} variant="secondary" className="bg-accent/50 text-accent-foreground border-accent/10 px-3 py-1 rounded-lg text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">Қызығушылықтарыңыз</label>
                    <Badge variant="outline" className="text-[9px] font-bold">AI ТАЛДАУ</Badge>
                  </div>
                  <Textarea 
                    placeholder="Мәселен: Мен техниканы жақсы көремін, бірақ адамдармен қарым-қатынаста болғанды ұнатамын. Математика мен ағылшын тіліне қызығамын..."
                    className="min-h-[180px] resize-none rounded-2xl bg-accent/5 border-none focus-visible:ring-primary shadow-inner"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                  />
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      Неғұрлым толық жазсаңыз, AI соғұрлым дәлірек мамандықтар мен ЖОО-ларды таңдап береді.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-accent/5 border-t pt-6">
                <Button 
                  className="w-full gap-2 h-12 rounded-xl shadow-xl shadow-primary/20 text-base font-bold" 
                  onClick={handleConsultation}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                  Талдауды бастау
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8 space-y-8">
            {!result && !isLoading && (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-accent/10 rounded-[40px] border-4 border-dashed border-white/50">
                <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 shadow-inner">
                  <Compass className="size-12 text-primary/30 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black mb-3 font-headline">AI-мен болашағыңды тап</h3>
                <p className="text-muted-foreground max-w-sm leading-relaxed font-medium">
                  Сол жақтағы терезеге өз қалауларыңызды жазыңыз. AI сіздің ҰБТ пәндеріңізді, балыңызды және армандарыңызды сараптап, ең үздік жолды көрсетеді.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center gap-6 py-20 bg-white rounded-[40px] shadow-sm border">
                <div className="relative">
                  <div className="size-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="size-10 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-2xl animate-pulse font-headline">AI зерттеуде...</p>
                  <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                    Пәндер комбинациясы мен нарықтағы сұраныс салыстырылуда. Сәл күте тұрыңыз.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-white rounded-[32px] overflow-hidden relative group">
                  <CardHeader className="relative z-10 p-8 pb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 font-bold">ЖАЛПЫ ТАЛДАУ</Badge>
                    </div>
                    <CardTitle className="text-2xl font-black font-headline">AI Есебі</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-8 pt-0">
                    <p className="text-lg leading-relaxed font-medium text-white/90 italic">
                      "{result.analysis}"
                    </p>
                  </CardContent>
                  <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                  <Briefcase className="absolute -bottom-10 -right-10 size-48 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </Card>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 rounded-full bg-green-500" />
                    <h3 className="text-2xl font-black font-headline tracking-tight flex items-center gap-2">
                      <Trophy className="size-6 text-green-600" />
                      Ұсынылатын мамандықтар
                    </h3>
                  </div>
                  
                  <div className="grid gap-6">
                    {result.recommendations.map((job, i) => (
                      <Card key={i} className="border-none shadow-md hover:shadow-2xl transition-all group bg-white rounded-3xl overflow-hidden">
                        <div className="h-1 bg-green-500/20 group-hover:bg-green-500 transition-colors" />
                        <CardHeader className="p-6 pb-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-black text-primary group-hover:text-indigo-600 transition-colors">{job.title}</CardTitle>
                              <CardDescription className="text-sm font-medium leading-relaxed">{job.description}</CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Сәйкестік</span>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-green-600">{job.suitabilityScore}%</span>
                                <Progress value={job.suitabilityScore} className="w-20 h-2 bg-green-100" />
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-4 grid md:grid-cols-2 gap-6">
                          <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 space-y-3">
                            <p className="text-[10px] font-black uppercase text-green-700 flex items-center gap-2 tracking-widest">
                              <CheckCircle2 className="size-3" /> Артықшылықтары
                            </p>
                            <ul className="space-y-2">
                              {job.pros.map((p, j) => (
                                <li key={j} className="text-xs font-bold text-green-800/80 flex items-start gap-2">
                                  <div className="size-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
                            <p className="text-[10px] font-black uppercase text-orange-700 flex items-center gap-2 tracking-widest">
                              <Sparkles className="size-3" /> Қиындықтары
                            </p>
                            <ul className="space-y-2">
                              {job.cons.map((c, j) => (
                                <li key={j} className="text-xs font-bold text-orange-800/80 flex items-start gap-2">
                                  <div className="size-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pb-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 rounded-full bg-blue-500" />
                      <h3 className="text-xl font-black font-headline tracking-tight flex items-center gap-2">
                        <Building2 className="size-5 text-blue-600" />
                        Үздік ЖОО-лар
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {result.suggestedUniversities.map((uni, i) => (
                        <div key={i} className="p-5 rounded-3xl border-2 bg-white hover:bg-blue-50/30 transition-colors shadow-sm group">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-base text-foreground group-hover:text-blue-700 transition-colors">{uni.name}</h4>
                            <Badge variant="outline" className="text-[9px] font-bold gap-1 rounded-lg">
                              <MapPin className="size-2.5" /> {uni.location}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                            {uni.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 rounded-full bg-primary" />
                      <h3 className="text-xl font-black font-headline tracking-tight flex items-center gap-2">
                        <ListTodo className="size-5 text-primary" />
                        Іс-қимыл жоспары
                      </h3>
                    </div>
                    <Card className="border-none shadow-xl bg-primary text-white rounded-[32px] overflow-hidden h-fit">
                      <CardHeader>
                        <CardTitle className="text-lg">AI Ұсынысы</CardTitle>
                        <CardDescription className="text-white/70">Мақсатқа жетудің нақты қадамдары</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                          <p className="text-sm leading-relaxed font-bold whitespace-pre-wrap">
                            {result.actionPlan}
                          </p>
                        </div>
                        <Button variant="secondary" className="w-full mt-8 gap-2 font-black h-12 rounded-xl shadow-lg" asChild>
                          <Link href="/plan">
                            Жоспарға қосу <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
