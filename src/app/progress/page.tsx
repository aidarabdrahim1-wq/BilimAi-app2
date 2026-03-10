
"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Calendar, 
  Zap, 
  Flame,
  Calculator,
  Atom,
  GraduationCap,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  PieChart
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { kk } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  const subjectProgress = [
    { 
      name: "Математика", 
      score: 85, 
      color: "from-blue-500 to-indigo-600", 
      icon: Calculator,
      status: "Жоғары деңгей",
      insight: "Тригонометрияда ілгерілеу бар",
      questions: 120
    },
    { 
      name: "Физика", 
      score: 62, 
      color: "from-orange-400 to-red-500", 
      icon: Atom,
      status: "Назар аудару керек",
      insight: "Механика бөлімін қайталау қажет",
      questions: 85
    },
    { 
      name: "Тарих", 
      score: 94, 
      color: "from-emerald-400 to-teal-600", 
      icon: GraduationCap,
      status: "Маман",
      insight: "Даталарды есте сақтау өте жақсы",
      questions: 210
    },
    { 
      name: "Оқу сауаттылығы", 
      score: 78, 
      color: "from-purple-500 to-pink-600", 
      icon: BookOpen,
      status: "Жақсы қарқын",
      insight: "Мәтін талдауда жылдамдық артты",
      questions: 145
    }
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="size-8" />
              </div>
              Даму статистикасы
            </h1>
            <p className="text-muted-foreground font-medium">Оқу қарқыныңыз бен белсенділігіңізді осы жерден бақылаңыз.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border">
            <Clock className="size-4 text-primary" />
            Соңғы жаңарту: Бүгін, {format(new Date(), 'HH:mm')}
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm bg-white hover:ring-2 ring-primary/5 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  <Award className="size-7" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-green-600 border-green-200 bg-green-50">+15%</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-foreground tabular-nums">{profile?.rating || 0}</span>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Жалпы рейтинг ұпайы</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white hover:ring-2 ring-primary/5 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Clock className="size-7" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-200">Белсенді</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-foreground">
                  {hours > 0 ? `${hours}с ${minutes}м` : `${minutes}м`}
                </span>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Платформадағы уақыт</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:ring-2 ring-primary/5 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
                  <Target className="size-7" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-green-600 border-green-200">Дәлдік</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-foreground">
                  {profile?.solvedQuestions ? Math.round((profile.correctAnswers / profile.solvedQuestions) * 100) : 0}%
                </span>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Дұрыс жауаптар үлесі</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-red-600 text-white relative overflow-hidden group">
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-2xl bg-white/20 text-white flex items-center justify-center animate-pulse">
                  <Flame className="size-7 fill-current" />
                </div>
                <Zap className="size-5 text-white/50" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black">{profile?.streakDays || 0} күн</span>
                <p className="text-xs text-white/80 font-bold uppercase tracking-tighter">Үзіліссіз оқу екпіні</p>
              </div>
            </CardContent>
            <Zap className="absolute -bottom-4 -right-4 size-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </Card>
        </div>

        {/* Subjects Progress - Creative Redesign */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <h2 className="text-2xl font-black font-headline tracking-tight">Пәндер прогресі</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold gap-1" asChild>
              <Link href="/theory">Толық тізім <ChevronRight className="size-4" /></Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {subjectProgress.map((subject, i) => (
              <Card key={i} className="border-none shadow-lg bg-white overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className={`h-1.5 bg-gradient-to-r ${subject.color}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${subject.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <subject.icon className="size-6" />
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-foreground">{subject.score}%</span>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Меңгеру деңгейі</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                        <span>Прогресс</span>
                        <span>{subject.questions} сұрақ</span>
                      </div>
                      <Progress value={subject.score} className="h-2" />
                    </div>

                    <div className="pt-2">
                      <Badge className={`w-full justify-center py-1 rounded-lg border-none ${
                        subject.score > 80 ? 'bg-green-100 text-green-700' : 
                        subject.score > 60 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {subject.status}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/30 border border-accent/10">
                      {subject.score < 70 ? (
                        <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                      )}
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                        {subject.insight}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Lower Section: Calendar and AI Forecast */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Activity Calendar */}
          <Card className="lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Calendar className="size-6 text-primary" />
                    Белсенділік күнтізбесі
                  </CardTitle>
                  <CardDescription>Соңғы 7 күндегі оқу жүйелілігі</CardDescription>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  <Sparkles className="size-3" />
                  Керемет қарқын!
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-between items-center gap-2 md:gap-4">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 flex-1">
                    <div 
                      className={`w-full aspect-square max-w-[70px] rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-sm relative group/day ${
                        day.active 
                          ? "bg-primary text-white scale-105 shadow-xl shadow-primary/20" 
                          : "bg-accent/30 text-muted-foreground/30 border border-dashed border-muted-foreground/20"
                      }`}
                    >
                      {day.active ? (
                        <Zap className="size-8 fill-current drop-shadow-md animate-in zoom-in duration-500" />
                      ) : (
                        <div className="size-2 rounded-full bg-muted-foreground/20" />
                      )}
                      {/* Tooltip Simulation */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {day.fullDate}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-[11px] font-black uppercase tracking-wider ${day.active ? "text-primary" : "text-muted-foreground/50"}`}>
                        {day.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                    <TrendingUp className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Дайындық деңгейі</h4>
                    <p className="text-[10px] text-indigo-700/70 font-medium">Өткен аптамен салыстырғанда <span className="font-black text-indigo-600">+12% өсті</span></p>
                  </div>
                </div>
                <div className="p-5 rounded-3xl bg-orange-50 border border-orange-100 flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                    <PieChart className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-orange-900">Уақытты үлестіру</h4>
                    <p className="text-[10px] text-orange-700/70 font-medium">Көбіне кешкі уақытта (19:00-21:00) өнімдісіз</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Forecast Card */}
          <Card className="lg:col-span-4 border-none shadow-xl bg-primary text-primary-foreground relative overflow-hidden flex flex-col">
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Sparkles className="size-5" />
                AI Болжам
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">Қазіргі нәтижелер негізінде</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 flex flex-col justify-center items-center py-10 gap-8">
              <div className="relative size-48">
                {/* Circular Progress Path */}
                <svg className="size-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={552}
                    strokeDashoffset={552 - (552 * (profile?.currentScore || 0)) / 140}
                    className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black tracking-tighter">{profile?.currentScore || 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">балдың ішінен</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-bold leading-tight px-4 italic">
                  "Сіздің қазіргі қарқыныңызбен грантқа түсу мүмкіндігіңіз <span className="underline decoration-2 underline-offset-4">85%</span>"
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <div className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">AI талдау сәтті аяқталды</span>
                </div>
              </div>
            </CardContent>
            {/* Background elements */}
            <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 size-64 bg-indigo-500/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
