'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <RouteLoadingFallback />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
