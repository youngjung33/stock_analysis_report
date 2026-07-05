'use client';

import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wireAppServices } from '@/client/bootstrap';
import { AuthProvider } from '@/presentation/hooks/useAuth';
import { ServicesProvider } from '@/presentation/hooks/useServices';
import { ToastProvider } from '@/presentation/components/Toast';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => wireAppServices(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </ServicesProvider>
    </QueryClientProvider>
  );
}
