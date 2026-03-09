
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  ChevronRight, 
  Star, 
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
  Target,
  Calendar,
  ClipboardList,
  AlertCircle,
  RefreshCcw,
  Info,
  Trophy,
  ArrowRight,
  XCircle,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Статикалық түсіндірмелер базасы
const STATIC_THEORY: Record<string, any> = {
  "Қазақ хандығының құрылуы мен дамуы": {
    given: "XV ғасырдың ортасындағы Қазақстан аумағындағы саяси жағдай және қазақ халқының этникалық бірігу процесі.",
    theory: "Қазақ хандығының негізі 1465 жылы Шу мен Қозыбасы өңірлерінде қаланды. Негізін салғандар - Керей мен Жәнібек хандар. Олар Әбілқайыр хандығынан (Көшпелі өзбектер мемлекеті) бөлініп, Моғолстанның батыс бөлігіне қоныс аударды.\n\nДаму кезеңдері:\n1. Қасым хан тұсында - 'Қасым ханның қасқа жолы' заңдар жинағы, халқы 1 миллионға жетті.\n2. Хақназар хан тұсында - Хандықтың жерін кеңейту және нығайту.\n3. Тәуекел хан тұсында - Түркістан мен Ташкентті қосу.\n4. Есім хан тұсында - 'Есім ханның ескі жолы' заңдары.\n5. Тәуке хан тұсында - 'Жеті жарғы' заңдар жинағы, 'Алтын ғасыр'.",
    years: ["1465 ж. - Қазақ хандығының құрылуы", "1511-1518 жж. - Қасым ханның билігі", "1680-1718 жж. - Тәуке ханның билігі"],
    unt_focus: "Керей мен Жәнібектің Моғолстанға көшу себептері, 'Жеті жарғы' баптары және хандардың билік еткен жылдары жиі келеді."
  },
  "Логарифмдік теңдеулер": {
    given: "Айнымалысы логарифм белгісінің астында немесе негізінде болатын теңдеулер.",
    theory: "Логарифмнің негізгі қасиеттері:\n1. log_a(b) = c => a^c = b (Анықтама бойынша)\n2. log_a(xy) = log_a(x) + log_a(y)\n3. log_a(x/y) = log_a(x) - log_a(y)\n4. log_a(x^n) = n * log_a(x)\n\nШешу жолдары:\n- Потенциалдау (екі жағын бірдей негізге келтіру).\n- Жаңа айнымалы енгізу.\n- Логарифмдік анықтаманы қолдану.\n\nМАҢЫЗДЫ: Мүмкін мәндер жиынын (ММЖ) анықтау керек! Негізі a > 0, a != 1 және логарифм астындағы сан x > 0 болуы тиіс.",
    years: ["log_a(1) = 0", "log_a(a) = 1", "a^{log_a(b)} = b"],
    unt_focus: "ММЖ-ны ұмытып кету - ең жиі қателік. Тестте жауабын теңдеуге қойып тексерген тиімді."
  },
  "Ньютонның екінші заңы": {
    given: "Дененің үдеуі мен оған әсер етуші күш арасындағы байланысты сипаттайтын классикалық механиканың іргелі заңы.",
    theory: "Денеге әсер ететін күш дене массасы мен оның алған үдеуінің көбейтіндісіне тең.\n\nФормула: F = m * a\nМұндағы:\n- F — күш (Ньютон, Н)\n- m — масса (Килограмм, кг)\n- a — үдеу (м/с²)\n\nЕгер денеге бірнеше күш әсер етсе, онда F — барлық күштердің теңәсерлі күші болып табылады.",
    years: ["1 Н = 1 кг * м/с²", "a = F / m", "m = F / a"],
    unt_focus: "Көлбеу жазықтық пен блоктар арқылы жүктерді тарту есептерінде осы заң негізінде теңдеулер жүйесі құрылады."
  }
};

