'use client';

import { Suspense } from 'react';
import { LoginView } from '@/presentation/views/LoginView';

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
