"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Medal, User, Crown, Star, Loader2, Users2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { useMemoFirebase, useCollection } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const { user } = useAuth();

  // Барлық профильдерді рейтинг бойынша шығару (фильтрсіз)
  const leaderboardQuery = useMemoFirebase(() => {
    if (!db) return null;
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
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="size-12 rounded-2xl bg-yellow-100 flex items-center justify-center shadow-inner">
              <Trophy className="size-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight font-headline">Оқушылар рейтингі</h1>
              <p className="text-muted-foreground text-sm font-medium">Ең белсенді Top 10 оқушы тізімі.</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="size-10 animate-spin text-primary opacity-20" />
            <p className="text-muted-foreground font-bold animate-pulse">Рейтинг анықталуда...</p>
          </div>
        ) : topStudents && topStudents.length > 0 ? (
          <div className="grid gap-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[32px]">
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-primary to-orange-500" />
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {topStudents.map((student, index) => {
                    const isCurrentUser = student.id === user?.uid;
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-4 md:p-6 transition-all hover:bg-accent/5 ${
                          isCurrentUser ? "bg-primary/5 ring-inset ring-1 ring-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="size-10 flex items-center justify-center shrink-0">
                            {getRankBadge(index)}
                          </div>
                          
                          <Avatar className="size-14 border-2 border-background shadow-md">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName}`} />
                            <AvatarFallback><User /></AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-base md:text-lg ${isCurrentUser ? "text-primary" : ""}`}>
                                {student.fullName}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="text-[9px] h-5 bg-primary text-white border-none font-black uppercase px-2">
                                  Сен
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-black">
                              {student.grade}-сынып • {student.targetCareer || "Болашақ маман"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-primary">
                            <Star className="size-4 fill-primary" />
                            <span className="text-xl md:text-2xl font-black tabular-nums">
                              {student.rating || 0}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                            ұпай жиналды
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-lg bg-white rounded-[24px] p-6 border-l-4 border-yellow-500">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    Ұпай жинау жолдары
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-xs space-y-3 font-bold text-muted-foreground">
                  <div className="flex justify-between items-center bg-accent/5 p-2 rounded-lg">
                    <span>Әрбір дұрыс жауап</span>
                    <Badge variant="outline" className="text-primary border-primary/20">+2 ұпай</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-accent/5 p-2 rounded-lg">
                    <span>Тесттен 80% жоғары</span>
                    <Badge variant="outline" className="text-primary border-primary/20">+15 ұпай</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-accent/5 p-2 rounded-lg">
                    <span>Күнделікті жоспарды аяқтау</span>
                    <Badge variant="outline" className="text-primary border-primary/20">+20 ұпай</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-accent/5 p-2 rounded-lg">
                    <span>AI Диагностика</span>
                    <Badge variant="outline" className="text-primary border-primary/20">+10 ұпай</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-primary text-primary-foreground rounded-[24px] p-6 relative overflow-hidden group">
                <CardHeader className="p-0 pb-4 relative z-10">
                  <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                    <Crown className="size-4 fill-current text-yellow-300" />
                    Айдың үздігі бол!
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                  <p className="text-sm leading-relaxed font-bold opacity-90">
                    Рейтингте жоғары көтеріліп, AI Куратордан арнайы мәртебе мен қосымша мүмкіндіктерді ашыңыз. Тәртіп — жеңістің кілті!
                  </p>
                </CardContent>
                <Trophy className="absolute -bottom-6 -right-6 size-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[40px] shadow-sm border-2 border-dashed flex flex-col items-center gap-6">
            <div className="size-20 rounded-full bg-accent/50 flex items-center justify-center text-muted-foreground/30">
              <Users2 className="size-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Әзірге ешкім тіркелмеген</h3>
              <p className="text-sm text-muted-foreground font-medium">Рейтинг бос. Бірінші болып ұпай жинаңыз!</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}