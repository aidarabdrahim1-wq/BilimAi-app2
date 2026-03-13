
"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ShieldAlert,
  Users,
  Megaphone,
  Plus,
  Trash2,
  Star,
  User,
  ExternalLink
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, collection, query, orderBy, deleteDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCollection, useMemoFirebase } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState<"info" | "urgent" | "success">("info");
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, loading, router]);

  // Fetch users for monitoring
  const usersQuery = useMemoFirebase(() => query(collection(db, "studentProfiles"), orderBy("rating", "desc")), []);
  const { data: students, isLoading: loadingUsers } = useCollection(usersQuery);

  // Fetch announcements for management
  const annQuery = useMemoFirebase(() => query(collection(db, "announcements"), orderBy("createdAt", "desc")), []);
  const { data: announcements, isLoading: loadingAnn } = useCollection(annQuery);

  const handleBulkUpload = async () => {
    if (!jsonInput.trim()) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = JSON.parse(jsonInput);
      if (!data.subjects) throw new Error("JSON файлында 'subjects' массиві болуы керек.");
      
      let subjectCount = 0;
      let topicCount = 0;
      let questionCount = 0;

      for (const subject of data.subjects) {
        const subjectId = subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "subjects", subjectId), {
          name: subject.name,
          description: subject.description || "",
          updatedAt: serverTimestamp()
        });
        subjectCount++;

        if (subject.topics) {
          for (const topic of subject.topics) {
            const topicId = topic.id || topic.title.toLowerCase().replace(/\s+/g, '-');
            await setDoc(doc(db, "subjects", subjectId, "topics", topicId), {
              title: topic.title,
              content: topic.content || "",
              subjectId: subjectId,
              updatedAt: serverTimestamp()
            });
            topicCount++;

            // Сұрақтарды жүктеу логикасы
            if (topic.questions && Array.isArray(topic.questions)) {
              for (const q of topic.questions) {
                const qId = q.id || Math.random().toString(36).substring(7);
                await setDoc(doc(db, "subjects", subjectId, "topics", topicId, "questions", qId), {
                  text: q.text,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || "",
                  points: q.points || 1,
                  updatedAt: serverTimestamp()
                });
                questionCount++;
              }
            }
          }
        }
      }
      toast({ 
        title: "Деректер жүктелді", 
        description: `${subjectCount} пән, ${topicCount} тақырып және ${questionCount} сұрақ қосылды.` 
      });
      setJsonInput("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!annTitle || !annContent) return;
    setIsAnnouncing(true);
    try {
      const id = Math.random().toString(36).substring(7);
      await setDoc(doc(db, "announcements", id), {
        id,
        title: annTitle,
        content: annContent,
        type: annType,
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
      toast({ title: "Хабарландыру жарияланды!" });
      setAnnTitle("");
      setAnnContent("");
    } catch (e) {
      toast({ title: "Қате", variant: "destructive" });
    } finally {
      setIsAnnouncing(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Өшіруді растайсыз ба?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast({ title: "Өшірілді" });
    } catch (e) {
      toast({ title: "Қате", variant: "destructive" });
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Админ рұқсаты тексерілуде...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight font-headline">Платформаны басқару</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
              <ShieldAlert className="size-4" />
              Админ: {isAdmin ? "Абдрахым Айдар" : "Белгісіз"}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">Жүйелік баптаулар, пайдаланушылар және контент орталығы.</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border p-1.5 h-14 rounded-2xl shadow-sm mb-8">
            <TabsTrigger value="users" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Users className="size-4" /> Пайдаланушылар
            </TabsTrigger>
            <TabsTrigger value="announcements" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Megaphone className="size-4" /> Хабарландырулар
            </TabsTrigger>
            <TabsTrigger value="import" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Database className="size-4" /> Контент импорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="bg-accent/5 pb-6 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-primary" />
                  Тіркелген оқушылар ({students?.length || 0})
                </CardTitle>
                <CardDescription>Барлық пайдаланушылардың белсенділігін бақылау.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="p-20 flex justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="divide-y">
                    {students?.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-accent/5 transition-all">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-12 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`} />
                            <AvatarFallback>{s.fullName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{s.fullName}</span>
                            <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">
                              {s.grade}-сынып • {s.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Рейтинг</p>
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none font-black px-3 py-1">
                              <Star className="size-3 mr-1 fill-current" /> {s.rating || 0}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Тест балы</p>
                            <span className="text-xl font-black text-primary">{s.currentScore || 0}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <ExternalLink className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-none shadow-xl bg-white rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-xl font-black">Жаңа хабарландыру</CardTitle>
                  <CardDescription>Платформадағы барлық оқушыларға көрінеді.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold">Тақырыбы</Label>
                    <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="М: Жаңа пән қосылды!" className="h-12 rounded-xl bg-accent/5 border-none shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Түрі</Label>
                    <Select value={annType} onValueChange={(v: any) => setAnnType(v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-accent/5 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Ақпарат (Көк)</SelectItem>
                        <SelectItem value="urgent">Шұғыл (Қызыл)</SelectItem>
                        <SelectItem value="success">Жаңалық (Жасыл)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Мазмұны</Label>
                    <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Хабарлама мәтінін жазыңыз..." className="min-h-[150px] rounded-xl bg-accent/5 border-none shadow-inner" />
                  </div>
                  <Button className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-primary/20" onClick={handleAddAnnouncement} disabled={isAnnouncing || !annTitle}>
                    {isAnnouncing ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                    Жариялау
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="bg-accent/5 border-b">
                  <CardTitle className="text-xl font-black">Жарияланғандар</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingAnn ? (
                    <div className="p-20 flex justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
                  ) : (
                    <div className="divide-y">
                      {announcements?.map((ann) => (
                        <div key={ann.id} className="p-6 flex items-start justify-between group">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={`uppercase font-black text-[9px] ${
                                ann.type === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                                ann.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                                'bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                                {ann.type}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground">{ann.date}</span>
                            </div>
                            <h4 className="font-bold text-lg">{ann.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteAnnouncement(ann.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {announcements?.length === 0 && (
                        <div className="p-20 text-center text-muted-foreground font-medium italic">Хабарландырулар тізімі бос.</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[32px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="size-5 text-primary" />
                    JSON Импорт
                  </CardTitle>
                  <CardDescription>Базаға арналған жаңа пәндерді, тақырыптарды және тест сұрақтарын қосу.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs flex items-start gap-3 border border-destructive/20">
                      <XCircle className="size-4 shrink-0 mt-0.5" />
                      <div><p className="font-bold">Қате:</p><p>{error}</p></div>
                    </div>
                  )}
                  <Textarea placeholder='{ "subjects": [...] }' className="min-h-[400px] font-mono text-xs rounded-2xl bg-accent/5 border-none shadow-inner" value={jsonInput} onChange={(e) => { setJsonInput(e.target.value); if (error) setError(null); }} />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setJsonInput("")}>Тазалау</Button>
                    <Button className="flex-[2] gap-2 rounded-xl h-12 font-bold shadow-lg" onClick={handleBulkUpload} disabled={isUploading || !jsonInput.trim()}>
                      {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Базаға жүктеу
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[32px] overflow-hidden relative">
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><Info className="size-4" /> Нұсқаулық</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3 leading-relaxed relative z-10 opacity-90">
                    <p>1. Деректерді JSON форматына келтіріңіз.</p>
                    <p>2. Тақырыптар ішіне "questions" массивін қосуға болады.</p>
                    <p>3. Жүктеу батырмасын басып, нәтижені күтіңіз.</p>
                  </CardContent>
                  <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                </Card>
                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Code className="size-4 text-primary" /> Тестпен жүктеу үлгісі</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-2xl bg-black text-[10px] text-green-400 overflow-x-auto shadow-inner leading-relaxed">
{`{
  "subjects": [
    {
      "name": "Математика",
      "topics": [
        { 
          "title": "Логарифм", 
          "questions": [
            {
              "text": "log2(8) неге тең?",
              "options": ["1", "2", "3", "4"],
              "correctAnswer": "C",
              "explanation": "2^3 = 8"
            }
          ]
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
        </Tabs>
      </div>
    </AppShell>
  );
}
