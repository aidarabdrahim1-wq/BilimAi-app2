
"use client";

import { useState, useEffect } from "react";
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
  Code,
  ShieldAlert
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

const contentStructure = [
  { id: "01", title: "Профиль басқару", items: ["Студент деректері", "Мақсаттарды баптау", "Рейтинг жүйесі"], icon: Folder },
  { id: "02", title: "Пәндер", items: ["Теориялық база", "Тесттер жинағы", "Күрделі есептер"], icon: Database },
  { id: "03", title: "Қателер базасы", items: ["Типтік қателер", "AI талдау шаблондары", "Ескертулер"], icon: AlertCircle },
];

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, loading, router]);

  const handleBulkUpload = async () => {
    if (!jsonInput.trim()) return;
    setIsUploading(true);
    setError(null);
    
    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (e: any) {
        throw new Error(`JSON форматы дұрыс емес: ${e.message}`);
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
      setIsUploading(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Рұқсат тексерілуде...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Контентті басқару</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
              <ShieldAlert className="size-3.5" />
              Админ
            </Badge>
          </div>
          <p className="text-muted-foreground">Базаны жаңарту және деректерді жүктеу орталығы.</p>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="bg-white border p-1 h-12 rounded-xl">
            <TabsTrigger value="import" className="font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">Деректерді жүктеу</TabsTrigger>
            <TabsTrigger value="structure" className="font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">Құрылым</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="size-5 text-primary" />
                    JSON Импорт
                  </CardTitle>
                  <CardDescription>
                    Базаға арналған жаңа пәндер мен тақырыптарды қосу.
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
                    className={`min-h-[400px] font-mono text-xs rounded-2xl bg-accent/5 border-none shadow-inner ${error ? 'ring-2 ring-destructive' : ''}`}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setJsonInput("")}>Тазалау</Button>
                    <Button className="flex-[2] gap-2 rounded-xl h-12 font-bold shadow-lg" onClick={handleBulkUpload} disabled={isUploading || !jsonInput.trim()}>
                      {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Базаға жүктеу
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-primary text-primary-foreground rounded-3xl overflow-hidden relative">
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Info className="size-4" />
                      Нұсқаулық
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3 leading-relaxed relative z-10 opacity-90">
                    <p>1. Деректерді JSON форматына келтіріңіз.</p>
                    <p>2. Төмендегі үлгі бойынша құрылымды сақтаңыз.</p>
                    <p>3. Жүктеу батырмасын басып, нәтижені күтіңіз.</p>
                  </CardContent>
                  <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Code className="size-4 text-primary" />
                      Формат үлгісі
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-2xl bg-black text-[10px] text-green-400 overflow-x-auto shadow-inner leading-relaxed">
{`{
  "subjects": [
    {
      "name": "Математика",
      "topics": [
        {
          "title": "Логарифм",
          "content": "..."
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
                <Card key={section.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-3xl overflow-hidden group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <section.icon className="size-6" />
                      </div>
                      <CardTitle className="text-base font-bold">{section.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest">{section.id}</Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="size-1.5 bg-primary/30 rounded-full" />
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
