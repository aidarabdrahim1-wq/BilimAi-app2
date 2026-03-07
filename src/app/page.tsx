import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  Target, 
  BarChart, 
  Calendar, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  BookOpen 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary font-headline">BilimAI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Мүмкіндіктер</Link>
            <Link href="#subjects" className="text-sm font-medium hover:text-primary transition-colors">Пәндер</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Тарифтер</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Кіру</Link>
            <Button asChild>
              <Link href="/dashboard">Бастау</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 bg-accent/30">
          <div className="container relative z-10 px-4 md:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-extrabold tracking-tight font-headline sm:text-6xl text-foreground">
                AI куратордың көмегімен <span className="text-primary">ҰБТ-ға</span> сапалы дайындық
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                BilimAI – бұл тек тест емес. Бұл сіздің әлсіз тұстарыңызды тауып, жеке оқу жоспарын құрып, 
                күн сайын мотивация беретін ақылды платформа.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                  <Link href="/dashboard">Тегін бастау</Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                  <Link href="/diagnostic">Диагностикадан өту</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-24 container px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-headline mb-4">Неге бізді таңдайды?</h2>
            <p className="text-muted-foreground">Платформаның негізгі артықшылықтары</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Әлсіз тұсты анықтау", desc: "AI диагностика арқылы нақты қай тақырыптарды қайталау керек екенін білесіз." },
              { icon: Calendar, title: "Жеке оқу жоспары", desc: "Сіздің деңгейіңізге және мақсатты балыңызға сай құрастырылған апталық жоспар." },
              { icon: MessageSquare, title: "AI куратор", desc: "Кез келген уақытта сұрақ қойып, қолдау мен мотивация алыңыз." },
              { icon: BarChart, title: "Прогресс бақылауы", desc: "Әр күн сайын өсуіңізді бақылап, қателермен жұмыс жасаңыз." },
              { icon: ShieldCheck, title: "Теория + Практика", desc: "Барлық тақырып бойынша құрылымдалған конспектілер мен ҰБТ форматындағы тесттер." },
              { icon: Users, title: "Ұжымдық қолдау", desc: "Үздік оқушылар қауымдастығына қосылып, бірге дамыңыз." },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-headline">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subjects Section */}
        <section id="subjects" className="py-24 bg-muted/30">
          <div className="container px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold font-headline">Дайындық пәндері</h2>
                <p className="text-muted-foreground mt-2">Барлық негізгі және бейіндік пәндер қамтылған</p>
              </div>
              <Button variant="link" className="text-primary font-semibold">Барлық пәндерді көру</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Математика', 'Физика', 'Химия', 'Биология', 'Қазақстан тарихы', 'Дүниежүзі тарихы', 'Қазақ тілі', 'Оқу сауаттылығы'].map((subject, i) => (
                <div key={i} className="group cursor-pointer p-6 rounded-xl border bg-card text-center hover:bg-primary hover:text-primary-foreground transition-all">
                  <div className="mb-3 mx-auto size-10 flex items-center justify-center rounded-lg bg-primary/5 group-hover:bg-white/10">
                    <BookOpen className="size-5" />
                  </div>
                  <span className="font-semibold">{subject}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 container px-4 md:px-8">
          <div className="rounded-3xl bg-primary p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold font-headline md:text-5xl mb-6">Бүгіннен бастап ҰБТ-ға дайындықты жеңілдетіңіз</h2>
              <p className="text-primary-foreground/80 mb-10 text-lg">
                Диагностикадан өтіп, жеке оқу жоспарыңызды тегін алыңыз. 
                Мақсатыңызға бір қадам жақындаңыз!
              </p>
              <Button size="lg" variant="secondary" className="h-12 px-10 text-base font-bold shadow-lg" asChild>
                <Link href="/dashboard">Қазір бастау</Link>
              </Button>
            </div>
            <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 size-64 bg-white/5 rounded-full blur-3xl" />
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-card">
        <div className="container px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold tracking-tight text-primary font-headline">BilimAI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Қазақстандағы ең заманауи ҰБТ-ға дайындық платформасы. AI көмегімен биік белестерді бағындырыңыз.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Платформа</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Басты бет</Link></li>
                <li><Link href="#" className="hover:text-primary">Диагностика</Link></li>
                <li><Link href="#" className="hover:text-primary">Курстар</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Көмек</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Жиі қойылатын сұрақтар</Link></li>
                <li><Link href="#" className="hover:text-primary">Қолдау көрсету</Link></li>
                <li><Link href="#" className="hover:text-primary">Байланыс</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 BilimAI. Барлық құқықтар қорғалған.
          </div>
        </div>
      </footer>
    </div>
  );
}
