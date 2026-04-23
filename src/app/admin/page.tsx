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
  Trash2,
  UserPlus,
  AlertTriangle
} from "lucide-react";
import { doc, setDoc, collection, query, orderBy, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCollection, useMemoFirebase, useFirebase, errorEmitter, FirestorePermissionError, deleteDocumentNonBlocking } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth as firebaseAuth } from "@/lib/firebase/config";

const SUBJECT_COMBINATIONS = [
  { label: "Математика + Физика", subjects: ["Математика", "Физика"], careers: ["IT", "Инженерия", "Архитектура", "Авиация", "Техника"] },
  { label: "Математика + Информатика", subjects: ["Математика", "Информатика"], careers: ["IT", "Программалау", "Киберқауіпсіздік"] },
  { label: "Биология + Химия", subjects: ["Биология", "Химия"], careers: ["Медицина", "Стоматология", "Фармация", "Биотехнология"] },
  { label: "Биология + География", subjects: ["Биология", "География"], careers: ["Агрономия", "Экология", "География", "Туризм"] },
  { label: "География + Математика", subjects: ["География", "Математика"], careers: ["Экономика", "Бизнес", "Менеджмент", "Логистика", "Маркетинг"] },
  { label: "Дүниежүзі тарихы + География", subjects: ["Дүниежүзі тарихы", "География"], careers: ["Халықаралық қатынастар", "Мұғалімдік", "Саясаттану", "Аймақтану"] },
  { label: "Дүниежүзі тарихы + Адам. Қоғам. Құқық", subjects: ["Дүниежүзі тарихы", "Құқық негіздері"], careers: ["Заң", "Халықаралық құқық", "Қоғамдық ғылымдар"] },
  { label: "Қазақ әдебиеті + Қазақ тілі", subjects: ["Қазақ әдебиеті", "Қазақ тілі"], careers: ["Филология", "Мұғалімдік", "Журналистика"] },
  { label: "Орыс тілі + Орыс әдебиеті", subjects: ["Орыс тілі", "Орыс әдебиеті"], careers: ["Орыс филологиясы", "Аударма", "Мұғалімдік"] },
  { label: "Ағылшын тілі + Дүниежүзі тарихы", subjects: ["Ағылшын тілі", "Дүниежүзі тарихы"], careers: ["Дипломатия", "Халықаралық бизнес", "Шетелмен жұмыс", "Аударма", "Туризм"] },
];

export default function AdminPage() {
  const { isAdmin, loading, profile } = useAuth();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

    if (!confirm("Назар аударыңыз! Жаңа оқушыны тіркеген кезде сіздің админ сессияңыз аяқталып, жаңа оқушы ретінде кіресіз. Жалғастырасыз ба?")) {
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
        totalStudyTimeMinutes: 0,
        todayStudyTimeMinutes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'student'
      };

      await setDoc(doc(firestore, "studentProfiles", user.uid), profileData);

      toast({ title: "Оқушы сәтті тіркелді!", description: "Жүйе автоматты түрде оқушы профиліне ауысты." });
      router.push("/dashboard");
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

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Админ рұқсаты тексерілуде...</p>
      </div>
    );
  }

  const selectedCombo = regForm.comboIndex !== "" ? SUBJECT_COMBINATIONS[parseInt(regForm.comboIndex)] : null;

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
          <p className="text-muted-foreground font-medium">Пайдаланушылар және оқу контентін басқару орталығы.</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border p-1.5 h-14 rounded-2xl shadow-sm mb-8 overflow-x-auto">
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

          <TabsContent value="register" className="space-y-6">
            <Card className="max-w-2xl mx-auto border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
              <CardHeader className="bg-primary/5 pb-6 border-b">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="size-5 text-primary" />
                  Жаңа оқушыны тіркеу
                </CardTitle>
                <CardDescription>Оқушы үшін жаңа аккаунт жасау.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <AlertTriangle className="size-5 text-orange-500 mb-2" />
                <p className="text-xs text-orange-600 mb-6 font-medium">
                  Маңызды: Тіркеуден кейін сіз админ панелінен шығып, жаңа оқушының профиліне кіресіз. 
                  Қайтадан админ болу үшін қайта кіру қажет.
                </p>

                <form onSubmit={handleRegisterStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Аты-жөні</Label>
                      <Input 
                        placeholder="Арман Серік" 
                        value={regForm.fullName}
                        onChange={(e) => setRegForm({...regForm, fullName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        type="email" 
                        placeholder="student@mail.kz" 
                        value={regForm.email}
                        onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Құпия сөз</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={regForm.password}
                        onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Сынып</Label>
                      <Select onValueChange={(v) => setRegForm({...regForm, grade: v})} value={regForm.grade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10-сынып</SelectItem>
                          <SelectItem value="11">11-сынып</SelectItem>
                          <SelectItem value="college">Колледж</SelectItem>
                          <SelectItem value="graduated">Түлек</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Пән комбинациясы</Label>
                    <Select onValueChange={(v) => setRegForm({...regForm, comboIndex: v, targetCareer: ""})} value={regForm.comboIndex}>
                      <SelectTrigger><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                      <SelectContent>
                        {SUBJECT_COMBINATIONS.map((c, i) => (
                          <SelectItem key={i} value={i.toString()}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCombo && (
                    <div className="space-y-2">
                      <Label>Мамандық</Label>
                      <Select onValueChange={(v) => setRegForm({...regForm, targetCareer: v})} value={regForm.targetCareer}>
                        <SelectTrigger><SelectValue placeholder="Таңдаңыз" /></SelectTrigger>
                        <SelectContent>
                          {selectedCombo.careers.map((c, i) => (
                            <SelectItem key={i} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button className="w-full h-12 rounded-xl font-bold" type="submit" disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Оқушыны тіркеу
                  </Button>
                </form>
              </CardContent>
            </Card>
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
