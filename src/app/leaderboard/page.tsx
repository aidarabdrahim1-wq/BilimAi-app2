
"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Medal, User, Crown, Star, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { useMemoFirebase, useCollection } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const { user } = useAuth();

  const leaderboardQuery = useMemoFirebase(() => {
    return query(
      collection(db, "studentProfiles"),
      orderBy("rating", "desc"),
      limit(10)
    );
  }, []);

  const { data: topStudents, isLoading } = useCollection(leaderboardQuery);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="size-6 text-yellow-500 fill-yellow-500" />;
      case 1:
        return <Medal className="size-6 text-slate-400 fill-slate-400" />;
      case 2:
        return <Medal className="size-6 text-orange-600 fill-orange-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center justify-center md:justify-start gap-3">
            <Trophy className="size-8 text-yellow-500" />
            Оқушылар рейтингі
          </h1>
          <p className="text-muted-foreground">Ең белсенді және білімді Top 10 оқушы.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Рейтинг жүктелуде...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-primary to-orange-500" />
              <CardContent className="p-0">
                <div className="divide-y">
                  {topStudents?.map((student, index) => {
                    const isCurrentUser = student.id === user?.uid;
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-4 md:p-6 transition-colors hover:bg-accent/5 ${
                          isCurrentUser ? "bg-primary/5 ring-inset ring-1 ring-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="size-10 flex items-center justify-center shrink-0">
                            {getRankBadge(index)}
                          </div>
                          
                          <Avatar className="size-12 border-2 border-background shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName}`} />
                            <AvatarFallback><User /></AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm md:text-base ${isCurrentUser ? "text-primary" : ""}`}>
                                {student.fullName}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">
                                  Сен
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                              {student.grade}-сынып • {student.targetCareer || "Болашақ маман"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-primary">
                            <Star className="size-4 fill-primary" />
                            <span className="text-lg md:text-xl font-black tabular-nums">
                              {student.rating || 0}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            ұпай жиналды
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-accent/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Star className="size-4 text-primary fill-primary" />
                    Ұпайды қалай жинаймын?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                  <p>• Әрбір дұрыс жауап: +2 ұпай</p>
                  <p>• Тесттен 80% жоғары нәтиже: +15 ұпай</p>
                  <p>• Күнделікті жоспарды орындау: +20 ұпай</p>
                  <p>• AI Диагностикадан өту: +10 ұпай</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Crown className="size-4 fill-current" />
                    Айдың үздігі бол!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed opacity-90">
                  Рейтингте жоғары көтеріліп, AI Куратордан арнайы сыйлықтар мен қосымша мүмкіндіктерді ашыңыз. Тәртіп — жеңістің кілті!
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
