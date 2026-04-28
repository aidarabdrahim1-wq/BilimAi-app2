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
  XCircle,
  Clock,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { updateUserRating } from "@/lib/rating";
import { STATIC_TESTS, UBT_TOPICS } from "@/lib/ubt-data";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight font-headline flex items-center gap-3">
                <BookOpen className="size-8 text-primary" />
                Практикалық база
              </h1>
              <p className="text-muted-foreground text-sm font-medium">Кәсіби деңгейдегі ҰБТ сұрақтарымен біліміңді бекіт.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Пәнді немесе тақырыпты іздеу..." 
                className="pl-10 h-12 bg-white border-none shadow-sm rounded-xl text-sm focus-visible:ring-primary" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white p-1 rounded-xl shadow-sm border shrink-0">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="my" className="rounded-lg text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-white">Менің пәндерім</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-white">Барлық база</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-8 animate-spin text-primary opacity-20" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">База жүктелуде...</p>
            </div>
          ) : displayedSubjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedSubjects.map((subject, i) => (
                <SubjectCard key={i} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 rounded-[32px] border-4 border-dashed border-white flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/20">
                <XCircle className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg">Пәндер табылмады</p>
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
  const [isOpen, setIsOpen] = useState(false);
  const [dbTopics, setDbTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Fetch topics from Firestore when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchDbTopics = async () => {
        setLoadingTopics(true);
        try {
          const subjectId = subject.toLowerCase().replace(/\s+/g, '-');
          const topicsRef = collection(db, "subjects", subjectId, "topics");
          const snap = await getDocs(topicsRef);
          setDbTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingTopics(false);
        }
      };
      fetchDbTopics();
    }
  }, [isOpen, subject]);

  const ubtInfo = UBT_TOPICS[subject] || { description: "Кәсіби дайындалған базалық пән.", sections: [] };

  // Merge static sections with dynamic topics from DB that aren't in sections
  const dynamicSection = useMemo(() => {
    if (dbTopics.length === 0) return null;
    const staticTopicNames = ubtInfo.sections.flatMap(s => s.topics);
    const newTopics = dbTopics
      .filter(t => !staticTopicNames.includes(t.title))
      .map(t => t.title);
    
    if (newTopics.length === 0) return null;
    return { title: "Жүктелген тақырыптар", topics: newTopics };
  }, [dbTopics, ubtInfo.sections]);

  const allSections = useMemo(() => {
    return dynamicSection ? [...ubtInfo.sections, dynamicSection] : ubtInfo.sections;
  }, [ubtInfo.sections, dynamicSection]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all group bg-white border-none shadow-sm rounded-[24px] overflow-hidden flex flex-col h-full">
          <div className="h-1.5 bg-gradient-to-r from-primary/30 to-transparent group-hover:from-primary transition-all" />
          <CardHeader className="p-6">
            <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
              <Icon className="size-6" />
            </div>
            <CardTitle className="text-xl font-black">{subject}</CardTitle>
            <CardDescription className="text-xs font-medium leading-relaxed mt-2 text-muted-foreground line-clamp-2">
              {ubtInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto p-6 pt-0">
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Құрылымы</span>
                <span className="text-base font-black text-primary">{allSections.length} бөлім</span>
              </div>
              <div className="size-10 rounded-full bg-accent/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[85vh] bg-white border-none shadow-2xl p-0 rounded-[32px] overflow-hidden flex flex-col">
        <div className="bg-primary/5 p-8 pb-4 border-b border-primary/10 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon className="size-6" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 bg-white/80 text-primary border-primary/20 font-black tracking-widest text-[8px]">ҰБТ СПЕЦИФИКАЦИЯСЫ 2026</Badge>
                <DialogTitle className="text-2xl font-black font-headline tracking-tight">{subject}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-8 py-4">
          <div className="py-4">
            {loadingTopics ? (
              <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary opacity-20" /></div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {allSections.map((section, sIdx) => (
                  <AccordionItem key={sIdx} value={`section-${sIdx}`} className="border-2 rounded-2xl bg-accent/5 px-6 border-transparent data-[state=open]:border-primary/20 data-[state=open]:bg-white transition-all">
                    <AccordionTrigger className="hover:no-underline py-6">
                      <div className="flex items-center gap-4 text-left">
                        <div className="size-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-primary shadow-sm border">
                          {sIdx + 1}
                        </div>
                        <span className="font-black text-lg">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="grid gap-3 pt-2">
                        {section.topics.map((topic, tIdx) => (
                          <TopicItem key={tIdx} topic={topic} subject={subject} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/20 border-t flex justify-center shrink-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="size-3 text-primary animate-pulse" /> Барлық сұрақтар ресми бағдарламаға сай
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopicItem({ topic, subject }: { topic: string, subject: string }) {
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
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-');
      const topicId = topic.toLowerCase().replace(/\s+/g, '-');
      const qRef = collection(db, "subjects", subjectId, "topics", topicId, "questions");
      const qSnap = await getDocs(qRef);
      
      if (!qSnap.empty) {
        setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPracticeMode("testing");
        return;
      }

      if (STATIC_TESTS[subject] && STATIC_TESTS[subject][topic]) {
        setQuestions(STATIC_TESTS[subject][topic]);
        setPracticeMode("testing");
        return;
      }

      const { questions: newQuestions } = await generateUntQuestions({ subject, topic, count: 5 });
      setQuestions(newQuestions || []);
      setPracticeMode("testing");
    } catch (error: any) {
      setErrorMessage(error.message?.includes("AI_QUOTA_EXCEEDED") ? "AI лимиті аяқталды. 1-2 минут күтіңіз." : "Жүктеу қатесі.");
      setPracticeMode("reading");
    }
  };

  const handleAnswer = (option: string) => {
    if (answers[currentIndex]) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    else finishPractice();
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
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

  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer === questions[currentIndex]?.correctAnswer;

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
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-white hover:border-primary/20 hover:shadow-md transition-all group/item cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-accent/50 flex items-center justify-center">
              <ChevronRight className="size-4 text-primary group-hover/item:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover/item:text-primary transition-colors">{topic}</span>
          </div>
          <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black uppercase">Тест</Badge>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 rounded-[24px] border-none shadow-2xl bg-white overflow-hidden">
        <div className="p-8 pb-4 border-b shrink-0 bg-accent/5">
          <DialogHeader>
            <Badge variant="outline" className="w-fit mb-2 bg-white text-primary border-primary/20 font-black text-[9px]">{subject}</Badge>
            <DialogTitle className="text-xl font-black font-headline">{topic}</DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-8 py-6">
          {practiceMode === "reading" && (
            <div className="flex flex-col items-center text-center gap-6 py-8 animate-in fade-in zoom-in duration-500">
              <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center text-primary/20">
                <BookOpen className="size-12" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h4 className="text-lg font-black tracking-tight">Дайындыққа кірісу</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  «{topic}» тақырыбы бойынша біліміңізді тест арқылы тексеріңіз.
                </p>
              </div>
              <div className="w-full max-w-xs pt-6 border-t border-dashed">
                <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/10 gap-2" onClick={startPractice}>
                  <Sparkles className="size-5" /> Бастау
                </Button>
                {errorMessage && <p className="mt-4 text-[10px] font-bold text-destructive flex items-center justify-center gap-1"><AlertCircle className="size-3" /> {errorMessage}</p>}
              </div>
            </div>
          )}

          {practiceMode === "loading" && (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="size-12 animate-spin text-primary opacity-20" />
              <p className="font-black text-lg animate-pulse">Сұрақтар жүктелуде...</p>
            </div>
          )}

          {practiceMode === "testing" && questions.length > 0 && (
            <div key={currentIndex} className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Прогресс</span>
                    <span className="text-xl font-black font-headline">Сұрақ {currentIndex + 1} / {questions.length}</span>
                  </div>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 rounded-full" />
              </div>

              <Card className="border-none shadow-lg bg-white p-8 rounded-[24px] ring-1 ring-border/50">
                <h3 className="text-lg md:text-xl font-black leading-tight mb-8">{questions[currentIndex].text}</h3>
                <div className="grid gap-3">
                  {questions[currentIndex].options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = currentAnswer === letter;
                    const isCorrectOption = questions[currentIndex].correctAnswer === letter;
                    
                    let variantClass = "border-border hover:border-primary/30";
                    let iconClass = "text-muted-foreground";

                    if (currentAnswer) {
                      if (isCorrectOption) {
                        variantClass = "border-green-500 bg-green-50 ring-4 ring-green-500/5";
                        iconClass = "bg-green-500 text-white border-green-500";
                      } else if (isSelected) {
                        variantClass = "border-destructive bg-destructive/5 ring-4 ring-destructive/5";
                        iconClass = "bg-destructive text-white border-destructive";
                      } else {
                        variantClass = "border-border opacity-50";
                      }
                    } else if (isSelected) {
                      variantClass = "border-primary bg-primary/5 ring-4 ring-primary/5";
                      iconClass = "bg-primary text-white border-primary";
                    }

                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswer(letter)} 
                        disabled={!!currentAnswer}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group active:scale-[0.98] ${variantClass}`}
                      >
                        <span className={`size-8 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all ${iconClass}`}>
                          {letter}
                        </span>
                        <span className={`font-bold text-sm ${isSelected ? (isCorrect ? 'text-green-700' : 'text-destructive') : 'text-foreground'}`}>
                          {opt}
                        </span>
                        {currentAnswer && isCorrectOption && (
                          <CheckCircle2 className="size-4 text-green-500 ml-auto" />
                        )}
                        {currentAnswer && isSelected && !isCorrectOption && (
                          <XCircle className="size-4 text-destructive ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {currentAnswer && (
                  <div className="mt-8 p-6 rounded-2xl bg-accent/10 border-2 border-accent/20 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      {isCorrect ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-none px-3 py-1 rounded-lg font-black text-[10px] gap-1.5">
                          <CheckCircle2 className="size-3" /> ДҰРЫС!
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive hover:bg-destructive text-white border-none px-3 py-1 rounded-lg font-black text-[10px] gap-1.5">
                          <XCircle className="size-3" /> ҚАТЕ!
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Info className="size-4 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Түсіндірме</p>
                          <p className="text-sm font-medium leading-relaxed text-foreground/90 italic">
                            {questions[currentIndex].explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-14 text-sm font-black rounded-xl border-2" onClick={prevQuestion} disabled={currentIndex === 0}>Артқа</Button>
                <Button 
                  className="flex-[2] h-14 text-sm font-black rounded-xl shadow-lg shadow-primary/10 gap-2" 
                  disabled={!currentAnswer} 
                  onClick={nextQuestion}
                >
                  {currentIndex === questions.length - 1 ? "Аяқтау" : "Келесі"} <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {practiceMode === "results" && (
            <div className="py-8 space-y-8 animate-in zoom-in-95 duration-500 pb-12">
              <div className="text-center space-y-4">
                <div className="inline-flex size-20 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner relative">
                  <Trophy className="size-10" />
                </div>
                <h3 className="text-3xl font-black font-headline tracking-tighter">Нәтиже: {testResult.score} / {testResult.total}</h3>
              </div>

              <div className="grid gap-4">
                {questions.map((q, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${answers[i] === q.correctAnswer ? 'bg-green-50/50 border-green-200' : 'bg-destructive/5 border-destructive-200'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${answers[i] === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-destructive text-white'}`}>
                        {answers[i] === q.correctAnswer ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                      </div>
                      <div className="space-y-3">
                        <p className="text-base font-bold leading-tight">{q.text}</p>
                        <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest">
                          <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Сенің жауабың: {answers[i] || "—"}</span>
                          <span className="text-green-700">Дұрыс: {q.correctAnswer}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/80 border border-border shadow-inner">
                          <p className="text-xs font-medium italic leading-relaxed text-muted-foreground"><span className="font-black text-primary not-italic mr-1">ТҮСІНДІРМЕ:</span> {q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full h-14 text-base font-black rounded-2xl border-2" onClick={() => setPracticeMode("reading")}>Бөлімге қайту</Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
