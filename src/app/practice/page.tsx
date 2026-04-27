
"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ClipboardCheck, Zap, History, Play, Loader2, ArrowRight, CheckCircle2, Trophy, Lock, Calendar, BookOpen, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { updateUserRating } from "@/lib/rating";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, setDoc, getDocs } from "firebase/firestore";
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
  
  const [testState, setTestState] = useState<"idle" | "loading" | "selecting_subject" | "testing" | "results" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(-1);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [allTestAnswers, setAllTestAnswers] = useState<any[]>([]);
  const [clientDate, setClientDate] = useState<Date | null>(null);

  useEffect(() => {
    setClientDate(new Date());
  }, []);
  
  const subjectConfigs = useMemo((): SubjectConfig[] => {
    const profileSubjects = profile?.selectedSubjects || ["Қазақстан тарихы", "Оқу сауаттылығы", "Математикалық сауаттылық", "Математика", "Физика"];
    
    return [
      { name: "Қазақстан тарихы", count: 20, threshold: 5 },
      { name: "Оқу сауаттылығы", count: 10, threshold: 3 },
      { name: "Математикалық сауаттылық", count: 10, threshold: 3 },
      { name: profileSubjects[3] || "1-бейіндік пән", count: 40, threshold: 5 },
      { name: profileSubjects[4] || "2-бейіндік пән", count: 40, threshold: 5 },
    ];
  }, [profile]);

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

  const hasTakenTestThisWeek = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0 || !clientDate) return false;
    return recentSessions.some(session => {
      if (!session.createdAt) return false;
      const sessionDate = session.createdAt.toDate ? session.createdAt.toDate() : new Date(session.createdAt.seconds * 1000);
      return isSameWeek(sessionDate, clientDate, { weekStartsOn: 1 });
    });
  }, [recentSessions, clientDate]);

  const initiateTest = async () => {
    if (hasTakenTestThisWeek) {
      toast({
        title: "Апталық лимит",
        description: "Сіз осы аптада тест тапсырып қойдыңыз.",
        variant: "destructive"
      });
      return;
    }
    setErrorMessage(null);
    setResults([]);
    setAllTestAnswers([]);
    setTestState("selecting_subject");
  };

  const loadSubjectQuestions = async (subjectIdx: number) => {
    const config = subjectConfigs[subjectIdx];
    setTestState("loading");
    setCurrentSubjectIndex(subjectIdx);
    
    try {
      const subjectId = config.name.toLowerCase().replace(/\s+/g, '-');
      const topicsRef = collection(db, "subjects", subjectId, "topics");
      const topicsSnap = await getDocs(topicsRef);
      
      let dbQuestions: any[] = [];
      if (!topicsSnap.empty) {
        for (const topicDoc of topicsSnap.docs.slice(0, 2)) {
          const qRef = collection(db, "subjects", subjectId, "topics", topicDoc.id, "questions");
          const qSnap = await getDocs(query(qRef, limit(config.count)));
          dbQuestions = [...dbQuestions, ...qSnap.docs.map(d => d.data())];
        }
      }

      let finalQuestions: Question[] = [];

      if (dbQuestions.length >= config.count) {
        finalQuestions = dbQuestions.slice(0, config.count).map((q, idx) => ({
          id: idx.toString(),
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          points: (subjectIdx >= 3 && idx >= 30) ? 2 : 1
        }));
      } else {
        const { questions: aiQuestions } = await generateUntQuestions({ 
          subject: config.name, 
          count: config.count 
        });
        
        finalQuestions = (aiQuestions || []).map((q, idx) => ({
          ...q,
          points: (subjectIdx >= 3 && idx >= 30) ? 2 : 1
        }));
      }

      setQuestions(finalQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestState("testing");
    } catch (error: any) {
      setErrorMessage("Сұрақтарды жүктеу мүмкін болмады.");
      setTestState("error");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: option });
  };

  const nextStep = async () => {
    const currentConfig = subjectConfigs[currentSubjectIndex];
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate subject results
      const subjectAnswers = questions.map((q, idx) => ({
        question: q.text,
        correctAnswer: q.correctAnswer,
        studentAnswer: answers[idx] || "Жауап берілмеді",
        isCorrect: answers[idx] === q.correctAnswer,
        subject: currentConfig.name,
        explanation: q.explanation,
        points: q.points
      }));

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
      
      // Return to subject selection
      setTestState("selecting_subject");
    }
  };

  const finishTest = async () => {
    setTestState("loading");
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);

    if (user) {
      const sessionId = Math.random().toString(36).substring(7);
      const testSession = {
        studentId: user.uid,
        type: "full_unt_attempt",
        score: totalScore,
        results,
        createdAt: serverTimestamp(),
      };
      
      try {
        const sessionRef = doc(db, "studentProfiles", user.uid, "testSessions", sessionId);
        await setDoc(sessionRef, testSession);
        
        const missed = allTestAnswers.filter(ans => !ans.isCorrect);
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
          description: `Нәтиже: ${totalScore} балл.`,
        });
        setTestState("results");
      } catch (e) {
        console.error(e);
        setTestState("error");
      }
    }
  };

  if (testState === "loading") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="relative">
            <Loader2 className="size-20 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="size-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-2xl font-headline">
              {currentSubjectIndex !== -1 ? subjectConfigs[currentSubjectIndex].name : "Тест дайындалуда"}
            </p>
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Сұрақтар жүктелуде...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "selecting_subject") {
    const isAllCompleted = results.length === subjectConfigs.length;
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black font-headline tracking-tight">Қай пәннен бастаймыз?</h1>
            <p className="text-muted-foreground font-medium text-lg">Тест тапсыру ретін өзіңіз таңдаңыз.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjectConfigs.map((config, idx) => {
              const result = results.find(r => r.subject === config.name);
              const isCompleted = !!result;

              return (
                <Card 
                  key={idx} 
                  className={`border-none shadow-md overflow-hidden transition-all group ${isCompleted ? 'bg-green-50/50 opacity-80' : 'bg-white hover:ring-2 hover:ring-primary/20 cursor-pointer'}`}
                  onClick={() => !isCompleted && loadSubjectQuestions(idx)}
                >
                  <CardHeader className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all'}`}>
                        {isCompleted ? <CheckCircle2 className="size-6" /> : <BookOpen className="size-6" />}
                      </div>
                      <Badge variant="outline" className={`font-black text-[9px] ${isCompleted ? 'border-green-200 text-green-600' : ''}`}>
                        {config.count} СҰРАҚ
                      </Badge>
                    </div>
                    <CardTitle className={`text-xl font-black ${isCompleted ? 'text-green-800' : ''}`}>{config.name}</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-1">Шекті балл: {config.threshold}</CardDescription>
                  </CardHeader>
                  {isCompleted && (
                    <CardFooter className="px-6 pb-6 pt-0">
                      <p className="text-xs font-black text-green-600 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" /> Орындалды
                      </p>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>

          {isAllCompleted ? (
            <div className="pt-10 flex flex-col items-center gap-6">
              <div className="size-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-xl animate-bounce">
                <Trophy className="size-10" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black">Барлық пәндер аяқталды!</h2>
                <p className="text-muted-foreground font-medium">Жалпы нәтижені көру үшін батырманы басыңыз.</p>
              </div>
              <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 gap-3" onClick={finishTest}>
                Нәтижені көру <ArrowRight className="size-6" />
              </Button>
            </div>
          ) : (
            <div className="pt-8 border-t border-dashed flex justify-center">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <LayoutGrid className="size-4 text-primary" />
                Тестті аяқтау үшін барлық пәндерді орындау қажет.
              </p>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  if (testState === "results") {
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 text-center py-10 animate-in zoom-in-95 duration-500">
          <div className="size-28 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-xl border-8 border-white">
            <Trophy className="size-14" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black font-headline tracking-tighter text-slate-900 leading-none">
              {totalScore} <span className="text-2xl text-muted-foreground font-bold tracking-normal">/ 140 балл</span>
            </h1>
            <p className="text-lg font-bold text-primary uppercase tracking-[0.2em]">Құттықтаймыз! ҰБТ сәтті өтті.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-8">
            {results.map((r, i) => (
              <Card key={i} className="border-none shadow-md p-6 text-left bg-white rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">{r.subject}</p>
                  <p className="text-2xl font-black text-primary">{r.score} балл</p>
                  <div className="flex justify-between items-end mt-4 mb-1 text-[9px] font-bold text-muted-foreground">
                    <span>{r.correct} / {r.total} сұрақ</span>
                    <span>{Math.round((r.score/r.maxScore)*100)}%</span>
                  </div>
                  <Progress value={(r.score/r.maxScore)*100} className="h-1.5" />
                </div>
                <BookOpen className="absolute -bottom-4 -right-4 size-20 text-accent opacity-20 group-hover:scale-110 transition-transform" />
              </Card>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-10">
            <Button size="lg" className="rounded-2xl h-16 px-12 font-black text-lg shadow-xl shadow-primary/20" onClick={() => setTestState("idle")}>Дашбордқа қайту</Button>
            <Button variant="outline" size="lg" className="rounded-2xl h-16 px-12 font-black text-lg border-2" onClick={() => window.location.href='/analysis'}>Қатемен жұмыс</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "testing") {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / (questions.length || 1)) * 100;
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-lg">
                {subjectConfigs[currentSubjectIndex].name}
              </Badge>
              <h2 className="text-3xl font-black font-headline">Сұрақ {currentQuestionIndex + 1} / {questions.length}</h2>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">Пән балы</span>
               <Badge variant="secondary" className="font-black text-sm">+{q?.points || 1}</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 rounded-full bg-accent" />
          
          <Card className="border-none shadow-2xl bg-white p-8 md:p-10 rounded-[40px] border border-border/50">
            <h3 className="text-xl md:text-2xl font-bold leading-relaxed mb-10 text-slate-800">{q?.text || "Жүктелуде..."}</h3>
            <div className="grid gap-4">
              {q?.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestionIndex] === letter;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(letter)} 
                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center gap-5 group active:scale-[0.98] ${isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-slate-100 hover:border-primary/20 bg-white"}`}
                  >
                    <span className={`size-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all ${isSelected ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 group-hover:border-primary/30"}`}>{letter}</span>
                    <span className={`font-bold text-lg ${isSelected ? "text-primary" : "text-slate-700"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-between items-center px-4">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
              Артқа
            </Button>
            <Button 
              className="h-16 px-12 rounded-[24px] font-black text-xl gap-3 shadow-2xl shadow-primary/20" 
              disabled={!answers[currentQuestionIndex]} 
              onClick={nextStep}
            >
              {currentQuestionIndex === questions.length - 1 ? "Пәнді аяқтау" : "Келесі сұрақ"}
              <ArrowRight className="size-6" />
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
            <div className="size-14 rounded-[22px] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
               <ClipboardCheck className="size-8" />
            </div>
            ҰБТ Тестілеу (Mock Test)
          </h1>
          <p className="text-muted-foreground font-medium text-lg">Ресми 140 балдық шкала бойынша біліміңізді тексеріңіз.</p>
        </div>

        {hasTakenTestThisWeek && clientDate && (
          <Alert className="bg-orange-50 border-orange-200 text-orange-800 rounded-[32px] p-8 border-l-8 border-l-orange-500 animate-in fade-in slide-in-from-top-2">
            <Calendar className="h-6 w-6 text-orange-600" />
            <AlertTitle className="font-black text-xl">Апталық лимит</AlertTitle>
            <AlertDescription className="text-base font-medium mt-2 leading-relaxed">
              Сіз осы аптада тест тапсырып қойдыңыз. Жүйе аптасына бір рет толық нұсқаны тегін тапсыруға мүмкіндік береді. 
              Келесі мүмкіндік келесі дүйсенбі күні ашылады.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8">
          <Card className={`border-none shadow-xl bg-white rounded-[48px] overflow-hidden flex flex-col group transition-all relative ${hasTakenTestThisWeek ? 'opacity-75' : 'hover:shadow-2xl hover:-translate-y-1'}`}>
            <div className="h-3 bg-gradient-to-r from-primary via-indigo-500 to-primary/50" />
            <CardHeader className="p-10 md:p-12">
              <Badge variant="secondary" className="w-fit mb-6 font-black py-1.5 px-4 rounded-xl bg-primary/10 text-primary border-none">АПТАСЫНА 1 РЕТ</Badge>
              <CardTitle className="text-4xl font-black font-headline tracking-tight">Толық ҰБТ нұсқасы</CardTitle>
              <CardDescription className="text-lg font-medium mt-4 max-w-2xl leading-relaxed">
                Базадағы сұрақтар мен AI көмегімен құрастырылған 120 сұрақтан тұратын кешенді тест. 
                Барлық 5 пәнді қамтиды (3 міндетті + 2 таңдау пәні).
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-10 md:p-12 pt-0">
              <Button 
                size="lg" 
                className="w-full h-20 rounded-[32px] font-black text-2xl gap-4 shadow-2xl shadow-primary/30 transition-all active:scale-95"
                onClick={initiateTest}
                disabled={hasTakenTestThisWeek || !clientDate}
              >
                {hasTakenTestThisWeek ? <><Lock className="size-8" /> Лимит орындалды</> : <><Play className="size-8 fill-current" /> Тестті бастау</>}
              </Button>
            </CardFooter>
            <Zap className="absolute -top-10 -right-10 size-48 text-primary/5 rotate-12 pointer-events-none" />
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h2 className="text-2xl font-black font-headline flex items-center gap-3">
              <History className="size-6 text-primary" /> 
              Соңғы нәтижелер
            </h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((item) => (
                <Card key={item.id} className="border-none shadow-sm bg-white p-6 rounded-[28px] flex justify-between items-center hover:shadow-md transition-all border border-border/30">
                  <div className="space-y-1">
                    <p className="font-black text-base text-slate-800 uppercase tracking-tight">ҰБТ Тесті</p>
                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      {item.createdAt?.seconds ? format(new Date(item.createdAt.seconds * 1000), "d MMMM, yyyy", { locale: kk }) : "Жақында"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`text-3xl font-black tabular-nums ${item.score >= 120 ? 'text-green-600' : item.score >= 100 ? 'text-primary' : 'text-orange-500'}`}>{item.score}</span>
                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">балл</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-muted/5 rounded-[40px] border-4 border-dashed border-white">
                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/20">
                  <History className="size-8" />
                </div>
                <p className="text-muted-foreground font-bold italic text-lg">Әзірге тест тапсырылмаған.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

