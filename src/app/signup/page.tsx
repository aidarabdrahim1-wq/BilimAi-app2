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
import { BrainCircuit, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    grade: "",
    targetScore: 120,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigValid || !auth) {
      toast({
        title: "Конфигурация қатесі",
        description: "Firebase API кілті дұрыс орнатылмаған.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      if (db) {
        await setDoc(doc(db, "users", user.uid), {
          fullName: formData.fullName,
          email: formData.email,
          grade: formData.grade,
          targetScore: Number(formData.targetScore),
          currentScore: 0,
          rating: 0, // Бастапқы рейтинг
          solvedQuestions: 0,
          correctAnswers: 0,
          completedPlans: 0,
          streakDays: 0,
          selectedSubjects: ["Математика", "Қазақстан тарихы"],
          weakTopics: [],
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: "Тіркелу сәтті аяқталды!",
        description: "BilimAI платформасына қош келдіңіз.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Тіркелу кезінде қате орын алды.";
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "МАҢЫЗДЫ: Firebase консолінде Email/Password әдісі қосылмаған. Authentication > Sign-in method бөліміне өтіп, оны қосыңыз.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Бұл email мекенжайы бос емес.";
      }

      toast({
        title: "Қате орын алды",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <Card className="w-full max-w-lg border-none shadow-xl">
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
          {!isConfigValid && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Назар аударыңыз</AlertTitle>
              <AlertDescription>
                Firebase конфигурациясы дұрыс емес. API кілтін тексеріңіз.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
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
                    <SelectItem value="10">10-сынып</SelectItem>
                    <SelectItem value="11">11-сынып</SelectItem>
                    <SelectItem value="college">Колледж</SelectItem>
                    <SelectItem value="graduated">Түлек</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
