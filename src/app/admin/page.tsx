
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
  ShieldCheck, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  Loader2,
  FileJson
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const contentStructure = [
  { id: "01", title: "Профиль басқару", items: ["Студент деректері", "Мақсаттарды баптау", "Рейтинг жүйесі"], icon: Folder },
  { id: "02", title: "Пәндер", items: ["Теориялық база", "Тесттер жинағы", "Күрделі есептер"], icon: Database },
  { id: "03", title: "Қателер базасы", items: ["Типтік қателер", "AI талдау шаблондары", "Ескертулер"], icon: AlertCircle },
];

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkUpload = async () => {
    if (!jsonInput.trim()) return;
    setIsLoading(true);
    try {
      const data = JSON.parse(jsonInput);
      
      // Мысалы: Пәндерді жүктеу
      if (data.subjects && Array.isArray(data.subjects)) {
        for (const subject of data.subjects) {
          const subjectId = subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
          await setDoc(doc(db, "subjects", subjectId), {
            name: subject.name,
            description: subject.description || "",
            updatedAt: new Date().toISOString()
          });

          // Тақырыптар болса
          if (subject.topics && Array.isArray(subject.topics)) {
            for (const topic of subject.topics) {
              const topicId = topic.id || topic.title.toLowerCase().replace(/\s+/g, '-');
              await setDoc(doc(db, "subjects", subjectId, "topics", topicId), {
                title: topic.title,
                content: topic.content || "",
                subjectId: subjectId,
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
        toast({ title: "Деректер сәтті жүктелді!", description: "Пәндер мен тақырыптар базаға қосылды." });
      } else {
        toast({ title: "Қате формат", description: "JSON файлында 'subjects' массиві болуы керек.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Жүктеу қатесі", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setJsonInput("");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Контентті басқару</h1>
          <p className="text-muted-foreground">Платформаның құрылымы мен мазмұнын басқару және деректерді жүктеу.</p>
        </div>

        <Tabs defaultValue="structure" className="w-full">
          <TabsList>
            <TabsTrigger value="structure" className="font-bold">Құрылым</TabsTrigger>
            <TabsTrigger value="import" className="font-bold">Деректерді жүктеу (JSON)</TabsTrigger>
          </TabsList>

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
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="size-5 text-primary" />
                  JSON импорт
                </CardTitle>
                <CardDescription>
                  Төмендегі терезеге JSON форматындағы деректерді қойыңыз. 
                  Үлгі: {"{ \"subjects\": [ { \"name\": \"Математика\", \"topics\": [...] } ] }"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder='{ "subjects": [...] }' 
                  className="min-h-[300px] font-mono text-xs"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <Button 
                  className="w-full gap-2" 
                  onClick={handleBulkUpload} 
                  disabled={isLoading || !jsonInput.trim()}
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Базаға жүктеу
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
