import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, HelpCircle, CheckCircle2, XCircle } from "lucide-react";

export default function AnalysisPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Қателерді талдау</h1>
        <p className="text-muted-foreground">Жиі шатастыратын ұғымдар мен формулаларды осы жерден көре аласыз.</p>
      </div>

      <div className="grid gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-primary" />
            <h2 className="text-xl font-bold font-headline">Жиі шатасатын ұғымдар</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Прогрессиялар",
                c1: "Арифметикалық",
                c2: "Геометрикалық",
                desc: "Айырмашылығы: біріншісінде сан қосылады (+d), екіншісінде сан көбейтіледі (*q).",
                example: "2, 4, 6... vs 2, 4, 8..."
              },
              {
                title: "Тарих: Ордалар",
                c1: "Алтын Орда",
                c2: "Ақ Орда",
                desc: "Алтын Орда – империяның атауы. Ақ Орда – оның шығыс бөлігінде құрылған алғашқы мемлекеттік бірлестік.",
                example: "Бату хан vs Орда Ежен"
              },
              {
                title: "Химия: Массалар",
                c1: "Молекулалық масса",
                c2: "Молярлық масса",
                desc: "Мән-мағынасы бір болса да, өлшем бірлігі әртүрлі (м.а.б vs г/моль).",
                example: "Mr vs M"
              }
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group">
                <div className="h-2 bg-primary group-hover:h-3 transition-all" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-center">
                    <div className="p-2 rounded bg-blue-50 text-blue-700">{item.c1}</div>
                    <div className="p-2 rounded bg-teal-50 text-teal-700">{item.c2}</div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs font-mono">
                    Мысалы: {item.example}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <h2 className="text-xl font-bold font-headline">Осы жерде абай бол!</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-destructive/5 border-l-4 border-l-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <HelpCircle className="size-5" />
                  Есептеулердегі қателер
                </CardTitle>
                <CardDescription>Студенттердің 60%-ы осы жерден ұпай жоғалтады</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 bg-white rounded-xl border border-destructive/20">
                  <h4 className="font-bold mb-2">Сандардың таңбасы (+/-)</h4>
                  <p className="text-muted-foreground text-xs">Жақшаны ашқан кезде алдында "минус" болса, ішіндегі барлық таңбалар өзгеретінін ұмытпаңыз.</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-red-600 font-mono text-[10px]">
                      <XCircle className="size-3" /> -(a - b) = -a - b
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-mono text-[10px]">
                      <CheckCircle2 className="size-3" /> -(a - b) = -a + b
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-orange-50 border-l-4 border-l-orange-400">
              <CardHeader>
                <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  Ұқсас терминдер (Биология)
                </CardTitle>
                <CardDescription>Биологиядағы шатастыратын ұғымдар базасы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 bg-white rounded-xl border border-orange-200">
                  <h4 className="font-bold mb-2">Митоз vs Мейоз</h4>
                  <p className="text-muted-foreground text-xs">Митоз – дененің (соматикалық) жасушаларының бөлінуі. Мейоз – жыныс жасушаларының бөлінуі.</p>
                  <Badge className="mt-2 bg-orange-100 text-orange-700 hover:bg-orange-200">Есте сақта: Мейоз = маңызды (ұрпақ үшін)</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
