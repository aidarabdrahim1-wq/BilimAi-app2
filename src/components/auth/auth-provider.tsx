
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  fullName: string;
  email: string;
  grade: string;
  targetScore: number;
  currentScore: number;
  selectedSubjects: string[];
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        if (db) {
          try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        
        // Қорғалған беттерді тексеру
        const protectedRoutes = ["/dashboard", "/curator", "/plan", "/diagnostic", "/analysis", "/progress", "/practice", "/theory"];
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Hydration қатесін болдырмау үшін mounted тексерісі
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background" aria-hidden="true" />
    );
  }

  // Жүктелу экраны
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
