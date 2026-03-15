
"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings as SettingsIcon, 
  Target, 
  GraduationCap, 
  CalendarDays, 
  Mail, 
  Save, 
  Loader2,
  ShieldCheck
} from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function SettingsPage() {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    grade: "",
    targetScore: 120,
    targetCareer: "",
    untDate: "2025-06-20"
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        grade: profile.grade || "",
        targetScore: profile.targetScore || 120,
        targetCareer: profile.targetCareer || "",
        untDate: profile.untDate || "2025-06-20"
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const userRef = doc(db, "studentProfiles", user.uid);
    const updateData = {
      ...formData,
      targetScore: Number(formData.targetScore),
      updatedAt: serverTimestamp()
    };

    updateDoc(userRef, updateData)
      .then(() => {
        toast({
          title: "Мәліметтер сақталды",
          description: "Сіздің профиліңіз сәтті жаңартылды.",
        });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <SettingsIcon className="size-8" />
            </div>
            Баптаулар
          </h1>
          <p className="text-muted-foreground font-medium">Жеке профильді және мақсаттарды реттеу.</p>
        </div>

        <div className="grid gap-8">
          {/* Personal Information */}
          <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="bg-accent/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                Жеке мәліметтер
              </CardTitle>
              <CardDescription>Басқа оқушылар мен кураторға көрінетін ақпарат.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-bold">Толық аты-жөніңіз</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="pl-10 h-12 rounded-xl bg-accent/5 border-none shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-muted-foreground">Email (Өзгертуге болмайды)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="pl-10 h-12 rounded-xl bg-muted/50 border-none cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Сынып</Label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(v) => setFormData({...formData, grade: v})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-accent/5 border-none shadow-inner">
                      <SelectValue placeholder="Таңдаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10-сынып</SelectItem>
                      <SelectItem value="11">11-сынып</SelectItem>
                      <SelectItem value="college">Колледж</SelectItem>
                      <SelectItem value="graduated">Түлек</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mt-6">
                    <ShieldCheck className="size-6 text-primary" />
                    <div>
                      <p className="text-sm font-black">Админ статусы</p>
                      <p className="text-xs text-muted-foreground">Сізде платформаны басқару құқығы бар.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* UNT Goals */}
          <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="bg-accent/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                ҰБТ мақсаттары
              </CardTitle>
              <CardDescription>AI стратегиясы мен жоспарлау осы деректерге негізделеді.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Мақсатты балл (0-140)</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      min="0"
                      max="140"
                      value={formData.targetScore}
                      onChange={(e) => setFormData({...formData, targetScore: parseInt(e.target.value) || 0})}
                      className="pl-10 h-12 rounded-xl bg-accent/5 border-none shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Болашақ мамандық</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      value={formData.targetCareer}
                      onChange={(e) => setFormData({...formData, targetCareer: e.target.value})}
                      placeholder="М: IT Маман"
                      className="pl-10 h-12 rounded-xl bg-accent/5 border-none shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">ҰБТ тапсыру күні</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      type="date"
                      value={formData.untDate}
                      onChange={(e) => setFormData({...formData, untDate: e.target.value})}
                      className="pl-10 h-12 rounded-xl bg-accent/5 border-none shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-accent/5 p-8 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="gap-2 h-12 px-10 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Өзгерістерді сақтау
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
