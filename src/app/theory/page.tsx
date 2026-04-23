
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  Clock,
  LayoutGrid
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
import { collection, getDocs, onSnapshot, query } from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [firestoreSubjects, setFirestoreSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my");

  useEffect(() => {
    const q = query(collection(db, "subjects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirestoreSubjects(subjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allAvailableSubjectNames = useMemo(() => {
    return Array.from(new Set([
      ...Object.keys(UBT_TOPICS),
      ...firestoreSubjects.map(s => s.name)
    ]));
  }, [firestoreSubjects]);

  const userSubjects = profile?.selectedSubjects || [];
  const normalizedUserSubjects = userSubjects.map(s => s === "Мат. сауаттылық" ? "Математикалық сауаттылық" : s);

  const displayedSubjects = useMemo(() => {
    let list = activeTab === "my" 
      ? allAvailableSubjectNames.filter(s => normalizedUserSubjects.includes(s))
      : allAvailableSubjectNames;

    return list.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeTab, allAvailableSubjectNames, normalizedUserSubjects, searchQuery]);

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
              <p className="text-muted-foreground font-medium">Кәсіби деңгейдегі ҰБТ сұрақтарымен біліміңді бекіт.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                placeholder="Пәнді немесе тақырыпты іздеу..." 
                className="pl-12 h-14 bg-white border-none shadow-md rounded-2xl text-base focus-visible:ring-primary" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white p-1 rounded-xl shadow-sm border shrink-0">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="my" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Менің пәндерім</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Барлық база</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-20" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">База жүктелуде...</p>
            </div>
          ) : displayedSubjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedSubjects.map((subject, i) => (
                <SubjectCard key={i} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 rounded-[40px] border-4 border-dashed border-white flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/20">
                <XCircle className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-xl">Пәндер табылмады</p>
                <p className="text-sm text-muted-foreground">Іздеу сұранысын немесе таңдалған табты тексеріңіз.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SubjectCard({ subject }: { subject: string }) {
  const Icon = getSubjectIcon(subject);
  const ubtInfo = UBT_TOPICS[subject] || { topics: [], description: "Кәсіби дайындалған базалық пән." };
  const [isOpen, setIsOpen] = useState(false);
  const [firestoreTopics, setFirestoreTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingTopics(true);
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-');
      const topicsRef = collection(db, "subjects", subjectId, "topics");
      
      const unsubscribe = onSnapshot(topicsRef, (snapshot) => {
        const topics = snapshot.docs.map(doc => doc.data().title || doc.id);
        setFirestoreTopics(topics);
        setLoadingTopics(false);
      });

      return () => unsubscribe();
    }
  }, [isOpen, subject]);

  const allTopics = Array.from(new Set([...ubtInfo.topics, ...firestoreTopics]));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all group bg-white border-none shadow-sm rounded-[32px] overflow-hidden flex flex-col h-full">
          <div className="h-2 bg-gradient-to-r from-primary/30 to-transparent group-hover:from-primary transition-all" />
          <CardHeader className="p-8">
            <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
              <Icon className="size-7" />
            </div>
            <CardTitle className="text-2xl font-black">{subject}</CardTitle>
            <CardDescription className="text-sm font-medium leading-relaxed mt-3 text-muted-foreground line-clamp-2">
              {ubtInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto p-8 pt-0">
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Мазмұны</span>
                <span className="text-lg font-black text-primary">{allTopics.length} бөлім</span>
              </div>
              <div className="size-12 rounded-full bg-accent/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] bg-white border-none shadow-2xl p-0 rounded-[40px] overflow-hidden flex flex-col">
        <div className="bg-primary/5 p-10 pb-6 border-b border-primary/10 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-5 mb-4">
              <div className="size-16 rounded-[24px] bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
                <Icon className="size-8" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2 bg-white/80 text-primary border-primary/20 font-black tracking-widest text-[9px]">ҰБТ СПЕЦИФИКАЦИЯСЫ</Badge>
                <DialogTitle className="text-4xl font-black font-headline tracking-tight">{subject}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-10 py-6">
          {loadingTopics ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">Тақырыптар жүктелуде...</p>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {allTopics.map((topic, idx) => (
                <TopicItem key={idx} index={idx} topic={topic} subject={subject} />
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-6 bg-muted/20 border-t flex justify-center shrink-0">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="size-3 text-primary animate-pulse" /> Барлық сұрақтар ҰБТ-2025 форматына сай
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
      if (viewport) viewport.scrollTop = 0;
    }
  }, [currentIndex, practiceMode]);

  const startPractice = async () => {
    setPracticeMode("loading");
    setErrorMessage(null);
    setCurrentIndex(0);
    setAnswers({});
    
    try {
      // 1. Алдымен Firestore-дан іздейміз
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-');
      const topicId = topic.toLowerCase().replace(/\s+/g, '-');
      const qRef = collection(db, "subjects", subjectId, "topics", topicId, "questions");
      const qSnap = await getDocs(qRef);
      
      if (!qSnap.empty) {
        setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPracticeMode("testing");
        return;
      }

      // 2. Егер базада жоқ болса, статикалық базадан іздейміз
      if (STATIC_TESTS[subject] && STATIC_TESTS[subject][topic]) {
        setQuestions(STATIC_TESTS[subject][topic]);
        setPracticeMode("testing");
        return;
      }

      // 3. AI генерациясы (соңғы нұсқа)
      const { questions: newQuestions } = await generateUntQuestions({ subject, topic, count: 5 });
      setQuestions(newQuestions || []);
      setPracticeMode("testing");
    } catch (error: any) {
      setErrorMessage(error.message?.includes("AI_QUOTA_EXCEEDED") ? "AI лимиті аяқталды. 1-2 минут күтіңіз." : "Жүктеу қатесі.");
      setPracticeMode("reading");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    else finishPractice();
  };

  const finishPractice = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    setTestResult({ score: correct, total: questions.length });
    setPracticeMode("results");
    if (user && correct > 0) updateUserRating(user.uid, 'CORRECT_ANSWER');
  };

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
        <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-transparent bg-accent/5 hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all group/item cursor-pointer">
          <div className="flex items-center gap-5">
            <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-xs font-black text-muted-foreground group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm">
              {index + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black group-hover/item:text-primary transition-colors">{topic}</span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="size-3" /> 15 минут практика
              </span>
            </div>
          </div>
          <Button variant="ghost" className="rounded-full size-12 p-0 text-primary group-hover/item:bg-primary group-hover/item:text-white">
            <ChevronRight className="size-6" />
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0 rounded-[40px] border-none shadow-2xl bg-white overflow-hidden">
        <div className="p-10 pb-6 border-b shrink-0 bg-accent/5">
          <DialogHeader>
            <Badge variant="outline" className="w-fit mb-3 bg-white text-primary border-primary/20 font-black">{subject}</Badge>
            <DialogTitle className="text-4xl font-black font-headline">{topic}</DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-10 py-10">
          {practiceMode === "reading" && (
            <div className="flex flex-col items-center text-center gap-8 py-10 animate-in fade-in zoom-in duration-500">
              <div className="size-32 rounded-full bg-primary/5 flex items-center justify-center text-primary/20">
                <BookOpen className="size-16" />
              </div>
              <div className="space-y-3 max-w-sm">
                <h4 className="text-2xl font-black tracking-tight">Дайындыққа кірісу</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Бұл бөлімде сіз «{topic}» тақырыбы бойынша ҰБТ деңгейіндегі кәсіби сұрақтарға жауап бересіз.
                </p>
              </div>
              <div className="w-full max-w-md pt-8 border-t-2 border-dashed">
                <Button className="w-full h-20 text-2xl font-black rounded-3xl shadow-2xl shadow-primary/20 gap-3" onClick={startPractice}>
                  <Sparkles className="size-7" /> Практиканы бастау
                </Button>
                {errorMessage && <p className="mt-6 text-sm font-bold text-destructive flex items-center justify-center gap-2"><AlertCircle className="size-4" /> {errorMessage}</p>}
              </div>
            </div>
          )}

          {practiceMode === "loading" && (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader2 className="size-16 animate-spin text-primary opacity-20" />
              <p className="font-black text-2xl animate-pulse">Сұрақтар жүктелуде...</p>
            </div>
          )}

          {practiceMode === "testing" && questions.length > 0 && (
            <div key={currentIndex} className="space-y-10 animate-in slide-in-from-right-10 duration-500 pb-20">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Прогресс</span>
                    <span className="text-3xl font-black font-headline">Сұрақ {currentIndex + 1} / {questions.length}</span>
                  </div>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-3 rounded-full" />
              </div>

              <Card className="border-none shadow-2xl bg-white p-12 rounded-[40px] ring-1 ring-border/50">
                <h3 className="text-2xl md:text-3xl font-black leading-tight mb-12">{questions[currentIndex].text}</h3>
                <div className="grid gap-5">
                  {questions[currentIndex].options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = answers[currentIndex] === letter;
                    return (
                      <button key={i} onClick={() => handleAnswer(letter)} className={`w-full text-left p-6 rounded-[24px] border-2 transition-all flex items-center gap-6 group active:scale-[0.98] ${isSelected ? "border-primary bg-primary/5 ring-8 ring-primary/5" : "border-border hover:border-primary/30"}`}>
                        <span className={`size-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all ${isSelected ? "bg-primary text-white border-primary" : "text-muted-foreground"}`}>{letter}</span>
                        <span className={`font-bold text-lg ${isSelected ? "text-primary" : "text-foreground"}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <div className="flex gap-6">
                <Button variant="outline" className="flex-1 h-20 text-xl font-black rounded-[24px] border-2" onClick={prevQuestion} disabled={currentIndex === 0}>Артқа</Button>
                <Button className="flex-[2] h-20 text-xl font-black rounded-[24px] shadow-2xl shadow-primary/20 gap-3" disabled={!answers[currentIndex]} onClick={nextQuestion}>
                  {currentIndex === questions.length - 1 ? "Аяқтау" : "Келесі сұрақ"} <ArrowRight className="size-6" />
                </Button>
              </div>
            </div>
          )}

          {practiceMode === "results" && (
            <div className="py-10 space-y-12 animate-in zoom-in-95 duration-500 pb-20">
              <div className="text-center space-y-6">
                <div className="inline-flex size-32 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner relative">
                  <Trophy className="size-16" />
                </div>
                <h3 className="text-5xl font-black font-headline tracking-tighter">Нәтиже: {testResult.score} / {testResult.total}</h3>
              </div>

              <div className="grid gap-6">
                {questions.map((q, i) => (
                  <div key={i} className={`p-8 rounded-[32px] border ${answers[i] === q.correctAnswer ? 'bg-green-50/50 border-green-200' : 'bg-destructive/5 border-destructive-200'}`}>
                    <div className="flex items-start gap-5">
                      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${answers[i] === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-destructive text-white'}`}>
                        {answers[i] === q.correctAnswer ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
                      </div>
                      <div className="space-y-4">
                        <p className="text-xl font-bold leading-tight">{q.text}</p>
                        <div className="flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest">
                          <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Сенің жауабың: {answers[i] || "—"}</span>
                          <span className="text-green-700">Дұрыс жауап: {q.correctAnswer}</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/80 border border-border shadow-inner">
                          <p className="text-sm font-medium italic leading-relaxed text-muted-foreground"><span className="font-black text-primary not-italic mr-2">ТҮСІНДІРМЕ:</span> {q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full h-20 text-xl font-black rounded-3xl border-2" onClick={() => setPracticeMode("reading")}>Бөлімге қайту</Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
