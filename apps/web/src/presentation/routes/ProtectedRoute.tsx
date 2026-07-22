'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
}
