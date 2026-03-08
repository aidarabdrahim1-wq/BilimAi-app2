"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ClipboardCheck, Zap, History, Play, Loader2, ArrowRight, CheckCircle2, Trophy, AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { updateUserRating } from "@/lib/rating";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { kk } from "date-fns/locale";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
};

type SubjectConfig = {
  name: string;
  count: number;
  threshold: number;
};

type SubjectResult = {
  subject: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  isThresholdPassed: boolean;
};

type TestSession = {
  id: string;
  score: number;
  createdAt: any;
  type: string;
};

export default function PracticePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [testState, setTestState] = useState<"idle" | "loading" | "testing" | "results" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  
  const getSubjectConfigs = (): SubjectConfig[] => {
    const profileSubjects = profile?.selectedSubjects || ["Қазақстан тарихы", "Оқу сауаттылығы", "Мат. сауаттылық", "Математика", "Физика"];
    
    return [
      { name: "Қазақстан тарихы", count: 20, threshold: 5 },
      { name: "Оқу сауаттылығы", count: 10, threshold: 3 },
      { name: "Математикалық сауаттылық", count: 10, threshold: 3 },
      { name: profileSubjects[3] || "1-бейіндік пән", count: 40, threshold: 5 },
      { name: profileSubjects[4] || "2-бейіндік пән", count: 40, threshold: 5 },
    ];
  };

  const subjectConfigs = getSubjectConfigs();

  useEffect(() => {
    if (!user) return;

    const sessionsRef = collection(db, "studentProfiles", user.uid, "testSessions");
    const q = query(sessionsRef, orderBy("createdAt", "desc"), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestSession[];
      setRecentSessions(sessions);
    }, (err) => {
      console.error("Firestore snapshot error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const startTest = async () => {
    setErrorMessage(null);
    setTestState("loading");
    setCurrentSubjectIndex(0);
    setResults([]);
    await loadSubjectQuestions(subjectConfigs[0], 0);
  };

  const loadSubjectQuestions = async (config: SubjectConfig, subjectIdx: number) => {
    try {
      const { questions: newQuestions } = await generateUntQuestions({ 
        subject: config.name, 
        count: config.count 
      });
      
      const updatedQuestions = newQuestions.map((q, idx) => {
        let points = 1;
        if (subjectIdx >= 3) {
          if (idx >= 30) points = 2; 
        }
        return { ...q, points };
      });

      setQuestions(updatedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestState("testing");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      let msg = "Сұрақтарды жүктеу мүмкін болмады.";
      if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        msg = "AI квотасы (тегін лимит) аяқталды. Сәлден соң (1-2 минут) қайта көріңіз.";
      }
      setErrorMessage(msg);
      setTestState("error");
      toast({ title: "Қате", description: msg, variant: "destructive" });
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: option });
  };

  const nextStep = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let score = 0;
      let correct = 0;
      let maxScore = 0;
      
      questions.forEach((q, idx) => {
        maxScore += q.points;
        if (answers[idx] === q.correctAnswer) {
          score += q.points;
          correct++;
        }
      });

      const config = subjectConfigs[currentSubjectIndex];
      const subjectResult: SubjectResult = {
        subject: config.name,
        score,
        maxScore,
        correct,
        total: questions.length,
        isThresholdPassed: score >= config.threshold
      };

      const newResults = [...results, subjectResult];
      setResults(newResults);

      if (currentSubjectIndex < subjectConfigs.length - 1) {
        setTestState("loading");
        const nextIdx = currentSubjectIndex + 1;
        setCurrentSubjectIndex(nextIdx);
        await loadSubjectQuestions(subjectConfigs[nextIdx], nextIdx);
      } else {
        finishTest(newResults);
      }
    }
  };

  const finishTest = async (finalResults: SubjectResult[]) => {
    setTestState("results");
    
    const totalScore = finalResults.reduce((acc, r) => acc + r.score, 0);

    if (user) {
      const testSession = {
        studentId: user.uid,
        type: "practice_2026",
        score: totalScore,
        results: finalResults,
        createdAt: serverTimestamp(),
      };
      
      try {
        await addDoc(collection(db, "studentProfiles", user.uid, "testSessions"), testSession);
        await updateUserRating(user.uid, totalScore >= 120 ? 'TEST_EXCELLENT' : 'CORRECT_ANSWER');
      } catch (e) {
        console.error("Save result error:", e);
      }
    }
  };

  if (testState === "loading") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <Loader2 className="size-16 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="size-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-bold text-xl">{subjectConfigs[currentSubjectIndex].name}</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              {subjectConfigs[currentSubjectIndex].count} сұрақ дайындалуда...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "error") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
          <div className="size-20 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="size-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-headline">Байланыс қатесі</h2>
            <p className="text-muted-foreground text-sm">
              {errorMessage || "AI жүйесіне қосылу кезінде қате орын алды."}
            </p>
          </div>
          <div className="flex gap-4 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setTestState("idle")}>Артқа қайту</Button>
            <Button className="flex-1 gap-2" onClick={startTest}>
              <RefreshCcw className="size-4" /> Қайта көру
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "results") {
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const isAllPassed = results.every(r => r.isThresholdPassed);

    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-4">
            <div className="inline-flex size-24 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center mb-2 shadow-inner">
              <Trophy className="size-12 drop-shadow-sm" />
            </div>
            <h1 className="text-4xl font-black font-headline">2026 ҰБТ Нәтижесі</h1>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black text-primary tracking-tighter">{totalScore}</span>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">140 балдан</span>
            </div>
            {!isAllPassed && (
              <Badge variant="destructive" className="px-4 py-1">Шекті балл жиналмаған пәндер бар</Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((r, i) => (
              <Card key={i} className={`border-none shadow-sm overflow-hidden ${!r.isThresholdPassed ? 'ring-2 ring-destructive/20' : ''}`}>
                <div className={`h-1.5 ${i < 3 ? 'bg-blue-500' : 'bg-primary'}`} />
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{r.subject}</CardTitle>
                    <Badge variant={r.isThresholdPassed ? "secondary" : "destructive"} className="text-[10px]">
                      {r.score} балл
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase">
                    <span>Дұрыс: {r.correct} / {r.total}</span>
                    <span className={r.isThresholdPassed ? "text-green-600" : "text-destructive"}>
                      {r.isThresholdPassed ? "Өтті" : "Шекті: " + subjectConfigs[i].threshold}
                    </span>
                  </div>
                  <Progress value={(r.score / r.maxScore) * 100} className="h-2 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" size="lg" className="px-8" onClick={() => setTestState("idle")}>Басты бетке</Button>
            <Button size="lg" className="px-8 font-bold" onClick={startTest}>Қайта тапсыру</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "testing") {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <div className="flex flex-col">
                <Badge variant="outline" className="w-fit mb-1 bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                  {subjectConfigs[currentSubjectIndex].name}
                </Badge>
                <span className="text-2xl font-black font-headline">Сұрақ {currentQuestionIndex + 1} / {questions.length}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Жалпы барысы</span>
                <span className="text-sm font-black text-primary">Пән {currentSubjectIndex + 1} / 5</span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full" />
          </div>

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
            <CardHeader className="p-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-accent/50 px-2 py-1 rounded">
                  {q.points} БАЛЛЫҚ СҰРАҚ
                </span>
              </div>
              <CardTitle className="text-xl md:text-2xl leading-relaxed font-bold">
                {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-3">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestionIndex] === letter;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(letter)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-5 group active:scale-[0.98] ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                        : "border-border hover:border-primary/30 hover:bg-accent/5"
                    }`}
                  >
                    <span className={`size-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all ${
                      isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg" : "group-hover:border-primary/50"
                    }`}>
                      {letter}
                    </span>
                    <span className={`font-semibold text-base ${isSelected ? "text-primary" : ""}`}>{opt}</span>
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="bg-accent/5 p-6 border-t flex justify-between">
              <Button variant="ghost" className="font-bold" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
                Артқа
              </Button>
              <Button className="gap-2 px-10 h-12 font-black text-lg shadow-lg shadow-primary/20" disabled={!answers[currentQuestionIndex]} onClick={nextStep}>
                {currentQuestionIndex === questions.length - 1 
                  ? (currentSubjectIndex === subjectConfigs.length - 1 ? "Аяқтау" : "Келесі пән") 
                  : "Келесі сұрақ"}
                <ArrowRight className="size-5" />
              </Button>
            </CardFooter>
          </Card>
          
          <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            2026 ҰБТ Стандарты бойынша
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <ClipboardCheck className="size-8 text-primary" />
            Практикалық жаттығу (ҰБТ 2026)
          </h1>
          <p className="text-muted-foreground text-sm">Жаңа формат бойынша 120 сұрақ және 140 балдық шкаламен дайындал.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative group">
            <CardHeader className="relative z-10 p-8">
              <Badge className="bg-white/20 text-white w-fit mb-4 font-bold">2026 ФОРМАТ</Badge>
              <CardTitle className="text-4xl md:text-5xl font-black font-headline leading-tight">Толық ҰБТ Тесті</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg max-w-md mt-4 leading-relaxed">
                5 пән бойынша кешенді тексеру. Жаңа шкаламен (140 балл) деңгейіңді анықта.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 px-8 pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-black tracking-tighter">120</span>
                  <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Сұрақ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black tracking-tighter">140</span>
                  <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Макс балл</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black tracking-tighter">5</span>
                  <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Пән</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black tracking-tighter">+20</span>
                  <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Рейтинг</span>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="mt-12 font-black h-16 px-12 text-xl gap-4 shadow-2xl hover:scale-105 transition-transform" onClick={startTest}>
                ТЕСТТІ БАСТАУ <Play className="size-6 fill-current" />
              </Button>
            </CardContent>
            <div className="absolute -bottom-20 -right-20 size-96 bg-white/10 rounded-full blur-3xl" />
            <Zap className="absolute top-10 right-10 size-48 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm h-fit">
              <CardHeader className="pb-3 border-b bg-accent/5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="size-4 text-primary" />
                  Соңғы нәтижелер
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 hover:bg-accent/5 transition-colors">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">ҰБТ Тесті</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {item.createdAt?.seconds 
                              ? format(new Date(item.createdAt.seconds * 1000), "d MMMM, HH:mm", { locale: kk }) 
                              : "Жақында"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black ${item.score >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.score}/140
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-xs text-muted-foreground italic">
                      Әлі тест тапсырылмаған
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
