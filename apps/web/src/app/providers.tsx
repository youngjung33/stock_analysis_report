'use client';

import { useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { wireAppServices } from '@/client/bootstrap';
import { AuthProvider } from '@/presentation/hooks/useAuth';
import { ServicesProvider } from '@/presentation/hooks/useServices';
import { ToastProvider } from '@/presentation/components/Toast';
import { createAppQueryClient } from '@/presentation/lib/query-config';

const queryClient = createAppQueryClient();

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
