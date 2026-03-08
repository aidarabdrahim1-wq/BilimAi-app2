
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  ChevronRight, 
  History, 
  Calculator, 
  Languages, 
  Atom, 
  FlaskConical, 
  Globe, 
  Dna,
  Scale
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Пәндерге сәйкес иконкаларды анықтау
const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("тарих")) return History;
  if (n.includes("мат")) return Calculator;
  if (n.includes("сауаттылық") && n.includes("оқу")) return Languages;
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

  // Пәндерді топтарға бөлу (signup-тағы логика бойынша)
  // Index 0, 1, 2 - Міндетті пәндер
  // Index 3, 4 - Таңдау пәндері
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
          <p className="text-muted-foreground">ҰБТ-да кездесетін барлық тақырыптар бойынша құрылымдалған конспектілер.</p>
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

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold font-headline">Соңғы оқылғандар</h2>
          <div className="space-y-3">
            {[
              { title: "Квадрат теңдеулер", subject: "Математика", progress: 80 },
              { title: "Ньютон заңдары", subject: "Физика", progress: 45 },
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-sm flex items-center justify-between p-4 bg-white hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {item.progress}% аяқталды
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
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
          return (
            <Card key={i} className="hover:border-primary cursor-pointer transition-all group bg-white shadow-sm border-none overflow-hidden">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                  <Icon className="size-6" />
                </div>
                <CardTitle className="text-lg font-bold">{subject}</CardTitle>
                <CardDescription className="text-xs">
                  {subject === "Математикалық сауаттылық" ? "10 негізгі тақырып" : "20+ тереңдетілген тақырып"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Оқуды бастау <ChevronRight className="size-4" />
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-accent/30">ҰБТ 2025</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
