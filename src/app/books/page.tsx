"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Library, 
  BookText, 
  FileDown, 
  Eye, 
  GraduationCap, 
  Calculator, 
  Globe, 
  Atom, 
  Languages,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const BOOKS_DATA = [
  {
    id: 1,
    title: "Математика: ҰБТ-ға дайындық",
    author: "А. Нұрланұлы",
    subject: "Математика",
    pages: 320,
    year: 2024,
    description: "Логикалық есептер мен күрделі теңдеулерді шешу жолдары.",
    icon: Calculator,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    id: 2,
    title: "Қазақстан тарихы: Конспект",
    author: "М. Сәбит",
    subject: "Тарих",
    pages: 180,
    year: 2023,
    description: "Ежелгі дәуірден бүгінге дейінгі негізгі даталар мен оқиғалар.",
    icon: GraduationCap,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    id: 3,
    title: "Физика: Формулалар жинағы",
    author: "Д. Ержан",
    subject: "Физика",
    pages: 120,
    year: 2024,
    description: "ҰБТ-да жиі кездесетін физикалық заңдар мен формулалар.",
    icon: Atom,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
  {
    id: 4,
    title: "Оқу сауаттылығы: Текстер",
    author: "Б. Қайрат",
    subject: "Оқу сауаттылығы",
    pages: 210,
    year: 2024,
    description: "Мәтінді талдау және логикалық сұрақтарға жауап беру техникасы.",
    icon: Languages,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    id: 5,
    title: "География: ҰБТ анықтамалығы",
    author: "Ш. Айдын",
    subject: "География",
    pages: 250,
    year: 2023,
    description: "Дүниежүзілік экономикалық және саяси география негіздері.",
    icon: Globe,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  }
];

const SUBJECTS = ["Барлығы", "Математика", "Тарих", "Физика", "Оқу сауаттылығы", "География"];

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Барлығы");

  const filteredBooks = BOOKS_DATA.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "Барлығы" || book.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Library className="size-8" />
              </div>
              ҰБТ кітапханасы
            </h1>
            <p className="text-muted-foreground font-medium">Дайындыққа арналған таңдаулы оқулықтар мен жинақтар.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100">
            <Sparkles className="size-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Жаңа басылымдар қосылды</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid gap-6 md:grid-cols-12 items-center">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input 
              placeholder="Кітап немесе авторды іздеу..." 
              className="pl-12 h-14 bg-white border-none shadow-md rounded-2xl text-base focus-visible:ring-primary" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-7 flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {SUBJECTS.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-6 h-12 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedSubject === subject 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "bg-white text-muted-foreground hover:bg-accent/50 border"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <Card key={book.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white rounded-[32px] overflow-hidden flex flex-col">
                <div className={`h-24 ${book.bg} flex items-center justify-center relative overflow-hidden`}>
                  <book.icon className={`size-12 ${book.color} opacity-20 absolute -right-4 -bottom-4 rotate-12`} />
                  <book.icon className={`size-10 ${book.color} relative z-10 drop-shadow-sm`} />
                </div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-accent/50 text-[10px] font-black uppercase tracking-widest">{book.subject}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground">{book.year} жыл</span>
                  </div>
                  <CardTitle className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-bold">{book.author}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2 flex-1">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {book.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
                    <span className="flex items-center gap-1"><BookText className="size-3" /> {book.pages} бет</span>
                    <span className="flex items-center gap-1"><Eye className="size-3" /> 1.2к оқылды</span>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 border-t bg-accent/5 mt-auto grid grid-cols-2 gap-3">
                  <Button variant="ghost" className="rounded-xl text-xs font-bold gap-2">
                    <FileDown className="size-4" /> PDF
                  </Button>
                  <Button className="rounded-xl text-xs font-black gap-2 shadow-lg shadow-primary/10">
                    Оқу <ArrowRight className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-6 bg-muted/5 rounded-[40px] border-4 border-dashed border-white">
              <div className="size-24 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground/30">
                <Library className="size-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Кітаптар табылмады</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Өтініш, іздеу сұранысын немесе пәнді өзгертіп көріңіз.</p>
              </div>
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => { setSearchQuery(""); setSelectedSubject("Барлығы"); }}>
                Фильтрді тазалау
              </Button>
            </div>
          )}
        </div>

        {/* Suggestion Section */}
        <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[40px] overflow-hidden relative p-8 md:p-12">
          <div className="relative z-10 max-w-2xl space-y-6">
            <Badge className="bg-primary text-white border-none font-bold px-4 py-1">AI ҰСЫНЫСЫ</Badge>
            <h2 className="text-3xl md:text-4xl font-black font-headline leading-tight">
              Өз кітабыңды немесе конспектіңді таппадың ба?
            </h2>
            <p className="text-slate-300 text-lg font-medium leading-relaxed">
              AI Кураторға жаз! Ол саған кез келген тақырып бойынша ең үздік материалдарды тауып береді немесе өзі жеке конспект құрастырып шығады.
            </p>
            <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg gap-3 bg-white text-primary hover:bg-white/90 shadow-xl" asChild>
              <a href="/curator">
                AI Куратордан сұрау
                <Sparkles className="size-5" />
              </a>
            </Button>
          </div>
          <Library className="absolute -bottom-20 -right-20 size-[400px] text-white/5 rotate-12 pointer-events-none" />
        </Card>
      </div>
    </AppShell>
  );
}
