"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ClipboardCheck, Zap, History, Play, Loader2, ArrowRight, CheckCircle2, Trophy, AlertTriangle, RefreshCcw, Info, Calendar, CreditCard, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { updateUserRating } from "@/lib/rating";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, setDoc } from "firebase/firestore";
import { format, isSameWeek } from "date-fns";
import { kk } from "date-fns/locale";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  
  const [testState, setTestState] = useState<"idle" | "payment" | "loading" | "testing" | "results" | "error">("idle");
  const [testMode, setTestMode] = useState<"free" | "paid">("free");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [allTestAnswers, setAllTestAnswers] = useState<any[]>([]);
  
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
    const q = query(sessionsRef, orderBy("createdAt", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestSession[];
      setRecentSessions(sessions);
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: sessionsRef.path,
        operation: 'list'
      }));
    });

    return () => unsubscribe();
  }, [user]);

  const isFreeLimitReached = useMemo(() => {
    const freeSessions = recentSessions.filter(s => s.type === "free_weekly");
    if (freeSessions.length === 0) return false;
    
    const lastSession = freeSessions[0];
    if (!lastSession.createdAt?.seconds) return false;
    
    const lastDate = new Date(lastSession.createdAt.seconds * 1000);
    return isSameWeek(lastDate, new Date(), { weekStartsOn: 1 });
  }, [recentSessions]);

  const handleStartFree = () => {
    if (isFreeLimitReached) {
      toast({
        title: "Шектеу",
        description: "Тегін тест аптасына 1 рет қана. Ақылы нұсқаны таңдаңыз немесе келесі аптаны күтіңіз.",
        variant: "destructive"
      });
      return;
    }
    setTestMode("free");
    initiateTest();
  };

  const handleStartPaid = () => {
    setTestMode("paid");
    setTestState("payment");
  };

  const handlePaymentConfirm = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      initiateTest();
      toast({ title: "Төлем сәтті өтті!", description: "Тест басталды." });
    }, 1500);
  };

  const openKaspiLink = () => {
    window.open("https://pay.kaspi.kz/pay/52tookf8", "_blank");
  };

  const initiateTest = async () => {
    setErrorMessage(null);
    setTestState("loading");
    setCurrentSubjectIndex(0);
    setResults([]);
    setAllTestAnswers([]);
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
      let msg = "Сұрақтарды жүктеу мүмкін болмады.";
      if (error.message?.includes("AI_QUOTA_EXCEEDED") || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        msg = "AI квотасы аяқталды. Сәлден соң (1-2 минут) қайта көріңіз.";
      }
      setErrorMessage(msg);
      setTestState("error");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: option });
  };

  const nextStep = async () => {
    const currentConfig = subjectConfigs[currentSubjectIndex];
    
    const subjectAnswers = questions.map((q, idx) => ({
      question: q.text,
      correctAnswer: q.correctAnswer,
      studentAnswer: answers[idx] || "Жауап берілмеді",
      isCorrect: answers[idx] === q.correctAnswer,
      subject: currentConfig.name,
      explanation: q.explanation,
      points: q.points
    }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let score = 0;
      let correct = 0;
      let maxScore = 0;
      
      subjectAnswers.forEach((ans) => {
        maxScore += ans.points;
        if (ans.isCorrect) {
          score += ans.points;
          correct++;
        }
      });

      const subjectResult: SubjectResult = {
        subject: currentConfig.name,
        score,
        maxScore,
        correct,
        total: questions.length,
        isThresholdPassed: score >= currentConfig.threshold
      };

      const newResults = [...results, subjectResult];
      setResults(newResults);
      setAllTestAnswers([...allTestAnswers, ...subjectAnswers]);

      if (currentSubjectIndex < subjectConfigs.length - 1) {
        setTestState("loading");
        const nextIdx = currentSubjectIndex + 1;
        setCurrentSubjectIndex(nextIdx);
        await loadSubjectQuestions(subjectConfigs[nextIdx], nextIdx);
      } else {
        finishTest(newResults, [...allTestAnswers, ...subjectAnswers]);
      }
    }
  };

  const finishTest = async (finalResults: SubjectResult[], finalAnswers: any[]) => {
    setTestState("results");
    const totalScore = finalResults.reduce((acc, r) => acc + r.score, 0);

    if (user) {
      const sessionId = Math.random().toString(36).substring(7);
      const testSession = {
        studentId: user.uid,
        type: testMode === "free" ? "free_weekly" : "paid_attempt",
        score: totalScore,
        results: finalResults,
        createdAt: serverTimestamp(),
      };
      
      try {
        const sessionRef = doc(db, "studentProfiles", user.uid, "testSessions", sessionId);
        await setDoc(sessionRef, testSession);
        
        const missed = finalAnswers.filter(ans => !ans.isCorrect);
        const mistakesRef = collection(db, "studentProfiles", user.uid, "mistakes");
        
        for (const m of missed) {
          addDoc(mistakesRef, {
            studentId: user.uid,
            testSessionId: sessionId,
            question: m.question,
            correctAnswer: m.correctAnswer,
            studentAnswer: m.studentAnswer,
            subject: m.subject,
            explanation: m.explanation || "",
            createdAt: serverTimestamp()
          }).catch(() => {});
        }

        await updateUserRating(user.uid, totalScore >= 120 ? 'TEST_EXCELLENT' : 'CORRECT_ANSWER');
        
        toast({
          title: "Тест аяқталды!",
          description: `Нәтиже: ${totalScore} балл. Қателер сақталды.`,
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (testState === "payment") {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4">
          <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="bg-primary/5 p-10 text-center border-b">
              <div className="size-20 rounded-3xl bg-primary text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                <CreditCard className="size-10" />
              </div>
              <CardTitle className="text-3xl font-black font-headline">Нұсқаны сатып алу</CardTitle>
              <CardDescription className="font-bold text-lg">1 толық ҰБТ нұсқасы (120 сұрақ)</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="flex justify-between items-center p-6 rounded-3xl bg-accent/30 border-2 border-dashed border-primary/20">
                <p className="font-black text-xl">ҰБТ Нұсқасы #2026</p>
                <p className="text-3xl font-black text-primary">390 ₸</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Төлем әдісі:</p>
                <button 
                  onClick={openKaspiLink}
                  className="w-full p-6 rounded-3xl border-2 border-primary bg-primary/5 flex flex-col items-center gap-3 cursor-pointer hover:bg-primary/10 transition-all group"
                >
                  <QrCode className="size-12 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="text-sm font-black uppercase text-primary">Kaspi арқылы төлеу</span>
                    <p className="text-[10px] text-primary/60 font-bold">Сілтеме бойынша өту</p>
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3">
                <Info className="size-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Төлем жасап болған соң, «Төледім, растау» батырмасын басыңыз.
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-10 pt-0 flex flex-col gap-4">
              <Button className="w-full h-16 rounded-2xl font-black text-xl shadow-lg" onClick={handlePaymentConfirm} disabled={isProcessingPayment}>
                {isProcessingPayment ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 size-6" />}
                {isProcessingPayment ? "Тексерілуде..." : "Төледім, растау"}
              </Button>
              <Button variant="ghost" className="w-full font-bold" onClick={() => setTestState("idle")}>Бас тарту</Button>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (testState === "loading") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="size-16 animate-spin text-primary opacity-20" />
          <div className="text-center space-y-2">
            <p className="font-bold text-xl">{subjectConfigs[currentSubjectIndex].name}</p>
            <p className="text-sm text-muted-foreground animate-pulse">Сұрақтар жүктелуде...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "results") {
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 text-center py-10 animate-in zoom-in-95">
          <div className="size-24 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Trophy className="size-12" />
          </div>
          <h1 className="text-5xl font-black font-headline tracking-tighter">Нәтиже: {totalScore} / 140</h1>
          <div className="grid gap-4 md:grid-cols-3 pt-8">
            {results.map((r, i) => (
              <Card key={i} className="border-none shadow-sm p-6 text-left bg-white rounded-3xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{r.subject}</p>
                <p className="text-2xl font-black text-primary">{r.score} балл</p>
                <Progress value={(r.score/r.maxScore)*100} className="h-1 mt-3" />
              </Card>
            ))}
          </div>
          <Button size="lg" className="mt-10 rounded-2xl h-14 px-10 font-bold" onClick={() => setTestState("idle")}>Басты бетке қайту</Button>
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
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <Badge className="bg-primary/10 text-primary border-none">{subjectConfigs[currentSubjectIndex].name}</Badge>
              <h2 className="text-2xl font-black font-headline">Сұрақ {currentQuestionIndex + 1} / {questions.length}</h2>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase">Пән {currentSubjectIndex + 1} / 5</span>
          </div>
          <Progress value={progress} className="h-1.5 rounded-full" />
          <Card className="border-none shadow-xl bg-white p-8 rounded-[32px]">
            <h3 className="text-xl md:text-2xl font-bold leading-relaxed mb-8">{q.text}</h3>
            <div className="grid gap-4">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestionIndex] === letter;
                return (
                  <button key={i} onClick={() => handleAnswer(letter)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/20"}`}>
                    <span className={`size-10 rounded-xl border-2 flex items-center justify-center font-black ${isSelected ? "bg-primary text-white border-primary" : ""}`}>{letter}</span>
                    <span className="font-bold">{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="flex justify-between items-center px-2">
            <Button variant="ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>Артқа</Button>
            <Button className="h-14 px-10 rounded-2xl font-black text-lg gap-2" disabled={!answers[currentQuestionIndex]} onClick={nextStep}>
              {currentQuestionIndex === questions.length - 1 ? "Жалғастыру" : "Келесі сұрақ"}
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
            <ClipboardCheck className="size-10 text-primary" />
            ҰБТ Тестілеу (2026)
          </h1>
          <p className="text-muted-foreground font-medium">Өз біліміңді жаңа форматтағы 140 балдық шкаламен тексер.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Attempt Card */}
          <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden flex flex-col group hover:ring-2 ring-primary/20 transition-all">
            <div className="h-3 bg-primary/10" />
            <CardHeader className="p-8">
              <Badge variant="secondary" className="w-fit mb-4 font-black">ТЕГІН МҮМКІНДІК</Badge>
              <CardTitle className="text-3xl font-black font-headline">Апталық нұсқа</CardTitle>
              <CardDescription className="text-base font-medium mt-2">
                Аптасына 1 рет тегін тапсыру мүмкіндігі. Нәтижелер талдау бетінде сақталады.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-1">
              <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground p-4 bg-accent/20 rounded-2xl border-2 border-dashed border-accent/50">
                <Calendar className="size-5 text-primary" />
                {isFreeLimitReached ? "Бұл аптаға лимит аяқталды" : "Бұл аптаға қолжетімді: 1 мүмкіндік"}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button 
                size="lg" 
                className={`w-full h-16 rounded-2xl font-black text-xl gap-3 ${isFreeLimitReached ? "bg-muted text-muted-foreground cursor-not-allowed" : "shadow-xl shadow-primary/20"}`}
                disabled={isFreeLimitReached}
                onClick={handleStartFree}
              >
                {isFreeLimitReached ? "Келесі аптаны күтіңіз" : "Тестті бастау"}
                {!isFreeLimitReached && <Play className="size-6 fill-current" />}
              </Button>
            </CardFooter>
          </Card>

          {/* Paid Attempt Card */}
          <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[40px] overflow-hidden flex flex-col relative group hover:scale-[1.02] transition-all">
            <div className="h-3 bg-gradient-to-r from-primary to-secondary" />
            <CardHeader className="p-8 relative z-10">
              <Badge className="w-fit mb-4 font-black bg-white/20 text-white border-none">PREMIUM</Badge>
              <CardTitle className="text-3xl font-black font-headline">Кез келген уақытта</CardTitle>
              <CardDescription className="text-base font-medium mt-2 text-slate-400">
                Шектеусіз тапсыру. Әрбір жаңа нұсқа AI арқылы қайталанбас етіп құрастырылады.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-1 relative z-10">
              <div className="text-center py-6">
                <span className="text-5xl font-black tracking-tighter">390 ₸</span>
                <span className="text-sm font-bold text-slate-500 ml-2">/ 1 нұсқа</span>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 relative z-10">
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full h-16 rounded-2xl font-black text-xl gap-3 bg-white text-slate-900 hover:bg-slate-100 shadow-2xl"
                onClick={handleStartPaid}
              >
                Сатып алып, бастау
                <Zap className="size-6 fill-current" />
              </Button>
            </CardFooter>
            <div className="absolute -bottom-20 -right-20 size-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="size-5 text-primary" />
            Соңғы нәтижелер
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((item) => (
                <Card key={item.id} className="border-none shadow-sm bg-white p-5 rounded-2xl flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">ҰБТ Тесті</p>
                      <Badge variant="outline" className="text-[8px] h-4 py-0 font-bold uppercase">{item.type === 'free_weekly' ? 'Тегін' : 'Ақылы'}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      {item.createdAt?.seconds ? format(new Date(item.createdAt.seconds * 1000), "d MMMM", { locale: kk }) : "Жақында"}
                    </p>
                  </div>
                  <span className={`text-xl font-black ${item.score >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.score}/140
                  </span>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-accent/5 rounded-3xl border-2 border-dashed font-medium italic">
                Әлі тест тапсырылмаған
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
