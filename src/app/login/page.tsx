"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setInputEmail] = useState("");
  const [password, setInputPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Сәтті кірдіңіз!",
        description: "Дашбордқа бағытталуда...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      
      let friendlyMessage = "Email немесе құпия сөз дұрыс емес.";
      
      if (error.code === 'auth/invalid-api-key') {
        friendlyMessage = "API кілті қате. Әкімшіге хабарласыңыз.";
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = "Интернет байланысын тексеріңіз.";
      } else if (error.code === 'auth/user-disabled') {
        friendlyMessage = "Бұл аккаунт бұғатталған.";
      } else if (error.code?.includes('api-key-is-blocked') || error.message?.includes('blocked')) {
        friendlyMessage = "API кілті бұғатталған немесе Identity Platform бапталмаған.";
      }

      setErrorMsg(friendlyMessage);
      toast({
        title: "Кіру қатесі",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <BrainCircuit className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">BilimAI-ға қош келдіңіз</CardTitle>
          <CardDescription>Дайындықты жалғастыру үшін жүйеге кіріңіз</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2 mb-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setInputEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Құпия сөз</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setInputPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full h-11 font-bold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Кіру"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Тіркелмегенсіз бе?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Тіркелу
            </Link>
          </div>
          <Link href="/" className="text-xs text-center text-muted-foreground hover:underline">
            Басты бетке қайту
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
