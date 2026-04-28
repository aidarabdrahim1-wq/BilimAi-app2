"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Upload, 
  Loader2,
  FileJson,
  PlusCircle,
  Users,
  ShieldAlert,
  Trash2,
  Search,
  BookOpen,
  Plus,
  CheckCircle2,
  ClipboardCopy,
  LayoutGrid,
  AlertCircle
} from "lucide-react";
import { doc, setDoc, collection, query, orderBy, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCollection, useMemoFirebase, useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { UBT_TOPICS } from "@/lib/ubt-data";

const SUBJECT_COMBINATIONS = [
  { label: "Математика + Физика", subjects: ["Математика", "Физика"] },
  { label: "Математика + Информатика", subjects: ["Математика", "Информатика"] },
  { label: "Биология + Химия", subjects: ["Биология", "Химия"] },
  { label: "Биология + География", subjects: ["Биология", "География"] },
  { label: "География + Математика", subjects: ["География", "Математика"] },
];

export default function AdminPage() {
  const { isAdmin, loading, profile } = useAuth();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Manual Question State
  const [manualQ, setManualQ] = useState({
    subject: "",
    topic: "",
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: ""
  });
  const [isSavingQ, setIsSavingQ] = useState(false);

  // View Questions State
  const [selectedViewSubject, setSelectedViewSubject] = useState("");
  const [selectedViewTopic, setSelectedViewTopic] = useState("");
  const [fetchedQuestions, setFetchedQuestions] = useState<any[]>([]);
  const [isFetchingQ, setIsFetchingQ] = useState(false);

  // Registration State
  const [regForm, setRegForm] = useState({
    fullName: "",
    email: "",
    password: "",
    grade: "11",
    comboIndex: "",
    targetScore: 120
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, loading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, "studentProfiles"), orderBy("rating", "desc"));
  }, [firestore, isAdmin]);
  
  const { data: students, isLoading: loadingUsers } = useCollection(usersQuery);

  const availableSubjects = useMemo(() => Object.keys(UBT_TOPICS), []);
  const availableTopics = useMemo(() => {
    if (!manualQ.subject) return [];
    const info = UBT_TOPICS[manualQ.subject];
    if (!info) return [];
    return info.sections.flatMap(s => s.topics);
  }, [manualQ.subject]);

  const viewTopics = useMemo(() => {
    if (!selectedViewSubject) return [];
    const info = UBT_TOPICS[selectedViewSubject];
    if (!info) return [];
    return info.sections.flatMap(s => s.topics);
  }, [selectedViewSubject]);

  const handleManualSave = () => {
    if (!manualQ.subject || !manualQ.text || !manualQ.optionA || !manualQ.optionB) {
      toast({ title: "Өрістерді толтырыңыз", variant: "destructive" });
      return;
    }

    setIsSavingQ(true);
    const subjectId = manualQ.subject.toLowerCase().replace(/\s+/g, '-');
    const topicId = (manualQ.topic || "жалпы").toLowerCase().replace(/\s+/g, '-');
    const qId = Math.random().toString(36).substring(7);

    const qRef = doc(firestore, "subjects", subjectId, "topics", topicId, "questions", qId);
    const qData = {
      text: manualQ.text,
      options: [manualQ.optionA, manualQ.optionB, manualQ.optionC, manualQ.optionD],
      correctAnswer: manualQ.correctAnswer,
      explanation: manualQ.explanation,
      updatedAt: serverTimestamp()
    };

    setDoc(qRef, qData)
      .then(() => {
        toast({ title: "Сұрақ сақталды!" });
        setManualQ({ ...manualQ, text: "", optionA: "", optionB: "", optionC: "", optionD: "", explanation: "" });
        setIsSavingQ(false);
      })
      .catch(async (err) => {
        setIsSavingQ(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: qRef.path,
          operation: 'create',
          requestResourceData: qData
        }));
      });

    setDoc(doc(firestore, "subjects", subjectId), { name: manualQ.subject, updatedAt: serverTimestamp() }, { merge: true });
    setDoc(doc(firestore, "subjects", subjectId, "topics", topicId), { title: manualQ.topic || "Жалпы", updatedAt: serverTimestamp() }, { merge: true });
  };

  const fetchQuestionsForView = async () => {
    if (!selectedViewSubject || !selectedViewTopic) return;
    setIsFetchingQ(true);
    try {
      const subjectId = selectedViewSubject.toLowerCase().replace(/\s+/g, '-');
      const topicId = selectedViewTopic.toLowerCase().replace(/\s+/g, '-');
      const qRef = collection(firestore, "subjects", subjectId, "topics", topicId, "questions");
      const snap = await getDocs(qRef);
      setFetchedQuestions(snap.docs.map(d => ({ 
        id: d.id, 
        subjectId, 
        topicId, 
        ...d.data() 
      })));
    } catch (err) {
      toast({ title: "Жүктеу қатесі", variant: "destructive" });
    } finally {
      setIsFetchingQ(false);
    }
  };

  const deleteQuestion = (q: any) => {
    if (!confirm("Бұл сұрақты өшіргіңіз келе ме?")) return;
    const qRef = doc(firestore, "subjects", q.subjectId, "topics", q.topicId, "questions", q.id);
    setFetchedQuestions(prev => prev.filter(item => item.id !== q.id));
    toast({ title: "Сұрақ өшірілді" });
    deleteDoc(qRef).catch(async (err) => {
      const permissionError = new FirestorePermissionError({ path: qRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.comboIndex) {
      toast({ title: "Барлық өрістерді толтырыңыз", variant: "destructive" });
      return;
    }

    setIsRegistering(true);
    const combo = SUBJECT_COMBINATIONS[parseInt(regForm.comboIndex)];
    
    createUserWithEmailAndPassword(firebaseAuth, regForm.email, regForm.password)
      .then((userCredential) => {
        const user = userCredential.user;
        const profileData = {
          id: user.uid,
          fullName: regForm.fullName,
          email: regForm.email,
          grade: regForm.grade,
          targetScore: Number(regForm.targetScore),
          currentScore: 0,
          rating: 0,
          solvedQuestions: 0,
          correctAnswers: 0,
          completedPlans: 0,
          streakDays: 0,
          selectedSubjects: ["Оқу сауаттылығы", "Қазақстан тарихы", "Математикалық сауаттылық", ...combo.subjects],
          subjectCombination: combo.label,
          targetCareer: "",
          weakTopics: [],
          untDate: "2025-06-20",
          totalStudyTimeMinutes: 0,
          todayStudyTimeMinutes: 0,
          activityHistory: [],
          role: 'student',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const userRef = doc(firestore, "studentProfiles", user.uid);
        setDoc(userRef, profileData)
          .then(() => {
            toast({ title: "Оқушы сәтті тіркелді!" });
            setRegForm({ fullName: "", email: "", password: "", grade: "11", comboIndex: "", targetScore: 120 });
            setIsRegistering(false);
          })
          .catch(async (err) => {
            setIsRegistering(false);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userRef.path,
              operation: 'create',
              requestResourceData: profileData
            }));
          });
      })
      .catch((err: any) => {
        setIsRegistering(false);
        toast({ title: "Тіркеу қатесі", description: err.message, variant: "destructive" });
      });
  };

  const handleBulkUpload = () => {
    if (!jsonInput.trim() || !firestore) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress("Талдау жүріп жатыр...");

    try {
      let rawData = JSON.parse(jsonInput);
      let subjectsToProcess: any[] = [];

      const normalizeQ = (q: any) => {
        if (!q) return null;
        let options: string[] = [];
        
        if (Array.isArray(q.options)) {
          options = q.options;
        } else if (q.options && typeof q.options === 'object') {
          // Handle {A: "", B: "", ...}
          options = [q.options.A, q.options.B, q.options.C, q.options.D].map(o => String(o || "")).filter(Boolean);
        }
        
        return {
          text: q.question || q.text || "",
          options: options,
          correctAnswer: q.correct || q.correctAnswer || "A",
          explanation: q.explanation || "",
          bloom: q.bloom || "",
          difficulty: q.difficulty || "",
          updatedAt: serverTimestamp()
        };
      };

      // Improved structure detection with safety checks
      if (rawData.subject && rawData.chapters) {
        subjectsToProcess = [{
          name: rawData.subject,
          topics: (rawData.chapters || []).flatMap((ch: any) =>
            (ch.topics || []).map((t: any) => ({
              title: t.topic || t.title,
              questions: (t.questions || []).map(normalizeQ).filter(Boolean),
            }))
          ),
        }];
      } else if (rawData.subjects) {
        subjectsToProcess = (rawData.subjects || []).map((s: any) => ({
          name: s.name || s.subject,
          topics: (s.topics || []).map((t: any) => ({
            title: t.title || t.topic,
            questions: (t.questions || []).map(normalizeQ).filter(Boolean)
          }))
        }));
      } else if (rawData.subject && (rawData.questions || rawData.topics)) {
        subjectsToProcess = [{
          name: rawData.subject,
          topics: Array.isArray(rawData.topics) 
            ? rawData.topics.map((t: any) => ({
                title: t.topic || t.title,
                questions: (t.questions || []).map(normalizeQ).filter(Boolean)
              }))
            : [{
                title: rawData.topic || "Жалпы",
                questions: (rawData.questions || []).map(normalizeQ).filter(Boolean)
              }]
        }];
      } else {
        throw new Error("JSON форматы танылмады. Мәліметтердің дұрыстығын тексеріңіз.");
      }
      
      let totalQ = 0;
      subjectsToProcess.forEach(s => (s.topics || []).forEach((t: any) => totalQ += (t.questions || []).length));
      
      if (totalQ === 0) {
        throw new Error("Бірде-бір жарамды сұрақ табылмады.");
      }

      setUploadProgress(`Жүктеуде: 0 / ${totalQ} сұрақ...`);
      let processedCount = 0;
      
      subjectsToProcess.forEach((subject: any) => {
        if (!subject.name) return;
        const subjectId = subject.name.toLowerCase().replace(/\s+/g, '-');
        setDoc(doc(firestore, "subjects", subjectId), { name: subject.name, updatedAt: serverTimestamp() }, { merge: true });

        (subject.topics || []).forEach((topic: any) => {
          if (!topic.title) return;
          const topicId = topic.title.toLowerCase().replace(/\s+/g, '-');
          setDoc(doc(firestore, "subjects", subjectId, "topics", topicId), { title: topic.title, updatedAt: serverTimestamp() }, { merge: true });

          (topic.questions || []).forEach((q: any) => {
            const qId = q.id || Math.random().toString(36).substring(7);
            const qRef = doc(firestore, "subjects", subjectId, "topics", topicId, "questions", qId);
            
            setDoc(qRef, q)
              .then(() => {
                processedCount++;
                setUploadProgress(`Жүктеуде: ${processedCount} / ${totalQ} сұрақ...`);
                if (processedCount === totalQ) {
                  toast({ title: "Жүктеу аяқталды!", description: `${totalQ} сұрақ базаға қосылды.` });
                  setIsUploading(false);
                  setJsonInput("");
                }
              })
              .catch(async (err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: qRef.path,
                  operation: 'create',
                  requestResourceData: q
                }));
              });
          });
        });
      });
      
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight font-headline">Платформаны басқару</h1>
          <Badge variant="secondary" className="w-fit gap-1.5 py-1 px-3">
            <ShieldAlert className="size-4" /> Админ: {profile?.fullName}
          </Badge>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border p-1.5 h-14 rounded-2xl shadow-sm mb-8">
            <TabsTrigger value="users" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Users className="size-4" /> Пайдаланушылар
            </TabsTrigger>
            <TabsTrigger value="questions" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <BookOpen className="size-4" /> Сұрақтар базасы
            </TabsTrigger>
            <TabsTrigger value="import" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Database className="size-4" /> Импорт
            </TabsTrigger>
            <TabsTrigger value="register" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <PlusCircle className="size-4" /> Тіркеу
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="bg-accent/5 pb-6 border-b">
                <CardTitle>Тіркелген оқушылар ({students?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="p-20 flex justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="divide-y">
                    {students?.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-accent/5 transition-all">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-12 shadow-sm border-2 border-background">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`} />
                            <AvatarFallback>{s.fullName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{s.fullName}</span>
                            <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">{s.grade}-сынып • {s.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-primary">{s.rating || 0}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Рейтинг</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-foreground">{s.currentScore || 0}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Орта балл</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border-none shadow-xl bg-white rounded-[32px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Жаңа сұрақ қосу</CardTitle>
                  <CardDescription>Сұрақты қолмен базаға енгізу.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Пән</Label>
                    <Select onValueChange={(v) => setManualQ({...manualQ, subject: v, topic: ""})} value={manualQ.subject}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                      <SelectContent>
                        {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Тақырып</Label>
                    <Select onValueChange={(v) => setManualQ({...manualQ, topic: v})} value={manualQ.topic} disabled={!manualQ.subject}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                      <SelectContent>
                        {availableTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Сұрақ мәтіні</Label>
                    <Textarea value={manualQ.text} onChange={(e) => setManualQ({...manualQ, text: e.target.value})} className="rounded-xl min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px]">A нұсқасы</Label><Input value={manualQ.optionA} onChange={(e) => setManualQ({...manualQ, optionA: e.target.value})} className="rounded-lg h-9" /></div>
                    <div className="space-y-1"><Label className="text-[10px]">B нұсқасы</Label><Input value={manualQ.optionB} onChange={(e) => setManualQ({...manualQ, optionB: e.target.value})} className="rounded-lg h-9" /></div>
                    <div className="space-y-1"><Label className="text-[10px]">C нұсқасы</Label><Input value={manualQ.optionC} onChange={(e) => setManualQ({...manualQ, optionC: e.target.value})} className="rounded-lg h-9" /></div>
                    <div className="space-y-1"><Label className="text-[10px]">D нұсқасы</Label><Input value={manualQ.optionD} onChange={(e) => setManualQ({...manualQ, optionD: e.target.value})} className="rounded-lg h-9" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Дұрыс жауап</Label>
                      <Select onValueChange={(v) => setManualQ({...manualQ, correctAnswer: v})} value={manualQ.correctAnswer}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Түсіндірме</Label>
                    <Textarea value={manualQ.explanation} onChange={(e) => setManualQ({...manualQ, explanation: e.target.value})} className="rounded-xl h-20" />
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold" onClick={handleManualSave} disabled={isSavingQ}>
                    {isSavingQ ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PlusCircle className="mr-2 size-4" />} Сақтау
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 space-y-6">
                <Card className="border-none shadow-xl bg-white rounded-[32px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Базаны көру</CardTitle>
                      <CardDescription>Пән мен тақырыпты таңдап, сұрақтарды басқарыңыз.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select onValueChange={setSelectedViewSubject} value={selectedViewSubject}>
                        <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="Пән" /></SelectTrigger>
                        <SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select onValueChange={setSelectedViewTopic} value={selectedViewTopic} disabled={!selectedViewSubject}>
                        <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="Тақырып" /></SelectTrigger>
                        <SelectContent>{viewTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="icon" className="rounded-xl" onClick={fetchQuestionsForView} disabled={isFetchingQ || !selectedViewTopic}>
                        <Search className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-[400px]">
                    {isFetchingQ ? (
                      <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
                    ) : fetchedQuestions.length > 0 ? (
                      <div className="space-y-4">
                        {fetchedQuestions.map((q) => (
                          <div key={q.id} className="p-4 rounded-2xl bg-accent/5 border border-border/50 flex justify-between items-center gap-4 group hover:bg-accent/10 transition-all">
                            <div className="space-y-2 flex-1">
                              <p className="font-bold text-sm leading-relaxed">{q.text}</p>
                              <div className="flex flex-wrap gap-2">
                                {q.options.map((opt: string, i: number) => (
                                  <Badge key={i} variant="outline" className={`text-[9px] ${String.fromCharCode(65+i) === q.correctAnswer ? 'border-green-500 text-green-600 bg-green-50' : 'bg-white'}`}>
                                    {String.fromCharCode(65+i)}: {opt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-1 px-2 h-8 font-bold text-[10px]" 
                              onClick={() => deleteQuestion(q)}
                            >
                              <Trash2 className="size-3" />
                              Өшіру
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <LayoutGrid className="size-12 mb-4 opacity-20" />
                        <p>Сұрақтар таңдалмаған немесе база бос.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[32px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileJson className="size-5 text-primary" /> Базаны жаппай толтыру</CardTitle>
                  <CardDescription>Мыңдаған сұрақтарды 1 минутта жүктеңіз.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-3">
                      <AlertCircle className="size-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <Textarea 
                    placeholder='JSON кодын осы жерге қойыңыз...' 
                    className="min-h-[400px] font-mono text-xs rounded-2xl bg-accent/5 border-none" 
                    value={jsonInput} 
                    onChange={(e) => setJsonInput(e.target.value)} 
                  />
                  <Button className="w-full gap-2 rounded-xl h-12 font-bold shadow-lg" onClick={handleBulkUpload} disabled={isUploading || !jsonInput.trim()}>
                    {isUploading ? <><Loader2 className="size-4 animate-spin" /> {uploadProgress}</> : <><Upload className="size-4" /> Базаға жүктеу</>}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[32px] overflow-hidden p-6">
                  <h3 className="font-bold flex items-center gap-2 mb-4"><CheckCircle2 className="size-5" /> Тез толтыру жолы:</h3>
                  <div className="text-xs space-y-4 opacity-90 leading-relaxed">
                    <p>1. AI-дан (ChatGPT) сұрақтарды біздің форматқа келтіріп беруді сұраңыз.</p>
                    <p>2. Төмендегі "Импорт Үлгісін" AI-ға көрсетіңіз.</p>
                  </div>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold">Импорт Үлгісі</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({
                        subject: "Биология",
                        chapters: [
                          {
                            chapter: "1. Генетика",
                            topics: [
                              {
                                topic: "Мендель заңдары",
                                questions: [
                                  {
                                    question: "Мендельдің бірінші заңы қалай аталады?",
                                    options: { A: "Ажырау", B: "Біртектілік", C: "Тәуелсіз тұқым қуалау", D: "Тіркес" },
                                    correct: "B",
                                    explanation: "Бірінші ұрпақ будандарының біртектілік заңы.",
                                    difficulty: "easy"
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }, null, 2));
                      toast({ title: "Көшірілді!" });
                    }}><ClipboardCopy className="size-4" /></Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-xl bg-black text-[10px] text-green-400 overflow-x-auto">
{`{
  "subject": "Биология",
  "chapters": [
    {
      "chapter": "1. Генетика",
      "topics": [
        {
          "topic": "Мендель заңдары",
          "questions": [
            {
              "question": "Сұрақ?",
              "options": { "A": "..", "B": "..", "C": "..", "D": ".." },
              "correct": "B",
              "explanation": "Түсіндірме"
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

          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="bg-primary/5 pb-6 border-b">
                <CardTitle className="flex items-center gap-2"><PlusCircle className="size-5 text-primary" /> Жаңа оқушыны тіркеу</CardTitle>
                <CardDescription>Оқушы үшін жаңа аккаунт жасау.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Аты-жөні</Label><Input placeholder="Арман Серік" value={regForm.fullName} onChange={(e) => setRegForm({...regForm, fullName: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="student@mail.kz" value={regForm.email} onChange={(e) => setRegForm({...regForm, email: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Құпия сөз</Label><Input type="password" value={regForm.password} onChange={(e) => setRegForm({...regForm, password: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Сынып</Label>
                    <Select onValueChange={(v) => setRegForm({...regForm, grade: v})} value={regForm.grade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="10">10-сынып</SelectItem><SelectItem value="11">11-сынып</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Пән комбинациясы</Label>
                  <Select onValueChange={(v) => setRegForm({...regForm, comboIndex: v})} value={regForm.comboIndex}>
                    <SelectTrigger><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                    <SelectContent>{SUBJECT_COMBINATIONS.map((c, i) => <SelectItem key={i} value={i.toString()}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleRegisterStudent} disabled={isRegistering}>
                  {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Оқушыны тіркеу
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
