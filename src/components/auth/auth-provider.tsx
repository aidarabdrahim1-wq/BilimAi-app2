
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export interface UserProfile {
  fullName: string;
  email: string;
  grade: string;
  targetScore: number;
  currentScore: number;
  rating: number;
  solvedQuestions: number;
  correctAnswers: number;
  completedPlans: number;
  streakDays: number;
  selectedSubjects: string[];
  subjectCombination?: string;
  targetCareer?: string;
  untDate?: string;
  weakTopics: string[];
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        // Профильді тек studentProfiles коллекциясынан аламыз (firestore.rules бойынша)
        const userDocRef = doc(db, "studentProfiles", firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error: any) => {
          // Авторизация ауысуы кезіндегі уақытша рұқсат қатесін (permission-denied) өткізіп жібереміз
          if (error.code === 'permission-denied') {
            return;
          }
          
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          }));
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
        
        // Қорғалған беттерді тексеру
        const protectedRoutes = ["/dashboard", "/curator", "/plan", "/diagnostic", "/analysis", "/admin"];
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
    });

    return () => unsubscribeAuth();
  }, [pathname, router]);

  if (!mounted) return <div className="min-h-screen bg-background" />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">BilimAI жүктелуде...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
