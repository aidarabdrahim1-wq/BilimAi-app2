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
  RefreshCcw
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
import { explainTopic, type ExplainTopicOutput } from "@/ai/flows/explain-topic-flow";

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
      "Кесте, сызба, диаграммадағы ақпаратты оқу"
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
      "Дәреже, түбір, логарифм", "Тригонометрия", "Арифметикалық және геометриялық прогрессия", 
      "Туынды және оның қолданылуы", "Алғашқы функция және интегралдың бастапқы түсініктері", 
      "Векторлар", "Координаталар әдісі", "Планиметрия", "Стереометрия", "Комбинаторика және ықтималдық"
    ]
  },
  "Физика": {
    description: "Классикалық механикадан бастап атомдық физикаға дейінгі негізгі заңдар.",
    topics: [
      "Кинематика", "Динамика", "Сақталу заңдары", "Статика және гидростатика", "Молекулалық физика", 
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
  },
  "Дүниежүзі тарихы": {
    description: "Әлемдік өркениеттердин дамуы мен халықаралық қатынастар тарихы.",
    topics: [
      "Ежелгі өркениеттер", "Антикалық дүние", "Орта ғасырлар", "Феодалдық қоғам", "Ислам өркениеті", 
      "Қайта өрлеу", "Реформация", "Ұлы географиялық ашулар", "Буржуазиялық революциялар", 
      "Индустрияландыру", "Отаршылдық", "І және ІІ дүниежүзілік соғыс", "Версаль-Вашингтон жүйесі", 
      "Қырғи-қабақ соғыс", "Деколонизация", "Халықаралық қатынастар", "ХХ-ХХІ ғасырдағы жаһандық үрдістер"
    ]
  },
  "Құқық негіздері": {
    description: "Мемлекеттік басқару, Конституция және заңнама негіздері.",
    topics: [
      "Мемлекет және құқық теориясы", "Конституция", "Адам және азамат құқықтары", "Сайлау жүйесі", 
      "Мемлекеттік басқару", "Әкімшілік құқық", "Азаматтық құқық", "Еңбек құқығы", "Отбасы құқығы", 
      "Қылмыстық құқық", "Сыбайлас жемқорлыққа қарсы мәдениет", "Сот жүйесі", "Құқықтық жауапкершілік", 
      "Халықаралық құқықтың негізгі ұғымдары"
    ]
  },
  "Информатика": {
    description: "Алгоритмдеу, программалау және киберқауіпсіздік негіздері.",
    topics: [
      "Ақпарат және ақпараттық процестер", "Компьютер архитектурасы", "Операциялық жүйелер", 
      "Файлдар және деректер", "Ақпаратты кодтау", "Логика элементтері", "Алгоритмдеу", 
      "Программалау негіздері", "Деректер қоры", "Электрондық кестелер", "Желілер және интернет", 
      "Киберқауіпсіздік", "Веб-технология негіздері", "Модельдеу", "Цифрлық сауаттылық"
    ]
  },
  "Ағылшын тілі": {
    description: "Reading comprehension, grammar and vocabulary usage.",
    topics: [
      "Reading comprehension", "Vocabulary in context", "Grammar: tenses, passive voice, reported speech", 
      "Conditionals, modal verbs, articles, prepositions", "Relative clauses, word formation", 
      "Sentence transformation", "Cloze test", "Matching", "Everyday and academic topics мәтіндері"
    ]
  },
  "Қазақ тілі": {
    description: "Қазақ тілінің грамматикасы, стилистикасы мен мәтін талдауы.",
    topics: [
      "Фонетика", "Орфоэпия", "Орфография", "Лексика және фразеология", "Сөзжасам", "Морфология", 
      "Сөз таптары", "Сөйлем мүшелері", "Жай сөйлем", "Құрмалас сөйлем", "Синтаксис", "Тыныс белгілері", 
      "Мәтін түрлері", "Стильдер", "Тілдік норма", "Грамматикалық талдау"
    ]
  },
  "Қазақ әдебиеті": {
    description: "Әдеби шығармалар талдауы мен авторлар шығармашылығы.",
    topics: [
      "Әдеби бағыттар мен жанрлар", "Әдеби-теориялық ұғымдар", "Ақын-жазушылардың өмірі мен шығармашылығы", 
      "Поэзия талдауы", "Прозалық шығармаларды талдау", "Драмалық шығармалар", "Кейіпкер бейнесі", 
      "Идея, тақырып, композиция", "Тарихи-көркемдік маңызы", "Автор позициясы", "Әдеби шығарма бойынша салыстырмалы талдау"
    ]
  },
  "Орыс тілі": {
    description: "Русский язык и культура речи.",
    topics: [
      "Фонетика, лексика, грамматика", "Морфология, синтаксис, пунктуация", "Мәтінді түсіну", 
      "Стилистика", "Языковые нормы", "Культура речи"
    ]
  },
  "Орыс әдебиеті": {
    description: "History russian literature and analysis of works.",
    topics: [
      "Авторы и произведения", "Литературные жанры", "Литературный анализ", "Герои и идеи", 
      "Композиция", "Историко-литературный контекст"
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
            Теориялық база
          </h1>
          <p className="text-muted-foreground text-sm">ҰБТ-да кездесетін барлық тақырыптар бойынша құрылымдалған конспектілер.</p>
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

        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <Star className="size-5 text-yellow-500 fill-yellow-500" />
              Таңдаулы тақырыптар
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Логарифмдік теңдеулер", subject: "Математика", difficulty: "Орта" },
              { title: "Қазақ хандығының құрылуы", subject: "Қазақстан тарихы", difficulty: "Оңай" },
              { title: "Ньютонның екінші заңы", subject: "Физика", difficulty: "Орта" },
              { title: "Адам анатомиясы мен физиологиясы", subject: "Биология", difficulty: "Қиын" },
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-sm flex items-center justify-between p-4 bg-white hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none mb-1">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] font-bold">
                    {item.difficulty}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SubjectGroup({ title, subjects }: { title: string, subjects: string[] }) {
  const [explainingTopic, setExplainingTopic] = useState<string | null>(null);
  const [explainingSubject, setExplainingSubject] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<ExplainTopicOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExplain = async (subject: string, topic: string) => {
    setExplainingTopic(topic);
    setExplainingSubject(subject);
    setIsAiLoading(true);
    setAiExplanation(null);
    setErrorMessage(null);
    try {
      const result = await explainTopic({ subject, topic });
      setAiExplanation(result);
    } catch (error: any) {
      console.error("AI Explanation error:", error);
      let msg = "Түсіндірмені жүктеу мүмкін болмады.";
      if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        msg = "AI квотасы (тегін лимит) аяқталды. Сәлден соң (1-2 минут) қайта көріңіз.";
      }
      setErrorMessage(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (subjects.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold font-headline border-l-4 border-primary pl-3">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, i) => {
          const Icon = getSubjectIcon(subject);
          const ubtInfo = UBT_TOPICS[subject] || { topics: ["Негізгі тақырыптар", "Практикалық есептер"], description: "ҰБТ-ға дайындық материалдары" };

          return (
            <Dialog key={i}>
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
                        Оқуды бастау <ChevronRight className="size-4" />
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
                  <DialogDescription className="text-sm font-medium">
                    ҰТО спецификациясына сай бекітілген тақырыптар тізімі. AI арқылы кез келген тақырыпты түсіндіріп алыңыз.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                  <div className="grid gap-3">
                    {ubtInfo.topics.map((topic, idx) => (
                      <Dialog key={idx}>
                        <DialogTrigger asChild>
                          <div 
                            onClick={() => handleExplain(subject, topic)}
                            className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/5 hover:border-primary/30 transition-all group/item cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-bold">{topic}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs font-bold gap-1 h-8 text-primary group-hover/item:bg-primary/10">
                              <Sparkles className="size-3" /> AI Түсіндіру
                            </Button>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                          <DialogHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] uppercase">{subject}</Badge>
                              <Sparkles className="size-4 text-primary animate-pulse" />
                            </div>
                            <DialogTitle className="text-2xl font-bold font-headline">{topic}</DialogTitle>
                            <DialogDescription>BilimAI оқушыға арналған түсіндірмесі</DialogDescription>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 px-6 pb-6">
                            {isAiLoading ? (
                              <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="relative">
                                  <Loader2 className="size-12 animate-spin text-primary" />
                                  <Sparkles className="absolute -top-2 -right-2 size-6 text-yellow-400 animate-bounce" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold">AI ойлануда...</p>
                                  <p className="text-xs text-muted-foreground">Тақырыпты ең қарапайым тілмен құрастырып жатырмыз.</p>
                                </div>
                              </div>
                            ) : errorMessage ? (
                              <div className="py-20 flex flex-col items-center justify-center gap-6 text-center max-w-sm mx-auto">
                                <div className="size-20 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                                  <AlertCircle className="size-10" />
                                </div>
                                <div className="space-y-2">
                                  <h2 className="text-xl font-bold font-headline">Байланыс қатесі</h2>
                                  <p className="text-muted-foreground text-sm leading-relaxed">
                                    {errorMessage}
                                  </p>
                                </div>
                                <Button 
                                  className="gap-2" 
                                  onClick={() => handleExplain(explainingSubject!, explainingTopic!)}
                                >
                                  <RefreshCcw className="size-4" /> Қайта көру
                                </Button>
                              </div>
                            ) : aiExplanation ? (
                              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                {/* 1. Берілгені */}
                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                  <h4 className="flex items-center gap-2 text-sm font-black text-primary mb-2 uppercase tracking-wider">
                                    <ClipboardList className="size-4" /> 1. Берілгені
                                  </h4>
                                  <p className="text-sm leading-relaxed">{aiExplanation.given}</p>
                                </div>

                                {/* 2. Теория */}
                                <div className="space-y-3">
                                  <h4 className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider">
                                    <BookText className="size-4" /> 2. Теория
                                  </h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiExplanation.theory}</p>
                                </div>

                                {/* 5. Жаттап алу керек жылдар */}
                                <div className="p-5 rounded-2xl bg-yellow-50 border border-yellow-100">
                                  <h4 className="flex items-center gap-2 text-sm font-black text-yellow-800 mb-2 uppercase tracking-wider">
                                    <Calendar className="size-4" /> 5. Жаттап алу керек жылдар / Маңызды деректер
                                  </h4>
                                  <ul className="space-y-2">
                                    {aiExplanation.yearsToMemorize.map((item, yi) => (
                                      <li key={yi} className="flex gap-2 text-xs text-yellow-900">
                                        <CheckCircle2 className="size-3 text-yellow-600 shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* 6. ҰБТ-да көп келетін тақырыптар */}
                                <div className="p-5 rounded-2xl bg-green-50 border border-green-100">
                                  <h4 className="flex items-center gap-2 text-sm font-black text-green-800 mb-2 uppercase tracking-wider">
                                    <Target className="size-4" /> 6. ҰБТ-да көп келетін тақырыптар
                                  </h4>
                                  <p className="text-sm text-green-700 leading-relaxed whitespace-pre-wrap">
                                    {aiExplanation.frequentUntTopics}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </ScrollArea>
                          <div className="p-4 border-t bg-muted/20 flex justify-center">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Sparkles className="size-2.5" /> BilimAI Куратор сізге сәттілік тілейді!
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
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
