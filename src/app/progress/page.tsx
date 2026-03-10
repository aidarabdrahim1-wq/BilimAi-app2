
"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Award, Clock, Calendar, Zap, Flame } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Progress } from "@/components/ui/progress";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { kk } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ProgressPage() {
  const { profile } = useAuth();

  const totalMinutes = profile?.totalStudyTimeMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Calculate activity for the last 7 days
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isActive = profile?.activityHistory?.includes(dateStr);
      days.push({
        label: format(date, 'EEE', { locale: kk }),
        fullDate: format(date, 'd MMMM', { locale: kk }),
        active: isActive
      });
    }
    return days;
  }, [profile?.activityHistory]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <BarChart3 className="size-8 text-primary" />
            Даму статистикасы
          </h1>
          <p className="text-muted-foreground">Оқу қарқыныңыз бен белсенділігіңізді осы жерден бақылаңыз.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm bg-white hover:ring-1 ring-primary/10 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Жалпы рейтинг</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                  <Award className="size-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-foreground">{profile?.rating || 0}</span>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">ұпай жиналды</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white hover:ring-1 ring-primary/10 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Оқу уақыты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock className="size-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-foreground">
                    {hours > 0 ? `${hours} сағ ${minutes} мин` : `${minutes} мин`}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">платформада</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:ring-1 ring-primary/10 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Дәлдік</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                  <Target className="size-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-foreground">
                    {profile?.solvedQuestions ? Math.round((profile.correctAnswers / profile.solvedQuestions) * 100) : 0}%
                  </span>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">дұрыс жауаптар</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-orange-500 text-white relative overflow-hidden group">
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-white/80 uppercase tracking-widest">Оқу екпіні</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white/20 text-white flex items-center justify-center animate-pulse">
                  <Flame className="size-6 fill-current" />
                </div>
                <div>
                  <span className="text-2xl font-black">{profile?.streakDays || 0} күн</span>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">қатарынан оқыдыңыз</p>
                </div>
              </div>
            </CardContent>
            <Zap className="absolute -bottom-4 -right-4 size-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Белсенділік күнтізбесі
                  </CardTitle>
                  <CardDescription>Соңғы 7 күндегі оқу күндеріңіз</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary font-bold border-primary/20">
                  {profile?.activityHistory?.length || 0} күн белсенді
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-between items-center gap-2">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1">
                    <div 
                      className={`w-full aspect-square max-w-[60px] rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                        day.active 
                          ? "bg-primary text-white scale-105 shadow-primary/20" 
                          : "bg-accent/30 text-muted-foreground opacity-50"
                      }`}
                    >
                      {day.active ? <Zap className="size-6 fill-current" /> : <div className="size-2 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${day.active ? "text-primary" : "text-muted-foreground"}`}>
                        {day.label}
                      </p>
                      <p className="text-[8px] text-muted-foreground font-medium hidden sm:block">
                        {day.fullDate.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 rounded-2xl bg-primary/5 border border-dashed border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Flame className="size-5 text-orange-500" />
                  <span>Келесі ұпай бонусына дейін: <span className="font-black text-primary">2 күн</span></span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Күн сайын кіріп +10 бонус алыңыз</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
              <CardHeader className="bg-accent/5 pb-4 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Пәндер прогресі
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {[
                  { name: "Математика", score: 85, color: "bg-blue-500", icon: Calculator },
                  { name: "Физика", score: 62, color: "bg-indigo-500", icon: Atom },
                  { name: "Тарих", score: 94, color: "bg-orange-500", icon: GraduationCap },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                        {item.name}
                      </span>
                      <span className="font-black text-sm">{item.score}%</span>
                    </div>
                    <Progress value={item.score} className="h-1.5" />
                  </div>
                ))}
                
                <div className="pt-4 border-t border-dashed">
                  <Card className="bg-primary/5 border-none p-4 rounded-xl">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="size-16 rounded-full border-4 border-primary border-t-transparent flex items-center justify-center animate-spin-slow">
                        <span className="text-xl font-black">{profile?.currentScore || 0}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider">AI Болжам</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Сіздің қазіргі қарқыныңызбен ҰБТ-да осы баллды алу мүмкіндігіңіз жоғары.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Helper icons needed for the list above if not already in global scope
const Calculator = (props: any) => <BarChart3 {...props} />;
const Atom = (props: any) => <TrendingUp {...props} />;
const GraduationCap = (props: any) => <Award {...props} />;
