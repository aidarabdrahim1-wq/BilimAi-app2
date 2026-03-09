
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
import { BrainCircuit, Loader2 } from "lucide-react";

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
  const router = useRouter();
  const { toast } = useToast();

  const currentCombo = formData.subjectComboIndex !== "" ? SUBJECT_COMBINATIONS[parseInt(formData.subjectComboIndex)] : null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigValid || !auth) {
      toast({
        title: "Конфигурация қатесі",
        description: "Firebase API кілті дұрыс орнатылмаған немесе жоба бапталмаған.",
        variant: "destructive",
      });
      return;
    }

    if (!currentCombo) {
      toast({
        title: "Пәнді таңдаңыз",
        description: "Пән комбинациясын таңдау міндетті.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create Profile Data
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

        const docRef = doc(db, "studentProfiles", user.uid);
        await setDoc(docRef, profileData);
      }

      toast({
        title: "Тіркелу сәтті аяқталды!",
        description: "BilimAI платформасына қош келдіңіз.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error details:", error);
      
      let errorMessage = "Тіркелу кезінде қате орын алды.";
      
      // Detailed error handling for blocked methods
      if (error.message?.includes("signup-are-blocked") || error.message?.includes("method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked")) {
        errorMessage = "Тіркелу қызметі бұғатталған. Firebase Console -> Authentication -> Settings -> User actions бөлімінде 'Enable create' белгісінің тұрғанын тексеріңіз. Сонымен қатар, API Key шектеулерін тексеріңіз.";
      } else if (error.message?.includes("identitytoolkit.googleapis.com") || error.code === "auth/api-not-available") {
        errorMessage = "Identity Toolkit API іске қосылмаған. Google Cloud Console-дан оны іске қосу керек.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Бұл тіркелу әдісіне рұқсат берілмеген. Firebase Console-дан 'Email/Password' әдісін қосыңыз.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Бұл Email поштасы бұрын тіркелген.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Құпия сөз тым әлсіз (кемінде 6 таңба).";
      }

      toast({
        title: "Жүйелік шектеу",
        description: errorMessage,
        variant: "destructive",
      });
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
            
            <Button className="w-full h-11 shadow-md" type="submit" disabled={loading || !isConfigValid}>
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
