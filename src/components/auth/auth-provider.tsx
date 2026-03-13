"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, onSnapshot, updateDoc, increment, serverTimestamp, arrayUnion } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, subDays } from "date-fns";

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export interface UserProfile {
  fullName: string;
  email: string;
  grade: string;
  role?: 'admin' | 'student';
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
  totalStudyTimeMinutes: number;
  todayStudyTimeMinutes: number;
  lastStudyDate?: string;
  lastVisitDate?: string;
  activityHistory: string[];
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
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
  
  const profileRef = useRef<UserProfile | null>(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Adjust theme colors to match Telegram's UI if desired
      if (tg.themeParams?.bg_color) {
        // You could set CSS variables here if needed
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        const userDocRef = doc(db, "studentProfiles", firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            profileRef.current = data;
            
            const today = format(new Date(), 'yyyy-MM-dd');
            if (data.lastVisitDate !== today) {
              const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
              let newStreak = data.streakDays || 0;
              
              if (data.lastVisitDate === yesterday) {
                newStreak += 1;
              } else if (!data.lastVisitDate || data.lastVisitDate < yesterday) {
                newStreak = 1;
              }

              updateDoc(userDocRef, {
                lastVisitDate: today,
                activityHistory: arrayUnion(today),
                streakDays: newStreak,
                updatedAt: serverTimestamp()
              }).catch(() => {});
            }

          } else {
            setProfile(null);
            profileRef.current = null;
          }
          setLoading(false);
        }, (error: any) => {
          if (error.code !== 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'get',
            }));
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        profileRef.current = null;
        setLoading(false);
        
        const protectedRoutes = ["/dashboard", "/curator", "/plan", "/diagnostic", "/analysis", "/admin"];
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
    });

    return () => unsubscribeAuth();
  }, [pathname, router]);

  useEffect(() => {
    if (!user || !db) return;

    const trackTime = async () => {
      if (document.hidden) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const userDocRef = doc(db, "studentProfiles", user.uid);
      const currentProfile = profileRef.current;
      
      if (!currentProfile) return;

      const updateData: any = {
        totalStudyTimeMinutes: increment(1),
        updatedAt: serverTimestamp(),
        lastStudyDate: today,
      };

      if (currentProfile.lastStudyDate !== today) {
        updateData.todayStudyTimeMinutes = 1;
      } else {
        updateData.todayStudyTimeMinutes = increment(1);
      }

      try {
        await updateDoc(userDocRef, updateData);
      } catch (e) {}
    };

    const trackerInterval = setInterval(trackTime, 60000);
    return () => clearInterval(trackerInterval);
  }, [user?.uid]);

  const isAdmin = profile?.role === 'admin' || 
                  profile?.email === 'admin@bilimai.kz' || 
                  profile?.fullName === 'Абдрахым Айдар';

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
    <AuthContext.Provider value={{ user, profile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
