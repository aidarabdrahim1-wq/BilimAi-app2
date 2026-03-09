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
import { BrainCircuit, Loader2, AlertCircle, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [email, setInputEmail] = useState("");
  const [password, setInputPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setIsBlocked(false);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Сәтті кірдіңіз!",
        description: "Дашбордқа бағытталуда...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error Full:", error);
      
      let friendlyMessage = "Email немесе құпия сөз дұрыс емес.";
      
      // Check for blocked API requests
      if (error.message?.includes('blocked') || error.code?.includes('api-key-is-blocked')) {
        friendlyMessage = "API қызметі бұғатталған. Google Cloud-та Identity Toolkit API-ге рұқсат беріңіз.";
        setIsBlocked(true);
      } else if (error.code === 'auth/invalid-api-key') {
        friendlyMessage = "API кілті қате. Конфигурацияны тексеріңіз.";
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = "Интернет байланысын тексеріңіз.";
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
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <BrainCircuit className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">BilimAI-ға қош келдіңіз</CardTitle>
          <CardDescription>Дайындықты жалғастыру үшін жүйеге кіріңіз</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 ${isBlocked ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-destructive/10 text-destructive'}`}>
                <div className="flex items-center gap-2">
                  {isBlocked ? <ShieldAlert className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span className="font-bold">{isBlocked ? "Техникалық шектеу:" : "Қате:"}</span>
                </div>
                <p className="leading-relaxed">{errorMsg}</p>
                {isBlocked && (
                  <div className="mt-2 pt-2 border-t border-orange-200 text-[10px] space-y-1">
                    <p className="font-bold">Мәселені шешу жолы:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Google Cloud Console-ға кіріңіз.</li>
                      <li>APIs & Services -> Credentials бөліміне өтіңіз.</li>
                      <li>Қолданып жатқан API кілтіне "Identity Toolkit API" пайдалануға рұқсат беріңіз.</li>
                    </ol>
                  </div>
                )}
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
                className="bg-white"
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
                className="bg-white"
              />
            </div>
            <Button className="w-full h-11 font-bold shadow-lg" type="submit" disabled={loading}>
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
