
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  Database, 
  Upload, 
  AlertCircle, 
  Loader2,
  FileJson,
  XCircle,
  Info,
  Code
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const contentStructure = [
  { id: "01", title: "Профиль басқару", items: ["Студент деректері", "Мақсаттарды баптау", "Рейтинг жүйесі"], icon: Folder },
  { id: "02", title: "Пәндер", items: ["Теориялық база", "Тесттер жинағы", "Күрделі есептер"], icon: Database },
  { id: "03", title: "Қателер базасы", items: ["Типтік қателер", "AI талдау шаблондары", "Ескертулер"], icon: AlertCircle },
];

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBulkUpload = async () => {
    if (!jsonInput.trim()) return;
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (e: any) {
        throw new Error(`JSON форматы дұрыс емес: Жақшаларды немесе тырнақшаларды тексеріңіз. (Қате: ${e.message})`);
      }
      
      if (data.subjects && Array.isArray(data.subjects)) {
        let count = 0;
        for (const subject of data.subjects) {
          const subjectId = subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
          await setDoc(doc(db, "subjects", subjectId), {
            name: subject.name,
            description: subject.description || "",
            updatedAt: new Date().toISOString()
          });

          if (subject.topics && Array.isArray(subject.topics)) {
            for (const topic of subject.topics) {
              const topicId = topic.id || topic.title.toLowerCase().replace(/\s+/g, '-');
              await setDoc(doc(db, "subjects", subjectId, "topics", topicId), {
                title: topic.title,
                content: topic.content || "",
                subjectId: subjectId,
                updatedAt: new Date().toISOString()
              });
              count++;
            }
          }
        }
        toast({ 
          title: "Деректер сәтті жүктелді!", 
          description: `${data.subjects.length} пән және ${count} тақырып қосылды.`,
        });
        setJsonInput("");
      } else {
        throw new Error("JSON файлында 'subjects' массиві болуы керек.");
      }
    } catch (err: any) {
      setError(err.message);
      toast({ 
        title: "Жүктеу қатесі", 
        description: "Форматты тексеріңіз.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Контентті басқару</h1>
          <p className="text-muted-foreground">Базаны жаңарту және деректерді жүктеу орталығы.</p>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList>
            <TabsTrigger value="import" className="font-bold">Деректерді жүктеу</TabsTrigger>
            <TabsTrigger value="structure" className="font-bold">Құрылым</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="size-5 text-primary" />
                    JSON Импорт
                  </CardTitle>
                  <CardDescription>
                    Google Docs-тан көшірілген деректерді осында қойыңыз.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs flex items-start gap-3 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                      <XCircle className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Қате:</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}
                  <Textarea 
                    placeholder='{ "subjects": [...] }' 
                    className={`min-h-[400px] font-mono text-xs ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setJsonInput("")}>Тазалау</Button>
                    <Button className="flex-[2] gap-2" onClick={handleBulkUpload} disabled={isLoading || !jsonInput.trim()}>
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Базаға жүктеу
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-accent/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Info className="size-4 text-primary" />
                      Қалай жүктеймін?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3 leading-relaxed">
                    <p>1. Google Docs-тағы базаны маған (чатқа) жіберіңіз.</p>
                    <p>2. Мен оны JSON форматына айналдырып беремін.</p>
                    <p>3. Сол JSON-ды көшіріп, сол жақтағы терезеге қойыңыз.</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Code className="size-4 text-primary" />
                      Формат үлгісі
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-3 rounded-lg bg-black text-[10px] text-green-400 overflow-x-auto">
{`{
  "subjects": [
    {
      "name": "Математика",
      "topics": [
        {
          "title": "Логарифмдер",
          "content": "Толық теория..."
        }
      ]
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contentStructure.map((section) => (
                <Card key={section.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
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
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground group">
                          <div className="size-1 bg-muted group-hover:bg-primary rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
