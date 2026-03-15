
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
  Database, 
  Upload, 
  Loader2,
  FileJson,
  XCircle,
  Info,
  Code,
  ShieldAlert,
  Users,
  Star,
  ExternalLink,
  Megaphone,
  Plus,
  Trash2,
  Calendar
} from "lucide-react";
import { doc, setDoc, collection, query, orderBy, serverTimestamp, deleteDoc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCollection, useMemoFirebase, useFirebase, errorEmitter, FirestorePermissionError, deleteDocumentNonBlocking } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function AdminPage() {
  const { isAdmin, loading, profile } = useAuth();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Announcement form state
  const [annForm, setAnnForm] = useState({
    title: "",
    content: "",
    type: "info" as "urgent" | "success" | "info"
  });
  const [isAnnLoading, setIsAnnLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, loading, router]);

  // Fetch users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "studentProfiles"), orderBy("rating", "desc"));
  }, [firestore]);
  const { data: students, isLoading: loadingUsers } = useCollection(usersQuery);

  // Fetch announcements
  const annQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "announcements"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: announcements, isLoading: loadingAnn } = useCollection(annQuery);

  const handleBulkUpload = async () => {
    if (!jsonInput.trim() || !firestore) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = JSON.parse(jsonInput);
      if (!data.subjects) throw new Error("JSON файлында 'subjects' массиві болуы керек.");
      
      for (const subject of data.subjects) {
        const subjectId = subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        const subjectRef = doc(firestore, "subjects", subjectId);
        const subjectData = {
          name: subject.name,
          description: subject.description || "",
          updatedAt: serverTimestamp()
        };

        setDoc(subjectRef, subjectData, { merge: true }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: subjectRef.path,
            operation: 'write',
            requestResourceData: subjectData
          }));
        });

        if (subject.topics) {
          for (const topic of subject.topics) {
            const topicId = topic.id || topic.title.toLowerCase().replace(/\s+/g, '-');
            const topicRef = doc(firestore, "subjects", subjectId, "topics", topicId);
            const topicData = {
              title: topic.title,
              content: topic.content || "",
              subjectId: subjectId,
              updatedAt: serverTimestamp()
            };

            setDoc(topicRef, topicData, { merge: true }).catch(err => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: topicRef.path,
                operation: 'write',
                requestResourceData: topicData
              }));
            });

            if (topic.questions && Array.isArray(topic.questions)) {
              for (const q of topic.questions) {
                const qId = q.id || Math.random().toString(36).substring(7);
                const qRef = doc(firestore, "subjects", subjectId, "topics", topicId, "questions", qId);
                const qData = {
                  text: q.text,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || "",
                  points: q.points || 1,
                  updatedAt: serverTimestamp()
                };
                setDoc(qRef, qData, { merge: true }).catch(err => {
                  errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: qRef.path,
                    operation: 'write',
                    requestResourceData: qData
                  }));
                });
              }
            }
          }
        }
      }
      toast({ 
        title: "Деректерді жүктеу аяқталды", 
        description: "Барлық пәндер мен сұрақтар базаға сәтті қосылды." 
      });
      setJsonInput("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.content.trim() || !firestore) return;
    setIsAnnLoading(true);
    const annData = {
      title: annForm.title,
      content: annForm.content,
      type: annForm.type,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(firestore, "announcements"), annData);
      toast({ title: "Хабарландыру жарияланды!" });
      setAnnForm({ title: "", content: "", type: "info" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnnLoading(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!firestore || !confirm("Өшіргіңіз келе ме?")) return;
    const annRef = doc(firestore, "announcements", id);
    deleteDocumentNonBlocking(annRef);
    toast({ title: "Өшіру басталды..." });
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
              Админ: {profile?.fullName || "Белгісіз"}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">Пайдаланушылар, хабарландырулар және оқу контентін басқару орталығы.</p>
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

          <TabsContent value="announcements" className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-1 border-none shadow-xl bg-white rounded-[32px] h-fit">
                <CardHeader>
                  <CardTitle className="text-xl font-black">Жаңа хабарландыру</CardTitle>
                  <CardDescription>Платформадағы барлық оқушыларға көрінеді.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Түрі</Label>
                    <Select value={annForm.type} onValueChange={(v: any) => setAnnForm({ ...annForm, type: v })}>
                      <SelectTrigger className="rounded-xl h-11 bg-accent/5 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">🔴 Шұғыл (Urgent)</SelectItem>
                        <SelectItem value="success">🟢 Жаңалық (Success)</SelectItem>
                        <SelectItem value="info">🔵 Ақпарат (Info)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Тақырыбы</Label>
                    <Input 
                      placeholder="М: Техникалық жұмыстар" 
                      className="rounded-xl h-11 bg-accent/5 border-none" 
                      value={annForm.title}
                      onChange={(e) => setAnnForm({...annForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Мәтіні</Label>
                    <Textarea 
                      placeholder="Хабарламаның толық мазмұны..." 
                      className="rounded-xl min-h-[120px] bg-accent/5 border-none"
                      value={annForm.content}
                      onChange={(e) => setAnnForm({...annForm, content: e.target.value})}
                    />
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg" onClick={handleAddAnnouncement} disabled={isAnnLoading}>
                    {isAnnLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Жариялау
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="bg-accent/5 pb-6 border-b">
                  <CardTitle>Жарияланғандар</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingAnn ? (
                    <div className="p-20 flex justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
                  ) : (
                    <div className="divide-y">
                      {announcements?.map((ann) => (
                        <div key={ann.id} className="p-6 flex items-start justify-between group hover:bg-accent/5 transition-all">
                          <div className="flex gap-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                              ann.type === 'urgent' ? 'bg-red-100 text-red-600' : 
                              ann.type === 'success' ? 'bg-green-100 text-green-600' : 
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Megaphone className="size-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-lg">{ann.title}</h4>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase">{ann.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase pt-1">
                                <Calendar className="size-3" /> {ann.date}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDeleteAnnouncement(ann.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {announcements?.length === 0 && (
                        <div className="p-20 text-center text-muted-foreground italic font-medium">Хабарландырулар тізімі бос.</div>
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
