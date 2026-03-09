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
import { BrainCircuit, Loader2, AlertCircle, Settings2, ExternalLink } from "lucide-react";

export default function LoginPage() {
  const [email, setInputEmail] = useState("");
  const [password, setInputPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<"not-found" | "blocked" | "invalid" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Сәтті кірдіңіз!",
        description: "Дашбордқа бағытталуда...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      
      if (error.code === 'auth/configuration-not-found') {
        setErrorStatus("not-found");
      } else if (error.message?.includes('blocked')) {
        setErrorStatus("blocked");
      } else {
        setErrorStatus("invalid");
        toast({
          title: "Кіру қатесі",
          description: "Email немесе құпия сөз қате.",
          variant: "destructive",
        });
      }
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
            {errorStatus === "not-found" && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4 shrink-0" />
                  <span className="font-bold">Authentication бапталмаған:</span>
                </div>
                <p>Firebase жобаңызда <b>Email/Password</b> әдісін қосу керек.</p>
                <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline flex items-center gap-1 font-bold">Консольге өту <ExternalLink className="size-3" /></a>
              </div>
            )}

            {errorStatus === "blocked" && (
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span className="font-bold">API шектеуі:</span>
                </div>
                <p>Google Cloud-та осы API кілтіне <b>Identity Toolkit API</b> рұқсатын беріңіз.</p>
              </div>
            )}

            {errorStatus === "invalid" && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs items-center gap-2 flex">
                <AlertCircle className="size-4 shrink-0" />
                <p>Email немесе құпия сөз дұрыс емес.</p>
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
