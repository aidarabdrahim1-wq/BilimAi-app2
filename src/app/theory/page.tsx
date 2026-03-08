
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
  Info
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

// ҰБТ тақырыптарының базасы
const UBT_TOPICS: Record<string, { topics: string[], description: string }> = {
  "Математика": {
    description: "Алгебра және геометрия курсы",
    topics: ["Нақты сандар", "Көпмүшелер", "Тригонометрия", "Функциялар", "Туынды және оның қолданылуы", "Интеграл", "Планиметрия", "Стереометрия", "Векторлар"]
  },
  "Физика": {
    description: "Механикадан кванттық физикаға дейін",
    topics: ["Кинематика", "Динамика", "Статика және гидростатика", "Термодинамика", "Электр өрісі", "Тұрақты ток", "Магнитизм", "Оптика", "Кванттық және ядролық физика"]
  },
  "Қазақстан тарихы": {
    description: "Ежелгі дәуірден бүгінгі күнге дейін",
    topics: ["Ежелгі Қазақстан", "Орта ғасырлардағы Қазақстан", "Қазақ хандығының құрылуы", "XVIII-XIX ғғ. Қазақстан", "XX ғасыр басындағы Қазақстан", "Кеңестік кезең", "Тәуелсіз Қазақстан"]
  },
  "Математикалық сауаттылық": {
    description: "Логика және есептеу дағдылары",
    topics: ["Логикалық есептер", "Пайыздар мен қатынастар", "Диаграммалар және графиктер", "Мәтіндік есептер", "Жиындар теориясы", "Комбинаторика элементтері"]
  },
  "Оқу сауаттылығы": {
    description: "Мәтінді талдау және түсіну",
    topics: ["Мәтін түрлерін анықтау", "Мәтіннің негізгі ойы", "Ақпаратты салыстыру", "Сөйлемдегі сөз мағынасы", "Тұжырымдама жасау"]
  },
  "Биология": {
    description: "Тірі ағзалар және олардың дамуы",
    topics: ["Ботаника (Өсімдіктер)", "Зоология (Жануарлар)", "Адам анатомиясы", "Цитология", "Генетика негіздері", "Эволюция теориясы", "Экология"]
  },
  "Химия": {
    description: "Заттар мен олардың өзгерістері",
    topics: ["Периодтық заң", "Химиялық байланыстар", "Бейорганикалық химия", "Органикалық химия", "Ерітінділер", "Металдар мен бейметалдар"]
  },
  "География": {
    description: "Жер және оның ресурстары",
    topics: ["Физикалық география", "Дүниежүзі географиясы", "Қазақстанның экономикалық географиясы", "Халықтар географиясы", "Экологиялық мәселелер"]
  },
  "Ағылшын тілі": {
    description: "Грамматика және лексика",
    topics: ["Tenses", "Articles", "Modals", "Passive Voice", "Conditionals", "Vocabulary", "Reading Comprehension"]
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
            <SubjectGroup title="Таңдау пәндері" subjects={filterSubjects(choiceSubjects)} />
          </TabsContent>

          <TabsContent value="mandatory" className="mt-6">
            <SubjectGroup title="Міндетті пәндер" subjects={filterSubjects(mandatorySubjects)} />
          </TabsContent>

          <TabsContent value="choice" className="mt-6">
            <SubjectGroup title="Таңдау пәндері" subjects={filterSubjects(choiceSubjects)} />
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
              { title: "Аминқышқылдары", subject: "Биология", difficulty: "Қиын" },
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
                    ҰБТ-да кездесетін негізгі тақырыптар тізімі. Әр тақырыпты меңгеру сіздің баллыңызды арттырады.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                  <div className="grid gap-3">
                    {ubtInfo.topics.map((topic, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/5 hover:border-primary/30 transition-all group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-bold">{topic}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs font-bold gap-1 h-8 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Info className="size-3" /> Ашу
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-6 flex gap-3">
                  <Button className="flex-1 font-bold shadow-md shadow-primary/20">
                    <ListChecks className="size-4 mr-2" /> Барлық конспектіні жүктеу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </section>
  );
}
