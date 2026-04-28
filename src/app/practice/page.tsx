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
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestSession[];
      setRecentSessions(sessions);
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionsRef.path, operation: 'list' }));
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

  const initiateTest = () => {
    if (hasTakenTestThisWeek) {
      toast({ title: "Апталық лимит", description: "Сіз осы аптада тест тапсырып қойдыңыз.", variant: "destructive" });
      return;
    }
    setResults([]);
    setAllTestAnswers([]);
    setTestState("selecting_subject");
  };

  const loadSubjectQuestions = async (subjectIdx: number) => {
    const config = subjectConfigs[subjectIdx];
    setTestState("loading");
    setCurrentSubjectIndex(subjectIdx);
    try {
      const { questions: aiQuestions } = await generateUntQuestions({ subject: config.name, count: config.count });
      const finalQuestions = (aiQuestions || []).map((q, idx) => ({ ...q, points: (subjectIdx >= 3 && idx >= 30) ? 2 : 1 }));
      setQuestions(finalQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestState("testing");
    } catch (error: any) {
      setTestState("error");
    }
  };

  const handleAnswer = (option: string) => { setAnswers({ ...answers, [currentQuestionIndex]: option }); };

  const nextStep = () => {
    const currentConfig = subjectConfigs[currentSubjectIndex];
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const subjectAnswers = questions.map((q, idx) => ({
        question: q.text, correctAnswer: q.correctAnswer, studentAnswer: answers[idx] || "Жауап берілмеді",
        isCorrect: answers[idx] === q.correctAnswer, subject: currentConfig.name, explanation: q.explanation, points: q.points
      }));
      let score = 0, correct = 0, maxScore = 0;
      subjectAnswers.forEach((ans) => { maxScore += ans.points; if (ans.isCorrect) { score += ans.points; correct++; } });
      setResults([...results, { subject: currentConfig.name, score, maxScore, correct, total: questions.length, isThresholdPassed: score >= currentConfig.threshold }]);
      setAllTestAnswers([...allTestAnswers, ...subjectAnswers]);
      setTestState("selecting_subject");
    }
  };

  const finishTest = () => {
    setTestState("loading");
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    if (user) {
      const sessionId = Math.random().toString(36).substring(7);
      const testSession = { studentId: user.uid, type: "full_unt_attempt", score: totalScore, results, createdAt: serverTimestamp() };
      const sessionRef = doc(db, "studentProfiles", user.uid, "testSessions", sessionId);
      setDoc(sessionRef, testSession).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionRef.path, operation: 'create', requestResourceData: testSession }));
      });
      const missed = allTestAnswers.filter(ans => !ans.isCorrect);
      const mistakesRef = collection(db, "studentProfiles", user.uid, "mistakes");
      missed.forEach(m => {
        addDoc(mistakesRef, { ...m, studentId: user.uid, testSessionId: sessionId, createdAt: serverTimestamp() }).catch(() => {});
      });
      updateUserRating(user.uid, totalScore >= 120 ? 'TEST_EXCELLENT' : 'CORRECT_ANSWER');
      setTestState("results");
    }
  };

  if (testState === "loading") return <AppShell><div className="flex flex-col items-center justify-center min-h-[60vh] gap-6"><Loader2 className="size-20 animate-spin text-primary opacity-20" /><p className="font-black text-2xl">Жүктелуде...</p></div></AppShell>;

  if (testState === "selecting_subject") {
    const isAllCompleted = results.length === subjectConfigs.length;
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl font-black text-center">Қай пәннен бастаймыз?</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjectConfigs.map((config, idx) => {
              const isCompleted = results.some(r => r.subject === config.name);
              return (
                <Card key={idx} className={`p-6 cursor-pointer ${isCompleted ? 'bg-green-50 opacity-80' : 'bg-white hover:ring-2 hover:ring-primary'}`} onClick={() => !isCompleted && loadSubjectQuestions(idx)}>
                  <div className="flex justify-between items-start mb-4"><div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center">{isCompleted ? <CheckCircle2 className="size-6" /> : <BookOpen className="size-6" />}</div></div>
                  <CardTitle>{config.name}</CardTitle>
                  <p className="text-xs font-bold mt-2">{config.count} СҰРАҚ</p>
                </Card>
              );
            })}
          </div>
          {isAllCompleted && <Button size="lg" className="w-full h-16 rounded-2xl font-black text-xl" onClick={finishTest}>Нәтижені көру</Button>}
        </div>
      </AppShell>
    );
  }

  if (testState === "testing") {
    const q = questions[currentQuestionIndex];
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-black">{subjectConfigs[currentSubjectIndex].name} - {currentQuestionIndex + 1}/{questions.length}</h2>
          <Card className="p-8 rounded-[40px] shadow-2xl">
            <h3 className="text-xl md:text-2xl font-bold mb-10">{q?.text}</h3>
            <div className="grid gap-4">
              {q?.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestionIndex] === letter;
                return (
                  <button key={i} onClick={() => handleAnswer(letter)} className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center gap-5 ${isSelected ? "border-primary bg-primary/5" : "border-slate-100 hover:border-primary/20"}`}>
                    <span className={`size-12 rounded-2xl border-2 flex items-center justify-center font-black ${isSelected ? "bg-primary text-white" : "bg-slate-50"}`}>{letter}</span>
                    <span className="font-bold text-lg">{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="flex justify-between items-center">
            <Button variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>Артқа</Button>
            <Button className="h-16 px-12 rounded-[24px] font-black text-xl gap-3 shadow-xl" onClick={nextStep} disabled={!answers[currentQuestionIndex]}>
              {currentQuestionIndex === questions.length - 1 ? "Аяқтау" : "Келесі"} <ArrowRight className="size-6" />
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (testState === "results") {
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8 text-center py-10">
          <div className="size-28 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-xl"><Trophy className="size-14" /></div>
          <h1 className="text-6xl font-black font-headline">{totalScore} <span className="text-2xl text-muted-foreground">/ 140 балл</span></h1>
          <div className="grid gap-4 md:grid-cols-3 pt-8">
            {results.map((r, i) => (
              <Card key={i} className="p-6 text-left bg-white rounded-3xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{r.subject}</p>
                <p className="text-2xl font-black text-primary">{r.score} балл</p>
                <Progress value={(r.score/r.maxScore)*100} className="h-1.5 mt-4" />
              </Card>
            ))}
          </div>
          <Button size="lg" className="rounded-2xl h-16 px-12 font-black mt-8" onClick={() => setTestState("idle")}>Дашбордқа қайту</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-black font-headline">ҰБТ Тестілеу (Mock Test)</h1>
        <Card className="p-12 rounded-[48px] shadow-xl text-center flex flex-col items-center">
          <Badge className="mb-6 bg-primary/10 text-primary">АПТАСЫНА 1 РЕТ</Badge>
          <CardTitle className="text-4xl font-black">Толық ҰБТ нұсқасы</CardTitle>
          <p className="text-lg mt-4 max-w-2xl text-muted-foreground">Барлық 5 пәнді қамтитын кешенді тест.</p>
          <Button size="lg" className="w-full h-20 rounded-[32px] font-black text-2xl mt-10 shadow-xl" onClick={initiateTest} disabled={hasTakenTestThisWeek}>
            {hasTakenTestThisWeek ? <><Lock className="size-8 mr-2" /> Лимит орындалды</> : <><Play className="size-8 mr-2" /> Тестті бастау</>}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
