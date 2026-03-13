
"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, BrainCircuit, User, Sparkles, Loader2, History, AlertCircle, PlusCircle } from "lucide-react";
import { provideCuratorSupport } from "@/ai/flows/provide-curator-support";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id?: string;
  role: "user" | "ai" | "error";
  content: string;
  createdAt?: any;
};

export default function CuratorPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !db) return;

    const interactionsRef = collection(db, "studentProfiles", user.uid, "curatorInteractions");
    const q = query(
      interactionsRef,
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({ 
          id: doc.id, 
          role: data.messageType === 'ai_response' ? 'ai' : 'user',
          content: data.content,
          createdAt: data.timestamp 
        } as Message);
      });
      
      if (msgs.length === 0) {
        setMessages([
          {
            role: "ai",
            content: `Сәлем, ${profile?.fullName?.split(' ')[0] || "оқушы"}! Мен сенің жеке AI кураторыңмын. Бүгін ҰБТ-ға дайындығың қалай? Қандай көмек керек: теория түсіндіру ме, жоспар құру ма, әлде мотивация ма?`,
          },
        ]);
      } else {
        setMessages(msgs);
      }
    }, async (error) => {
      if (error.code !== 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: interactionsRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    });

    return () => unsubscribe();
  }, [user, profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading || !user || !db) return;

    const userMessage = textToSend.trim();
    const interactionsRef = collection(db, "studentProfiles", user.uid, "curatorInteractions");
    setInput("");
    setIsLoading(true);

    // 1. Save user message to Firestore
    const userDocData = {
      studentId: user.uid,
      messageType: "student_query",
      content: userMessage,
      timestamp: serverTimestamp(),
    };

    addDoc(interactionsRef, userDocData).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: interactionsRef.path,
        operation: 'create',
        requestResourceData: userDocData
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    try {
      // 2. Get AI Response
      const response = await provideCuratorSupport({ 
        studentMessage: userMessage,
        studentProfile: profile ? {
          fullName: profile.fullName,
          grade: profile.grade,
          targetScore: profile.targetScore,
          currentScore: profile.currentScore,
          selectedSubjects: profile.selectedSubjects,
          weakTopics: profile.weakTopics
        } : undefined
      });

      if (response.error) {
        const errorMsg = response.error === 'AI_QUOTA_EXCEEDED' 
          ? "AI куратордың тегін лимиті аяқталды. Сәлден соң (1-2 минут) қайта жазып көріңіз. ⏳" 
          : "Кешіріңіз, байланыста ақау болды. Қайта көріңізші.";
          
        setMessages((prev) => [...prev, { role: "error", content: errorMsg }]);
        setIsLoading(false);
        return;
      }

      if (!response.aiResponse) {
        setMessages((prev) => [...prev, { 
          role: "error", 
          content: "Кешіріңіз, жауап алу мүмкін болмады. Қайта жазып көріңіз." 
        }]);
        setIsLoading(false);
        return;
      }

      // 3. Save AI response to Firestore
      const aiDocData = {
        studentId: user.uid,
        messageType: "ai_response",
        content: response.aiResponse,
        timestamp: serverTimestamp(),
      };

      addDoc(interactionsRef, aiDocData).catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: interactionsRef.path,
          operation: 'create',
          requestResourceData: aiDocData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    } catch (error: any) {
      console.error("AI Curator Error:", error);
      setMessages((prev) => [...prev, { 
        role: "error", 
        content: "Кешіріңіз, байланыста ақау болды. Қайта көріңізші." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!user || !db) return;
    if (!confirm("Жаңа чат бастағыңыз келе ме? Ескі хабарламалар тарихы өшіріледі.")) return;

    setIsClearing(true);
    try {
      const interactionsRef = collection(db, "studentProfiles", user.uid, "curatorInteractions");
      const snapshot = await getDocs(interactionsRef);
      
      if (snapshot.empty) {
        setIsClearing(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(doc(db, "studentProfiles", user.uid, "curatorInteractions", d.id));
      });
      
      await batch.commit();

      toast({
        title: "Жаңа чат",
        description: "Жаңа диалог сәтті басталды. AI куратор дайын!",
      });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: `studentProfiles/${user.uid}/curatorInteractions`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsClearing(false);
    }
  };

  const suggestions = [
    { label: "Теория түсіндір", icon: "📚" },
    { label: "10 тест сұрағы", icon: "📝" },
    { label: "7 күндік жоспар", icon: "📅" },
    { label: "Мотивация керек", icon: "🔥" }
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <Sparkles className="text-primary size-8" />
              AI Куратор
            </h1>
            <p className="text-muted-foreground text-sm">Жекелендірілген ҰБТ көмекшісі</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 px-4" 
              onClick={handleNewChat} 
              disabled={isClearing || messages.length <= 1}
            >
              {isClearing ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              Жаңа чат
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
              <History className="size-4" /> Тарих
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b bg-accent/5 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <BrainCircuit className="size-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">BilimAI Куратор</CardTitle>
                <CardDescription className="text-xs text-green-600 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                  Желіде
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] ${
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          m.role === "user" ? "bg-accent text-accent-foreground" : 
                          m.role === "error" ? "bg-destructive text-destructive-foreground" :
                          "bg-primary text-primary-foreground"
                        }`}
                      >
                        {m.role === "user" ? <User className="size-4" /> : 
                         m.role === "error" ? <AlertCircle className="size-4" /> :
                         <BrainCircuit className="size-4" />}
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                            : m.role === "error"
                            ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none"
                            : "bg-muted text-foreground rounded-tl-none border border-border/50"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 items-center text-muted-foreground text-sm bg-muted/50 p-3 rounded-2xl border border-dashed animate-pulse">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Куратор ойлануда...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.label)}
                    disabled={isLoading}
                    className="text-[10px] bg-accent/20 hover:bg-accent/40 text-accent-foreground px-3 py-1.5 rounded-full transition-all font-medium border border-accent/10 flex items-center gap-1.5 active:scale-95"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Сұрағыңды жаз (мысалы: Логарифм түсіндір)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-accent/5 focus-visible:ring-primary border-none shadow-none"
                  disabled={isLoading}
                />
                <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
