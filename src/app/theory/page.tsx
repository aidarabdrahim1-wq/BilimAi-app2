
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
  XCircle
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
      "Ежелгі Қазақстан", "Тас дәуірі, қола дәуірі, ерте темір дәуірі", "Сақ, ғұн, үйсін, қаңлы", 
      "Түрік қағанаттары", "Орта ғасыр мемлекеттері", "Қарахан, Қыпшақ, Найман, Керейіт, Жалайыр", 
      "Алтын Орда, Ақ Орда, Моғолстан, Ноғай Ордасы, Әбілқайыр хандығы", "Қазақ хандығының құрылуы мен дамуы", 
      "Жоңғар шапқыншылығы", "Ресей империясы тұсындағы Қазақстан", "Ұлт-азаттық көтерілістер", 
      "ХХ ғасыр басы, Алаш қозғалысы", "Кеңестік кезең, ашаршылық, қуғын-сүргін, ҰОС", 
      "Тәуелсіз Қазақстан, Конституциялар, саяси реформалар, экономика, мәдениет, халықаралық қатынастар"
    ]
  },
  "Оқу сауаттылығы": {
    description: "Мәтінді талдау, интерпретациялау және логикалық қорытынды жасау дағдылары.",
    topics: [
      "Мәтіннің тақырыбы мен негізгі ойы", "Мәтіндегі ашық және жасырын ақпарат", "Стиль түрлері", 
      "Мәтін құрылымы", "Логикалық байланыс", "Автор көзқарасы", "Факті мен пікірді ажырату", 
      "Қорытынды шығару", "Салыстыру", "Мәтін бойынша интерпретация", "Бірнеше мәтінді салыстырып талдау", 
      "Кесте, сызба, диаграммадағы ақпаратны оқу"
    ]
  },
  "Математикалық сауаттылық": {
    description: "Күнделікті өмірдегі сандық мәліметтерді талдау және логикалық есептерді шығару.",
    topics: [
      "Сан және есептеу", "Бөлшек, пайыз, пропорция", "Орташа мән", "Қозғалыс, жұмыс, қоспа есептері", 
      "Кесте, график, диаграмма талдау", "Ықтималдықтың қарапайым элементтері", "Практикалық геометрия", 
      "Уақыт, қашықтық, масса, көлем бірліктері", "Қаржылық сауаттылық элементтері", "Күнделікті өмірдегі логикалық-сандық есептер"
    ]
  },
  "Математика": {
    description: "Алгебра, тригонометрия және геометрияның тереңдетілген курсы.",
    topics: [
      "Сандар мен өрнектер", "Теңдеулер мен теңсіздіктер", "Функциялар және графиктер", 
      "Дәреже, түбір, логарифм", "Логарифмдік теңдеулер", "Тригонометрия", "Арифметикалық және геометриялық прогрессия", 
      "Туынды және оның қолданылуы", "Алқышқы функция және интегралдың бастапқы түсініктері", 
      "Векторлар", "Координаталар әдісі", "Планиметрия", "Стереометрия", "Комбинаторика және ықтималдық"
    ]
  },
  "Физика": {
    description: "Классикалық механикадан бастап атомдық физикаға дейінгі негізгі заңдар.",
    topics: [
      "Кинематика", "Динамика", "Ньютонның екінші заңы", "Сақталу заңдары", "Статика және гидростатика", "Молекулалық физика", 
      "Термодинамика", "Электростатика", "Тұрақты ток заңдары", "Магнит өрісі", "Электромагниттік индукция", 
      "Тербелістер мен толқындар", "Оптика", "Атом және ядро физикасы", "Радиация", "Астрономияның негізгі элементтері"
    ]
  },
  "Химия": {
    description: "Заттардың құрылысы, қасиеттері және химиялық реакциялар заңдылықтары.",
    topics: [
      "Атом құрылысы", "Периодтық заң", "Химиялық байланыс", "Зат құрылысы", 
      "Химиялық реакциялар және олардың заңдылықтары", "Тотығу-тотықсыздану", "Ерітінділер", 
      "Электролиттік диссоциация", "Бейорганикалық қосылыстардың негізгі кластары", "Металдар мен бейметалдар", 
      "Органикалық химияның бастамалары", "Көмірсутектер", "Спирттер, альдегидтер, карбон қышқылдары, эфирлер", 
      "Аминдер, аминқышқылдар, ақуыздар", "Есептер мен сапалық реакциялар"
    ]
  },
  "Биология": {
    description: "Тірі ағзалардың құрылысы, генетика және адам анатомиясы.",
    topics: [
      "Жасуша теориясы", "Органоидтар", "Зат алмасу", "Фотосинтез және тыныс алу", 
      "Генетика және тұқымқуалаушылық", "Селекция", "Эволюция", "Экология", 
      "Адам анатомиясы мен физиологиясы", "Жүйке, қанайналым, тыныс алу, ас қорыту, зәр шығару, эндокриндік жүйелер", 
      "Ботаника", "Зоология", "Микроорганизмдер", "Биотехнология элементтері"
    ]
  },
  "География": {
    description: "Табиғат ресурсовтары, демография және Қазақстанның экономикалық географиясы.",
    topics: [
      "Географиялық зерттеу әдістері", "Карта, масштаб, координаталар", "Литосфера, атмосфера, гидросфера, биосфера", 
      "Климат және климат түзуші факторлар", "Табиғат зоналары", "Демография", "Урбандалу", 
      "Дүниежүзіның саяси картасы", "Елтану", "Табиғи ресурстар географиясы", 
      "Өнеркәсіп, ауыл шаруашылығы, көлік, қызмет көрсету саласы", 
      "Қазақстанның экономикалық және әлеуметтік географиясы", "Экологиялық проблемалар", "Ғаламдық мәселелер"
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
  return GraduationCap;
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <BookOpen className="size-8 text-primary" />
            Практикалық база
          </h1>
          <p className="text-muted-foreground text-sm">ҰБТ-да кездесетін барлық тақырыптар бойынша практикалық тапсырмалар мен материалдар.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Тақырыпты немесе пәнді іздеу..." 
            className="pl-10 bg-white" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="font-bold">Барлығы</TabsTrigger>
            <TabsTrigger value="mandatory" className="font-bold">Міндетті пәндер</TabsTrigger>
            <TabsTrigger value="choice" className="font-bold">Таңдау пәндері</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-8">
            <SubjectGroup title="Міндетті пәндер" subjects={filterSubjects(mandatorySubjects)} />
            <SubjectGroup title="Бейіндік және таңдау пәндері" subjects={filterSubjects(choiceSubjects)} />
          </TabsContent>

          <TabsContent value="mandatory" className="mt-6">
            <SubjectGroup title="Міндетті пәндер" subjects={filterSubjects(mandatorySubjects)} />
          </TabsContent>

          <TabsContent value="choice" className="mt-6">
            <SubjectGroup title="Бейіндік және таңдау пәндері" subjects={filterSubjects(choiceSubjects)} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function SubjectGroup({ title, subjects }: { title: string, subjects: string[] }) {
  const { user } = useAuth();
  const [activeDialogTopic, setActiveDialogTopic] = useState<string | null>(null);
  const [activeDialogSubject, setActiveDialogSubject] = useState<string | null>(null);
  
  // Practice Test State
  const [practiceMode, setPracticeMode] = useState<"reading" | "loading" | "testing" | "results">("reading");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState({ score: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startPractice = async (subject: string, topic: string) => {
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
      // Ұпай қосу
      await updateUserRating(user.uid, 'CORRECT_ANSWER');
    }
  };

  if (subjects.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold font-headline border-l-4 border-primary pl-3">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, i) => {
          const Icon = getSubjectIcon(subject);
          const ubtInfo = UBT_TOPICS[subject] || { topics: ["Негізгі тақырыптар"], description: "ҰБТ-ға дайындық материалдары" };

          return (
            <Dialog key={i} onOpenChange={(open) => { if(!open) setPracticeMode("reading"); }}>
              <DialogTrigger asChild>
                <Card className="hover:border-primary cursor-pointer transition-all group bg-white shadow-sm border-none overflow-hidden h-full flex flex-col">
                  <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-2">
                    <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                      <Icon className="size-6" />
                    </div>
                    <CardTitle className="text-lg font-bold">{subject}</CardTitle>
                    <CardDescription className="text-xs">
                      {ubtInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Тақырыптарды көру <ChevronRight className="size-4" />
                      </span>
                      <Badge variant="secondary" className="text-[9px] bg-accent/30 font-bold">
                        {ubtInfo.topics.length} тақырып
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-none shadow-2xl">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl font-bold font-headline">{subject}</DialogTitle>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                  <div className="grid gap-3">
                    {ubtInfo.topics.map((topic, idx) => {
                      const hasStatic = STATIC_THEORY[topic];
                      return (
                        <Dialog key={idx} onOpenChange={(open) => { 
                          if(!open) {
                            setPracticeMode("reading");
                            setQuestions([]);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <div 
                              onClick={() => {
                                setActiveDialogTopic(topic);
                                setActiveDialogSubject(subject);
                                setPracticeMode("reading");
                              }}
                              className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/5 hover:border-primary/30 transition-all group/item cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                  {idx + 1}
                                </div>
                                <span className="text-sm font-bold">{topic}</span>
                              </div>
                              <Button size="sm" variant="ghost" className="text-xs font-bold h-8 text-primary group-hover/item:bg-primary/10">
                                Бастау <ChevronRight className="size-4" />
                              </Button>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                            <DialogHeader className="p-6 pb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase">{subject}</Badge>
                                <Info className="size-4 text-primary" />
                              </div>
                              <DialogTitle className="text-2xl font-bold font-headline">{topic}</DialogTitle>
                            </DialogHeader>
                            
                            <ScrollArea className="flex-1 px-6 pb-6">
                              {practiceMode === "reading" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                  {hasStatic ? (
                                    <>
                                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                        <h4 className="flex items-center gap-2 text-sm font-black text-primary mb-2 uppercase tracking-wider">
                                          <ClipboardList className="size-4" /> Берілгені
                                        </h4>
                                        <p className="text-sm leading-relaxed">{hasStatic.given}</p>
                                      </div>
                                      <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider">
                                          <BookText className="size-4" /> Мәліметтер
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{hasStatic.theory}</p>
                                      </div>
                                      <div className="p-5 rounded-2xl bg-yellow-50 border border-yellow-100">
                                        <h4 className="flex items-center gap-2 text-sm font-black text-yellow-800 mb-2 uppercase tracking-wider">
                                          <Calendar className="size-4" /> Маңызды деректер
                                        </h4>
                                        <ul className="space-y-2">
                                          {hasStatic.years.map((item: string, yi: number) => (
                                            <li key={yi} className="flex gap-2 text-xs text-yellow-900">
                                              <CheckCircle2 className="size-3 text-yellow-600 shrink-0 mt-0.5" />
                                              {item}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="py-12 flex flex-col items-center text-center gap-4">
                                      <div className="size-16 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground">
                                        <BookOpen className="size-8" />
                                      </div>
                                      <p className="text-sm text-muted-foreground max-w-sm">
                                        Бұл тақырып бойынша материалдарды тест арқылы меңгере аласыз.
                                      </p>
                                    </div>
                                  )}

                                  <div className="pt-6 border-t">
                                    <Button 
                                      className="w-full gap-2 h-14 text-lg font-black shadow-lg bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] transition-transform"
                                      onClick={() => startPractice(subject, topic)}
                                    >
                                      <Sparkles className="size-5" />
                                      Тақырыпты бекіту (5 тест)
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                                      AI сізге осы тақырып бойынша арнайы 5 сұрақ дайындап береді.
                                    </p>
                                    {errorMessage && (
                                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                                        <AlertCircle className="size-4" /> {errorMessage}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {practiceMode === "loading" && (
                                <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                                  <div className="relative">
                                    <Loader2 className="size-12 animate-spin text-primary" />
                                    <Sparkles className="absolute -top-2 -right-2 size-6 text-yellow-400 animate-bounce" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold">AI сұрақтарды құрастыруда...</p>
                                    <p className="text-xs text-muted-foreground">Тақырыпқа сай ең маңызды сұрақтар таңдалуда.</p>
                                  </div>
                                </div>
                              )}

                              {practiceMode === "testing" && questions.length > 0 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                      <span className="text-sm font-bold">Сұрақ {currentIndex + 1} / {questions.length}</span>
                                      <Badge variant="secondary" className="text-[10px]">Тақырыптық практика</Badge>
                                    </div>
                                    <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />
                                  </div>

                                  <Card className="border-none shadow-md bg-accent/5 p-6">
                                    <h3 className="text-lg font-bold leading-relaxed mb-6">
                                      {questions[currentIndex].text}
                                    </h3>
                                    <div className="space-y-3">
                                      {questions[currentIndex].options.map((opt: string, i: number) => {
                                        const letter = String.fromCharCode(65 + i);
                                        const isSelected = answers[currentIndex] === letter;
                                        return (
                                          <button 
                                            key={i} 
                                            onClick={() => handleAnswer(letter)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                                              isSelected ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/30"
                                            }`}
                                          >
                                            <span className={`size-8 rounded-lg border-2 flex items-center justify-center text-xs font-black ${
                                              isSelected ? "bg-primary text-primary-foreground border-primary" : "group-hover:border-primary/50"
                                            }`}>
                                              {letter}
                                            </span>
                                            <span className="font-medium text-sm">{opt}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </Card>

                                  <Button 
                                    className="w-full h-12 gap-2 font-bold" 
                                    disabled={!answers[currentIndex]}
                                    onClick={nextQuestion}
                                  >
                                    {currentIndex === questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"}
                                    <ArrowRight className="size-4" />
                                  </Button>
                                </div>
                              )}

                              {practiceMode === "results" && (
                                <div className="py-8 space-y-8 animate-in zoom-in-95 duration-300">
                                  <div className="text-center space-y-4">
                                    <div className="inline-flex size-20 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner">
                                      <Trophy className="size-10" />
                                    </div>
                                    <div>
                                      <h3 className="text-2xl font-black font-headline">Нәтиже: {testResult.score} / {testResult.total}</h3>
                                      <p className="text-muted-foreground text-sm mt-1">
                                        {testResult.score === testResult.total ? "Керемет! Тақырыпты толық меңгердіңіз! 🚀" : "Жақсы нәтиже! Қателермен жұмыс істеуді ұмытпаңыз."}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Сұрақтарды талдау:</h4>
                                    <div className="grid gap-3">
                                      {questions.map((q, i) => (
                                        <div key={i} className={`p-4 rounded-xl border ${answers[i] === q.correctAnswer ? 'bg-green-50 border-green-100' : 'bg-destructive/5 border-destructive/10'}`}>
                                          <div className="flex items-start gap-3">
                                            {answers[i] === q.correctAnswer ? <CheckCircle2 className="size-4 text-green-600 mt-1 shrink-0" /> : <XCircle className="size-4 text-destructive mt-1 shrink-0" />}
                                            <div className="space-y-2">
                                              <p className="text-sm font-bold">{q.text}</p>
                                              <div className="flex gap-4 text-[10px] font-black uppercase">
                                                <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Жауабыңыз: {answers[i]}</span>
                                                <span className="text-green-700">Дұрыс: {q.correctAnswer}</span>
                                              </div>
                                              <p className="text-xs text-muted-foreground italic leading-relaxed">{q.explanation}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <Button variant="outline" className="w-full h-12 font-bold" onClick={() => setPracticeMode("reading")}>
                                    Бөлімге қайту
                                  </Button>
                                </div>
                              )}
                            </ScrollArea>
                            <div className="p-4 border-t bg-muted/20 flex justify-center">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Sparkles className="size-2.5" /> BilimAI — Сенің ҰБТ-дағы жеңісің!
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </section>
  );
}
