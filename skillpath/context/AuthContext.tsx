'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: { name: string; email: string; uid: string } | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  /** Get a fresh Firebase ID token. Always use this for API calls — never localStorage. */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string; uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const firebaseUserRef = useRef<User | null>(null);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        firebaseUserRef.current = firebaseUser;

        const userData = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          uid: firebaseUser.uid
        };

        setUser(userData);
      } else {
        firebaseUserRef.current = null;
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Get a fresh Firebase ID token.
   * Forces refresh to avoid stale/expired tokens.
   * This is the ONLY way API calls should get their auth token.
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) return null;

    try {
      return await fbUser.getIdToken(/* forceRefresh */ true);
    } catch (error) {
      console.error('[AuthContext] Failed to refresh token:', error);
      return null;
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      logout,
      getToken,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
