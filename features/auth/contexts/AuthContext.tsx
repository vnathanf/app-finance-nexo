'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/features/auth/types/user';
import {
  getCurrentUser,
  getUserStatus,
  onAuthChange,
  signOutUser,
  type UserApprovalStatus,
} from '@/features/auth/services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /** null enquanto carrega ou se não houver linha em `users` ainda. */
  status: UserApprovalStatus | null;
  isApproved: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<UserApprovalStatus | null>(null);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((u) => {
        if (active) setUser(u);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setStatus(null);
      return;
    }
    let active = true;
    getUserStatus(user.id).then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, status, isApproved: status === 'approved', signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
