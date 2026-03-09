
"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, isConfigValid } from "@/lib/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2, AlertCircle, ShieldAlert, ExternalLink, Settings2 } from "lucide-react";

const SUBJECT_COMBINATIONS = [
  { label: "Математика + Физика", subjects: ["Математика", "Физика"], careers: ["IT", "Инженерия", "Архитектура", "Авиация", "Техника"] },
  { label: "Математика + Информатика", subjects: ["Математика", "Информатика"], careers: ["IT", "Программалау", "Киберқауіпсіздік"] },
  { label: "Биология + Химия", subjects: ["Биология", "Химия"], careers: ["Медицина", "Стоматология", "Фармация", "Биотехнология"] },
  { label: "Биология + География", subjects: ["Биология", "География"], careers: ["Агрономия", "Экология", "География", "Туризм"] },
  { label: "География + Математика", subjects: ["География", "Математика"], careers: ["Экономика", "Бизнес", "Менеджмент", "Логистика", "Маркетинг"] },
  { label: "Дүниежүзі тарихы + География", subjects: ["Дүниежүзі тарихы", "География"], careers: ["Халықаралық қатынастар", "Мұғалімдік", "Саясаттану", "Аймақтану"] },
  { label: "Дүниежүзі тарихы + Адам. Қоғам. Құқық", subjects: ["Дүниежүзі тарихы", "Адам. Қоғам. Құқық"], careers: ["Заң", "Халықаралық құқық", "Қоғамдық ғылымдар"] },
  { label: "Қазақ әдебиеті + Қазақ тілі", subjects: ["Қазақ әдебиеті", "Қазақ тілі"], careers: ["Филология", "Мұғалімдік", "Журналистика"] },
  { label: "Орыс тілі + Орыс әдебиеті", subjects: ["Орыс тілі", "Орыс әдебиеті"], careers: ["Орыс филологиясы", "Аударма", "Мұғалімдік"] },
  { label: "Ағылшын тілі + Дүниежүзі тарихы", subjects: ["Ағылшын тілі", "Дүниежүзі тарихы"], careers: ["Дипломатия", "Халықаралық бизнес", "Шетелмен жұмыс", "Аударма", "Туризм"] },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    grade: "",
    targetScore: 120,
    subjectComboIndex: "",
    targetCareer: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<"blocked" | "not-found" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const currentCombo = formData.subjectComboIndex !== "" ? SUBJECT_COMBINATIONS[parseInt(formData.subjectComboIndex)] : null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    
    if (!isConfigValid || !auth) {
      toast({ title: "Қате", description: "Жүйе бапталмаған.", variant: "destructive" });
      return;
    }

    if (!currentCombo) {
      toast({ title: "Пәнді таңдаңыз", description: "Пән комбинациясын таңдау міндетті.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      if (db) {
        const profileData = {
          id: user.uid,
          fullName: formData.fullName,
          email: formData.email,
          grade: formData.grade,
          targetScore: Number(formData.targetScore),
          currentScore: 0,
          rating: 0,
          solvedQuestions: 0,
          correctAnswers: 0,
          completedPlans: 0,
          streakDays: 0,
          selectedSubjects: ["Оқу сауаттылығы", "Қазақстан тарихы", "Мат. сауаттылық", ...currentCombo.subjects],
          subjectCombination: currentCombo.label,
          targetCareer: formData.targetCareer,
          weakTopics: [],
          untDate: "2025-06-20", 
          totalStudyTimeMinutes: 0,
          todayStudyTimeMinutes: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, "studentProfiles", user.uid), profileData);
      }

      toast({ title: "Тіркелу сәтті аяқталды!", description: "BilimAI-ға қош келдіңіз." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup Error:", error.code, error.message);
      
      if (error.code === 'auth/configuration-not-found') {
        setErrorStatus("not-found");
      } else if (error.message?.includes('blocked')) {
        setErrorStatus("blocked");
      } else {
        toast({
          title: "Қате орын алды",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4 py-12">
      <Card className="w-full max-w-2xl border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <BrainCircuit className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Тіркелу</CardTitle>
          <CardDescription>BilimAI-мен ҰБТ-ға дайындықты бүгін бастаңыз</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {errorStatus === "not-found" && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4 shrink-0" />
                  <span className="font-bold">Authentication бапталмаған:</span>
                </div>
                <p>Firebase Console-да <b>Authentication</b> бөліміне өтіп, <b>Email/Password</b> әдісін қосуыңыз (Enable) керек.</p>
                <p className="text-[10px] opacity-70">Егер ол қосулы болса, API кілті мен Project ID сәйкестігін тексеріңіз.</p>
                <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline flex items-center gap-1 font-bold">Firebase Console-ға өту <ExternalLink className="size-3" /></a>
              </div>
            )}

            {errorStatus === "blocked" && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span className="font-bold">API шектеуі анықталды:</span>
                </div>
                <p>Google Cloud Console-да осы API кілтіне <b>"Identity Toolkit API"</b> пайдалануға рұқсат беріңіз.</p>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary underline flex items-center gap-1 font-bold">Баптауларға өту <ExternalLink className="size-3" /></a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Толық аты-жөніңіз</Label>
                <Input
                  id="fullName"
                  placeholder="Арман Серік"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Сынып</Label>
                <Select onValueChange={(v) => setFormData({ ...formData, grade: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Таңдаңыз" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8-сынып</SelectItem>
                    <SelectItem value="9">9-сынып</SelectItem>
                    <SelectItem value="10">10-сынып</SelectItem>
                    <SelectItem value="11">11-сынып</SelectItem>
                    <SelectItem value="college">Колледж</SelectItem>
                    <SelectItem value="graduated">Түлек</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Құпия сөз</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">ҰБТ таңдау пәндері</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Пән комбинациясы</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, subjectComboIndex: v, targetCareer: "" })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Комбинацияны таңдаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_COMBINATIONS.map((combo, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {combo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Болашақ мамандық</Label>
                  <Select 
                    disabled={!currentCombo} 
                    value={formData.targetCareer}
                    onValueChange={(v) => setFormData({ ...formData, targetCareer: v })} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={currentCombo ? "Мамандықты таңдаңыз" : "Алдымен пәнді таңдаңыз"} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCombo?.careers.map((career, index) => (
                        <SelectItem key={index} value={career}>
                          {career}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="targetScore">Мақсатты балл (0-140)</Label>
                <Input
                  id="targetScore"
                  type="number"
                  min="0"
                  max="140"
                  value={formData.targetScore}
                  onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            
            <Button className="w-full h-11 shadow-md font-bold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Тіркелу"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Аккаунтыңыз бар ма?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Кіру
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
