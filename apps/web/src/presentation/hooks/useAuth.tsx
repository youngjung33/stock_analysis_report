'use client';

import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GUEST_DISPLAY_NAME, isGuestUsername } from '@sar/shared';
import { tokenStorage } from '@/client/data/auth/token-storage';
import { clearGuestStore } from '@/client/data/guest/guest-storage';
import { guestSession } from '@/client/data/guest/guest-session';
import { useServices } from './useServices';

interface AuthContextValue {
  username: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loginUseCase, refreshSessionUseCase, logoutUseCase, authSession } = useServices();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    if (guestSession.isActive()) {
      guestSession.clear();
      clearGuestStore();
      setUsername(null);
      await queryClient.clear();
      return;
    }

    try {
      await logoutUseCase.execute();
    } finally {
      setUsername(null);
      await queryClient.clear();
    }
  }, [logoutUseCase, queryClient]);

  useEffect(() => {
    authSession.onUnauthorized(() => {
      if (!guestSession.isActive()) {
        setUsername(null);
      }
    });

    if (guestSession.isActive()) {
      setUsername(GUEST_DISPLAY_NAME);
      setIsLoading(false);
      return;
    }

    refreshSessionUseCase
      .execute()
      .then((result) => setUsername(result?.username ?? null))
      .catch(() => setUsername(null))
      .finally(() => setIsLoading(false));
  }, [refreshSessionUseCase, authSession]);

  const login = useCallback(
    async (user: string, password: string) => {
      guestSession.clear();
      clearGuestStore();
      const result = await loginUseCase.execute(user, password);
      setUsername(result.username);
      await queryClient.clear();
    },
    [loginUseCase, queryClient],
  );

  const loginAsGuest = useCallback(async () => {
    if (tokenStorage.getAccessToken()) {
      try {
        await logoutUseCase.execute();
      } catch {
        // ignore
      }
    }
    clearGuestStore();
    guestSession.activate();
    setUsername(GUEST_DISPLAY_NAME);
    await queryClient.clear();
  }, [logoutUseCase, queryClient]);

  const value = useMemo(
    () => ({
      username,
      isGuest: isGuestUsername(username),
      isAuthenticated: !!username,
      isLoading,
      login,
      loginAsGuest,
      logout,
    }),
    [username, isLoading, login, loginAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
