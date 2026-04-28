import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  BrainCircuit, 
  Target, 
  ChartNoAxesColumnIncreasing, 
  Calendar, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  BookOpen,
  Sparkles,
  Zap,
  Star,
  CheckCircle2,
  ArrowRight,
  GraduationCap
} from "lucide-react";

export default function LandingPage() {
  const whatsappNumber = "77066895607";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Сәлеметсіз бе! Мен BilimAI платформасына жазылғым келеді. Толық ақпарат бересіз бе?")}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary font-headline">BilimAI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-semibold hover:text-primary transition-colors">Мүмкіндіктер</Link>
            <Link href="#how-it-works" className="text-sm font-semibold hover:text-primary transition-colors">Қалай жұмыс істейді?</Link>
            <Link href="#pricing" className="text-sm font-semibold hover:text-primary transition-colors">Бағасы</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:inline-flex font-bold">
              <Link href="/login">Кіру</Link>
            </Button>
            <Button asChild className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Жазылу</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container relative z-10 px-4 md:px-8">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                <Sparkles className="size-3" />
                ҰБТ-ға дайындықтың жаңа дәуірі
              </div>
              <h1 className="text-5xl font-black tracking-tight font-headline sm:text-7xl text-foreground leading-[1.1]">
                AI куратормен <span className="text-primary">Грантқа</span> 
                <br className="hidden sm:block" /> нық қадам бас!
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed font-medium">
                BilimAI – бұл жай ғана сайт емес. Бұл сенің 24/7 қасыңда болатын, әлсіз тұстарыңды тауып, жеке оқу жоспарын құратын интеллектуалды ұстазың.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <Button size="lg" className="h-16 px-10 text-lg font-black rounded-2xl shadow-2xl shadow-primary/30" asChild>
                  <Link href="/login">Тегін бастау <ArrowRight className="ml-2 size-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-black rounded-2xl border-2 hover:bg-accent" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Zap className="mr-2 size-5 text-yellow-500 fill-current" /> Толық доступ алу
                  </a>
                </Button>
              </div>
              
              <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto opacity-70">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black">140</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Макс балл</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black">24/7</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Көмек</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black">100%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Жаңа спецификация</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black">5000+</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Сұрақтар</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* The Problem Section */}
        <section className="py-24 container px-4 md:px-8 bg-muted/30 rounded-[60px] my-12">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black font-headline tracking-tight">ҰБТ-ға дайындалуда <span className="text-destructive">неге қиналасың?</span></h2>
              <div className="space-y-6">
                {[
                  "Қай тақырыптан бастауды білмейсің?",
                  "Теория көп, бірақ есте ештеңе қалмайды?",
                  "Пробныйларда балың бір орында тұрып қалды?",
                  "Қатемен жұмыс істеуге ерінесің немесе түсінбейсің?"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border/50">
                    <div className="size-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 font-black">!</div>
                    <p className="font-bold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 bg-primary rounded-[40px] text-white space-y-6 relative overflow-hidden group">
              <h3 className="text-3xl font-black font-headline">Біздің шешім:</h3>
              <p className="text-lg opacity-90 font-medium leading-relaxed">
                BilimAI – бұл әр оқушының жағдайын жеке зерттейтін жасанды интеллект. Ол сенің әлсіз тұстарыңды «рентген» секілді көріп, соған ғана басымдық береді.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="text-yellow-400" /> Уақытты 3 есе үнемдеу</li>
                <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="text-yellow-400" /> Тек қажетті тақырыптарды оқу</li>
                <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="text-yellow-400" /> Грантқа кепілдік (ережені сақтасаң)</li>
              </ul>
              <Zap className="absolute -bottom-10 -right-10 size-48 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 container px-4 md:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black font-headline">Платформа мүмкіндіктері</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Біз ҰБТ-ға дайындықтың әр қадамын жеңілдеттік</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "AI Диагностика", desc: "Дайындықты бастамас бұрын деңгейіңді анықтап, саған арналған жеке Start Roadmap-ті сызып береміз." },
              { icon: MessageSquare, title: "Жеке AI Куратор", desc: "Түсінбеген тақырыбың бар ма? Сұра! Ол 24/7 желіде және кез келген есепті қарапайым тілде түсіндіреді." },
              { icon: Calendar, title: "Ақылды оқу жоспары", desc: "Күнделікті не оқу керектігін ойланба. AI саған бүгінге нақты тапсырмалар беріп, орындалуын қадағалайды." },
              { icon: ChartNoAxesColumnIncreasing, title: "Қателерді автоматты талдау", desc: "Жіберген қатеңді жүйе сақтап қалады және AI оны неге қате жібергеніңді түсіндіріп береді." },
              { icon: ShieldCheck, title: "ҰБТ 2026 Спецификациясы", desc: "Барлық сұрақтар мен тақырыптар ең соңғы ресми бағдарламаға сай құрастырылған." },
              { icon: Users, title: "Рейтинг және Мотивация", desc: "Басқа оқушылармен бәсекелес, ұпай жинап, Лидерлер тізіміне шық. Грант үшін жарыс басталды!" },
            ].map((feature, i) => (
              <div key={i} className="group p-10 rounded-[32px] border-2 bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                  <feature.icon className="size-7" />
                </div>
                <h3 className="text-2xl font-black mb-4 font-headline tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 container px-4 md:px-8">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-[50px] p-12 md:p-20 text-white text-center space-y-10 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <Badge className="bg-yellow-400 text-black border-none font-black px-4 py-1">Limited Offer</Badge>
              <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Болашағыңа бүгін <span className="text-primary-foreground underline decoration-primary underline-offset-8">инвестиция жаса</span></h2>
              <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                Бір айлық дайындық құны – бір реттік тамақтанудың бағасымен тең. Бірақ бұл грантқа түсу арқылы миллиондаған теңгені үнемдеуге мүмкіндік береді.
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-8">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-8 rounded-[32px] w-full max-w-xs text-left group hover:bg-white/20 transition-all">
                  <h4 className="text-xl font-black mb-2">Стандарт пакет</h4>
                  <p className="text-xs text-slate-400 mb-6">Барлық негізгі мүмкіндіктер</p>
                  <div className="text-4xl font-black mb-8">9 900 ₸ <span className="text-sm font-normal text-slate-500">/ай</span></div>
                  <Button className="w-full h-12 rounded-xl font-bold bg-white text-black hover:bg-slate-200" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Сатып алу</a>
                  </Button>
                </Card>
                
                <Card className="bg-primary p-8 rounded-[32px] w-full max-w-xs text-left ring-4 ring-primary/30 relative transform md:scale-110 shadow-2xl">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Хит</div>
                  <h4 className="text-xl font-black mb-2">Грант пакеті</h4>
                  <p className="text-xs text-white/70 mb-6">Толық AI доступ + Жеке қолдау</p>
                  <div className="text-4xl font-black mb-8">14 900 ₸ <span className="text-sm font-normal text-white/50">/ай</span></div>
                  <Button variant="secondary" className="w-full h-12 rounded-xl font-bold shadow-xl" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Сатып алу</a>
                  </Button>
                </Card>
              </div>

              <div className="pt-10 flex items-center justify-center gap-6">
                <p className="text-sm font-bold flex items-center gap-2">
                   <ShieldCheck className="text-primary-foreground size-5" /> Қауіпсіз төлем
                </p>
                <div className="h-4 w-px bg-white/20" />
                <p className="text-sm font-bold flex items-center gap-2">
                   <GraduationCap className="text-primary-foreground size-5" /> Грант иегерлері таңдайды
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-16 bg-white">
        <div className="container px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-bold text-muted-foreground/60">
            <p>© 2025 BilimAI. Барлық құқықтар қорғалған.</p>
            <div className="flex items-center gap-8">
               <span className="hover:text-primary cursor-pointer transition-all">Құпиялылық саясаты</span>
               <span className="hover:text-primary cursor-pointer transition-all">Пайдалану шарттары</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
