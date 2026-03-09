
"use client";

import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Award, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Progress } from "@/components/ui/progress";

export default function ProgressPage() {
  const { profile } = useAuth();

  const totalMinutes = profile?.totalStudyTimeMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <BarChart3 className="size-8 text-primary" />
            Даму статистикасы
          </h1>
          <p className="text-muted-foreground">ҰБТ-ға дайындық қарқыныңызды бақылаңыз.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Жалпы рейтинг</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="size-6 text-yellow-600" />
                <span className="text-2xl font-bold">{profile?.rating || 0} ұпай</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Оқу уақыты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="size-6 text-indigo-600" />
                <span className="text-2xl font-bold">
                  {hours > 0 ? `${hours} сағ ${minutes} мин` : `${minutes} мин`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Дәлдік</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="size-6 text-green-600" />
                <span className="text-2xl font-bold">
                  {profile?.solvedQuestions ? Math.round((profile.correctAnswers / profile.solvedQuestions) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Шешілген сұрақтар</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="size-6 text-blue-600" />
                <span className="text-2xl font-bold">{profile?.solvedQuestions || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Пәндер бойынша балл</CardTitle>
              <CardDescription>Соңғы аптадағы көрсеткіштер</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: "Математика", score: 85, color: "bg-blue-500" },
                { name: "Физика", score: 62, color: "bg-teal-500" },
                { name: "Тарих", score: 94, color: "bg-orange-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold">{item.score}%</span>
                  </div>
                  <Progress value={item.score} className={`h-2`} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-dashed">
            <CardHeader>
              <CardTitle>AI Болжам</CardTitle>
              <CardDescription>ҰБТ-дағы потенциалды балл</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="size-32 rounded-full border-8 border-primary border-t-transparent flex items-center justify-center mb-4 animate-spin-slow">
                <span className="text-4xl font-black">{profile?.currentScore || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Сіздің қазіргі қарқыныңызбен ҰБТ-да осы баллды алу мүмкіндігіңіз жоғары.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
