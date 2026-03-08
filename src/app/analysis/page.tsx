
"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Sparkles, Loader2, Trash2, BrainCircuit, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, limit } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";
import { analyzeStudentMistakes, type AnalyzeMistakesOutput } from "@/ai/flows/analyze-student-mistakes-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AnalysisPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AnalyzeMistakesOutput | null>(null);
  const [loadingMistakes, setLoadingMistakes] = useState(true);

  useEffect(() => {
    if (!user) return;

    const mistakesRef = collection(db, "studentProfiles", user.uid, "mistakes");
    const q = query(mistakesRef, orderBy("createdAt", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setMistakes(list);
      setLoadingMistakes(false);
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mistakesRef.path,
        operation: 'list'
      }));
      setLoadingMistakes(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAiAnalysis = async () => {
    if (mistakes.length === 0) return;
    setIsAiLoading(true);
    setAiReport(null);
    try {
      const testResults = mistakes.map(m => ({
        question: m.question,
        correctAnswer: m.correctAnswer,
        studentAnswer: m.studentAnswer,
        isCorrect: false,
        subject: m.subject,
        topic: m.topic || "Жалпы",
        explanation: m.explanation
      }));

      const report = await analyzeStudentMistakes({ testResults });
      setAiReport(report);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const deleteMistake = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "studentProfiles", user.uid, "mistakes", id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const clearAllMistakes = async () => {
    if (!user || mistakes.length === 0) return;
    if (!confirm("Барлық қателерді өшіргіңіз келе ме?")) return;
    
    try {
      for (const m of mistakes) {
        await deleteDoc(doc(db, "studentProfiles", user.uid, "mistakes", m.id));
      }
    } catch (error) {
      console.error("Clear error:", error);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <AlertCircle className="size-8 text-primary" />
              Қателерді талдау
            </h1>
            <p className="text-muted-foreground text-sm">Тест кезінде жіберген қателеріңіз осы жерге жиналады.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {mistakes.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllMistakes} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4 mr-2" /> Барлығын өшіру
              </Button>
            )}
            <Button 
              onClick={handleAiAnalysis} 
              disabled={mistakes.length === 0 || isAiLoading}
              className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {isAiLoading ? <Loader2 className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
              AI Талдау жасау
            </Button>
          </div>
        </div>

        {aiReport && (
          <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-5 text-primary" />
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">AI ЕСЕП</Badge>
                </div>
                <CardTitle className="text-xl font-headline">{aiReport.overallSummary}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="size-4 text-destructive" /> Жиі кездесетін қателер
                  </h4>
                  <div className="space-y-3">
                    {aiReport.commonMistakes.map((m, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-border/50 shadow-sm">
                        <p className="font-bold text-sm text-primary mb-1">{m.type}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.affectedTopics.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit className="size-4 text-secondary" /> Шатастырылған ұғымдар
                  </h4>
                  <div className="space-y-3">
                    {aiReport.confusedConcepts.map((c, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-border/50 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100">{c.concept1}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground italic">vs</span>
                          <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-100">{c.concept2}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{c.comparison}</p>
                        {c.example && <p className="text-[10px] font-mono bg-accent/30 p-2 rounded">Мысалы: {c.example}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-accent/5 border-t p-6 flex flex-col items-start gap-4">
                <div className="w-full">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" /> Жақсарту жолдары
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {aiReport.areasForImprovement.map((area, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 p-2 rounded-lg border">
                        <div className="size-1.5 rounded-full bg-primary" />
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
                {aiReport.warningBlocks.length > 0 && (
                  <div className="w-full p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    {aiReport.warningBlocks.map((w, i) => (
                      <div key={i} className="flex gap-3">
                        <AlertTriangle className="size-5 text-destructive shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-destructive">{w.message}</p>
                          <p className="text-xs text-destructive/80 mt-1">{w.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardFooter>
            </Card>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Соңғы қателер ({mistakes.length})
            </h2>
            {mistakes.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-destructive/20 text-destructive bg-destructive/5">
                Талдау қажет
              </Badge>
            )}
          </div>

          {loadingMistakes ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Қателер тізімі жүктелуде...</p>
            </div>
          ) : mistakes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mistakes.map((item) => (
                <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold">
                        {item.subject}
                      </Badge>
                      <CardTitle className="text-sm font-bold leading-relaxed pr-8">
                        {item.question}
                      </CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMistake(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-center">
                      <div className="p-2 rounded bg-destructive/10 text-destructive flex flex-col gap-1">
                        <span className="opacity-60">Сенің жауабың</span>
                        <span>{item.studentAnswer}</span>
                      </div>
                      <div className="p-2 rounded bg-green-50 text-green-700 flex flex-col gap-1">
                        <span className="opacity-60">Дұрыс жауап</span>
                        <span>{item.correctAnswer}</span>
                      </div>
                    </div>
                    {item.explanation && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-[10px] font-bold text-accent-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                          <BrainCircuit className="size-3" /> Түсіндірме
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 flex flex-col items-center gap-4 bg-muted/5 rounded-3xl border border-dashed border-muted-foreground/20">
              <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                <CheckCircle2 className="size-10 text-green-500/30" />
              </div>
              <div className="max-w-[300px] space-y-2">
                <h4 className="font-bold text-lg">Қателер табылмады!</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Керемет! Сіз әлі қате жібермедіңіз немесе барлығын талдап үлгердіңіз. Тест тапсыруды жалғастырыңыз.
                </p>
              </div>
              <Button variant="outline" asChild className="mt-4">
                <a href="/practice">Тест тапсыру</a>
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
