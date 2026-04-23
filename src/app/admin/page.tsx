
"use client";

import { useState, useEffect } from "react";
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
  XCircle,
  Info,
  Code,
  ShieldAlert,
  Users,
  Star,
  ExternalLink,
  UserPlus,
  AlertTriangle,
  ClipboardCopy,
  CheckCircle2
} from "lucide-react";
import { doc, setDoc, collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCollection, useMemoFirebase, useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth as firebaseAuth } from "@/lib/firebase/config";

const SUBJECT_COMBINATIONS = [
  { label: "Математика + Физика", subjects: ["Математика", "Физика"], careers: ["IT", "Инженерия", "Архитектура"] },
  { label: "Математика + Информатика", subjects: ["Математика", "Информатика"], careers: ["IT", "Программалау"] },
  { label: "Биология + Химия", subjects: ["Биология", "Химия"], careers: ["Медицина", "Стоматология"] },
  { label: "Биология + География", subjects: ["Биология", "География"], careers: ["Агрономия", "Экология"] },
  { label: "География + Математика", subjects: ["География", "Математика"], careers: ["Экономика", "Бизнес"] },
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

  // Registration State
  const [regForm, setRegForm] = useState({
    fullName: "",
    email: "",
    password: "",
    grade: "11",
    comboIndex: "",
    targetCareer: "",
    targetScore: 120
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, loading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "studentProfiles"), orderBy("rating", "desc"));
  }, [firestore]);
  const { data: students, isLoading: loadingUsers } = useCollection(usersQuery);

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.comboIndex) {
      toast({ title: "Барлық өрістерді толтырыңыз", variant: "destructive" });
      return;
    }

    setIsRegistering(true);
    try {
      const combo = SUBJECT_COMBINATIONS[parseInt(regForm.comboIndex)];
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, regForm.email, regForm.password);
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
        targetCareer: regForm.targetCareer,
        weakTopics: [],
        untDate: "2025-06-20",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'student'
      };

      await setDoc(doc(firestore, "studentProfiles", user.uid), profileData);
      toast({ title: "Оқушы сәтті тіркелді!" });
      setRegForm({ fullName: "", email: "", password: "", grade: "11", comboIndex: "", targetCareer: "", targetScore: 120 });
    } catch (err: any) {
      toast({ title: "Тіркеу қатесі", description: err.message, variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!jsonInput.trim() || !firestore) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress("Деректер талдануда...");

    try {
      const data = JSON.parse(jsonInput);
      if (!data.subjects) throw new Error("JSON файлында 'subjects' массиві болуы керек.");
      
      let count = 0;
      for (const subject of data.subjects) {
        setUploadProgress(`${subject.name} пәні жүктелуде...`);
        const subjectId = subject.name.toLowerCase().replace(/\s+/g, '-');
        const subjectRef = doc(firestore, "subjects", subjectId);
        
        await setDoc(subjectRef, { name: subject.name, updatedAt: serverTimestamp() }, { merge: true });

        if (subject.topics) {
          for (const topic of subject.topics) {
            const topicId = topic.title.toLowerCase().replace(/\s+/g, '-');
            const topicRef = doc(firestore, "subjects", subjectId, "topics", topicId);
            
            await setDoc(topicRef, { title: topic.title, updatedAt: serverTimestamp() }, { merge: true });

            if (topic.questions) {
              for (const q of topic.questions) {
                const qId = Math.random().toString(36).substring(7);
                const qRef = doc(firestore, "subjects", subjectId, "topics", topicId, "questions", qId);
                await setDoc(qRef, { ...q, updatedAt: serverTimestamp() });
                count++;
              }
            }
          }
        }
      }
      toast({ title: "Сәтті!", description: `${count} сұрақ базаға қосылды.` });
      setJsonInput("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            <TabsTrigger value="register" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <UserPlus className="size-4" /> Оқушыны тіркеу
            </TabsTrigger>
            <TabsTrigger value="import" className="font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white px-8 h-full gap-2">
              <Database className="size-4" /> Контент импорт
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
                          <Avatar className="size-12 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`} />
                            <AvatarFallback>{s.fullName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{s.fullName}</span>
                            <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">{s.grade}-сынып • {s.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none font-black px-3 py-1">
                            <Star className="size-3 mr-1 fill-current" /> {s.rating || 0}
                          </Badge>
                          <span className="text-xl font-black text-primary">{s.currentScore || 0} балл</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="bg-primary/5 pb-6 border-b">
                <CardTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" /> Жаңа оқушыны тіркеу</CardTitle>
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
                  {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Оқушыны тіркеу
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[32px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileJson className="size-5 text-primary" /> Базаны жаппай толтыру</CardTitle>
                  <CardDescription>Мыңдаған сұрақтарды 1 минутта жүктеңіз.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">{error}</div>}
                  <Textarea placeholder='JSON кодын осы жерге қойыңыз...' className="min-h-[400px] font-mono text-xs rounded-2xl bg-accent/5 border-none" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
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
                    <p>2. Оң жақтағы "Үлгіні көшіру" батырмасын басып, форматты AI-ға көрсетіңіз.</p>
                    <p>3. Дайын JSON кодын сол жақтағы терезеге қойып, "Жүктеу" батырмасын басыңыз.</p>
                  </div>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold">Импорт Үлгісі</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(`{ "subjects": [ { "name": "Математика", "topics": [ { "title": "Логарифм", "questions": [ { "text": "log2(8)?", "options": ["1","2","3","4"], "correctAnswer": "C", "explanation": "2^3=8" } ] } ] } ] }`);
                      toast({ title: "Көшірілді!" });
                    }}><ClipboardCopy className="size-4" /></Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-xl bg-black text-[10px] text-green-400 overflow-x-auto">
{`{
  "subjects": [
    {
      "name": "Пән атауы",
      "topics": [
        { 
          "title": "Тақырып", 
          "questions": [
            {
              "text": "Сұрақ?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A",
              "explanation": "Түсініктеме"
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
