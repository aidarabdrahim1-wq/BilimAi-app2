"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, BrainCircuit, User, Sparkles, Loader2 } from "lucide-react";
import { provideCuratorSupport } from "@/ai/flows/provide-curator-support";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function CuratorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Сәлем, Арман! Мен сенің жеке AI кураторыңмын. Бүгін көңіл-күйің қалай? Оқу барысында қиындықтар немесе стресс болып жатыр ма? Кез келген сұрағыңды қоюыңа болады.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { aiResponse } = await provideCuratorSupport({ studentMessage: userMessage });
      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Кешіріңіз, байланыста ақау болды. Қайта көріңізші." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Sparkles className="text-primary size-8" />
            AI Куратор қолдауы
          </h1>
          <p className="text-muted-foreground">Психологиялық қолдау, мотивация және оқу бойынша ақыл-кеңес.</p>
        </div>

        <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b bg-accent/5 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
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
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          m.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {m.role === "user" ? <User className="size-4" /> : <BrainCircuit className="size-4" />}
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted text-foreground rounded-tl-none"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 items-center text-muted-foreground text-sm">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Куратор жауап жазуда...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Хабарлама жазу..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={isLoading}>
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Мен үлгермей жатырмын", "Бүгін шаршап жүрмін", "Мотивация керек"].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="text-[10px] bg-accent/30 hover:bg-accent/50 text-accent-foreground px-3 py-1 rounded-full transition-colors font-medium border border-accent/20"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
