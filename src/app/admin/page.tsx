import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, FileText, Database, ShieldCheck, Settings } from "lucide-react";

const contentStructure = [
  { id: "01", title: "Профиль басқару", items: ["Студент деректері", "Мақсаттарды баптау", "Рейтинг жүйесі"], icon: Folder },
  { id: "02", title: "Математика", items: ["Теориялық база", "Тесттер жинағы", "Күрделі есептер"], icon: Database },
  { id: "03", title: "Физика", items: ["Теориялық база", "Тесттер жинағы", "Виртуалды лаборатория"], icon: Database },
  { id: "04", title: "Химия", items: ["Теориялық база", "Тесттер жинағы", "Реакциялар каталогы"], icon: Database },
  { id: "05", title: "Тарих", items: ["Даталар базасы", "Карталар", "Тесттер жинағы"], icon: Database },
  { id: "06", title: "Қателер базасы", items: ["Типтік қателер", "AI талдау шаблондары", "Ескертулер"], icon: AlertCircle },
  { id: "07", title: "Диагностика", items: ["Адаптивті алгоритм", "Сұрақтар банкі", "Есеп беру жүйесі"], icon: ShieldCheck },
  { id: "08", title: "Жоспарлар", items: ["Күнделікті жоспар шаблоны", "Апталық құрылым", "Сегментация"], icon: FileText },
  { id: "09", title: "Мотивация", items: ["Куратор мәтіндері", "Қолдау сценарийлері", "Дәйексөздер"], icon: MessageSquare },
];

export default function AdminPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Контентті басқару</h1>
        <p className="text-muted-foreground">Платформаның құрылымы мен мазмұнын басқару панелі.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contentStructure.map((section) => (
          <Card key={section.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-accent/20 text-accent-foreground flex items-center justify-center">
                  <section.icon className="size-5" />
                </div>
                <CardTitle className="text-base font-bold">{section.title}</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase">{section.id}</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors group">
                    <div className="size-1 bg-muted group-hover:bg-primary rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
