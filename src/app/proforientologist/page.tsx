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
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getCareerGuidance, type CareerGuidanceOutput } from "@/ai/flows/career-guidance-flow";
import { useToast } from "@/hooks/use-toast";

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
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Compass className="size-8 text-primary" />
            AI Профориентолог
          </h1>
          <p className="text-muted-foreground">Болашақ мамандығыңыз бен оқу орныңызды бірге таңдайық.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-none shadow-sm h-fit sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Консультация</CardTitle>
              <CardDescription>Өзіңіз туралы ақпарат беріңіз</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Сіздің пәндеріңіз:</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.selectedSubjects.map(s => (
                    <Badge key={s} variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Не нәрсеге қызығасыз?</label>
                <Textarea 
                  placeholder="М: Маған техникамен айналысқан ұнайды, математиканы жақсы көремін, бірақ адамдармен де жұмыс істегім келеді..."
                  className="min-h-[150px] resize-none"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Қызығушылықтарыңызды неғұрлым толық жазсаңыз, AI соғұрлым дәл кеңес береді.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full gap-2 shadow-lg shadow-primary/20" 
                onClick={handleConsultation}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Талдау жасау
              </Button>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            {!result && !isLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-accent/5 rounded-3xl border border-dashed border-muted-foreground/20">
                <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                  <Compass className="size-10 text-primary/30" />
                </div>
                <h3 className="text-xl font-bold mb-2">Кеңес алуды бастаңыз</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Сол жақтағы форманы толтырып, "Талдау жасау" батырмасын басыңыз. AI сіздің мүмкіндіктеріңізді зерттеп, үздік нұсқаларды ұсынады.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 py-20">
                <div className="relative">
                  <div className="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="size-8 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg animate-pulse">AI сіздің болашағыңызды жоспарлауда...</p>
                  <p className="text-sm text-muted-foreground">Пәндер мен қызығушылықтар салыстырылуда</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-md bg-white overflow-hidden">
                  <div className="h-1.5 bg-primary" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="size-5 text-primary" />
                      Жалпы талдау
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground bg-accent/5 p-4 rounded-xl border italic">
                      "{result.analysis}"
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    Ұсынылатын мамандықтар
                  </h3>
                  {result.recommendations.map((job, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-primary">{job.title}</CardTitle>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {job.suitabilityScore}% Сәйкестік
                          </Badge>
                        </div>
                        <CardDescription className="text-sm mt-1">{job.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Артықшылықтары:</p>
                          <ul className="space-y-1">
                            {job.pros.map((p, j) => (
                              <li key={j} className="text-xs flex items-start gap-2">
                                <div className="size-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Қиындықтары:</p>
                          <ul className="space-y-1">
                            {job.cons.map((c, j) => (
                              <li key={j} className="text-xs flex items-start gap-2">
                                <div className="size-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        Үздік ЖОО-лар
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.suggestedUniversities.map((uni, i) => (
                        <div key={i} className="p-3 rounded-xl border bg-accent/5 hover:bg-white transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{uni.name}</h4>
                            <span className="text-[10px] text-muted-foreground">{uni.location}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{uni.reason}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="size-5" />
                        Іс-қимыл жоспары
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
                        {result.actionPlan}
                      </p>
                      <Button variant="secondary" className="w-full mt-6 gap-2 font-bold" asChild>
                        <a href="/plan">
                          Жоспарға қосу <ArrowRight className="size-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