const UBT_TOPICS: Record<string, { topics: string[], description: string }> = {
  "Қазақстан тарихы": {
    description: "Ежелгі дәуірден бүгінгі күнге дейінгі Қазақстан тарихының толық курсы.",
    topics: [
      "Ежелгі Қазақстан", "Сақ, ғұн, үйсін, қаңлы", "Түрік қағанаттары", "Орта ғасыр мемлекеттері", 
      "Алтын Орда және Ақ Орда", "Қазақ хандығының құрылуы мен дамуы", "Жоңғар шапқыншылығы", 
      "Ресей империясы тұсындағы Қазақстан", "Ұлт-азаттық көтерілістер", "Алаш қозғалысы", 
      "Кеңестік кезең", "Тәуелсіз Қазақстан"
    ]
  },
  "Оқу сауаттылығы": {
    description: "Мәтінді талдау, интерпретациялау және логикалық қорытынды жасау дағдылары.",
    topics: [
      "Мәтіннің тақырыбы мен негізгі ойы", "Стиль түрлері", "Мәтін құрылымы", "Логикалық байланыс", 
      "Факті мен пікірді ажырату", "Кесте және сызбалармен жұмыс"
    ]
  },
  "Математикалық сауаттылық": {
    description: "Күнделікті өмірдегі сандық мәліметтерді талдау және логикалық есептер.",
    topics: [
      "Сан және есептеу", "Бөлшек, пайыз, пропорция", "Қозғалыс және жұмыс есептері", 
      "Графиктер мен диаграммалар", "Логикалық есептер", "Практикалық геометрия"
    ]
  },
  "Математика": {
    description: "Алгебра, тригонометрия және геометрияның тереңдетілген курсы.",
    topics: [
      "Теңдеулер мен теңсіздіктер", "Функциялар және графиктер", "Логарифмдік теңдеулер", 
      "Тригонометрия", "Туынды және оның қолданылуы", "Интеграл", "Планиметрия", "Стереометрия"
    ]
  },
  "Физика": {
    description: "Классикалық механикадан бастап атомдық физикаға дейінгі негізгі заңдар.",
    topics: [
      "Кинематика", "Динамика", "Ньютонның заңдары", "Сақталу заңдары", "Термодинамика", 
      "Электростатика", "Тұрақты ток", "Оптика", "Кванттық физика"
    ]
  },
  "Химия": {
    description: "Заттардың құрылысы, қасиеттері және химиялық реакциялар.",
    topics: [
      "Атом құрылысы", "Периодтық заң", "Химиялық байланыс", "Ерітінділер", 
      "Бейорганикалық химия", "Органикалық химия", "Химиялық есептер"
    ]
  },
  "Биология": {
    description: "Тірі ағзалардың құрылысы, генетика және адам анатомиясы.",
    topics: [
      "Жасуша биологиясы", "Зат алмасу", "Генетика", "Эволюция", "Экология", 
      "Адам анатомиясы", "Ботаника", "Зоология"
    ]
  }
};

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

  const mandatorySubjects = profile.selectedSubjects.slice(0, 3);
  const choiceSubjects = profile.selectedSubjects.slice(3);

  const filterSubjects = (subjects: string[]) => 
    subjects.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                <BookOpen className="size-10 text-primary" />
                Тақырыптық практика
              </h1>
              <p className="text-muted-foreground font-medium">ҰБТ-да кездесетін барлық тақырыптар бойынша жаттығу.</p>
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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1.5 h-12 rounded-xl mb-8">
            <TabsTrigger value="all" className="font-bold px-8 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Барлығы</TabsTrigger>
            <TabsTrigger value="mandatory" className="font-bold px-8 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Міндетті пәндер</TabsTrigger>
            <TabsTrigger value="choice" className="font-bold px-8 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Таңдау пәндері</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-12 mt-0">
            <SubjectGroup title="Міндетті пәндер" subjects={filterSubjects(mandatorySubjects)} variant="mandatory" />
            <SubjectGroup title="Бейіндік және таңдау пәндері" subjects={filterSubjects(choiceSubjects)} variant="choice" />
          </TabsContent>

          <TabsContent value="mandatory" className="mt-0">
            <SubjectGroup title="Міндетті пәндер" subjects={filterSubjects(mandatorySubjects)} variant="mandatory" />
          </TabsContent>

          <TabsContent value="choice" className="mt-0">
            <SubjectGroup title="Бейіндік және таңдау пәндері" subjects={filterSubjects(choiceSubjects)} variant="choice" />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function SubjectGroup({ title, subjects, variant }: { title: string, subjects: string[], variant: 'mandatory' | 'choice' }) {
  const { user } = useAuth();
  
  if (subjects.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-1.5 rounded-full ${variant === 'mandatory' ? 'bg-blue-500' : 'bg-primary'}`} />
        <h2 className="text-2xl font-black font-headline tracking-tight">{title}</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, i) => (
          <SubjectCard key={i} subject={subject} />
        ))}
      </div>
    </section>
  );
}

function SubjectCard({ subject }: { subject: string }) {
  const Icon = getSubjectIcon(subject);
  const ubtInfo = UBT_TOPICS[subject] || { topics: ["Негізгі тақырыптар"], description: "ҰБТ-ға дайындық материалдары" };
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
      <DialogContent className="max-w-3xl bg-white border-none shadow-2xl p-0 rounded-3xl overflow-hidden">
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon className="size-7" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 bg-white/50 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">Пән бойынша практика</Badge>
                <DialogTitle className="text-3xl font-black font-headline">{subject}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground max-w-xl">
              {ubtInfo.description} Тақырыпты таңдап, AI арқылы теорияны қайталаңыз немесе тест тапсырып бекітіңіз.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="max-h-[60vh] p-8">
          <div className="grid gap-4">
            {ubtInfo.topics.map((topic, idx) => (
              <TopicItem key={idx} index={idx} topic={topic} subject={subject} />
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/20 border-t flex items-center justify-center gap-2">
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
  const hasStatic = STATIC_THEORY[topic];

  // Practice Test State
  const [practiceMode, setPracticeMode] = useState<"reading" | "loading" | "testing" | "results">("reading");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState({ score: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startPractice = async () => {
    setPracticeMode("loading");
    setErrorMessage(null);
    try {
      const { questions: newQuestions } = await generateUntQuestions({ 
        subject, 
        topic, 
        count: 5 
      });
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setAnswers({});
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
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishPractice();
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
      await updateUserRating(user.uid, 'CORRECT_ANSWER');
    }
  };

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => {
      setIsDetailOpen(open);
      if(!open) {
        setPracticeMode("reading");
        setQuestions([]);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-white">
        <div className="p-8 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">{subject}</Badge>
              <Info className="size-4 text-primary opacity-50" />
            </div>
            <DialogTitle className="text-3xl font-black font-headline tracking-tight">{topic}</DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 p-8">
          {practiceMode === "reading" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {hasStatic ? (
                <>
                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 relative overflow-hidden">
                    <h4 className="flex items-center gap-2 text-xs font-black text-blue-700 mb-3 uppercase tracking-widest">
                      <ClipboardList className="size-4" /> Тақырыптың мәні
                    </h4>
                    <p className="text-sm leading-relaxed text-blue-900 font-medium">{hasStatic.given}</p>
                    <BookOpen className="absolute -bottom-4 -right-4 size-24 text-blue-200/30 -rotate-12" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-widest">
                      <BookText className="size-4 text-primary" /> Толық мәліметтер
                    </h4>
                    <div className="p-6 rounded-3xl bg-accent/5 border border-border/50">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">{hasStatic.theory}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100 relative overflow-hidden">
                    <h4 className="flex items-center gap-2 text-xs font-black text-yellow-800 mb-3 uppercase tracking-widest">
                      <Calendar className="size-4" /> Жаттау керек деректер
                    </h4>
                    <ul className="space-y-3 relative z-10">
                      {hasStatic.years.map((item: string, yi: number) => (
                        <li key={yi} className="flex gap-3 text-sm text-yellow-900 font-bold items-start">
                          <CheckCircle2 className="size-4 text-yellow-600 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Star className="absolute -bottom-4 -right-4 size-24 text-yellow-200/30 rotate-12" />
                  </div>
                </>
              ) : (
                <div className="py-16 flex flex-col items-center text-center gap-6">
                  <div className="size-24 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground shadow-inner">
                    <BookOpen className="size-12 opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold">Тест арқылы меңгеру</h4>
                    <p className="text-sm text-muted-foreground max-w-sm font-medium">
                      Бұл тақырып бойынша мәліметтерді тікелей практикалық тапсырмалар арқылы меңгеру тиімдірек.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-dashed">
                <Button 
                  className="w-full gap-3 h-16 text-xl font-black shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-secondary rounded-2xl hover:scale-[1.02] transition-all"
                  onClick={startPractice}
                >
                  <Sparkles className="size-6" />
                  Практиканы бастау (5 тест)
                </Button>
                <div className="flex flex-col items-center gap-1 mt-4">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    AI Арнайы сұрақтарды құрастырады
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
            <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <div className="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-black text-2xl tracking-tight">AI сұрақтарды құрастыруда...</p>
                <p className="text-sm text-muted-foreground font-medium">Тақырыптың ең маңызды тұстары таңдалуда.</p>
              </div>
            </div>
          )}

          {practiceMode === "testing" && questions.length > 0 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Прогресс</span>
                    <span className="text-2xl font-black font-headline">Сұрақ {currentIndex + 1} / {questions.length}</span>
                  </div>
                  <Badge variant="secondary" className="h-7 px-4 rounded-full bg-primary/10 text-primary border-none text-[10px] font-bold">Тақырыптық бекіту</Badge>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2 rounded-full" />
              </div>

              <Card className="border-none shadow-xl bg-white p-8 rounded-3xl ring-1 ring-border">
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

              <Button 
                className="w-full h-16 gap-3 font-black text-lg rounded-2xl shadow-xl shadow-primary/20" 
                disabled={!answers[currentIndex]}
                onClick={nextQuestion}
              >
                {currentIndex === questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"}
                <ArrowRight className="size-5" />
              </Button>
            </div>
          )}

          {practiceMode === "results" && (
            <div className="py-12 space-y-10 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-6">
                <div className="inline-flex size-32 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner relative">
                  <Trophy className="size-16 drop-shadow-sm" />
                  <Sparkles className="absolute -top-2 -right-2 size-8 text-yellow-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-4xl font-black font-headline tracking-tighter">Нәтиже: {testResult.score} / {testResult.total}</h3>
                  <p className="text-muted-foreground text-lg font-medium mt-2">
                    {testResult.score === testResult.total ? "Керемет! Бұл тақырыпты 100% меңгердіңіз! 🚀" : "Жақсы нәтиже! Қателермен жұмыс істеуді ұмытпаңыз."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Сұрақтарды талдау</h4>
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
                            <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Сенің жауабың: {answers[i]}</span>
                            <span className="text-green-700">Дұрыс жауап: {q.correctAnswer}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/50 border border-border/50">
                            <p className="text-xs text-muted-foreground italic leading-relaxed font-medium">
                              <span className="font-black text-primary mr-1">Түсіндірме:</span> {q.explanation}
                            </p>
                          </div>
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
        
        <div className="p-6 border-t bg-muted/10 flex justify-center">
          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="size-3 text-primary" /> BilimAI — Сапалы дайындық кепілі
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
