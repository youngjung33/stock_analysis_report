import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { useServices } from './useServices';

interface AuthContextValue {
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loginUseCase, refreshSessionUseCase, logoutUseCase, authSession } = useServices();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await logoutUseCase.execute();
    } finally {
      setUsername(null);
    }
  }, [logoutUseCase]);

  useEffect(() => {
    authSession.onUnauthorized(() => {
      setUsername(null);
    });

    refreshSessionUseCase
      .execute()
      .then((result) => setUsername(result.username))
      .catch(() => setUsername(null))
      .finally(() => setIsLoading(false));
  }, [refreshSessionUseCase, authSession]);

  const login = useCallback(
    async (user: string, password: string) => {
      const result = await loginUseCase.execute(user, password);
      setUsername(result.username);
    },
    [loginUseCase],
  );

  const value = useMemo(
    () => ({
      username,
      isAuthenticated: !!username,
      isLoading,
      login,
      logout,
    }),
    [username, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
