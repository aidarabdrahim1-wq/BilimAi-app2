
"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  ChevronRight, 
  Calculator, 
  Languages, 
  Atom, 
  FlaskConical, 
  Globe, 
  Dna,
  Scale,
  ListChecks,
  Terminal,
  BookText,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { updateUserRating } from "@/lib/rating";
import { STATIC_TESTS, UBT_TOPICS } from "@/lib/ubt-data";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("тарих")) return GraduationCap;
  if (n.includes("мат") && !n.includes("сауаттылық")) return Calculator;
  if (n.includes("сауаттылық") && n.includes("оқу")) return Languages;
  if (n.includes("математикалық сауаттылық")) return ListChecks;
  if (n.includes("физика")) return Atom;
  if (n.includes("химия")) return FlaskConical;
  if (n.includes("география")) return Globe;
  if (n.includes("биология")) return Dna;
  if (n.includes("құқық")) return Scale;
  if (n.includes("информатика")) return Terminal;
  if (n.includes("тіл")) return BookText;
  if (n.includes("әдебиет")) return FileText;
  return BookOpen;
};

export default function TheoryPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!profile) return null;

  const userSubjects = profile.selectedSubjects || [];
  const normalizedUserSubjects = userSubjects.map(s => s === "Мат. сауаттылық" ? "Математикалық сауаттылық" : s);

  const mySubjects = Object.keys(UBT_TOPICS).filter(s => {
    const isSelected = normalizedUserSubjects.includes(s);
    return isSelected && s.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                <BookOpen className="size-10 text-primary" />
                Практикалық база
              </h1>
              <p className="text-muted-foreground font-medium">Сіздің таңдаған ҰБТ пәндеріңіз бойынша дайындық.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <Trophy className="size-5 text-yellow-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Сенің ұпайың</span>
                <span className="text-sm font-black text-primary leading-tight">{profile.rating} ұпай</span>
              </div>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input 
              placeholder="Пәнді немесе тақырыпты іздеу..." 
              className="pl-12 h-14 bg-white border-none shadow-md rounded-2xl text-base focus-visible:ring-primary" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h2 className="text-2xl font-black font-headline tracking-tight">Менің пәндерім</h2>
          </div>
          {mySubjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mySubjects.map((subject, i) => (
                <SubjectCard key={i} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
              <p className="text-muted-foreground">Пәндер табылмады. Тіркелу кезіндегі таңдауды тексеріңіз.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SubjectCard({ subject }: { subject: string }) {
  const Icon = getSubjectIcon(subject);
  const ubtInfo = UBT_TOPICS[subject];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all group bg-white border-none shadow-sm rounded-3xl overflow-hidden flex flex-col h-full">
          <div className="h-2 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent group-hover:from-primary/40 transition-all" />
          <CardHeader className="p-6">
            <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
              <Icon className="size-7" />
            </div>
            <CardTitle className="text-xl font-black">{subject}</CardTitle>
            <CardDescription className="text-xs font-medium leading-relaxed mt-2 text-muted-foreground line-clamp-2">
              {ubtInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto p-6 pt-0">
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Тақырыптар</span>
                <span className="text-sm font-black text-primary">{ubtInfo.topics.length} бөлім</span>
              </div>
              <div className="size-10 rounded-full bg-accent/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[85vh] bg-white border-none shadow-2xl p-0 rounded-3xl overflow-hidden flex flex-col">
        <div className="bg-primary/5 p-8 pb-4 border-b border-primary/10 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon className="size-7" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 bg-white/50 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">Тақырыптық практика</Badge>
                <DialogTitle className="text-3xl font-black font-headline">{subject}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground max-w-xl">
              Нақты тақырыпты таңдап, практика жасаңыз. Әрбір дұрыс жауап үшін +2 рейтинг ұпайы қосылады.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-8 py-4">
          <div className="grid gap-4 py-4">
            {ubtInfo.topics.map((topic, idx) => (
              <TopicItem key={idx} index={idx} topic={topic} subject={subject} />
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/20 border-t flex items-center justify-center gap-2 shrink-0">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            AI Куратор сізге арнап жаңа сұрақтар дайындайды
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopicItem({ index, topic, subject }: { index: number, topic: string, subject: string }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [practiceMode, setPracticeMode] = useState<"reading" | "loading" | "testing" | "results">("reading");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState({ score: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (practiceMode === "testing" && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [currentIndex, practiceMode]);

  const startPractice = async () => {
    setPracticeMode("loading");
    setErrorMessage(null);
    setCurrentIndex(0);
    setAnswers({});
    
    try {
      // 1. Алдымен Firestore-дан Админ жүктеген сұрақтарды іздейміз
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-');
      const topicId = topic.toLowerCase().replace(/\s+/g, '-');
      const qRef = collection(db, "subjects", subjectId, "topics", topicId, "questions");
      const qSnap = await getDocs(qRef);
      
      if (!qSnap.empty) {
        const firestoreQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setQuestions(firestoreQuestions);
        setPracticeMode("testing");
        return;
      }

      // 2. Егер базада жоқ болса, статикалық ескі базадан іздейміз
      if (STATIC_TESTS[subject] && STATIC_TESTS[subject][topic]) {
        const staticQuestions = STATIC_TESTS[subject][topic];
        setQuestions(staticQuestions);
        setPracticeMode("testing");
        return;
      }

      // 3. Соңғы нұсқа ретінде AI генерациясын қолданамыз
      const { questions: newQuestions } = await generateUntQuestions({ 
        subject, 
        topic, 
        count: 5 
      });
      setQuestions(newQuestions || []);
      setPracticeMode("testing");
    } catch (error: any) {
      let msg = "Сұрақтарды жүктеу мүмкін болмады.";
      if (error.message?.includes("AI_QUOTA_EXCEEDED")) {
        msg = "AI лимиті аяқталды. 1-2 минуттан соң қайталаңыз.";
      }
      setErrorMessage(msg);
      setPracticeMode("reading");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishPractice();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishPractice = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    
    setTestResult({ score: correct, total: questions.length });
    setPracticeMode("results");

    if (user && correct > 0) {
      updateUserRating(user.uid, 'CORRECT_ANSWER');
    }
  };

  const isStatic = (STATIC_TESTS[subject] && STATIC_TESTS[subject][topic]) || questions.length > 0;

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => {
      setIsDetailOpen(open);
      if(!open) {
        setPracticeMode("reading");
        setQuestions([]);
        setCurrentIndex(0);
      }
    }}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between p-5 rounded-2xl border bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group/item cursor-pointer shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-inner">
              {index + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold group-hover/item:text-primary transition-colors">{topic}</span>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 uppercase tracking-wider">
                <Clock className="size-2.5" /> 15-20 мин практика
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="rounded-full size-10 p-0 text-primary group-hover/item:bg-primary group-hover/item:text-white">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-white overflow-hidden">
        <div className="p-8 pb-4 border-b shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">{subject}</Badge>
            </div>
            <DialogTitle className="text-3xl font-black font-headline tracking-tight">{topic}</DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-8 py-6">
          {practiceMode === "reading" && (
            <div className="py-12 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="size-24 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground shadow-inner">
                <BookOpen className="size-12 opacity-50" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold">Тақырыптық бекіту</h4>
                <p className="text-sm text-muted-foreground max-w-sm font-medium">
                  Бұл тақырып бойынша дайын тест сұрақтарын тапсырып немесе AI арқылы біліміңізді тексеріп, рейтинг ұпайына ие болыңыз.
                </p>
              </div>

              <div className="pt-8 border-t border-dashed w-full max-w-md mx-auto">
                <Button 
                  className="w-full gap-3 h-16 text-xl font-black shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-secondary rounded-2xl hover:scale-[1.02] transition-all"
                  onClick={startPractice}
                >
                  <Sparkles className="size-6" />
                  Практиканы бастау
                </Button>
                <div className="flex flex-col items-center gap-1 mt-4">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    Жүйе сұрақтарды базадан немесе AI-мен дайындайды
                  </p>
                  <p className="text-[10px] text-primary font-bold">+2 рейтинг ұпайы (әр дұрыс жауапқа)</p>
                </div>
                {errorMessage && (
                  <div className="mt-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-3 border border-destructive/20">
                    <AlertCircle className="size-5" /> {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {practiceMode === "loading" && (
            <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <div className="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-black text-2xl tracking-tight">Сұрақтар жүктелуде...</p>
                <p className="text-sm text-muted-foreground font-medium">Мазмұн сарапталуда. Сәл күте тұрыңыз.</p>
              </div>
            </div>
          )}

          {practiceMode === "testing" && questions.length > 0 && (
            <div key={currentIndex} className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-10">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Прогресс</span>
                    <span className="text-2xl font-black font-headline">Сұрақ {currentIndex + 1} / {questions.length}</span>
                  </div>
                  <Badge variant="secondary" className="h-7 px-4 rounded-full bg-primary/10 text-primary border-none text-[10px] font-bold">Тест режимі</Badge>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2 rounded-full" />
              </div>

              <Card className="border-none shadow-xl bg-white p-8 rounded-3xl ring-1 ring-border min-h-[200px]">
                <h3 className="text-xl md:text-2xl font-black leading-tight mb-10 text-foreground">
                  {questions[currentIndex].text}
                </h3>
                <div className="grid gap-4">
                  {questions[currentIndex].options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = answers[currentIndex] === letter;
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswer(letter)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-5 group active:scale-[0.98] ${
                          isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-white hover:border-primary/30"
                        }`}
                      >
                        <span className={`size-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all ${
                          isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg" : "group-hover:border-primary/50 text-muted-foreground"
                        }`}>
                          {letter}
                        </span>
                        <span className={`font-bold text-base ${isSelected ? "text-primary" : "text-foreground"}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  className="flex-1 h-16 gap-3 font-black text-lg rounded-2xl border-2" 
                  onClick={prevQuestion}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="size-5" />
                  Артқа
                </Button>
                <Button 
                  className="flex-[2] h-16 gap-3 font-black text-lg rounded-2xl shadow-xl shadow-primary/20" 
                  disabled={!answers[currentIndex]}
                  onClick={nextQuestion}
                >
                  {currentIndex === questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"}
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            </div>
          )}

          {practiceMode === "results" && (
            <div className="py-10 space-y-10 animate-in zoom-in-95 duration-500 pb-20">
              <div className="text-center space-y-6">
                <div className="inline-flex size-32 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner relative">
                  <Trophy className="size-16 drop-shadow-sm" />
                  <Sparkles className="absolute -top-2 -right-2 size-8 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-4xl font-black font-headline tracking-tighter">Нәтиже: {testResult.score} / {testResult.total}</h3>
                  <p className="text-muted-foreground text-lg font-medium mt-2">
                    {testResult.score === testResult.total ? "Керемет! Бұл тақырыпты 100% меңгердіңіз! 🚀" : "Жақсы нәтиже! Қателермен жұмыс істеуді ұмытпаңыз."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Жауаптарды талдау</h4>
                <div className="grid gap-4">
                  {questions.map((q, i) => (
                    <div key={i} className={`p-6 rounded-3xl border ${answers[i] === q.correctAnswer ? 'bg-green-50/50 border-green-100' : 'bg-destructive/5 border-destructive/10'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${answers[i] === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-destructive text-white'}`}>
                          {answers[i] === q.correctAnswer ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
                        </div>
                        <div className="space-y-3">
                          <p className="text-base font-bold leading-tight">{q.text}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Сенің жауабың: {answers[i] || "—"}</span>
                            <span className="text-green-700">Дұрыс жауап: {q.correctAnswer}</span>
                          </div>
                          {(q.explanation || answers[i] !== q.correctAnswer) && (
                            <div className="p-4 rounded-2xl bg-white/50 border border-border/50">
                              <p className="text-xs text-muted-foreground italic leading-relaxed font-medium">
                                <span className="font-black text-primary mr-1">Түсіндірме:</span> {q.explanation || "Бұл сұрақтың жауабын есте сақтаңыз."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full h-16 font-black text-lg rounded-2xl border-2" onClick={() => setPracticeMode("reading")}>
                Бөлімге қайту
              </Button>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-6 border-t bg-muted/10 flex justify-center shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="size-3 text-primary" /> BilimAI — Сапалы дайындық кепілі
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
