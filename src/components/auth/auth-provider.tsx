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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
        // Redirect to login if accessing protected routes
        const protectedRoutes = ["/dashboard", "/curator", "/plan", "/diagnostic", "/analysis", "/progress", "/practice", "/theory"];
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse font-medium">BilimAI жүктелуде...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
