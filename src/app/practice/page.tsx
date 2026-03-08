"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ClipboardCheck, Zap, History, Play, Loader2, ArrowRight, CheckCircle2, XCircle, Trophy, AlertTriangle } from "lucide-react";
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

type SubjectResult = {
  subject: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
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
  
  const [testState, setTestState] = useState<"idle" | "loading" | "testing" | "results">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  
  const subjects = profile?.selectedSubjects || ["Қазақстан тарихы", "Оқу сауаттылығы", "Мат. сауаттылық", "Математика", "Физика"];

  // Fetch recent sessions
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
    });

    return () => unsubscribe();
  }, [user]);

  const startTest = async () => {
    setTestState("loading");
    setCurrentSubjectIndex(0);
    setResults([]);
    await loadSubjectQuestions(subjects[0]);
  };

  const loadSubjectQuestions = async (subject: string) => {
    try {
      const { questions: newQuestions } = await generateUntQuestions({ 
        subject, 
        count: subject.includes("сауаттылық") ? 3 : 5 
      });
      setQuestions(newQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestState("testing");
    } catch (error) {
      toast({ title: "Қате", description: "Сұрақтарды жүктеу мүмкін болмады.", variant: "destructive" });
      setTestState("idle");
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

      const subjectResult: SubjectResult = {
        subject: subjects[currentSubjectIndex],
        score,
        maxScore,
        correct,
        total: questions.length
      };

      const newResults = [...results, subjectResult];
      setResults(newResults);

      if (currentSubjectIndex < subjects.length - 1) {
        setTestState("loading");
        const nextIdx = currentSubjectIndex + 1;
        setCurrentSubjectIndex(nextIdx);
        await loadSubjectQuestions(subjects[nextIdx]);
      } else {
        finishTest(newResults);
      }
    }
  };

  const finishTest = async (finalResults: SubjectResult[]) => {
    setTestState("results");
    
    let totalUntScore = 0;
    finalResults.forEach((r, idx) => {
      let weight = idx < 3 ? (idx === 0 ? 20 : 10) : 50;
      totalUntScore += (r.score / r.maxScore) * weight;
    });

    const finalScore = Math.round(totalUntScore);

    if (user) {
      const testSession = {
        studentId: user.uid,
        type: "practice",
        score: finalScore,
        results: finalResults,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "studentProfiles", user.uid, "testSessions"), testSession);
      await updateUserRating(user.uid, finalScore >= 120 ? 'TEST_EXCELLENT' : 'CORRECT_ANSWER');
    }
  };

  if (testState === "loading") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="font-bold text-lg animate-pulse">{subjects[currentSubjectIndex]} сұрақтары дайындалуда...</p>
        </div>
      </AppShell>
    );
  }

  if (testState === "results") {
    const totalScore = Math.round(results.reduce((acc, r, idx) => {
      let weight = idx < 3 ? (idx === 0 ? 20 : 10) : 50;
      return acc + (r.score / r.maxScore) * weight;
    }, 0));

    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-4">
            <div className="inline-flex size-20 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center mb-2">
              <Trophy className="size-10" />
            </div>
            <h1 className="text-4xl font-black font-headline">Тест аяқталды!</h1>
            <div className="flex flex-col items-center">
              <span className="text-7xl font-black text-primary">{totalScore}</span>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">140 балдан</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((r, i) => (
              <Card key={i} className="border-none shadow-sm overflow-hidden">
                <div className={`h-1 ${i < 3 ? 'bg-blue-500' : 'bg-primary'}`} />
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">{r.subject}</CardTitle>
                    <Badge variant="secondary">{Math.round((r.score / r.maxScore) * (i < 3 ? (i === 0 ? 20 : 10) : 50))} балл</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 text-xs text-muted-foreground">
                  Дұрыс жауап: {r.correct} / {r.total}
                  <Progress value={(r.correct/r.total)*100} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setTestState("idle")}>Басты бетке</Button>
            <Button onClick={startTest}>Қайта тапсыру</Button>
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
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-primary tracking-widest">{subjects[currentSubjectIndex]}</span>
              <span className="text-sm font-bold">Сұрақ {currentQuestionIndex + 1} / {questions.length}</span>
            </div>
            <Badge variant="outline" className="font-mono">
              Пән {currentSubjectIndex + 1} / 5
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />

          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl leading-relaxed font-headline font-bold">
                {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestionIndex] === letter;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(letter)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                        : "border-border hover:border-primary/30 hover:bg-accent/5"
                    }`}
                  >
                    <span className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground border-primary" : "group-hover:border-primary/50"
                    }`}>
                      {letter}
                    </span>
                    <span className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>{opt}</span>
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="bg-accent/5 py-4 border-t flex justify-between">
              <Button variant="ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
                Артқа
              </Button>
              <Button className="gap-2 px-8 font-bold" disabled={!answers[currentQuestionIndex]} onClick={nextStep}>
                {currentQuestionIndex === questions.length - 1 
                  ? (currentSubjectIndex === subjects.length - 1 ? "Аяқтау" : "Келесі пән") 
                  : "Келесі сұрақ"}
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>
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
            Практикалық жаттығу
          </h1>
          <p className="text-muted-foreground text-sm">ҰБТ форматындағы тесттер арқылы 140 балдық мүмкіндігіңді анықта.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative group">
            <CardHeader className="relative z-10">
              <Badge className="bg-white/20 text-white w-fit mb-2">ҰБТ СИМУЛЯТОРЫ</Badge>
              <CardTitle className="text-3xl font-black font-headline">Толық ҰБТ Тесті</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-base max-w-md mt-2">
                Барлық 5 пән бойынша кешенді тексеру. Нәтиже 140 балдық шкаламен есептеледі.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex flex-col">
                  <span className="text-3xl font-black">5</span>
                  <span className="text-[10px] uppercase font-bold opacity-70">Пән</span>
                </div>
                <div className="size-px h-8 bg-white/20" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black">140</span>
                  <span className="text-[10px] uppercase font-bold opacity-70">Макс балл</span>
                </div>
                <div className="size-px h-8 bg-white/20" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black">+20</span>
                  <span className="text-[10px] uppercase font-bold opacity-70">Рейтинг ұпайы</span>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="mt-10 font-black h-14 px-10 gap-3 shadow-xl hover:scale-105 transition-transform" onClick={startTest}>
                ТЕСТТІ БАСТАУ <Play className="size-5 fill-current" />
              </Button>
            </CardContent>
            <div className="absolute -bottom-10 -right-10 size-64 bg-white/10 rounded-full blur-3xl" />
            <Zap className="absolute top-10 right-10 size-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
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
                          <p className="font-bold text-sm">Толық ҰБТ Тесті</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {item.createdAt?.seconds 
                              ? format(new Date(item.createdAt.seconds * 1000), "d MMMM, HH:mm", { locale: kk }) 
                              : "Жақында"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black ${item.score >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.score}/140
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Әлі тест тапсырылмаған
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="size-4" />
                  Кеңес
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-orange-700 leading-relaxed font-medium">
                  ҰБТ-да уақытты тиімді пайдалану үшін әр сұраққа 1.5 минуттан артық жұмсамауға тырысыңыз.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
